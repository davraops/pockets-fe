import type { SvgIconComponent } from '@mui/icons-material'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import BookIcon from '@mui/icons-material/Book'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import FlagIcon from '@mui/icons-material/Flag'
import RepeatIcon from '@mui/icons-material/Repeat'
import TodayIcon from '@mui/icons-material/Today'

export type TiempoHubSection =
  | 'fechas'
  | 'mi-dia'
  | 'rutinas'
  | 'mi-diario'
  | 'metas'
  | 'valores'

export interface TiempoModuleDef {
  id: string
  title: string
  path: string
  Icon: SvgIconComponent
  color: string
  section: TiempoHubSection
}

export interface TiempoModuleGroup {
  header: string
  modules: TiempoModuleDef[]
}

export const TIEMPO_MODULE_GROUPS: TiempoModuleGroup[] = [
  {
    header: 'Agenda',
    modules: [
      {
        id: 'fechas',
        title: 'Fechas',
        path: '/tiempo/fechas',
        Icon: CalendarTodayIcon,
        color: '#007AFF',
        section: 'fechas',
      },
    ],
  },
  {
    header: 'Rutinas',
    modules: [
      {
        id: 'mi-dia',
        title: 'Mi Día',
        path: '/tiempo/mi-dia',
        Icon: TodayIcon,
        color: '#FF9500',
        section: 'mi-dia',
      },
      {
        id: 'rutinas',
        title: 'Rutinas',
        path: '/tiempo/rutinas',
        Icon: RepeatIcon,
        color: '#34C759',
        section: 'rutinas',
      },
    ],
  },
  {
    header: 'Reflexión',
    modules: [
      {
        id: 'mi-diario',
        title: 'Mi Diario',
        path: '/tiempo/mi-diario',
        Icon: BookIcon,
        color: '#AF52DE',
        section: 'mi-diario',
      },
    ],
  },
  {
    header: 'Crecimiento',
    modules: [
      {
        id: 'metas',
        title: 'Metas',
        path: '/tiempo/metas',
        Icon: FlagIcon,
        color: '#FF2D55',
        section: 'metas',
      },
      {
        id: 'valores',
        title: 'Valores',
        path: '/tiempo/valores',
        Icon: AutoStoriesIcon,
        color: '#5AC8FA',
        section: 'valores',
      },
    ],
  },
]
