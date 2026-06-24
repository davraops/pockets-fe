import { describe, expect, it } from 'vitest'
import { CUADERNO_BLOCK_COMMANDS } from './cuadernoBlockCommands'
import { detectSlashCommandTrigger, filterSlashCommands } from './cuadernoSlashCommand'

describe('detectSlashCommandTrigger', () => {
  it('opens when slash starts a token at block start', () => {
    expect(detectSlashCommandTrigger('/tit', 4)).toEqual({
      open: true,
      query: 'tit',
      slashIndex: 0,
    })
  })

  it('ignores slash inside words', () => {
    expect(detectSlashCommandTrigger('foo/bar', 7)).toBeNull()
  })
})

describe('filterSlashCommands', () => {
  it('returns all commands for empty query', () => {
    expect(filterSlashCommands('')).toHaveLength(CUADERNO_BLOCK_COMMANDS.length)
  })

  it('filters by keyword', () => {
    const matches = filterSlashCommands('tabla')
    expect(matches.some(command => command.type === 'table')).toBe(true)
  })
})
