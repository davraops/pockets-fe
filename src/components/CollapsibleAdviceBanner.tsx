import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface CollapsibleAdviceBannerProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  defaultOpen?: boolean
}

/**
 * Collapsible educational banner — saves vertical space on CRUD pages (Space Audit P2).
 */
function CollapsibleAdviceBanner({
  title,
  icon,
  children,
  className = '',
  defaultOpen = false,
}: CollapsibleAdviceBannerProps) {
  return (
    <details className={`advice-banner ${className}`.trim()} open={defaultOpen || undefined}>
      <summary className="advice-banner__summary">
        {icon ? <span className="advice-banner__icon">{icon}</span> : null}
        <span className="advice-banner__title">{title}</span>
        <ExpandMoreIcon className="advice-banner__chevron" aria-hidden="true" />
      </summary>
      <div className="advice-banner__body">{children}</div>
    </details>
  )
}

export default CollapsibleAdviceBanner
