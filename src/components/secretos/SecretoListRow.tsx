import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import type { Secret } from './secretosTypes'
import { formatSecretListMeta, formatSecretListMetaTitle } from './secretoDisplayUtils'

interface SecretoListRowProps {
  secret: Secret
  onClick: () => void
  onDecrypt: () => void
}

function SecretoListRow({ secret, onClick, onDecrypt }: SecretoListRowProps) {
  const metaDateTitle = formatSecretListMetaTitle(secret)

  return (
    <div className="secretos-list-item crud-row-accent-danger">
      <button
        type="button"
        className="crud-inset-row crud-row-accent-danger secretos-list-item-main"
        onClick={onClick}
        aria-label={`Ver secreto ${secret.titulo}`}
      >
        <div className="crud-row-content">
          <div className="crud-row-header">
            <div className="secretos-row-title-section">
              <LockIcon className="secretos-row-lock-icon" aria-hidden="true" />
              <span className="crud-row-title">{secret.titulo}</span>
            </div>
            <ChevronRightIcon className="crud-row-chevron" aria-hidden="true" />
          </div>
          <div className="secretos-row-meta">
            <span className="secretos-row-badge">Cifrado</span>
            <span className="secretos-row-meta-separator" aria-hidden="true">
              •
            </span>
            <span className="secretos-row-meta-date" title={metaDateTitle}>
              {formatSecretListMeta(secret)}
            </span>
          </div>
        </div>
      </button>
      <button
        type="button"
        className="secretos-row-decrypt"
        onClick={onDecrypt}
        aria-label={`Desencriptar ${secret.titulo}`}
        title="Desencriptar"
      >
        <LockOpenIcon className="secretos-row-decrypt-icon" aria-hidden="true" />
      </button>
    </div>
  )
}

export default SecretoListRow
