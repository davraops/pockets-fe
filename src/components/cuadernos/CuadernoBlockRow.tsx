import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import {
  applyMarkdownShortcut,
  enterCreatesNewBlock,
  nextBlockTypeOnEnter,
} from './cuadernoBlockCommands'
import {
  getBlockTodoItems,
  todoItemsEqual,
  todoItemsToBlockPatch,
} from './cuadernoTodoItems'
import CuadernoBlockInput, {
  type CuadernoBlockInputHandle,
  isCuadernoBlockInputFocused,
} from './CuadernoBlockInput'
import CuadernoBlockMenu from './CuadernoBlockMenu'
import {
  columnsEqual,
  columnsToBlockPatch,
  getBlockColumnCells,
  getBlockTableRows,
  tableRowsEqual,
  tableToBlockPatch,
} from './cuadernoBlockLayouts'
import CuadernoColumnBlockEditor from './CuadernoColumnBlockEditor'
import CuadernoImageBlock from './CuadernoImageBlock'
import CuadernoListBlockEditor from './CuadernoListBlockEditor'
import {
  getBlockListItems,
  listItemsEqual,
  listItemsToBlockPatch,
} from './cuadernoListItems'
import CuadernoTableBlockEditor from './CuadernoTableBlockEditor'
import CuadernoTodoBlockEditor from './CuadernoTodoBlockEditor'
import {
  isCaretAtEnd,
  isCaretAtStart,
} from './cuadernoContentEditableUtils'
import CuadernoLinkPicker, { type CuadernoLinkPickerHandle } from './CuadernoLinkPicker'
import CuadernoSlashCommandPicker, {
  type CuadernoSlashCommandPickerHandle,
} from './CuadernoSlashCommandPicker'
import { detectSlashCommandTrigger } from './cuadernoSlashCommand'
import type { CuadernoBlockCommand } from './cuadernoBlockCommands'
import {
  buildLinkedRichText,
  detectCuadernoLinkTrigger,
  type CuadernoLinkTarget,
  type CuadernoLinkTrigger,
  wrapTextAsCuadernoLink,
} from './cuadernoLinkUtils'
import { isModKey } from './cuadernoInlineFormat'
import {
  blockIndentStyle,
  canIndentBlock,
  canOutdentBlock,
  getBlockIndent,
  isIndentableBlockType,
} from './cuadernoBlockIndent'
import {
  BLOCK_TYPE_LABELS,
  getNumberedBlockStartNumber,
  type CuadernoBlock,
  type CuadernoBlockType,
} from './cuadernoDocument'
import {
  getBlockRichText,
  plainToRichText,
  richTextFromElement,
  richTextToPlain,
  splitRichTextAt,
  supportsInlineFormatting,
} from './cuadernoRichText'
import './cuadernoEditor.css'

interface CuadernoBlockRowProps {
  block: CuadernoBlock
  index: number
  blocks: CuadernoBlock[]
  linkNotes?: CuadernoLinkTarget[]
  currentNoteId?: string
  autoFocus?: boolean
  focusCaret?: number
  onFocusHandled?: () => void
  isDragging?: boolean
  isDropTarget?: boolean
  onUpdate: (blockId: string, patch: Partial<CuadernoBlock>) => void
  onChangeType: (blockId: string, type: CuadernoBlockType) => void
  onAddAfter: (
    blockId: string,
    payload?:
      | CuadernoBlockType
      | {
          type?: CuadernoBlockType
          sourcePatch?: Partial<CuadernoBlock>
          initialRichText?: ReturnType<typeof getBlockRichText>
          initialText?: string
          focusCaret?: number
        }
  ) => void
  onInsertImage: (blockId: string, imageSrc: string, imageAlt?: string) => void
  onImagePasteError?: (message: string) => void
  onRemove: (blockId: string) => void
  onIndent: (blockId: string) => void
  onOutdent: (blockId: string) => void
  onFocusPrevious: (blockId: string) => void
  onFocusNext: (blockId: string) => void
  onDragStart: (blockId: string) => void
  onDragEnd: () => void
  onDragOver: (blockId: string) => void
  onDrop: (blockId: string) => void
}

function allowsMultiline(type: CuadernoBlockType): boolean {
  return type === 'code' || type === 'paragraph' || type === 'quote'
}

