export type ProcesoClosureReason =
  | 'estancado'
  | 'precio'
  | 'skills'
  | 'contratado'
  | 'rechazado'
  | 'desistido'
  | 'otro'

export type ProcesoContratacionTab = 'pipeline' | 'cierres' | 'agenda'

export interface ProcesoClosureInfo {
  reason: ProcesoClosureReason
  closedAt: string
  notes?: string
  skillsGap?: string[]
  skillsReinforced?: string[]
  wasStalledAtClose?: boolean
}

export interface HiringProcessData {
  contact?: string
  contactVia?: 'LinkedIn' | 'WhatsApp' | 'Email'
  company?: string
  roleDescription?: string
  status?: 'Abierto' | 'Cerrado'
  salaryRange?: {
    min?: number
    max?: number
    currency?: string
  }
  negotiatedSalary?: {
    amount?: number
    currency?: string
  }
  benefits?: string[]
  hiringSteps?: Array<{ step: string; completed: boolean }>
  interviewDates?: Array<{ date: string; time: string }>
  interactions?: Array<{ date: string; description: string }>
  hasAgency?: boolean
  agencyName?: string
  payToLeadingZen?: boolean
  closingDate?: string
  closure?: ProcesoClosureInfo
  position?: string
  location?: string
  applicationDate?: string
  notes?: string
  [key: string]: unknown
}

export interface HiringProcessAPI {
  id: string
  name: string
  data: HiringProcessData
  created_at: string
  updated_at: string
}

export interface ProcesoContratacion {
  id: string
  titulo: string
  empresa: string
  posicion: string
  estado: string
  fechaApertura: string
  fechaCierre?: string
  rawData: HiringProcessAPI
}

export interface InterviewEvent {
  procesoId: string
  procesoName: string
  empresa: string
  date: string
  time: string
  datetime: Date
}

export const CLOSURE_REASON_OPTIONS: Array<{
  id: ProcesoClosureReason
  label: string
  description: string
}> = [
  {
    id: 'estancado',
    label: 'Se estancó',
    description: 'Sin respuesta o sin avance por mucho tiempo',
  },
  {
    id: 'precio',
    label: 'Precio',
    description: 'Oferta fuera de rango o negociación fallida',
  },
  {
    id: 'skills',
    label: 'Skills',
    description: 'No cumplí requisitos técnicos del rol',
  },
  {
    id: 'contratado',
    label: 'Contratado',
    description: 'Cerré el proceso con éxito',
  },
  {
    id: 'rechazado',
    label: 'Rechazado',
    description: 'La empresa descartó mi candidatura',
  },
  {
    id: 'desistido',
    label: 'Desistí',
    description: 'Decidí no continuar',
  },
  {
    id: 'otro',
    label: 'Otro',
    description: 'Otro motivo',
  },
]
