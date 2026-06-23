import { Link, useParams, Navigate } from 'react-router-dom'
import type { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import ThemeToggle from '../components/ThemeToggle'
import './AppPage.css'
import './ProductReadiness.css'
import BuildIcon from '@mui/icons-material/Build'
import readmeRaw from '../../product-readiness/README.md?raw'
import finanzasRaw from '../../product-readiness/finanzas.md?raw'
import registrosRaw from '../../product-readiness/registros.md?raw'

type DocStatus = 'ready' | 'audited' | 'pending'

interface DocMeta {
  title: string
  description: string
  score: number | null
  status: DocStatus
  accent: string
  icon: typeof AssessmentIcon
  content: string
}

const DOCS: Record<string, DocMeta> = {
  readme: {
    title: 'Índice',
    description: 'Mapa de auditorías por sección de la app',
    score: null,
    status: 'audited',
    accent: 'var(--accent-primary)',
    icon: AssessmentIcon,
    content: readmeRaw,
  },
  finanzas: {
    title: 'Finanzas',
    description: '17 módulos · ~20.5k LOC · hub + sub-rutas',
    score: 5.0,
    status: 'ready',
    accent: 'var(--section-finanzas)',
    icon: AccountBalanceWalletIcon,
    content: finanzasRaw,
  },
  registros: {
    title: 'Registros',
    description: '9 módulos · ~7.6k LOC · utilidades + lifestyle API',
    score: 5.0,
    status: 'ready',
    accent: 'var(--section-utilidades)',
    icon: BuildIcon,
    content: registrosRaw,
  },
}

const DOC_ORDER = ['readme', 'finanzas', 'registros'] as const

function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, '')
}

function resolveDocLink(href: string): string | null {
  const normalized = href.replace(/^\.\//, '')
  if (normalized === 'README.md' || normalized === 'readme.md') {
    return '/product-readiness'
  }
  if (normalized.endsWith('.md')) {
    const id = normalized.replace(/\.md$/i, '').toLowerCase()
    if (id === 'finanzas') return '/product-readiness/finanzas'
    if (id === 'registros') return '/product-readiness/registros'
  }
  return null
}

const markdownComponents: Components = {
  a: ({ href, children }) => {
    if (!href) return <>{children}</>
    const internal = resolveDocLink(href)
    if (internal) {
      return (
        <Link to={internal} className="product-readiness-inline-link">
          {children}
        </Link>
      )
    }
    if (href.startsWith('http') || href.startsWith('//')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="product-readiness-inline-link"
        >
          {children}
        </a>
      )
    }
    return (
      <a href={href} className="product-readiness-inline-link">
        {children}
      </a>
    )
  },
  table: ({ children }) => (
    <div className="product-readiness-table-wrap">
      <table>{children}</table>
    </div>
  ),
  input: ({ type, checked, disabled }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled ?? true}
          readOnly
          className="product-readiness-checkbox"
          aria-label={checked ? 'Completado' : 'Pendiente'}
        />
      )
    }
    return <input type={type} checked={checked} disabled={disabled} readOnly />
  },
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === 'ready') {
    return (
      <span className="product-readiness-status product-readiness-status-ready">
        <CheckCircleIcon aria-hidden="true" />
        Production-ready
      </span>
    )
  }
  if (status === 'audited') {
    return (
      <span className="product-readiness-status product-readiness-status-audited">
        <AssessmentIcon aria-hidden="true" />
        Auditado
      </span>
    )
  }
  return (
    <span className="product-readiness-status product-readiness-status-pending">
      <ScheduleIcon aria-hidden="true" />
      Pendiente
    </span>
  )
}

function ProductReadiness() {
  const { docId } = useParams<{ docId?: string }>()
  const activeId = docId ?? 'readme'

  if (docId && !DOCS[docId]) {
    return <Navigate to="/product-readiness" replace />
  }

  const doc = DOCS[activeId]
  const DocIcon = doc.icon
  const bodyMarkdown = stripLeadingH1(doc.content)

  return (
    <div className="product-readiness-page">
      <header className="product-readiness-topbar">
        <Link to="/" className="product-readiness-back">
          <ArrowBackIcon aria-hidden="true" />
          <span>Pockets</span>
        </Link>
        <div className="product-readiness-topbar-actions">
          <span className="product-readiness-topbar-label">Product Readiness</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="product-readiness-layout">
        <aside className="product-readiness-sidebar" aria-label="Documentos de auditoría">
          <div className="product-readiness-sidebar-header">
            <h2 className="product-readiness-sidebar-title">Auditorías</h2>
            <p className="product-readiness-sidebar-desc">Evaluación de readiness por sección</p>
          </div>
          <nav className="product-readiness-nav">
            {DOC_ORDER.map(id => {
              const meta = DOCS[id]
              const Icon = meta.icon
              const isActive = activeId === id
              return (
                <Link
                  key={id}
                  to={id === 'readme' ? '/product-readiness' : `/product-readiness/${id}`}
                  className={`product-readiness-nav-item${isActive ? ' active' : ''}`}
                  style={{ '--doc-accent': meta.accent } as CSSProperties}
                >
                  <span className="product-readiness-nav-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="product-readiness-nav-text">
                    <span className="product-readiness-nav-label">{meta.title}</span>
                    <span className="product-readiness-nav-meta">
                      {meta.score != null ? `${meta.score} / 5` : 'Índice general'}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="product-readiness-main">
          <section className="product-readiness-hero">
            <div
              className="product-readiness-hero-icon"
              style={{ backgroundColor: doc.accent }}
              aria-hidden="true"
            >
              <DocIcon />
            </div>
            <div className="product-readiness-hero-body">
              <h1 className="product-readiness-hero-title">{doc.title}</h1>
              <p className="product-readiness-hero-desc">{doc.description}</p>
              <div className="product-readiness-hero-badges">
                <StatusBadge status={doc.status} />
                {doc.score != null && (
                  <span className="product-readiness-score-pill">
                    <span className="product-readiness-score-value">{doc.score}</span>
                    <span className="product-readiness-score-max">/ 5</span>
                  </span>
                )}
              </div>
            </div>
          </section>

          <article className="product-readiness-article">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {bodyMarkdown}
            </ReactMarkdown>
          </article>
        </main>
      </div>
    </div>
  )
}

export default ProductReadiness
