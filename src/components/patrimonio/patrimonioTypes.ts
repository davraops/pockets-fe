export interface PatrimonyData {
  category?: string
  purchaseDate?: string
  purchaseValue?: number
  currency?: string
  description?: string
  brand?: string
  model?: string
  serialNumber?: string
  condition?: string
  currentValue?: number
  location?: string
  insurance?: {
    company?: string
    policyNumber?: string
    coverage?: number
  }
  photos?: string[]
  notes?: string
}

export interface PatrimonyItemRecord {
  id: string
  name: string
  data: PatrimonyData
  created_at: string
  updated_at: string
}

export interface PatrimonyItem {
  id: string
  name: string
  data: PatrimonyData
  created_at?: string
  updated_at?: string
}

export function mapPatrimonyRecords(records: PatrimonyItemRecord[]): PatrimonyItem[] {
  return records.map(record => ({
    id: record.id,
    name: record.name,
    data: record.data,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }))
}
