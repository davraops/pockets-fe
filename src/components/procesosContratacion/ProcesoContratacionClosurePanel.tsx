import SchoolIcon from '@mui/icons-material/School'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { ProcesoContratacion } from './procesoContratacionTypes'
import {
  buildClosureRecords,
  buildClosureStats,
  buildSkillGapAggregates,
  formatProcesoDate,
  getClosureReasonLabel,
  getClosureReasonTone,
} from './procesoContratacionDisplayUtils'

interface ProcesoContratacionClosurePanelProps {
  procesos: ProcesoContratacion[]
  reinforcingSkillKey?: string | null
  onSelectProceso?: (proceso: ProcesoContratacion) => void
  onReinforceSkill?: (skillKey: string, skillLabel: string) => void
}

function ProcesoContratacionClosurePanel({
  procesos,
  reinforcingSkillKey = null,
  onSelectProceso,
  onReinforceSkill,
}: ProcesoContratacionClosurePanelProps) {
  const stats = buildClosureStats(procesos)
  const records = buildClosureRecords(procesos)
  const skillGaps = buildSkillGapAggregates(procesos)

  const kpis = [
    { label: 'Abiertos estancados', value: stats.abiertosEstancados, tone: 'danger' as const },
    { label: 'Cerrados por estancamiento', value: stats.estancados, tone: 'danger' as const },
    { label: 'Descartados por precio', value: stats.precio, tone: 'warning' as const },
    { label: 'Por falta de skills', value: stats.skills, tone: 'warning' as const },
    { label: 'Contratados', value: stats.contratados, tone: 'success' as const },
    { label: 'Total cerrados', value: stats.totalCerrados, tone: 'neutral' as const },
  ]

  return (
    <div className="proceso-contratacion-closure-panel">
      <div className="proceso-contratacion-closure-kpis" role="list" aria-label="Resumen de cierres">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className={`proceso-contratacion-closure-kpi proceso-contratacion-closure-kpi--${kpi.tone}`}
            role="listitem"
          >
            <span className="proceso-contratacion-closure-kpi__label">{kpi.label}</span>
            <span className="proceso-contratacion-closure-kpi__value">{kpi.value}</span>
          </div>
        ))}
      </div>

      {skillGaps.length > 0 ? (
        <section className="proceso-contratacion-closure-section" aria-labelledby="skills-gap-heading">
          <div className="proceso-contratacion-closure-section__header">
            <SchoolIcon aria-hidden="true" />
            <div className="proceso-contratacion-closure-section__header-copy">
              <h2 id="skills-gap-heading" className="proceso-contratacion-closure-section__title">
                Skills para reforzar
              </h2>
              <p className="proceso-contratacion-closure-section__hint">
                Marca como reforzada cuando ya la practiques; desaparece de esta lista pero queda en el historial.
              </p>
            </div>
          </div>
          <div className="proceso-contratacion-closure-skills">
            {skillGaps.map(item => (
              <div key={item.key} className="proceso-contratacion-closure-skill">
                <div className="proceso-contratacion-closure-skill__head">
                  <span className="proceso-contratacion-closure-skill__name">{item.skill}</span>
                  <div className="proceso-contratacion-closure-skill__actions">
                    <span className="proceso-contratacion-closure-skill__count">
                      {item.count} proceso{item.count !== 1 ? 's' : ''}
                    </span>
                    {onReinforceSkill ? (
                      <button
                        type="button"
                        className="proceso-contratacion-closure-skill__reinforce"
                        onClick={() => onReinforceSkill(item.key, item.skill)}
                        disabled={reinforcingSkillKey === item.key}
                        aria-label={`Marcar ${item.skill} como reforzada`}
                      >
                        <CheckCircleIcon aria-hidden="true" />
                        {reinforcingSkillKey === item.key ? 'Guardando…' : 'Ya reforcé'}
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="proceso-contratacion-closure-skill__meta">{item.procesos.join(' · ')}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="proceso-contratacion-closure-section" aria-labelledby="closure-list-heading">
        <h2 id="closure-list-heading" className="proceso-contratacion-closure-section__title">
          Historial de cierres
        </h2>
        {records.length === 0 ? (
          <p className="proceso-contratacion-closure-empty">
            Aún no hay procesos cerrados con motivo registrado.
          </p>
        ) : (
          <div className="glass-group">
            {records.map(record => {
              const proceso = procesos.find(item => item.id === record.id)
              const tone = getClosureReasonTone(record.closure.reason)
              return (
                <button
                  key={record.id}
                  type="button"
                  className="crud-inset-row crud-row-accent-indigo proceso-contratacion-closure-row"
                  onClick={() => proceso && onSelectProceso?.(proceso)}
                >
                  <div className="crud-row-content">
                    <div className="crud-row-header">
                      <div className="crud-row-title-section">
                        <div className="procesos-item-info">
                          <div className="crud-row-title-row">
                            <h3 className="crud-row-title">{record.titulo}</h3>
                            <span
                              className={`proceso-contratacion-closure-badge proceso-contratacion-closure-badge--${tone}`}
                            >
                              {getClosureReasonLabel(record.closure.reason)}
                            </span>
                          </div>
                          <span className="crud-row-meta">
                            {record.empresa} · {record.posicion}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="crud-row-preview">
                      Cerrado {formatProcesoDate(record.closure.closedAt)}
                      {record.closure.notes ? ` · ${record.closure.notes}` : ''}
                    </p>
                    {record.closure.skillsGap && record.closure.skillsGap.length > 0 ? (
                      <p className="proceso-contratacion-closure-row__skills">
                        Pendientes: {record.closure.skillsGap.join(', ')}
                      </p>
                    ) : null}
                    {record.closure.skillsReinforced && record.closure.skillsReinforced.length > 0 ? (
                      <p className="proceso-contratacion-closure-row__skills proceso-contratacion-closure-row__skills--reinforced">
                        Reforzadas: {record.closure.skillsReinforced.join(', ')}
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default ProcesoContratacionClosurePanel
