export const HUB_LABELS = {
  registros: 'Utilidades',
  tiempo: 'Lifestyle',
  justicia: 'Justicia',
  trabajo: 'Trabajo',
} as const

export type HubKey = keyof typeof HUB_LABELS

export function backToHubLabel(hub: HubKey): string {
  return `Volver a ${HUB_LABELS[hub]}`
}
