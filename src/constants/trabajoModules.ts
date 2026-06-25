import AssignmentIcon from '@mui/icons-material/Assignment'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import WorkIcon from '@mui/icons-material/Work'
import type { SvgIconProps } from '@mui/material'
import { sectionColor } from './sectionColors'

export type TrabajoModuleId = 'contratos' | 'actividades' | 'procesos'

export interface TrabajoModuleDef {
  id: TrabajoModuleId
  title: string
  path: string
  Icon: React.ComponentType<SvgIconProps>
  color: string
}

export const TRABAJO_MODULES: TrabajoModuleDef[] = [
  {
    id: 'contratos',
    title: 'Contratos',
    path: '/trabajo/contratos',
    Icon: AssignmentIcon,
    color: sectionColor.blue,
  },
  {
    id: 'actividades',
    title: 'Actividades',
    path: '/trabajo/actividades',
    Icon: WorkIcon,
    color: sectionColor.trabajo,
  },
  {
    id: 'procesos',
    title: 'Procesos',
    path: '/trabajo/procesos',
    Icon: PersonSearchIcon,
    color: sectionColor.success,
  },
]
