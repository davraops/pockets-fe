const PAGE_ICON_MAX_LENGTH = 8
const PAGE_COMMENT_MAX_LENGTH = 500

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeParentId(value: unknown, validIds?: Set<string>): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed || !UUID_PATTERN.test(trimmed)) {
    return undefined
  }
  if (validIds && !validIds.has(trimmed)) {
    return undefined
  }
  return trimmed
}

export interface CuadernoEmojiCategory {
  id: string
  label: string
  emojis: readonly string[]
}

export const CUADERNO_EMOJI_CATEGORIES: CuadernoEmojiCategory[] = [
  {
    id: 'notes',
    label: 'Notas y documentos',
    emojis: [
      '📓', '📝', '📔', '📕', '📗', '📘', '📙', '📚',
      '📖', '📰', '📋', '📃', '📄', '🗒️', '🗂️', '📁',
      '📂', '🗃️', '📑', '🔖', '📎', '🖇️', '📌', '📍',
    ],
  },
  {
    id: 'work',
    label: 'Trabajo y productividad',
    emojis: [
      '💼', '🗂️', '📊', '📈', '📉', '🗓️', '📅', '⏰',
      '⏱️', '✅', '☑️', '✔️', '📆', '🗳️', '🏢', '🏛️',
      '👔', '🤝', '📞', '💻', '🖥️', '⌨️', '🖱️', '🖨️',
    ],
  },
  {
    id: 'finance',
    label: 'Finanzas',
    emojis: [
      '💰', '💵', '💴', '💶', '💷', '💳', '🏦', '📉',
      '📈', '💹', '🪙', '🧾', '💸', '🤑', '💲', '🏧',
    ],
  },
  {
    id: 'ideas',
    label: 'Ideas y aprendizaje',
    emojis: [
      '💡', '🧠', '🎓', '📚', '🔬', '🧪', '🔭', '🧬',
      '📐', '📏', '🧮', '🔍', '🔎', '💭', '🗨️', '❓',
      '❗', '💬', '🗯️', '📢', '📣', '🎯', '🧩', '🎲',
    ],
  },
  {
    id: 'goals',
    label: 'Metas y logros',
    emojis: [
      '🎯', '🚀', '⭐', '🌟', '✨', '💫', '🔥', '⚡',
      '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '👑', '💎',
      '🎉', '🎊', '🙌', '👏', '💪', '🫡', '🚩', '🛡️',
    ],
  },
  {
    id: 'tech',
    label: 'Tecnología',
    emojis: [
      '💻', '🖥️', '⌨️', '🖱️', '📱', '📲', '🔋', '🔌',
      '💾', '💿', '📀', '🤖', '🛰️', '📡', '🔧', '🛠️',
      '⚙️', '🔩', '🧰', '🕹️', '🎮', '👾', '🕶️', '🥽',
    ],
  },
  {
    id: 'creative',
    label: 'Arte y creatividad',
    emojis: [
      '🎨', '🖌️', '🖍️', '✏️', '✒️', '🖊️', '🖋️', '📝',
      '🎭', '🎬', '🎤', '🎧', '🎵', '🎶', '🎹', '🎸',
      '🥁', '🎺', '📷', '📸', '🎥', '📹', '🎞️', '📽️',
    ],
  },
  {
    id: 'health',
    label: 'Salud y bienestar',
    emojis: [
      '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜',
      '🏋️', '🤸', '🧘', '🏃', '🚴', '🏊', '⚽', '🎾',
      '🏀', '🏈', '💊', '🩺', '🧴', '😴', '🛌', '🌿',
    ],
  },
  {
    id: 'food',
    label: 'Comida y bebida',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🥑', '🥦', '🥕', '🌽', '🍕', '🍔', '🌮', '🍣',
      '🍜', '🍝', '🥗', '🍰', '🧁', '🍪', '☕', '🍵',
      '🧃', '🥤', '🍷', '🍺', '🫖', '🧋', '🍫', '🍿',
    ],
  },
  {
    id: 'travel',
    label: 'Viajes y lugares',
    emojis: [
      '🏠', '🏡', '🏘️', '🏙️', '🌆', '🗼', '🏰', '⛪',
      '🕌', '🛕', '🗿', '🌍', '🌎', '🌏', '🗺️', '🧭',
      '✈️', '🛫', '🛬', '🚗', '🚕', '🚌', '🚆', '🚇',
      '🚢', '⛵', '🏖️', '🏕️', '⛰️', '🏔️', '🌋', '🗻',
    ],
  },
  {
    id: 'nature',
    label: 'Naturaleza',
    emojis: [
      '🌱', '🌿', '🍀', '🌸', '🌺', '🌻', '🌹', '🌷',
      '🌲', '🌳', '🌴', '🌵', '🍁', '🍂', '🌾', '🌊',
      '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌈',
      '🌙', '🌛', '⭐', '🌟', '❄️', '☃️', '🔥', '💧',
    ],
  },
  {
    id: 'animals',
    label: 'Animales',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🦅', '🦉', '🐝', '🦋', '🐢', '🐍',
      '🐙', '🐠', '🐬', '🐳', '🦄', '🐴', '🦒', '🐘',
    ],
  },
  {
    id: 'people',
    label: 'Personas y emociones',
    emojis: [
      '😀', '😊', '🙂', '😎', '🤩', '🥳', '😇', '🤔',
      '😴', '🤗', '😌', '🥰', '😍', '🤯', '😤', '😢',
      '👤', '👥', '🧑‍💻', '👨‍💼', '👩‍💼', '🧑‍🎨', '👨‍🔬', '👩‍🏫',
      '👶', '🧒', '👦', '👧', '🧓', '👴', '👵', '🙋',
    ],
  },
  {
    id: 'symbols',
    label: 'Símbolos y estados',
    emojis: [
      '🔑', '🔒', '🔓', '🔔', '🔕', '⚠️', '🚫', '⛔',
      '♻️', '🔁', '🔂', '▶️', '⏸️', '⏹️', '➡️', '⬅️',
      '⬆️', '⬇️', '↗️', '↘️', '🔴', '🟠', '🟡', '🟢',
      '🔵', '🟣', '⚫', '⚪', '🟤', '❤️‍🔥', '💔', '♾️',
    ],
  },
  {
    id: 'lifestyle',
    label: 'Estilo de vida',
    emojis: [
      '🛒', '🛍️', '🎁', '🧳', '👗', '👟', '⌚', '💍',
      '🪴', '🛋️', '🛏️', '🪑', '🚿', '🧹', '🧺', '🪞',
      '📺', '📻', '🎧', '📚', '🧸', '🕯️', '🎄', '🎃',
      '🎂', '🍾', '🥂', '🎈', '🎀', '🧧', '🪅', '🎪',
    ],
  },
]

