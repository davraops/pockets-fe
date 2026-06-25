import CrudInsetRow from '../crud/CrudInsetRow'
import type { FileAPI } from './archivosTypes'
import { formatFileListMeta, formatFileSize } from './archivosDisplayUtils'

interface ArchivoListRowProps {
  file: FileAPI
  onClick: () => void
}

function ArchivoListRow({ file, onClick }: ArchivoListRowProps) {
  return (
    <CrudInsetRow
      accentClass="crud-row-accent-files"
      ariaLabel={`Ver archivo ${file.title}`}
      onClick={onClick}
      title={file.title}
      value={formatFileSize(file.file_size)}
      meta={formatFileListMeta(file)}
      preview={file.description || undefined}
    />
  )
}

export default ArchivoListRow
