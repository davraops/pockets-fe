import CrudInsetRow from '../crud/CrudInsetRow'
import type { PatrimonyItem } from './patrimonioTypes'
import {
  formatPatrimonyMeta,
  formatPatrimonyPreview,
  formatPatrimonyRowValue,
} from './patrimonioDisplayUtils'

interface PatrimonioListRowProps {
  item: PatrimonyItem
  onClick: () => void
}

function PatrimonioListRow({ item, onClick }: PatrimonioListRowProps) {
  return (
    <CrudInsetRow
      accentClass="crud-row-accent-green"
      ariaLabel={`Ver item ${item.name}`}
      onClick={onClick}
      title={item.name}
      value={formatPatrimonyRowValue(item)}
      meta={formatPatrimonyMeta(item)}
      preview={formatPatrimonyPreview(item)}
    />
  )
}

export default PatrimonioListRow
