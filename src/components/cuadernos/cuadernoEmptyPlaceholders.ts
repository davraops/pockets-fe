import type { CuadernoPickCardModel } from './cuadernoPickCardTypes'

/** Tarjetas de ejemplo para la pantalla vacía cuando aún no hay cuadernos. */
export const CUADERNO_EMPTY_PLACEHOLDER_CARDS: CuadernoPickCardModel[] = [
  {
    id: 'placeholder-proyecto',
    title: 'Proyecto Freedom',
    icon: '🚀',
    cover: 'gradient-ocean',
  },
  {
    id: 'placeholder-reunion',
    title: 'Notas de reunión',
    icon: '📝',
    cover: 'solid-blue',
  },
  {
    id: 'placeholder-roadmap',
    title: 'Roadmap Q2',
    icon: '🗺️',
    cover: 'gradient-indigo',
    parentLabel: 'Proyecto Freedom',
  },
  {
    id: 'placeholder-ideas',
    title: 'Ideas sueltas',
    icon: '💡',
    cover: 'gradient-sunset',
  },
  {
    id: 'placeholder-compras',
    title: 'Lista de compras',
    icon: '🛒',
    cover: 'gradient-mint',
  },
  {
    id: 'placeholder-diario',
    title: 'Diario personal',
    icon: '📔',
    cover: 'gradient-dusk',
  },
]
