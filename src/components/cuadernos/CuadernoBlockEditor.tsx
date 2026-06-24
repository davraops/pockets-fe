import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import CuadernoBlockRow from './CuadernoBlockRow'
import {
  createBlock,
  createImageBlock,
  getBlockPlainText,
  normalizeDocument,
  patchDocumentBlocks,
  type CuadernoBlock,
  type CuadernoBlockType,
  type CuadernoDocument,
} from './cuadernoDocument'
import { isDataImageSrc } from './cuadernoImagePaste'
import { getBlockRichText, normalizeRichText, plainToRichText, richTextToPlain, type RichTextSegment } from './cuadernoRichText'
import type { CuadernoLinkTarget } from './cuadernoLinkUtils'
import { createListItem, listItemsToBlockPatch } from './cuadernoListItems'
import { createTodoItem, todoItemsToBlockPatch } from './cuadernoTodoItems'
import {
  columnsToBlockPatch,
  createColumnCell,
  createDefaultTableRows,
  getBlockColumnCells,
  tableToBlockPatch,
} from './cuadernoBlockLayouts'
import {
  getBlockIndent,
  indentBlockAt,
  isIndentableBlockType,
  outdentBlockAt,
} from './cuadernoBlockIndent'

interface InsertBlockAfterOptions {
  type?: CuadernoBlockType
  sourcePatch?: Partial<CuadernoBlock>
  initialRichText?: RichTextSegment[]
  initialText?: string
  focusCaret?: number
}

type InsertBlockAfterPayload = CuadernoBlockType | InsertBlockAfterOptions

interface FocusHint {
  blockId: string
  caret: number
}

interface CuadernoBlockEditorProps {
  document: CuadernoDocument
  onChange: (document: CuadernoDocument) => void
  linkNotes?: CuadernoLinkTarget[]
  currentNoteId?: string
  onImagePasteError?: (message: string) => void
}

