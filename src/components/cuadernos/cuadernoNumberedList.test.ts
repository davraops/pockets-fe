import { describe, expect, it } from 'vitest'
import { createEmptyDocument, createBlockId, getNumberedBlockStartNumber } from './cuadernoDocument'
import { createListItem } from './cuadernoListItems'

describe('getNumberedBlockStartNumber', () => {
  it('continues numbering across consecutive numbered blocks', () => {
    const blocks = [
      {
        id: createBlockId(),
        type: 'numbered_list_item' as const,
        listItems: [createListItem([{ text: 'Uno' }]), createListItem([{ text: 'Dos' }])],
      },
      {
        id: createBlockId(),
        type: 'numbered_list_item' as const,
        listItems: [createListItem([{ text: 'Tres' }])],
      },
    ]

    expect(getNumberedBlockStartNumber(blocks, 0)).toBe(1)
    expect(getNumberedBlockStartNumber(blocks, 1)).toBe(3)
  })

  it('resets after a non-numbered block', () => {
    const doc = createEmptyDocument()
    const blocks = [
      { ...doc.blocks[0], type: 'numbered_list_item' as const, listItems: [createListItem()] },
      { id: createBlockId(), type: 'paragraph' as const, text: 'break' },
      { id: createBlockId(), type: 'numbered_list_item' as const, listItems: [createListItem()] },
    ]

    expect(getNumberedBlockStartNumber(blocks, 2)).toBe(1)
  })
})
