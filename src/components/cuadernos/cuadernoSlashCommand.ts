import {
  CUADERNO_BLOCK_COMMANDS,
  type CuadernoBlockCommand,
} from './cuadernoBlockCommands'

export interface SlashCommandTrigger {
  open: boolean
  query: string
  slashIndex: number
}

export function detectSlashCommandTrigger(text: string, caret: number): SlashCommandTrigger | null {
  const before = text.slice(0, caret)
  const slashIndex = before.lastIndexOf('/')
  if (slashIndex === -1) {
    return null
  }

  if (slashIndex > 0) {
    const previous = before[slashIndex - 1]
    if (previous !== ' ' && previous !== '\n') {
      return null
    }
  }

  const query = before.slice(slashIndex + 1)
  if (/\s/.test(query)) {
    return null
  }

  return { open: true, query, slashIndex }
}

export function filterSlashCommands(query: string): CuadernoBlockCommand[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return CUADERNO_BLOCK_COMMANDS
  }

  return CUADERNO_BLOCK_COMMANDS.filter(command => {
    const haystack = [command.label, command.description, ...command.keywords]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalized) || command.type.includes(normalized)
  })
}