function CuadernoBlockEditor({
  document: cuadernoDoc,
  onChange,
  linkNotes = [],
  currentNoteId,
  onImagePasteError,
}: CuadernoBlockEditorProps) {
  const [focusHint, setFocusHint] = useState<FocusHint | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const cuadernoDocRef = useRef(cuadernoDoc)
  const onChangeRef = useRef(onChange)
  const draggedBlockIdRef = useRef<string | null>(null)
  const [initialAutoFocusBlockId] = useState(() => {
    const blocks = normalizeDocument(cuadernoDoc).blocks
    if (blocks.length === 1 && !blocks[0].text?.trim()) {
      return blocks[0].id
    }
    return null
  })

  cuadernoDocRef.current = cuadernoDoc
  onChangeRef.current = onChange
  draggedBlockIdRef.current = draggedBlockId

  const updateDocument = useCallback((updater: (blocks: CuadernoBlock[]) => CuadernoBlock[]) => {
    const current = cuadernoDocRef.current
    const nextBlocks = updater(normalizeDocument(current).blocks)
    onChangeRef.current(patchDocumentBlocks(current, nextBlocks))
  }, [])

  const handleUpdate = useCallback(
    (blockId: string, patch: Partial<CuadernoBlock>) => {
      updateDocument(blocks =>
        blocks.map(block => (block.id === blockId ? { ...block, ...patch } : block))
      )
    },
    [updateDocument]
  )

  const handleChangeType = useCallback(
    (blockId: string, type: CuadernoBlockType) => {
      if (type === 'image') {
        onImagePasteError?.('Pega la imagen con ⌘V o Ctrl+V')
        return
      }
      updateDocument(blocks =>
        blocks.map(block => {
          if (block.id !== blockId) {
            return block
          }
          const next = createBlock(type, block.text ?? '')
          const indent = isIndentableBlockType(type) ? getBlockIndent(block) : 0
          const richText =
            type === 'code' ? plainToRichText(block.text ?? '') : getBlockRichText(block)
          const base = {
            ...next,
            id: block.id,
            indent,
            richText,
            text: richTextToPlain(richText),
          }
          if (type === 'to_do') {
            return {
              ...base,
              ...todoItemsToBlockPatch([
                createTodoItem(richText, Boolean(block.checked)),
              ]),
            }
          }
          if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
            return {
              ...base,
              type,
              ...listItemsToBlockPatch([createListItem(richText)]),
            }
          }
          if (type === 'column_2') {
            return {
              ...base,
              ...columnsToBlockPatch([createColumnCell(richText), createColumnCell()]),
            }
          }
          if (type === 'table') {
            return {
              ...base,
              ...tableToBlockPatch(createDefaultTableRows()),
            }
          }
          return base
        })
      )
    },
    [onImagePasteError, updateDocument]
  )

  const handleAddAfter = useCallback(
    (blockId: string, payload: InsertBlockAfterPayload = 'paragraph') => {
      const options =
        typeof payload === 'string'
          ? { type: payload, focusCaret: 0 }
          : {
              type: payload.type ?? 'paragraph',
              sourcePatch: payload.sourcePatch,
              initialRichText: payload.initialRichText,
              initialText: payload.initialText,
              focusCaret: payload.focusCaret ?? 0,
            }

      const blocks = normalizeDocument(cuadernoDocRef.current).blocks
      const index = blocks.findIndex(block => block.id === blockId)
      const source = index >= 0 ? blocks[index] : null
      const indent = source ? getBlockIndent(source) : 0
      const newBlock =
        options.type === 'image' && isDataImageSrc(options.sourcePatch?.imageSrc)
          ? createImageBlock(
              options.sourcePatch.imageSrc,
              typeof options.sourcePatch.imageAlt === 'string'
                ? options.sourcePatch.imageAlt
                : undefined,
              indent
            )
          : createBlock(options.type, options.initialText ?? '', indent)

      if (options.initialRichText) {
        newBlock.richText = normalizeRichText(options.initialRichText)
        newBlock.text = options.initialText ?? richTextToPlain(newBlock.richText)
      }

      updateDocument(currentBlocks => {
        const currentIndex = currentBlocks.findIndex(block => block.id === blockId)
        if (currentIndex === -1) {
          return [...currentBlocks, newBlock]
        }
        const next = [...currentBlocks]
        if (options.sourcePatch) {
          next[currentIndex] = { ...next[currentIndex], ...options.sourcePatch }
        }
        next.splice(currentIndex + 1, 0, newBlock)
        return next
      })
      setFocusHint({ blockId: newBlock.id, caret: options.focusCaret })
    },
    [updateDocument]
  )

  const handleIndent = useCallback(
    (blockId: string) => {
      updateDocument(blocks => {
        const index = blocks.findIndex(block => block.id === blockId)
        return index === -1 ? blocks : indentBlockAt(blocks, index)
      })
    },
    [updateDocument]
  )

  const handleOutdent = useCallback(
    (blockId: string) => {
      updateDocument(blocks => {
        const index = blocks.findIndex(block => block.id === blockId)
        return index === -1 ? blocks : outdentBlockAt(blocks, index)
      })
    },
    [updateDocument]
  )

  const handleInsertImage = useCallback(
    (blockId: string, imageSrc: string, imageAlt?: string) => {
      let focusBlockId = blockId
      updateDocument(blocks => {
        const index = blocks.findIndex(block => block.id === blockId)
        if (index === -1) {
          return blocks
        }

        const current = blocks[index]
        const indent = getBlockIndent(current)
        const imageBlock = createImageBlock(imageSrc, imageAlt, indent)
        const isEmptyTextBlock =
          current.type !== 'image' && !getBlockPlainText(current).trim()

        if (isEmptyTextBlock && current.type === 'paragraph') {
          const next = [...blocks]
          next[index] = imageBlock
          const paragraphAfter = createBlock('paragraph', '', indent)
          next.splice(index + 1, 0, paragraphAfter)
          focusBlockId = paragraphAfter.id
          return next
        }

        const paragraphAfter = createBlock('paragraph', '', indent)
        const next = [...blocks]
        next.splice(index + 1, 0, imageBlock, paragraphAfter)
        focusBlockId = paragraphAfter.id
        return next
      })
      setFocusHint({ blockId: focusBlockId, caret: 0 })
    },
    [updateDocument]
  )

  const handleRemove = useCallback(
    (blockId: string) => {
      updateDocument(blocks => blocks.filter(block => block.id !== blockId))
    },
    [updateDocument]
  )

  const focusSibling = useCallback((blockId: string, direction: -1 | 1) => {
    const blocks = normalizeDocument(cuadernoDocRef.current).blocks
    const index = blocks.findIndex(block => block.id === blockId)
    const sibling = blocks[index + direction]
    if (sibling) {
      setFocusHint({ blockId: sibling.id, caret: -1 })
    }
  }, [])

  const clearFocusHint = useCallback(() => {
    setFocusHint(null)
  }, [])

  const handleFocusPrevious = useCallback((blockId: string) => {
    focusSibling(blockId, -1)
  }, [focusSibling])

  const handleFocusNext = useCallback((blockId: string) => {
    focusSibling(blockId, 1)
  }, [focusSibling])

  const handleMoveBlock = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) {
        return
      }
      updateDocument(blocks => {
        const sourceIndex = blocks.findIndex(b => b.id === sourceId)
        const targetIndex = blocks.findIndex(b => b.id === targetId)
        if (sourceIndex === -1 || targetIndex === -1) {
          return blocks
        }
        const next = [...blocks]
        const [moved] = next.splice(sourceIndex, 1)
        next.splice(targetIndex, 0, moved)
        return next
      })
    },
    [updateDocument]
  )

  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null)
    setDropTargetId(null)
  }, [])

  const handleDragOver = useCallback((blockId: string) => {
    setDropTargetId(blockId)
  }, [])

  const handleDrop = useCallback(
    (blockId: string) => {
      const sourceId = draggedBlockIdRef.current
      if (sourceId) {
        handleMoveBlock(sourceId, blockId)
      }
      setDraggedBlockId(null)
      setDropTargetId(null)
    },
    [handleMoveBlock]
  )

  const blocks = normalizeDocument(cuadernoDoc).blocks

  return (
    <div
      ref={editorRef}
      className="cuaderno-block-editor"
      role="document"
      aria-label="Contenido del cuaderno"
    >
      {blocks.map((block, index) => (
        <CuadernoBlockRow
          key={block.id}
          block={block}
          index={index}
          blocks={blocks}
          linkNotes={linkNotes}
          currentNoteId={currentNoteId}
          autoFocus={block.id === initialAutoFocusBlockId}
          focusCaret={focusHint?.blockId === block.id ? focusHint.caret : undefined}
          onFocusHandled={clearFocusHint}
          isDragging={draggedBlockId === block.id}
          isDropTarget={dropTargetId === block.id && draggedBlockId !== block.id}
          onUpdate={handleUpdate}
          onChangeType={handleChangeType}
          onAddAfter={handleAddAfter}
          onInsertImage={handleInsertImage}
          onImagePasteError={onImagePasteError}
          onRemove={handleRemove}
          onIndent={handleIndent}
          onOutdent={handleOutdent}
          onFocusPrevious={handleFocusPrevious}
          onFocusNext={handleFocusNext}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  )
}

export default CuadernoBlockEditor
