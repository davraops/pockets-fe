import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'

interface TransaccionPatrimonioToggleProps {
  checked: boolean
  showSuggestion: boolean
  onChange: (checked: boolean) => void
}

function TransaccionPatrimonioToggle({
  checked,
  showSuggestion,
  onChange,
}: TransaccionPatrimonioToggleProps) {
  return (
    <div className="transaccion-patrimonio-toggle-wrap">
      <button
        type="button"
        className={`transaccion-patrimonio-toggle${checked ? ' transaccion-patrimonio-toggle--active' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label="Registrar esta compra en Patrimonio"
      >
        <span className="transaccion-patrimonio-toggle__icon-wrap" aria-hidden="true">
          <Inventory2OutlinedIcon className="transaccion-patrimonio-toggle__icon" />
        </span>
        <span className="transaccion-patrimonio-toggle__copy">
          <span className="transaccion-patrimonio-toggle__title">Registrar en Patrimonio</span>
          <span className="transaccion-patrimonio-toggle__subtitle">
            Guarda este egreso como un bien de valor en Bienes
          </span>
        </span>
        <span className="transaccion-patrimonio-toggle__switch" aria-hidden="true">
          <span className="transaccion-patrimonio-toggle__switch-thumb" />
        </span>
      </button>

      {showSuggestion && !checked ? (
        <p className="transaccion-patrimonio-toggle__suggestion">
          Esta categoría suele corresponder a un bien de patrimonio. ¿Quieres registrarlo?
        </p>
      ) : null}
    </div>
  )
}

export default TransaccionPatrimonioToggle
