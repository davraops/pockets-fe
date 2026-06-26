import { Link } from 'react-router-dom'
import '../App.css'
import './AppPage.css'
import './UiReadiness.css'
import './UxReadiness.css'
import './E2e.css'
import {
  E2E_CI_JOBS,
  E2E_COMMANDS,
  E2E_METRICS,
  E2E_PREREQUISITES,
  E2E_SUITE_GROUPS,
  formatE2eBackend,
  type E2eFlow,
} from '../constants/e2eFlows'

function suiteBadgeKind(suiteLabel: string): 'smoke' | 'regression' | 'mobile' | 'nightly' {
  if (suiteLabel === 'Smoke') return 'smoke'
  if (suiteLabel === 'Mobile') return 'mobile'
  return 'regression'
}

function E2eFlowCard({ flow, suiteLabel }: { flow: E2eFlow; suiteLabel: string }) {
  return (
    <article className="e2e-flow-card">
      <div className="e2e-flow-card__header">
        <h3 className="e2e-flow-card__title">{flow.name}</h3>
        <div className="e2e-flow-card__meta">
          <span className={`e2e-badge e2e-badge--${suiteBadgeKind(suiteLabel)}`}>
            {suiteLabel}
          </span>
          {flow.tag ? <span className="e2e-badge e2e-badge--nightly">{flow.tag}</span> : null}
          <span className="e2e-badge">{flow.auth ? 'Auth' : 'Sin auth'}</span>
          <span className="e2e-badge">{formatE2eBackend(flow.backend)}</span>
        </div>
      </div>

      <p className="e2e-spec-path">{flow.specFile}</p>

      {flow.routes.length > 0 ? (
        <div className="e2e-route-links">
          {flow.routes.map(route => (
            <Link key={route} to={route} className="e2e-route-link">
              {route}
            </Link>
          ))}
        </div>
      ) : null}

      <ol className="e2e-flow-list">
        {flow.steps.map(step => (
          <li key={step.label}>
            <strong>Paso:</strong> {step.label}
            {step.detail ? <> — {step.detail}</> : null}
          </li>
        ))}
      </ol>

      <ul className="e2e-flow-list">
        {flow.asserts.map(assertion => (
          <li key={assertion}>
            <strong>Assert:</strong> {assertion}
          </li>
        ))}
      </ul>

      {flow.notes?.length ? (
        <ul className="e2e-flow-list">
          {flow.notes.map(note => (
            <li key={note}>
              <strong>Nota:</strong> {note}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

function E2e() {
  const smokeCount = E2E_SUITE_GROUPS.find(group => group.kind === 'smoke')?.flows.length ?? 0
  const regressionCount = E2E_SUITE_GROUPS.find(group => group.kind === 'regression')?.flows.length ?? 0
  const mobileCount = E2E_SUITE_GROUPS.find(group => group.kind === 'mobile')?.flows.length ?? 0

  return (
    <div className="app-page-container">
      <div className="app-page-content e2e-content ui-readiness-content">
        <section className="ui-readiness-hero">
          <h1 className="home-title">E2E Flows</h1>
          <p className="ui-readiness-subtitle">
            Mapa de los flujos Playwright implementados en <code>e2e/smoke/</code>,{' '}
            <code>e2e/regression/</code> y <code>e2e/mobile/</code>. Los tests corren contra backend real (usuario{' '}
            <code>e2e</code>) salvo Justicia (mocks) y generador de contraseñas (local).
            Documentación técnica en <code>e2e/README.md</code>.
          </p>
        </section>

        <section className="ui-readiness-section">
          <h2 className="app-subsection-title app-subsection-title--plain">Resumen</h2>
          <div className="ui-readiness-token-grid">
            {E2E_METRICS.map(metric => (
              <div key={metric.label} className="ui-readiness-token-card">
                <div className="ui-readiness-token-swatch ui-readiness-token-swatch-meta">
                  {metric.value}
                </div>
                <div className="ui-readiness-token-info">
                  <span className="ui-readiness-token-desc">{metric.label}</span>
                </div>
              </div>
            ))}
            <div className="ui-readiness-token-card">
              <div className="ui-readiness-token-swatch ui-readiness-token-swatch-meta">
                {smokeCount}+{regressionCount}+{mobileCount}
              </div>
              <div className="ui-readiness-token-info">
                <span className="ui-readiness-token-desc">Flujos smoke + regression + mobile</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="app-subsection-title app-subsection-title--plain">Comandos</h2>
          <div className="e2e-commands">
            {E2E_COMMANDS.map(item => (
              <div key={item.command} className="e2e-command-row">
                <span>{item.label}</span>
                <code>{item.command}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="app-subsection-title app-subsection-title--plain">Prerrequisitos</h2>
          <ul className="e2e-flow-list">
            {E2E_PREREQUISITES.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {E2E_SUITE_GROUPS.map(group => (
          <section key={group.kind} className="ui-readiness-section">
            <h2 className="app-subsection-title app-subsection-title--plain">{group.label}</h2>
            <p className="ui-readiness-section-desc">
              {group.description} Comando: <code>{group.command}</code>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {group.flows.map(flow => (
                <E2eFlowCard key={flow.id} flow={flow} suiteLabel={group.label} />
              ))}
            </div>
          </section>
        ))}

        <section className="ui-readiness-section">
          <h2 className="app-subsection-title app-subsection-title--plain">CI recomendado</h2>
          <div className="ux-readiness-sections-table">
            <div className="ux-readiness-sections-header">
              <span>Job</span>
              <span>Specs</span>
              <span>Cuándo</span>
            </div>
            {E2E_CI_JOBS.map(job => (
              <div key={job.job} className="ux-readiness-sections-row">
                <span>{job.job}</span>
                <span>{job.specs}</span>
                <span>{job.when}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-readiness-section">
          <h2 className="app-subsection-title app-subsection-title--plain">Fixtures compartidos</h2>
          <ul className="e2e-flow-list">
            <li>
              <strong>e2e/fixtures/auth.ts</strong> — loginViaUi, credenciales por defecto e2e /
              123qweZ!
            </li>
            <li>
              <strong>e2e/fixtures/authenticated.ts</strong> — authenticatedBeforeEach para
              regression
            </li>
            <li>
              <strong>e2e/fixtures/testData.ts</strong> — e2eLabel(), e2eToday(), e2eYesterday()
            </li>
            <li>
              <strong>e2e/fixtures/judicialMocks.ts</strong> — mocks de Rama Judicial para smoke de
              Justicia
            </li>
            <li>
              <strong>e2e/fixtures/mobile.ts</strong> — viewport 390×844 (breakpoint mobile 768px)
            </li>
            <li>
              <strong>e2e/fixtures/notifications.ts</strong> — createE2eNotification vía API lifestyle
            </li>
          </ul>
          <p className="ui-readiness-section-desc" style={{ marginTop: 'var(--spacing-md)' }}>
            Playwright: <code>workers: 1</code>, <code>fullyParallel: false</code> — evita
            colisiones de datos en el usuario compartido.
          </p>
        </section>
      </div>
    </div>
  )
}

export default E2e
