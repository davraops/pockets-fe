import { blockIndentStyle, getBlockIndent } from './cuadernoBlockIndent'
import CuadernoImageBlock from './CuadernoImageBlock'
import CuadernoRichTextContent from './CuadernoRichTextContent'
import {
  documentHasContent,
  getBlockPlainText,
  getBlockRichText,
  getNumberedBlockStartNumber,
  normalizeDocument,
  type CuadernoBlock,
  type CuadernoDocument,
} from './cuadernoDocument'
import { getBlockListItems } from './cuadernoListItems'
import { getBlockTodoItems } from './cuadernoTodoItems'
import { getBlockColumnCells, getBlockTableRows, layoutBlockHasContent } from './cuadernoBlockLayouts'
import { richTextToPlain } from './cuadernoRichText'
import './cuadernoEditor.css'

interface CuadernoBlockViewRowProps {
  block: CuadernoBlock
  index: number
  blocks: CuadernoBlock[]
}

function CuadernoBlockViewRow({ block, index, blocks }: CuadernoBlockViewRowProps) {
  const plainText = getBlockPlainText(block).trim()
  const richText = getBlockRichText(block)

  const rowClass = [
    'cuaderno-block-view',
    `cuaderno-block-view--${block.type.replace(/_/g, '-')}`,
  ].join(' ')

  if (block.type === 'divider') {
    return (
      <div className={rowClass} style={blockIndentStyle(getBlockIndent(block))} role="presentation">
        <hr className="cuaderno-block-divider" aria-hidden="true" />
      </div>
    )
  }

  if (block.type === 'image') {
    if (!block.imageSrc) {
      return null
    }
    return (
      <div className={rowClass} style={blockIndentStyle(getBlockIndent(block))}>
        <CuadernoImageBlock block={block} mode="read" />
      </div>
    )
  }

  if (block.type === 'column_2') {
    const columns = getBlockColumnCells(block)
    if (!layoutBlockHasContent(block)) {
      return null
    }
    return (
      <div className={rowClass} style={blockIndentStyle(getBlockIndent(block))}>
        <div className="cuaderno-column-block cuaderno-column-block--read">
          {columns.map(column => (
            <div key={column.id} className="cuaderno-column-block__col">
              <div className="cuaderno-block-view__text">
                <CuadernoRichTextContent segments={column.richText} className="cuaderno-rich-text-content" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'table') {
    const rows = getBlockTableRows(block)
    if (!layoutBlockHasContent(block)) {
      return null
    }
    return (
      <div className={rowClass}>
        <div className="cuaderno-table-block cuaderno-table-block--read">
          <table className="cuaderno-table-block__table">
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  {row.cells.map(cell => (
                    <td key={cell.id} className="cuaderno-table-block__cell">
                      <CuadernoRichTextContent segments={cell.richText} className="cuaderno-rich-text-content" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!plainText && block.type !== 'to_do') {
    return null
  }

  if (block.type === 'to_do') {
    const items = getBlockTodoItems(block)
    return (
      <div className={rowClass} style={blockIndentStyle(getBlockIndent(block))}>
        <div className="cuaderno-todo-block cuaderno-todo-block--read">
          {items.map(item => {
            const itemText = richTextToPlain(item.richText).trim()
            return (
              <div key={item.id} className="cuaderno-todo-item cuaderno-todo-item--read">
                <span className="cuaderno-block-view__todo-marker" aria-hidden="true">
                  {item.checked ? '☑' : '☐'}
                </span>
                <span
                  className={[
                    'cuaderno-block-view__text',
                    item.checked ? 'cuaderno-block-view__text--done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {itemText ? (
                    <CuadernoRichTextContent segments={item.richText} className="cuaderno-rich-text-content" />
                  ) : (
                    'Tarea sin descripción'
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
    const items = getBlockListItems(block)
    const variant = block.type === 'bulleted_list_item' ? 'bullet' : 'numbered'
    const numberedStart =
      variant === 'numbered' ? getNumberedBlockStartNumber(blocks, index) : 1
    return (
      <div className={rowClass} style={blockIndentStyle(getBlockIndent(block))}>
        <div className={`cuaderno-list-block cuaderno-list-block--read cuaderno-list-block--${variant}`}>
          {items.map((item, itemIndex) => {
            const itemText = richTextToPlain(item.richText).trim()
            if (!itemText) {
              return null
            }
            return (
              <div key={item.id} className="cuaderno-list-item cuaderno-list-item--read">
                <span className="cuaderno-list-item__marker" aria-hidden="true">
                  {variant === 'bullet' ? '•' : `${numberedStart + itemIndex}.`}
                </span>
                <span className="cuaderno-block-view__text">
                  <CuadernoRichTextContent segments={item.richText} className="cuaderno-rich-text-content" />
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const Tag =
    block.type === 'heading_1'
      ? 'h1'
      : block.type === 'heading_2'
        ? 'h2'
        : block.type === 'heading_3'
          ? 'h3'
          : block.type === 'code'
            ? 'pre'
            : block.type === 'quote'
              ? 'blockquote'
              : 'p'

  return (
    <div className={rowClass} style={blockIndentStyle(getBlockIndent(block))}>
      <Tag className="cuaderno-block-view__text">
        {block.type === 'code' ? (
          <code>{plainText}</code>
        ) : (
          <CuadernoRichTextContent segments={richText} className="cuaderno-rich-text-content" />
        )}
      </Tag>
    </div>
  )
}

interface CuadernoBlockViewerProps {
  document: CuadernoDocument
}

function CuadernoBlockViewer({ document: cuadernoDoc }: CuadernoBlockViewerProps) {
  const normalized = normalizeDocument(cuadernoDoc)
  const blocks = normalized.blocks
  const hasContent = documentHasContent(normalized)

  if (!hasContent) {
    return (
      <div className="cuaderno-read-empty">
        <p className="cuaderno-read-empty__title">Cuaderno vacío</p>
        <p className="cuaderno-read-empty__hint">Haz clic aquí para empezar a escribir.</p>
      </div>
    )
  }

  return (
    <article className="cuaderno-block-viewer" aria-label="Contenido del cuaderno">
      {blocks.map((block, index) => (
        <CuadernoBlockViewRow key={block.id} block={block} index={index} blocks={blocks} />
      ))}
    </article>
  )
}

export default CuadernoBlockViewer
