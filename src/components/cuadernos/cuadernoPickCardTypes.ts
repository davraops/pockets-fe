export interface CuadernoPickCardModel {
  id: string
  title: string
  icon?: string
  cover?: string
  /** Nombre del cuaderno padre cuando es subpágina. */
  parentLabel?: string
  isPlaceholder?: boolean
}
