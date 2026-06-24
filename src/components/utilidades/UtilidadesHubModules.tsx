import { useNavigate } from 'react-router-dom'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { UTILIDADES_MODULE_GROUPS } from '../../constants/utilidadesModules'
import {
  formatUtilidadesBytes,
  formatUtilidadesPrice,
  type UtilidadesHubStats,
} from '../../hooks/useUtilidadesHubStats'

interface UtilidadesHubModulesProps {
  stats: UtilidadesHubStats
  failedSources: Set<string>
  statSubtitle: (source: string, value: string) => string
  statSubtitleClass: (source: string) => string
}

function moduleSubtitle(
  moduleId: string,
  statSource: string | undefined,
  staticSubtitle: string | undefined,
  stats: UtilidadesHubStats,
  statSubtitleFn: (source: string, value: string) => string
): string {
  if (staticSubtitle) return staticSubtitle

  switch (statSource) {
    case 'notes':
      return statSubtitleFn(
        'notes',
        stats.totalNotas === 0
          ? 'Sin cuadernos'
          : `${stats.totalNotas} cuaderno${stats.totalNotas !== 1 ? 's' : ''}${
              stats.notasEstaSemana > 0 ? ` · ${stats.notasEstaSemana} esta semana` : ''
            }`
      )
    case 'secrets':
      return statSubtitleFn(
        'secrets',
        stats.totalSecretos === 0
          ? 'Vault vacío'
          : `${stats.totalSecretos} guardado${stats.totalSecretos !== 1 ? 's' : ''}`
      )
    case 'files':
      return statSubtitleFn(
        'files',
        stats.totalArchivos === 0
          ? 'Sin archivos'
          : `${stats.totalArchivos} · ${formatUtilidadesBytes(stats.bytesArchivos)}`
      )
    case 'employees':
      return statSubtitleFn(
        'employees',
        stats.totalEmpleados === 0
          ? 'Sin empleados'
          : `${stats.totalEmpleados} registrado${stats.totalEmpleados !== 1 ? 's' : ''}`
      )
    case 'vehicles':
      return statSubtitleFn(
        'vehicles',
        stats.totalVehiculos === 0
          ? 'Sin vehículos'
          : `${stats.totalVehiculos} · ${stats.vehiculosConSeguro} con seguro`
      )
    case 'patrimony':
      return statSubtitleFn(
        'patrimony',
        stats.totalPatrimonio === 0
          ? 'Sin ítems'
          : stats.valorPatrimonioCOP > 0
            ? `${stats.totalPatrimonio} · ${formatUtilidadesPrice(stats.valorPatrimonioCOP)}`
            : `${stats.totalPatrimonio} ítem${stats.totalPatrimonio !== 1 ? 's' : ''}`
      )
    default:
      return moduleId
  }
}

function UtilidadesHubModules({
  stats,
  failedSources,
  statSubtitle,
  statSubtitleClass,
}: UtilidadesHubModulesProps) {
  const navigate = useNavigate()

  return (
    <nav className="utilidades-modules" aria-label="Módulos de Utilidades">
      {UTILIDADES_MODULE_GROUPS.map(group => (
        <section key={group.header} className="utilidades-modules-group">
          <h2 className="utilidades-modules-group-title">{group.header}</h2>
          <div className="glass-group">
            {group.modules.map(module => {
              const IconComponent = module.Icon
              const subtitle = moduleSubtitle(
                module.id,
                module.statSource,
                module.staticSubtitle,
                stats,
                (source, value) =>
                  failedSources.has(source) ? 'No disponible' : value
              )
              const subtitleClass = module.statSource
                ? statSubtitleClass(module.statSource)
                : 'utilidades-module-sub'

              return (
                <button
                  key={module.id}
                  type="button"
                  className="utilidades-module-row"
                  onClick={() => navigate(module.path)}
                  aria-label={`Ir a ${module.title}. ${subtitle}`}
                >
                  <div
                    className="utilidades-module-icon"
                    style={{ '--section-color': module.color } as React.CSSProperties}
                    aria-hidden="true"
                  >
                    <IconComponent />
                  </div>
                  <div className="utilidades-module-body">
                    <span className="utilidades-module-title">{module.title}</span>
                    <span className={subtitleClass}>{subtitle}</span>
                  </div>
                  <ChevronRightIcon className="utilidades-feed-chevron" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}

export default UtilidadesHubModules