/** Lista plana (sin duplicados) para compatibilidad y búsquedas simples. */
export const CUADERNO_EMOJI_OPTIONS: readonly string[] = [
  ...new Set(CUADERNO_EMOJI_CATEGORIES.flatMap(category => category.emojis)),
]

export function normalizePageIcon(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  const icon = trimmed.slice(0, PAGE_ICON_MAX_LENGTH)
  return icon || undefined
}

export function normalizePageComment(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  return trimmed.slice(0, PAGE_COMMENT_MAX_LENGTH)
}

/** Preserva espacios mientras se edita; solo limita longitud. */
export function clampPageCommentDraft(value: string): string {
  return value.slice(0, PAGE_COMMENT_MAX_LENGTH)
}

export function pickRandomPageIcon(): string {
  const options = CUADERNO_EMOJI_OPTIONS
  return options[Math.floor(Math.random() * options.length)] ?? '📓'
}

export function resolvePageIcon(value: unknown): string {
  return normalizePageIcon(value) ?? pickRandomPageIcon()
}

export function pageMetaEqual(
  left: { icon?: string; comment?: string; cover?: string },
  right: { icon?: string; comment?: string; cover?: string }
): boolean {
  return left.icon === right.icon && left.comment === right.comment && left.cover === right.cover
}

export { normalizePageCover, getPageCoverBackground, getPageCoverOption, resolvePageCover } from './cuadernoPageCovers'
