import { useNavigate } from 'react-router-dom'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { TRABAJO_MODULES } from '../../constants/trabajoModules'
import { formatTrabajoModuleSubtitle, type TrabajoHubStats } from './trabajoHubUtils'

interface TrabajoHubModulesProps {
  stats: TrabajoHubStats
  failedSources: Set<string>
  statsLoading: boolean
}

function sourceForModule(moduleId: (typeof TRABAJO_MODULES)[number]['id']): string {
  switch (moduleId) {
    case 'contratos':
      return 'contracts'
    case 'actividades':
      return 'activities'
    case 'procesos':
      return 'processes'
    default:
      return moduleId
  }
}

function TrabajoHubModules({ stats, failedSources, statsLoading }: TrabajoHubModulesProps) {
  const navigate = useNavigate()

  return (
    <div className="trabajo-modules">
      <div className="glass-group">
        {TRABAJO_MODULES.map(module => {
          const source = sourceForModule(module.id)
          const unavailable = failedSources.has(source)

          return (
            <button
              key={module.id}
              type="button"
              className="trabajo-module-row"
              onClick={() => navigate(module.path)}
              aria-label={`Ir a ${module.title}`}
            >
              <div
                className="trabajo-module-icon"
                style={{ '--section-color': module.color } as React.CSSProperties}
                aria-hidden="true"
              >
                <module.Icon />
              </div>
              <div className="trabajo-module-body">
                <span className="trabajo-module-title">{module.title}</span>
                <span
                  className={`trabajo-module-sub${unavailable ? ' trabajo-module-sub-unavailable' : ''}`}
                >
                  {statsLoading
                    ? 'Cargando…'
                    : unavailable
                      ? 'No disponible'
                      : formatTrabajoModuleSubtitle(module.id, stats)}
                </span>
              </div>
              <ChevronRightIcon className="trabajo-feed-chevron" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TrabajoHubModules
