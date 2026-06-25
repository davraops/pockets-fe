export type PersonalValueKind = 'value' | 'belief'

export interface PersonalValueEntry {
  id: string
  kind: PersonalValueKind
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export type ValoresFilterKind = 'all' | PersonalValueKind
