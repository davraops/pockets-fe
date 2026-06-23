import CrudInsetRow from '../crud/CrudInsetRow'
import type { Secret } from './secretosTypes'
import { formatSecretMeta } from './secretoDisplayUtils'

interface SecretoListRowProps {
  secret: Secret
  onClick: () => void
}

function SecretoListRow({ secret, onClick }: SecretoListRowProps) {
  return (
    <CrudInsetRow
      accentClass="crud-row-accent-danger"
      ariaLabel={`Ver secreto ${secret.titulo}`}
      onClick={onClick}
      title={secret.titulo}
      meta={formatSecretMeta(secret)}
    />
  )
}

export default SecretoListRow
