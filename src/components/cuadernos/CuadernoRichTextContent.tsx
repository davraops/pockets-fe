import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getCuadernoLinkPath } from './cuadernoLinkUtils'
import type { RichTextSegment } from './cuadernoRichText'
import './cuadernoEditor.css'

interface CuadernoRichTextContentProps {
  segments: RichTextSegment[]
  className?: string
}

function renderSegment(segment: RichTextSegment, index: number) {
  const marks = segment.marks ?? []
  let node: ReactNode = segment.text

  if (marks.includes('code')) {
    node = <code>{node}</code>
  }
  if (marks.includes('strikethrough')) {
    node = <s>{node}</s>
  }
  if (marks.includes('underline')) {
    node = <u>{node}</u>
  }
  if (marks.includes('italic')) {
    node = <em>{node}</em>
  }
  if (marks.includes('bold')) {
    node = <strong>{node}</strong>
  }

  if (segment.link?.type === 'cuaderno') {
    return (
      <Link
        key={`segment-${index}`}
        to={getCuadernoLinkPath(segment.link.noteId)}
        className="cuaderno-internal-link"
        onMouseUp={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
      >
        {node}
      </Link>
    )
  }

  return <span key={`segment-${index}`}>{node}</span>
}

function CuadernoRichTextContent({ segments, className }: CuadernoRichTextContentProps) {
  return (
    <span className={className}>
      {segments.map((segment, index) => renderSegment(segment, index))}
    </span>
  )
}

export default CuadernoRichTextContent