function blocksStructureEqual(prevBlocks: CuadernoBlock[], nextBlocks: CuadernoBlock[]): boolean {
  if (prevBlocks.length !== nextBlocks.length) {
    return false
  }
  return prevBlocks.every(
    (block, index) =>
      block.id === nextBlocks[index].id && block.type === nextBlocks[index].type
  )
}

function blockContentEqual(a: CuadernoBlock, b: CuadernoBlock): boolean {
  if (a.id !== b.id || a.type !== b.type || getBlockIndent(a) !== getBlockIndent(b)) {
    return false
  }
  if (a.type === 'to_do') {
    return todoItemsEqual(getBlockTodoItems(a), getBlockTodoItems(b))
  }
  if (a.type === 'bulleted_list_item' || a.type === 'numbered_list_item') {
    return listItemsEqual(getBlockListItems(a), getBlockListItems(b))
  }
  if (a.type === 'column_2') {
    return columnsEqual(getBlockColumnCells(a), getBlockColumnCells(b))
  }
  if (a.type === 'table') {
    return tableRowsEqual(getBlockTableRows(a), getBlockTableRows(b))
  }
  if (a.type === 'image') {
    return a.imageSrc === b.imageSrc && a.imageAlt === b.imageAlt
  }
  return (
    a.text === b.text &&
    a.checked === b.checked &&
    JSON.stringify(a.richText) === JSON.stringify(b.richText)
  )
}

function areBlockRowPropsEqual(
  prev: CuadernoBlockRowProps,
  next: CuadernoBlockRowProps
): boolean {
  if (isCuadernoBlockInputFocused(next.block.id)) {
    return true
  }

  if (
    prev.index !== next.index ||
    prev.autoFocus !== next.autoFocus ||
    prev.focusCaret !== next.focusCaret ||
    prev.isDragging !== next.isDragging ||
    prev.isDropTarget !== next.isDropTarget ||
    prev.currentNoteId !== next.currentNoteId ||
    prev.linkNotes !== next.linkNotes
  ) {
    return false
  }

  if (!blockContentEqual(prev.block, next.block)) {
    return false
  }

  return blocksStructureEqual(prev.blocks, next.blocks)
}

