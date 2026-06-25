import type { ProcesoBadge } from '../../utils/judicialActuaciones'

export type ProcesoFilter = 'all' | 'tracked' | 'tramite' | 'inactivos'

export interface ProcesoParty {
  role: string
  names: string
}

export interface Proceso {
  id: string
  idProceso: number
  numero: string
  despacho: string
  departamento: string
  sujetosProcesales: string
  fechaInicio: string
  fechaUltimaActuacion: string
  estado: string
  badge?: ProcesoBadge
  trackingId?: string
  isTracked?: boolean
  userRoles?: string[]
  parties?: ProcesoParty[]
}

export interface Actuacion {
  id: number
  numero: number
  fecha: string
  tipo: string
  anotacion: string | null
  fechaInicial: string | null
  fechaFinal: string | null
  fechaRegistro: string
  conDocumentos: boolean
}

export interface ProcesoAPI {
  idProceso: number
  idConexion: number
  llaveProceso: string
  fechaProceso: string
  fechaUltimaActuacion: string
  despacho: string
  departamento: string
  sujetosProcesales: string
  esPrivado: boolean
  cantFilas: number
}
