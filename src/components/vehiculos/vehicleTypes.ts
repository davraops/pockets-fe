export interface VehicleData {
  type?: string
  brand?: string
  model?: string
  year?: number
  plate?: string
  color?: string
  vin?: string
  mileage?: number
  fuelType?: string
  insurance?: {
    company?: string
    policyNumber?: string
    expirationDate?: string
    coverage?: string
  }
  maintenance?: {
    lastService?: string
    nextService?: string
    serviceInterval?: number
  }
  documents?: {
    soat?: {
      number?: string
      expiration?: string
    }
    technicalReview?: {
      number?: string
      expiration?: string
    }
  }
  notes?: string
  events?: Array<{
    type: string
    date: string
    description?: string
    location?: string
    cost?: number
    repairShop?: string
    purchasePlace?: string
    notes?: string
  }>
}

export interface VehicleRecord {
  id: string
  name: string
  data: VehicleData
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  name: string
  data: VehicleData
  created_at?: string
  updated_at?: string
}

export type VehicleSyncHandler = (vehicleId: string) => Promise<void>

export function mapVehicleRecords(records: VehicleRecord[]): Vehicle[] {
  return records.map(record => ({
    id: record.id,
    name: record.name,
    data: record.data,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }))
}
