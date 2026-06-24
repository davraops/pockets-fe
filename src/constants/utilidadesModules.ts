import type { SvgIconComponent } from '@mui/icons-material'
import BookIcon from '@mui/icons-material/Book'
import CalculateIcon from '@mui/icons-material/Calculate'
import FolderIcon from '@mui/icons-material/Folder'
import PeopleIcon from '@mui/icons-material/People'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import InventoryIcon from '@mui/icons-material/Inventory'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import LockIcon from '@mui/icons-material/Lock'
import { sectionColor } from './sectionColors'

export type UtilidadesStatSource =
  | 'notes'
  | 'secrets'
  | 'files'
  | 'employees'
  | 'vehicles'
  | 'patrimony'

export interface UtilidadesModuleDef {
  id: string
  title: string
  path: string
  Icon: SvgIconComponent
  color: string
  statSource?: UtilidadesStatSource
  staticSubtitle?: string
}

export interface UtilidadesModuleGroup {
  header: string
  modules: UtilidadesModuleDef[]
}

export const UTILIDADES_MODULE_GROUPS: UtilidadesModuleGroup[] = [
  {
    header: 'Productividad',
    modules: [
      {
        id: 'cuadernos',
        title: 'Cuadernos',
        path: '/registros/cuadernos',
        Icon: BookIcon,
        color: sectionColor.blue,
        statSource: 'notes',
      },
      {
        id: 'calculadora',
        title: 'Calculadora',
        path: '/registros/calculadora',
        Icon: CalculateIcon,
        color: sectionColor.success,
        staticSubtitle: 'Herramienta instantánea',
      },
    ],
  },
  {
    header: 'Seguridad',
    modules: [
      {
        id: 'secretos',
        title: 'Secretos',
        path: '/registros/secretos',
        Icon: LockIcon,
        color: sectionColor.danger,
        statSource: 'secrets',
      },
      {
        id: 'generador',
        title: 'Generador',
        path: '/registros/generador-contrasenas',
        Icon: VpnKeyIcon,
        color: sectionColor.blue,
        staticSubtitle: 'Contraseñas seguras',
      },
    ],
  },
  {
    header: 'Registros',
    modules: [
      {
        id: 'archivos',
        title: 'Archivos',
        path: '/registros/archivos',
        Icon: FolderIcon,
        color: sectionColor.utilidades,
        statSource: 'files',
      },
      {
        id: 'empleados',
        title: 'Empleados',
        path: '/registros/empleados',
        Icon: PeopleIcon,
        color: sectionColor.lifestyle,
        statSource: 'employees',
      },
    ],
  },
  {
    header: 'Bienes',
    modules: [
      {
        id: 'vehiculos',
        title: 'Vehículos',
        path: '/registros/vehiculos',
        Icon: DirectionsCarIcon,
        color: sectionColor.indigo,
        statSource: 'vehicles',
      },
      {
        id: 'patrimonio',
        title: 'Patrimonio',
        path: '/registros/patrimonio',
        Icon: InventoryIcon,
        color: sectionColor.lifestyle,
        statSource: 'patrimony',
      },
    ],
  },
]
