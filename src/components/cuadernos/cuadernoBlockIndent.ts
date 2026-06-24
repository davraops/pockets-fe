import type { CSSProperties } from 'react'
import type { CuadernoBlock, CuadernoBlockType } from './cuadernoDocument'

export const MAX_BLOCK_INDENT = 8
export const INDENT_STEP_REM = 1.5

export const INDENTABLE_BLOCK_TYPES: CuadernoBlockType[] = [
  'paragraph',
  'bulleted_list_item',
  'numbered_list_item',
  'to_do',
]

export function isIndentableBlockType(type: CuadernoBlockType): boolean {
  return INDENTABLE_BLOCK_TYPES.includes(type)
}

export function getBlockIndent(block: CuadernoBlock): number {
  return block.indent ?? 0
}

export function clampIndent(indent: number): number {
  return Math.min(Math.max(0, Math.round(indent)), MAX_BLOCK_INDENT)
}

export function canIndentBlock(blocks: CuadernoBlock[], index: number): boolean {
  if (index <= 0) {
    return false
  }
  const block = blocks[index]
  if (!isIndentableBlockType(block.type)) {
    return false
  }
  const indent = getBlockIndent(block)
  if (indent >= MAX_BLOCK_INDENT) {
    return false
  }
  const previous = blocks[index - 1]
  return getBlockIndent(previous) >= indent
}

export function canOutdentBlock(blocks: CuadernoBlock[], index: number): boolean {
  const block = blocks[index]
  if (!isIndentableBlockType(block.type)) {
    return false
  }
  return getBlockIndent(block) > 0
}

export function indentBlockAt(blocks: CuadernoBlock[], index: number): CuadernoBlock[] {
  if (!canIndentBlock(blocks, index)) {
    return blocks
  }
  const next = [...blocks]
  const block = next[index]
  next[index] = { ...block, indent: getBlockIndent(block) + 1 }
  return next
}

export function outdentBlockAt(blocks: CuadernoBlock[], index: number): CuadernoBlock[] {
  if (!canOutdentBlock(blocks, index)) {
    return blocks
  }
  const next = [...blocks]
  const block = next[index]
  next[index] = { ...block, indent: getBlockIndent(block) - 1 }
  return next
}

export function blockIndentStyle(indent: number): CSSProperties {
  return { '--cuaderno-block-indent': clampIndent(indent) } as CSSProperties
}