function CuadernoBlockRow({
  block,
  index,
  blocks,
  linkNotes = [],
  currentNoteId,
  autoFocus,
  focusCaret,
  onFocusHandled,
  isDragging,
  isDropTarget,
  onUpdate,
  onChangeType,
  onAddAfter,
  onInsertImage,
  onImagePasteError,
  onRemove,
  onIndent,
  onOutdent,
  onFocusPrevious,
  onFocusNext,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CuadernoBlockRowProps) {
  const inputRef = useRef<CuadernoBlockInputHandle>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const linkMenuRef = useRef<CuadernoLinkPickerHandle>(null)
  const slashMenuRef = useRef<CuadernoSlashCommandPickerHandle>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [linkQuery, setLinkQuery] = useState('')
  const [linkPickerMode, setLinkPickerMode] = useState<'trigger' | 'shortcut'>('trigger')
  const [linkTriggerType, setLinkTriggerType] = useState<CuadernoLinkTrigger | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [isRowFocused, setIsRowFocused] = useState(false)
  const [blockMenuOpen, setBlockMenuOpen] = useState(false)
  const blockMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const didAutoFocusRef = useRef(false)

  useEffect(() => {
    if (!autoFocus || didAutoFocusRef.current) {
      return
    }
    didAutoFocusRef.current = true
    inputRef.current?.focusAtEnd()
  }, [autoFocus])

  useLayoutEffect(() => {
    if (focusCaret === undefined) {
      return
    }
    if (focusCaret < 0) {
      inputRef.current?.focusAtEnd()
    } else {
      inputRef.current?.focusAtCaret(focusCaret)
    }
    onFocusHandled?.()
  }, [focusCaret, onFocusHandled])

  const updateAnchorRect = () => {
    const el = inputRef.current?.getElement()
    if (el) {
      setAnchorRect(el.getBoundingClientRect())
    }
  }

  const closeLinkPicker = () => {
    setLinkOpen(false)
    setLinkQuery('')
    setLinkTriggerType(null)
  }

  const closeSlashPicker = () => {
    setSlashOpen(false)
    setSlashQuery('')
  }

  const closeBlockMenu = () => {
    setBlockMenuOpen(false)
  }

  const openBlockMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (blockMenuOpen) {
      closeBlockMenu()
      return
    }
    closeLinkPicker()
    closeSlashPicker()
    setBlockMenuOpen(true)
  }

  const openSlashPicker = (query: string) => {
    closeLinkPicker()
    closeBlockMenu()
    setSlashQuery(query)
    setSlashOpen(true)
    updateAnchorRect()
  }

  const handleChangeBlockType = (type: CuadernoBlockType) => {
    if (type === block.type) {
      closeBlockMenu()
      return
    }
    onChangeType(block.id, type)
    if (type === 'divider') {
      onAddAfter(block.id, 'paragraph')
    } else {
      window.requestAnimationFrame(() => inputRef.current?.focusAtEnd())
    }
    closeBlockMenu()
  }

  const handleDeleteBlock = () => {
    if (blocks.length <= 1) {
      return
    }
    closeBlockMenu()
    onRemove(block.id)
    onFocusPrevious(block.id)
  }

  const openLinkPicker = (mode: 'trigger' | 'shortcut', query = '') => {
    setLinkPickerMode(mode)
    setLinkQuery(query)
    setLinkOpen(true)
    updateAnchorRect()
  }

  const handleLinkSelect = (note: CuadernoLinkTarget) => {
    const plain = inputRef.current?.getText() ?? block.text ?? ''
    let result

    if (linkPickerMode === 'shortcut') {
      const { start, end } = inputRef.current?.getSelectionOffsets() ?? { start: 0, end: 0 }
      result = wrapTextAsCuadernoLink(plain, start, end, note)
    } else if (linkTriggerType) {
      const caret = inputRef.current?.getCaret() ?? plain.length
      result = buildLinkedRichText(plain, caret, linkTriggerType, note)
    } else {
      closeLinkPicker()
      return
    }

    onUpdate(block.id, { richText: result.richText, text: result.plainText })
    inputRef.current?.applyRichText(result.richText, result.caret)
    closeLinkPicker()
  }

  const handleSlashSelect = (command: CuadernoBlockCommand) => {
    const plain = inputRef.current?.getText() ?? block.text ?? ''
    const caret = inputRef.current?.getCaret() ?? plain.length
    const trigger = detectSlashCommandTrigger(plain, caret)
    let remaining = plain
    if (trigger) {
      remaining = `${plain.slice(0, trigger.slashIndex)}${plain.slice(caret)}`.trimStart()
    }

    closeSlashPicker()

    if (command.type === 'image') {
      onUpdate(block.id, {
        richText: plainToRichText(remaining),
        text: remaining,
      })
      onImagePasteError?.('Pega la imagen con ⌘V o Ctrl+V')
      window.requestAnimationFrame(() => inputRef.current?.focusAtEnd())
      return
    }

    onChangeType(block.id, command.type)
    if (command.type === 'divider') {
      onAddAfter(block.id, 'paragraph')
      return
    }

    onUpdate(block.id, {
      richText: plainToRichText(remaining),
      text: remaining,
    })
    window.requestAnimationFrame(() => inputRef.current?.focusAtEnd())
  }

  const syncSlashPicker = (plainText: string, caret: number) => {
    const trigger = detectSlashCommandTrigger(plainText, caret)
    if (trigger?.open) {
      openSlashPicker(trigger.query)
      return
    }
    if (slashOpen) {
      closeSlashPicker()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const el = inputRef.current?.getElement()
    const value = inputRef.current?.getText() ?? block.text ?? ''
    const caretAtStart = el ? isCaretAtStart(el) : value.length === 0
    const caretAtEnd = el ? isCaretAtEnd(el) : true

    if (slashOpen) {
      if (slashMenuRef.current?.onKeyDown(event)) {
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeSlashPicker()
        return
      }
    }

    if (linkOpen) {
      if (linkMenuRef.current?.onKeyDown(event)) {
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeLinkPicker()
        return
      }
    }

    if (
      supportsInlineFormatting(block.type) &&
      isModKey(event) &&
      event.key.toLowerCase() === 'k' &&
      !linkOpen &&
      !slashOpen
    ) {
      event.preventDefault()
      openLinkPicker('shortcut')
      return
    }

    if (event.key === 'Tab' && !linkOpen && !slashOpen) {
      event.preventDefault()
      if (event.shiftKey) {
        if (canOutdentBlock(blocks, index)) {
          onOutdent(block.id)
        }
      } else if (canIndentBlock(blocks, index)) {
        onIndent(block.id)
      }
      return
    }

    if (event.key === 'ArrowUp' && caretAtStart && !linkOpen && !slashOpen) {
      event.preventDefault()
      onFocusPrevious(block.id)
      return
    }

    if (event.key === 'ArrowDown' && caretAtEnd && !linkOpen && !slashOpen) {
      event.preventDefault()
      onFocusNext(block.id)
      return
    }

    if (event.key === 'Enter' && !event.shiftKey && !linkOpen && !slashOpen) {
      if (!enterCreatesNewBlock(block.type)) {
        return
      }

      event.preventDefault()
      if (!el) {
        onAddAfter(block.id, nextBlockTypeOnEnter(block.type))
        return
      }

      const richText = richTextFromElement(el)
      const caret = inputRef.current?.getCaret() ?? richTextToPlain(richText).length
      const { before, after } = splitRichTextAt(richText, caret)
      const beforePlain = richTextToPlain(before)
      const afterPlain = richTextToPlain(after)

      inputRef.current?.applyRichText(before, beforePlain.length, { focus: false })

      onAddAfter(block.id, {
        type: nextBlockTypeOnEnter(block.type),
        sourcePatch: { richText: before, text: beforePlain },
        initialRichText: after,
        initialText: afterPlain,
        focusCaret: 0,
      })
      return
    }

    if (event.key === 'Backspace' && value === '') {
      event.preventDefault()
      if (getBlockIndent(block) > 0 && isIndentableBlockType(block.type)) {
        onOutdent(block.id)
        return
      }
      if (blocks.length > 1) {
        onRemove(block.id)
        onFocusPrevious(block.id)
      }
    }
  }

  const handleTodoItemsChange = (items: ReturnType<typeof getBlockTodoItems>) => {
    onUpdate(block.id, todoItemsToBlockPatch(items))
  }

  const handleTodoItemTextChange = (
    index: number,
    richText: ReturnType<typeof getBlockRichText>,
    plainText: string,
    caret: number
  ) => {
    const shortcut = applyMarkdownShortcut(plainText)
    if (shortcut) {
      if (shortcut.type === 'divider') {
        onChangeType(block.id, 'divider')
        onAddAfter(block.id, 'paragraph')
      } else {
        onChangeType(block.id, shortcut.type)
        const nextItems = getBlockTodoItems(block).map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, richText: plainToRichText(shortcut.text) }
            : item
        )
        onUpdate(block.id, todoItemsToBlockPatch(nextItems))
      }
      closeLinkPicker()
      return
    }

    if (supportsInlineFormatting(block.type) && linkNotes.length > 0) {
      const linkTrigger = detectCuadernoLinkTrigger(plainText, caret)
      if (linkTrigger?.open) {
        setLinkPickerMode('trigger')
        setLinkTriggerType(linkTrigger.trigger)
        setLinkQuery(linkTrigger.query)
        setLinkOpen(true)
        updateAnchorRect()
        return
      }
      if (linkOpen && linkPickerMode === 'trigger') {
        closeLinkPicker()
      }
    }
  }

  const handleRemoveListBlock = () => {
    if (blocks.length > 1) {
      onRemove(block.id)
      onFocusPrevious(block.id)
    }
  }

  const handleListItemsChange = (items: ReturnType<typeof getBlockListItems>) => {
    onUpdate(block.id, listItemsToBlockPatch(items))
  }

  const handleListItemTextChange = (
    index: number,
    richText: ReturnType<typeof getBlockRichText>,
    plainText: string,
    caret: number
  ) => {
    const shortcut = applyMarkdownShortcut(plainText)
    if (shortcut) {
      if (shortcut.type === 'divider') {
        onChangeType(block.id, 'divider')
        onAddAfter(block.id, 'paragraph')
      } else {
        onChangeType(block.id, shortcut.type)
        const nextItems = getBlockListItems(block).map((item, itemIndex) =>
          itemIndex === index ? { ...item, richText: plainToRichText(shortcut.text) } : item
        )
        onUpdate(block.id, listItemsToBlockPatch(nextItems))
      }
      closeLinkPicker()
      return
    }

    if (supportsInlineFormatting(block.type) && linkNotes.length > 0) {
      const linkTrigger = detectCuadernoLinkTrigger(plainText, caret)
      if (linkTrigger?.open) {
        setLinkPickerMode('trigger')
        setLinkTriggerType(linkTrigger.trigger)
        setLinkQuery(linkTrigger.query)
        setLinkOpen(true)
        updateAnchorRect()
        return
      }
      if (linkOpen && linkPickerMode === 'trigger') {
        closeLinkPicker()
      }
    }
  }

  const handleRemoveTodoBlock = () => {
    if (blocks.length > 1) {
      onRemove(block.id)
      onFocusPrevious(block.id)
    }
  }

  const handleRichTextChange = (richText: ReturnType<typeof getBlockRichText>, plainText: string, caret: number) => {
    const shortcut = applyMarkdownShortcut(plainText)
    if (shortcut) {
      if (shortcut.type === 'divider') {
        onChangeType(block.id, 'divider')
        onAddAfter(block.id, 'paragraph')
      } else {
        onChangeType(block.id, shortcut.type)
        onUpdate(block.id, {
          richText: plainToRichText(shortcut.text),
          text: shortcut.text,
        })
      }
      closeLinkPicker()
      closeSlashPicker()
      return
    }

    onUpdate(block.id, { richText, text: plainText })
    syncSlashPicker(plainText, caret)

    if (slashOpen) {
      return
    }

    if (supportsInlineFormatting(block.type) && linkNotes.length > 0) {
      const linkTrigger = detectCuadernoLinkTrigger(plainText, caret)
      if (linkTrigger?.open) {
        setLinkPickerMode('trigger')
        setLinkTriggerType(linkTrigger.trigger)
        setLinkQuery(linkTrigger.query)
        setLinkOpen(true)
        updateAnchorRect()
        return
      }
      if (linkOpen && linkPickerMode === 'trigger') {
        closeLinkPicker()
      }
    }
  }

  const refreshMenus = () => {
    const value = inputRef.current?.getText() ?? block.text ?? ''
    const caret = inputRef.current?.getCaret() ?? value.length
    syncSlashPicker(value, caret)
    if (slashOpen) {
      return
    }
    if (supportsInlineFormatting(block.type) && linkNotes.length > 0) {
      const linkTrigger = detectCuadernoLinkTrigger(value, caret)
      if (linkTrigger?.open) {
        setLinkPickerMode('trigger')
        setLinkTriggerType(linkTrigger.trigger)
        setLinkQuery(linkTrigger.query)
        setLinkOpen(true)
        updateAnchorRect()
      }
    }
  }

  const placeholder =
    index === 0 && blocks.length === 1
      ? 'Escribe algo, o / para comandos…'
      : block.type === 'heading_1'
        ? 'Título principal'
        : block.type === 'code'
          ? 'Pega o escribe código'
          : block.type === 'quote'
            ? 'Escribe una cita…'
            : ''

  const rowClass = [
    'cuaderno-block-row',
    `cuaderno-block-row--${block.type.replace(/_/g, '-')}`,
    isRowFocused ? 'cuaderno-block-row--active' : '',
    blockMenuOpen ? 'cuaderno-block-row--menu-open' : '',
    isDragging ? 'cuaderno-block-row--dragging' : '',
    isDropTarget ? 'cuaderno-block-row--drop-target' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rowRef}
      className={rowClass}
      data-block-id={block.id}
      onDragOver={event => {
        event.preventDefault()
        onDragOver(block.id)
      }}
      onDrop={event => {
        event.preventDefault()
        onDrop(block.id)
      }}
    >
      <div className="cuaderno-block-row__gutter" contentEditable={false}>
        <button
          type="button"
          className="cuaderno-block-gutter-btn"
          onClick={() => onAddAfter(block.id, 'paragraph')}
          aria-label="Añadir bloque debajo"
          tabIndex={-1}
        >
          <AddIcon fontSize="inherit" aria-hidden />
        </button>
        <button
          ref={blockMenuTriggerRef}
          type="button"
          className={[
            'cuaderno-block-gutter-btn',
            blockMenuOpen ? 'cuaderno-block-gutter-btn--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={openBlockMenu}
          aria-label="Opciones del bloque"
          aria-expanded={blockMenuOpen}
          aria-haspopup="menu"
          tabIndex={-1}
        >
          <MoreHorizIcon fontSize="inherit" aria-hidden />
        </button>
        <button
          type="button"
          className="cuaderno-block-gutter-btn cuaderno-block-gutter-btn--drag"
          draggable
          onDragStart={() => onDragStart(block.id)}
          onDragEnd={onDragEnd}
          aria-label="Arrastrar bloque"
          tabIndex={-1}
        >
          <DragIndicatorIcon fontSize="inherit" aria-hidden />
        </button>
      </div>

      <div
        className="cuaderno-block-row__body"
        style={blockIndentStyle(getBlockIndent(block))}
      >
        {block.type === 'divider' ? (
          <div className="cuaderno-block-divider" role="separator" aria-label="Divisor" />
        ) : block.type === 'image' ? (
          <CuadernoImageBlock block={block} mode="edit" />
        ) : block.type === 'to_do' ? (
          <CuadernoTodoBlockEditor
            blockId={block.id}
            items={getBlockTodoItems(block)}
            enableFormatting={supportsInlineFormatting(block.type)}
            onItemsChange={handleTodoItemsChange}
            onItemTextChange={handleTodoItemTextChange}
            onFocus={() => {
              setIsRowFocused(true)
              refreshMenus()
            }}
            onBlur={() => setIsRowFocused(false)}
            onRemoveBlock={handleRemoveTodoBlock}
          />
        ) : block.type === 'bulleted_list_item' || block.type === 'numbered_list_item' ? (
          <CuadernoListBlockEditor
            blockId={block.id}
            variant={block.type === 'bulleted_list_item' ? 'bullet' : 'numbered'}
            items={getBlockListItems(block)}
            numberedStart={
              block.type === 'numbered_list_item'
                ? getNumberedBlockStartNumber(blocks, index)
                : 1
            }
            enableFormatting={supportsInlineFormatting(block.type)}
            onItemsChange={handleListItemsChange}
            onItemTextChange={handleListItemTextChange}
            onFocus={() => {
              setIsRowFocused(true)
              refreshMenus()
            }}
            onBlur={() => setIsRowFocused(false)}
            onRemoveBlock={handleRemoveListBlock}
          />
        ) : block.type === 'column_2' ? (
          <CuadernoColumnBlockEditor
            blockId={block.id}
            columns={getBlockColumnCells(block)}
            onColumnsChange={columns =>
              onUpdate(block.id, columnsToBlockPatch(columns))
            }
            onFocus={() => {
              setIsRowFocused(true)
              refreshMenus()
            }}
            onBlur={() => setIsRowFocused(false)}
          />
        ) : block.type === 'table' ? (
          <CuadernoTableBlockEditor
            blockId={block.id}
            rows={getBlockTableRows(block)}
            onRowsChange={tableRows =>
              onUpdate(block.id, tableToBlockPatch(tableRows))
            }
            onFocus={() => {
              setIsRowFocused(true)
              refreshMenus()
            }}
            onBlur={() => setIsRowFocused(false)}
          />
        ) : (
          <>
            <CuadernoBlockInput
              ref={inputRef}
              blockId={block.id}
              richText={getBlockRichText(block)}
              placeholder={placeholder}
              allowMultiline={allowsMultiline(block.type)}
              enableFormatting={supportsInlineFormatting(block.type)}
              ariaLabel={BLOCK_TYPE_LABELS[block.type]}
              onRichTextChange={handleRichTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsRowFocused(true)
                refreshMenus()
              }}
              onBlur={() => setIsRowFocused(false)}
              onClick={refreshMenus}
              onPasteImage={(dataUrl, alt) => onInsertImage(block.id, dataUrl, alt)}
              onPasteImageError={onImagePasteError}
            />
          </>
        )}
      </div>

      {slashOpen ? (
        <CuadernoSlashCommandPicker
          ref={slashMenuRef}
          query={slashQuery}
          anchorRect={anchorRect}
          onSelect={handleSlashSelect}
          onClose={closeSlashPicker}
        />
      ) : null}

      {linkOpen && linkNotes.length > 0 && (
        <CuadernoLinkPicker
          ref={linkMenuRef}
          query={linkQuery}
          notes={linkNotes}
          currentNoteId={currentNoteId}
          anchorRect={anchorRect}
          onSelect={handleLinkSelect}
          onClose={closeLinkPicker}
        />
      )}

      {blockMenuOpen ? (
        <CuadernoBlockMenu
          anchorEl={blockMenuTriggerRef.current}
          currentType={block.type}
          canDelete={blocks.length > 1}
          onSelectType={handleChangeBlockType}
          onDelete={handleDeleteBlock}
          onClose={closeBlockMenu}
        />
      ) : null}
    </div>
  )
}

export default memo(CuadernoBlockRow, areBlockRowPropsEqual)
