import type { CuadernoBlockType } from './cuadernoDocument'

export interface CuadernoBlockCommand {
  type: CuadernoBlockType
  label: string
  description: string
  keywords: string[]
  icon: string
}

export const CUADERNO_BLOCK_COMMANDS: CuadernoBlockCommand[] = [
  {
    type: 'paragraph',
    label: 'Texto',
    description: 'Empieza a escribir con texto normal',
    keywords: ['texto', 'parrafo', 'p'],
    icon: '¶',
  },
  {
    type: 'heading_1',
    label: 'Título 1',
    description: 'Encabezado grande',
    keywords: ['h1', 'titulo', 'heading'],
    icon: 'H1',
  },
  {
    type: 'heading_2',
    label: 'Título 2',
    description: 'Encabezado mediano',
    keywords: ['h2', 'subtitulo'],
    icon: 'H2',
  },
  {
    type: 'heading_3',
    label: 'Título 3',
    description: 'Encabezado pequeño',
    keywords: ['h3'],
    icon: 'H3',
  },
  {
    type: 'bulleted_list_item',
    label: 'Lista con viñetas',
    description: 'Crea una lista simple',
    keywords: ['lista', 'viñeta', 'bullet', 'ul'],
    icon: '•',
  },
  {
    type: 'numbered_list_item',
    label: 'Lista numerada',
    description: 'Crea una lista con números',
    keywords: ['numerada', 'ol', '1'],
    icon: '1.',
  },
  {
    type: 'to_do',
    label: 'Lista de tareas',
    description: 'Sigue el progreso con casillas',
    keywords: ['todo', 'tarea', 'check', 'checkbox'],
    icon: '☐',
  },
  {
    type: 'quote',
    label: 'Cita',
    description: 'Captura una cita',
    keywords: ['quote', 'cita', 'blockquote'],
    icon: '❝',
  },
  {
    type: 'code',
    label: 'Código',
    description: 'Bloque de código monoespaciado',
    keywords: ['code', 'codigo', 'snippet'],
    icon: '</>',
  },
  {
    type: 'divider',
    label: 'Divisor',
    description: 'Separa secciones visualmente',
    keywords: ['divider', 'linea', 'hr', '---'],
    icon: '—',
  },
  {
    type: 'image',
    label: 'Imagen',
    description: 'Pega una imagen desde el portapapeles',
    keywords: ['imagen', 'image', 'foto', 'picture', 'img'],
    icon: '🖼',
  },
  {
    type: 'column_2',
    label: '2 columnas',
    description: 'Divide el contenido en dos columnas',
    keywords: ['columnas', 'column', 'cols', 'grid'],
    icon: '▥',
  },
  {
    type: 'table',
    label: 'Tabla',
    description: 'Organiza datos en filas y columnas',
    keywords: ['tabla', 'table', 'grid', 'celdas'],
    icon: '⊞',
  },
]

export function enterCreatesNewBlock(type: CuadernoBlockType): boolean {
  return (
    type !== 'to_do' &&
    type !== 'bulleted_list_item' &&
    type !== 'numbered_list_item' &&
    type !== 'column_2' &&
    type !== 'table' &&
    type !== 'image'
  )
}

export function nextBlockTypeOnEnter(type: CuadernoBlockType): CuadernoBlockType {
  switch (type) {
    case 'bulleted_list_item':
      return 'bulleted_list_item'
    case 'numbered_list_item':
      return 'numbered_list_item'
    case 'to_do':
      return 'to_do'
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'quote':
    case 'code':
    case 'column_2':
    case 'table':
    case 'image':
      return 'paragraph'
    default:
      return 'paragraph'
  }
}

export interface MarkdownShortcutResult {
  type: CuadernoBlockType
  text: string
}

export function applyMarkdownShortcut(value: string): MarkdownShortcutResult | null {
  if (value === '# ') {
    return { type: 'heading_1', text: '' }
  }
  if (value === '## ') {
    return { type: 'heading_2', text: '' }
  }
  if (value === '### ') {
    return { type: 'heading_3', text: '' }
  }
  if (value === '- ' || value === '* ') {
    return { type: 'bulleted_list_item', text: '' }
  }
  if (value === '[] ' || value === '[ ] ') {
    return { type: 'to_do', text: '' }
  }
  if (/^\d+\.\s$/.test(value)) {
    return { type: 'numbered_list_item', text: '' }
  }
  if (value === '---') {
    return { type: 'divider', text: '' }
  }
  return null
}
