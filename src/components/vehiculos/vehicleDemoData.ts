import type { VehicleData } from './vehicleTypes'

export const DEMO_VEHICLES: Array<{ name: string; data: VehicleData }> = [
  {
    name: 'Toyota Corolla 2020',
    data: {
      type: 'Automóvil',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      plate: 'ABC123',
      color: 'Blanco',
      vin: '1HGBH41JXMN109186',
      mileage: 45000,
      fuelType: 'Gasolina',
      insurance: {
        company: 'Seguros XYZ',
        policyNumber: 'POL-123456',
        expirationDate: '2023-12-31',
        coverage: 'Todo Riesgo',
      },
      maintenance: {
        lastService: '2024-01-15',
        nextService: '2024-07-15',
        serviceInterval: 10000,
      },
      documents: {
        soat: { number: 'SOAT-789012', expiration: '2024-12-31' },
        technicalReview: { number: 'RT-345678', expiration: '2023-06-30' },
      },
      notes: 'Vehículo en excelente estado - Seguro y revisión técnica vencidos',
    },
  },
  {
    name: 'Honda CB650R',
    data: {
      type: 'Moto',
      brand: 'Honda',
      model: 'CB650R',
      year: 2022,
      plate: 'XYZ789',
      color: 'Negro',
      vin: 'JH2SC5900CK200001',
      mileage: 12000,
      fuelType: 'Gasolina',
      insurance: {
        company: 'Seguros ABC',
        policyNumber: 'POL-789012',
        expirationDate: '2024-11-30',
        coverage: 'Responsabilidad Civil',
      },
      maintenance: {
        lastService: '2024-03-20',
        nextService: '2024-09-20',
        serviceInterval: 6000,
      },
      documents: {
        soat: { number: 'SOAT-345678', expiration: '2024-11-30' },
      },
    },
  },
  {
    name: 'Ford Ranger 2021',
    data: {
      type: 'Camioneta',
      brand: 'Ford',
      model: 'Ranger',
      year: 2021,
      plate: 'DEF456',
      color: 'Gris',
      vin: '1FTFW1ET5MFA12345',
      mileage: 35000,
      fuelType: 'Diesel',
      insurance: {
        company: 'Seguros DEF',
        policyNumber: 'POL-456789',
        expirationDate: '2025-01-15',
        coverage: 'Todo Riesgo',
      },
      maintenance: {
        lastService: '2024-02-10',
        nextService: '2024-08-10',
        serviceInterval: 15000,
      },
      documents: {
        soat: { number: 'SOAT-901234', expiration: '2025-01-15' },
        technicalReview: { number: 'RT-567890', expiration: '2025-03-31' },
      },
    },
  },
]
