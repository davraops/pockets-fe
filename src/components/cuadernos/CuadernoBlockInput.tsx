import { forwardRef, memo, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import {
  ensureContentEditableCaretHost,
  focusContentEditableAtEnd,
  getContentEditableCaret,
  getContentEditableSelectionOffsets,
  getContentEditableText,
  insertPlainTextAtSelection,
  normalizeInlineText,
  placeCaretInEmptyContentEditable,
  setContentEditableCaret,
} from './cuadernoContentEditableUtils'
import CuadernoInlineToolbar from './CuadernoInlineToolbar'
import { matchInlineShortcut, toggleInlineMark } from './cuadernoInlineFormat'
import {
  isRichTextEmpty,
  richTextFromElement,
  richTextToPlain,
  syncRichTextHtml,
  type RichTextSegment,
} from './cuadernoRichText'
import { getClipboardImageFile, prepareClipboardImage } from './cuadernoImagePaste'
import './cuadernoEditor.css'

export interface CuadernoBlockInputHandle {
  focusAtEnd: () => void
  focusAtCaret: (offset: number) => void
  applyRichText: (segments: RichTextSegment[], caret: number, options?: { focus?: boolean }) => void
  getText: () => string
  getCaret: () => number
  getSelectionOffsets: () => { start: number; end: number }
  getElement: () => HTMLDivElement | null
}

interface CuadernoBlockInputProps {
  blockId: string
  richText: RichTextSegment[]
  placeholder?: string
  className?: string
  ariaLabel: string
  allowMultiline?: boolean
  enableFormatting?: boolean
  onRichTextChange: (richText: RichTextSegment[], plainText: string, caret: number) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  onClick?: () => void
  onPasteImage?: (dataUrl: string, alt?: string) => void | Promise<void>
  onPasteImageError?: (message: string) => void
}

const focusedBlockInputs = new Set<string>()

export function isCuadernoBlockInputFocused(blockId: string): boolean {
  if (focusedBlockInputs.has(blockId)) {
    return true
  }
  const prefix = `${blockId}:`
  for (const id of focusedBlockInputs) {
    if (id.startsWith(prefix)) {
      return true
    }
  }
  return false
}

function areCuadernoBlockInputPropsEqual(
  prev: CuadernoBlockInputProps,
  next: CuadernoBlockInputProps
): boolean {
  if (
    prev.blockId !== next.blockId ||
    prev.placeholder !== next.placeholder ||
    prev.className !== next.className ||
    prev.ariaLabel !== next.ariaLabel ||
    prev.allowMultiline !== next.allowMultiline ||
    prev.enableFormatting !== next.enableFormatting
  ) {
    return false
  }

  if (focusedBlockInputs.has(next.blockId)) {
    return true
  }

  return richTextToPlain(prev.richText) === richTextToPlain(next.richText)
}

const CuadernoBlockInput = forwardRef<CuadernoBlockInputHandle, CuadernoBlockInputProps>(
  function CuadernoBlockInput(
    {
      blockId,
      richText,
      placeholder,
      className,
      ariaLabel,
      allowMultiline = false,
      enableFormatting = false,
      onRichTextChange,
      onKeyDown,
      onFocus,
      onBlur,
      onClick,
      onPasteImage,
      onPasteImageError,
    },
    ref
  ) {
    const editableRef = useRef<HTMLDivElement>(null)
    const isFocusedRef = useRef(false)
    const isComposingRef = useRef(false)
    const suppressSyncRef = useRef(false)
    const hasMountedRef = useRef(false)
    const lastSyncedPlainRef = useRef(richTextToPlain(richText))
    const [isFocused, setIsFocused] = useState(false)

    const syncDomFromRichText = useCallback((segments: RichTextSegment[]) => {
      if (!editableRef.current) {
        return
      }
      syncRichTextHtml(editableRef.current, segments)
      lastSyncedPlainRef.current = richTextToPlain(segments)
    }, [])

    const ensureDomMatchesRichText = useCallback(() => {
      if (!editableRef.current || suppressSyncRef.current) {
        return
      }
      const expectedPlain = richTextToPlain(richText)
      const currentPlain = getContentEditableText(editableRef.current)
      if (currentPlain !== expectedPlain) {
        syncDomFromRichText(richText)
      } else {
        lastSyncedPlainRef.current = expectedPlain
      }
    }, [richText, syncDomFromRichText])

    useImperativeHandle(ref, () => ({
      focusAtEnd() {
        if (editableRef.current) {
          ensureDomMatchesRichText()
          focusContentEditableAtEnd(editableRef.current)
        }
      },
      focusAtCaret(offset: number) {
        if (editableRef.current) {
          ensureDomMatchesRichText()
          editableRef.current.focus()
          setContentEditableCaret(editableRef.current, offset)
        }
      },
      applyRichText(segments: RichTextSegment[], caret: number, options?: { focus?: boolean }) {
        if (!editableRef.current) {
          return
        }
        syncDomFromRichText(segments)
        suppressSyncRef.current = true
        if (options?.focus !== false) {
          editableRef.current.focus()
        }
        setContentEditableCaret(editableRef.current, caret)
        queueMicrotask(() => {
          suppressSyncRef.current = false
        })
      },
      getText() {
        return editableRef.current
          ? getContentEditableText(editableRef.current)
          : richTextToPlain(richText)
      },
      getCaret() {
        return editableRef.current
          ? getContentEditableCaret(editableRef.current)
          : richTextToPlain(richText).length
      },
      getSelectionOffsets() {
        return editableRef.current
          ? getContentEditableSelectionOffsets(editableRef.current)
          : { start: 0, end: 0 }
      },
      getElement() {
        return editableRef.current
      },
    }))

    useLayoutEffect(() => {
      if (!editableRef.current) {
        return
      }

      const nextPlain = richTextToPlain(richText)

      if (!hasMountedRef.current) {
        hasMountedRef.current = true
        syncDomFromRichText(richText)
        return
      }

      if (isFocusedRef.current || suppressSyncRef.current) {
        return
      }

      if (lastSyncedPlainRef.current === nextPlain) {
        return
      }

      const currentPlain = getContentEditableText(editableRef.current)
      if (currentPlain === nextPlain) {
        lastSyncedPlainRef.current = nextPlain
        return
      }

      syncDomFromRichText(richText)
    }, [richText, syncDomFromRichText])

    const emitChange = () => {
      if (!editableRef.current || isComposingRef.current) {
        return
      }

      let segments = richTextFromElement(editableRef.current)
      let plain = richTextToPlain(segments)

      if (!allowMultiline) {
        const collapsed = plain.replace(/\n/g, ' ')
        if (collapsed !== plain) {
          const caret = getContentEditableCaret(editableRef.current)
          plain = collapsed
          segments = [{ text: plain, marks: segments[0]?.marks }]
          syncRichTextHtml(editableRef.current, segments)
          setContentEditableCaret(editableRef.current, Math.min(caret, plain.length))
        }
      }

      const caret = getContentEditableCaret(editableRef.current)
      lastSyncedPlainRef.current = plain
      suppressSyncRef.current = true
      onRichTextChange(segments, plain, caret)
      queueMicrotask(() => {
        suppressSyncRef.current = false
      })
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (enableFormatting) {
        const mark = matchInlineShortcut(event)
        if (mark) {
          event.preventDefault()
          toggleInlineMark(mark)
          emitChange()
          return
        }
      }
      onKeyDown(event)
    }

    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('.cuaderno-internal-link')) {
        event.preventDefault()
      }
      onClick?.()
    }

    const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
      const imageFile = getClipboardImageFile(event.nativeEvent)
      if (imageFile && onPasteImage) {
        event.preventDefault()
        try {
          const dataUrl = await prepareClipboardImage(imageFile)
          await onPasteImage(dataUrl, imageFile.name)
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'No se pudo pegar la imagen'
          onPasteImageError?.(message)
        }
        return
      }

      const text = event.clipboardData.getData('text/plain')
      if (!text && imageFile) {
        event.preventDefault()
        onPasteImageError?.('No se pudo pegar la imagen')
        return
      }

      event.preventDefault()
      insertPlainTextAtSelection(normalizeInlineText(text, allowMultiline))
      emitChange()
    }

    const isEmpty = isRichTextEmpty(richText)

    return (
      <>
        <div
          ref={editableRef}
          className={[
            'cuaderno-block-input',
            isEmpty ? 'cuaderno-block-input--empty' : '',
            isFocused ? 'cuaderno-block-input--focused' : '',
            enableFormatting ? 'cuaderno-block-input--rich' : '',
            className ?? '',
          ]
            .filter(Boolean)
            .join(' ')}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label={ariaLabel}
          aria-multiline={allowMultiline}
          data-placeholder={placeholder ?? ''}
          onInput={emitChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isFocusedRef.current = true
            focusedBlockInputs.add(blockId)
            setIsFocused(true)
            ensureDomMatchesRichText()
            if (editableRef.current) {
              ensureContentEditableCaretHost(editableRef.current)
              if (getContentEditableText(editableRef.current).length === 0) {
                placeCaretInEmptyContentEditable(editableRef.current, false)
              }
            }
            onFocus?.()
          }}
          onBlur={() => {
            emitChange()
            isFocusedRef.current = false
            focusedBlockInputs.delete(blockId)
            setIsFocused(false)
            onBlur?.()
          }}
          onClick={handleClick}
          onCompositionStart={() => {
            isComposingRef.current = true
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false
            emitChange()
          }}
        />
        <CuadernoInlineToolbar
          anchorElement={editableRef.current}
          enabled={enableFormatting && isFocused}
          onFormat={emitChange}
        />
      </>
    )
  }
)

export default memo(CuadernoBlockInput, areCuadernoBlockInputPropsEqual)
