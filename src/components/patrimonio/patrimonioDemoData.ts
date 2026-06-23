import type { PatrimonyData } from './patrimonioTypes'

export const DEMO_PATRIMONY_ITEMS: Array<{ name: string; data: PatrimonyData }> = [
  {
    name: 'Reloj Rolex Submariner',
    data: {
      category: 'Relojes',
      purchaseDate: '2020-05-15',
      purchaseValue: 15000000,
      currency: 'COP',
      description: 'Reloj de lujo submariner con caja de acero inoxidable',
      brand: 'Rolex',
      model: 'Submariner Date',
      serialNumber: 'M126610LN-0001',
      condition: 'Excelente',
      currentValue: 18000000,
      location: 'Caja fuerte',
      insurance: {
        company: 'Seguros Premium',
        policyNumber: 'POL-ROLEX-001',
        coverage: 20000000,
      },
      notes: 'Reloj en perfecto estado, con todos los papeles',
    },
  },
  {
    name: 'Laptop MacBook Pro 16"',
    data: {
      category: 'Electrónica',
      purchaseDate: '2023-03-20',
      purchaseValue: 12000000,
      currency: 'COP',
      description: 'MacBook Pro 16 pulgadas M2 Max, 32GB RAM, 1TB SSD',
      brand: 'Apple',
      model: 'MacBook Pro 16" M2 Max',
      serialNumber: 'C02XK0ABCDEF',
      condition: 'Muy Buena',
      currentValue: 10000000,
      location: 'Oficina',
      notes: 'Equipo de trabajo principal',
    },
  },
  {
    name: 'Pintura Original',
    data: {
      category: 'Arte',
      purchaseDate: '2019-11-10',
      purchaseValue: 5000000,
      currency: 'COP',
      description: 'Pintura al óleo original de artista local',
      condition: 'Buena',
      currentValue: 7500000,
      location: 'Casa',
      insurance: {
        company: 'Seguros Arte',
        policyNumber: 'POL-ART-001',
        coverage: 8000000,
      },
      notes: 'Valorizado por experto en 2023',
    },
  },
]
