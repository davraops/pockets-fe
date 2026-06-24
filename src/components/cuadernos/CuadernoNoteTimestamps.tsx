import { formatNoteDate } from './cuadernoDisplayUtils'

interface CuadernoNoteTimestampsProps {
  fechaCreacion: string
  fechaActualizacion: string
}

function CuadernoNoteTimestamps({ fechaCreacion, fechaActualizacion }: CuadernoNoteTimestampsProps) {
  const showUpdated = fechaCreacion !== fechaActualizacion

  return (
    <div className="cuaderno-page-meta" aria-label="Registro del cuaderno">
      <time className="cuaderno-page-meta__item" dateTime={fechaCreacion}>
        Creado: {formatNoteDate(fechaCreacion)}
      </time>
      {showUpdated ? (
        <>
          <span className="cuaderno-page-meta__sep" aria-hidden="true">
            ·
          </span>
          <time className="cuaderno-page-meta__item" dateTime={fechaActualizacion}>
            Actualizado: {formatNoteDate(fechaActualizacion)}
          </time>
        </>
      ) : null}
    </div>
  )
}

export default CuadernoNoteTimestamps
