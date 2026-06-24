export type CuadernoPageCoverKind = 'solid' | 'gradient'

export interface CuadernoPageCoverOption {
  id: string
  label: string
  kind: CuadernoPageCoverKind
  background: string
}

export interface CuadernoPageCoverCategory {
  id: string
  label: string
  covers: readonly CuadernoPageCoverOption[]
}

export const CUADERNO_PAGE_COVER_CATEGORIES: CuadernoPageCoverCategory[] = [
  {
    id: 'solids-neutral',
    label: 'Neutros',
    covers: [
      { id: 'solid-gray', label: 'Gris', kind: 'solid', background: '#9B9A97' },
      { id: 'solid-slate', label: 'Pizarra', kind: 'solid', background: '#64748B' },
      { id: 'solid-charcoal', label: 'Carbón', kind: 'solid', background: '#3F3F46' },
      { id: 'solid-brown', label: 'Marrón', kind: 'solid', background: '#64473A' },
      { id: 'solid-beige', label: 'Beige', kind: 'solid', background: '#C4A882' },
      { id: 'solid-sand', label: 'Arena', kind: 'solid', background: '#D4A574' },
    ],
  },
  {
    id: 'solids-warm',
    label: 'Cálidos',
    covers: [
      { id: 'solid-red', label: 'Rojo', kind: 'solid', background: '#E03E3E' },
      { id: 'solid-coral', label: 'Coral', kind: 'solid', background: '#E56B6F' },
      { id: 'solid-orange', label: 'Naranja', kind: 'solid', background: '#D9730D' },
      { id: 'solid-amber', label: 'Ámbar', kind: 'solid', background: '#F59E0B' },
      { id: 'solid-yellow', label: 'Amarillo', kind: 'solid', background: '#DFAB01' },
      { id: 'solid-peach', label: 'Durazno', kind: 'solid', background: '#F4A261' },
    ],
  },
  {
    id: 'solids-cool',
    label: 'Fríos',
    covers: [
      { id: 'solid-green', label: 'Verde', kind: 'solid', background: '#0F7B6C' },
      { id: 'solid-teal', label: 'Verde azulado', kind: 'solid', background: '#14B8A6' },
      { id: 'solid-mint', label: 'Menta', kind: 'solid', background: '#6EE7B7' },
      { id: 'solid-blue', label: 'Azul', kind: 'solid', background: '#0B6E99' },
      { id: 'solid-sky', label: 'Cielo', kind: 'solid', background: '#38BDF8' },
      { id: 'solid-navy', label: 'Marino', kind: 'solid', background: '#1E3A5F' },
      { id: 'solid-purple', label: 'Morado', kind: 'solid', background: '#6940A5' },
      { id: 'solid-violet', label: 'Violeta', kind: 'solid', background: '#8B5CF6' },
      { id: 'solid-pink', label: 'Rosa', kind: 'solid', background: '#AD1A72' },
      { id: 'solid-rose', label: 'Rosado', kind: 'solid', background: '#EC4899' },
    ],
  },
  {
    id: 'gradients-warm',
    label: 'Gradientes cálidos',
    covers: [
      {
        id: 'gradient-sunset',
        label: 'Atardecer',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
      },
      {
        id: 'gradient-peach',
        label: 'Durazno',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      },
      {
        id: 'gradient-ember',
        label: 'Brasa',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
      },
      {
        id: 'gradient-gold',
        label: 'Oro',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
      },
      {
        id: 'gradient-rose',
        label: 'Rosa',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
      {
        id: 'gradient-coral',
        label: 'Coral',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      },
    ],
  },
  {
    id: 'gradients-cool',
    label: 'Gradientes fríos',
    covers: [
      {
        id: 'gradient-ocean',
        label: 'Océano',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
      },
      {
        id: 'gradient-forest',
        label: 'Bosque',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      },
      {
        id: 'gradient-sky',
        label: 'Cielo',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #56CCF2 0%, #2F80ED 100%)',
      },
      {
        id: 'gradient-mint',
        label: 'Menta',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      },
      {
        id: 'gradient-sage',
        label: 'Salvia',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
      },
      {
        id: 'gradient-aqua',
        label: 'Agua',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
      },
    ],
  },
  {
    id: 'gradients-deep',
    label: 'Gradientes profundos',
    covers: [
      {
        id: 'gradient-lavender',
        label: 'Lavanda',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)',
      },
      {
        id: 'gradient-indigo',
        label: 'Índigo',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
      },
      {
        id: 'gradient-dusk',
        label: 'Anochecer',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
      },
      {
        id: 'gradient-slate',
        label: 'Pizarra',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #536976 0%, #292E49 100%)',
      },
      {
        id: 'gradient-midnight',
        label: 'Medianoche',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      },
      {
        id: 'gradient-aurora',
        label: 'Aurora',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      },
      {
        id: 'gradient-berry',
        label: 'Baya',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
      },
      {
        id: 'gradient-steel',
        label: 'Acero',
        kind: 'gradient',
        background: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
      },
    ],
  },
]

const COVER_BY_ID = new Map(
  CUADERNO_PAGE_COVER_CATEGORIES.flatMap(category =>
    category.covers.map(cover => [cover.id, cover] as const)
  )
)

export function normalizePageCover(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed || !COVER_BY_ID.has(trimmed)) {
    return undefined
  }
  return trimmed
}

export function getPageCoverOption(coverId: string | undefined): CuadernoPageCoverOption | undefined {
  if (!coverId) {
    return undefined
  }
  return COVER_BY_ID.get(coverId)
}

export function getPageCoverBackground(coverId: string | undefined): string | undefined {
  return getPageCoverOption(coverId)?.background
}

export const CUADERNO_PAGE_COVER_IDS: readonly string[] = CUADERNO_PAGE_COVER_CATEGORIES.flatMap(category =>
  category.covers.map(cover => cover.id)
)

export function pickRandomPageCover(): string {
  const ids = CUADERNO_PAGE_COVER_IDS
  return ids[Math.floor(Math.random() * ids.length)] ?? 'solid-gray'
}

export function resolvePageCover(value: unknown): string {
  return normalizePageCover(value) ?? pickRandomPageCover()
}
