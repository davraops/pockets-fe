import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { FileAPI } from './archivosTypes'
import { formatFileDate, formatFileSize, getFileIcon } from './archivosDisplayUtils'

interface ArchivoListRowProps {
  file: FileAPI
  onClick: () => void
}

function ArchivoListRow({ file, onClick }: ArchivoListRowProps) {
  return (
    <button
      className="crud-inset-row crud-row-accent-files"
      onClick={onClick}
      type="button"
    >
      <div className="crud-row-content">
        <div className="crud-row-header">
          <div className="crud-row-title-section">
            <span className="crud-row-icon">{getFileIcon(file.mime_type)}</span>
            <h3 className="crud-row-title">{file.title}</h3>
          </div>
          <ChevronRightIcon className="crud-row-chevron" />
        </div>
        {file.description && <p className="crud-row-preview">{file.description}</p>}
        <div className="crud-row-meta">
          <span className="crud-row-meta">{file.file_name}</span>
          <span className="crud-row-separator">•</span>
          <span className="crud-row-meta">{formatFileSize(file.file_size)}</span>
          <span className="crud-row-separator">•</span>
          <span className="crud-row-meta">{formatFileDate(file.created_at)}</span>
        </div>
      </div>
    </button>
  )
}

export default ArchivoListRow
