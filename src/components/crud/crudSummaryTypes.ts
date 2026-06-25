export type CrudSummaryTone =
  | 'info'
  | 'available'
  | 'expense'
  | 'income'
  | 'positive'
  | 'negative'
  | 'savings'
  | 'danger'

export interface CrudSummaryItem {
  label: string
  value: string | number
  tone?: CrudSummaryTone
  emphasis?: boolean
}
