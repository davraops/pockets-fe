import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import StoreIcon from '@mui/icons-material/Store'
import CurrencyBitcoinIcon from '@mui/icons-material/CurrencyBitcoin'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BusinessIcon from '@mui/icons-material/Business'
import DescriptionIcon from '@mui/icons-material/Description'
import PersonIcon from '@mui/icons-material/Person'
import PercentIcon from '@mui/icons-material/Percent'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import './CryptoVendors.css'

interface CryptoVendor {
  id: string
  name: string
  data: {
    contact?: {
      name?: string
      email?: string
      phone?: string
      address?: string
    }
    acceptedCryptocurrencies?: string[]
    wallets?: Record<string, string>
    businessType?: string
    notes?: string
    discount?: {
      percentage?: number
      minAmount?: number
    }
  }
  created_at?: string
  updated_at?: string
}

interface CryptoVendorRecord {
  id: string
  name: string
  data: CryptoVendor['data']
  created_at: string
  updated_at: string
}

const CRYPTO_OPTIONS = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE', 'MATIC', 'DOT', 'LTC', 'AVAX', 'UNI', 'LINK']

function CryptoVendors() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [vendors, setVendors] = useState<CryptoVendor[]>([])
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    acceptedCryptocurrencies: [] as string[],
    wallets: {} as Record<string, string>,
    businessType: '',
    notes: '',
    discountPercentage: '',
    discountMinAmount: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [records, setRecords] = useState<CryptoVendorRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [listName, setListName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoadingRecords(true)
      const response = await api.getCryptoVendors()
      if (response.vendors && Array.isArray(response.vendors)) {
        setRecords(response.vendors)
      }
    } catch (err: any) {
      console.error('Error al cargar registros de crypto vendors:', err)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCryptoToggle = (crypto: string) => {
    setFormData(prev => {
      const isSelected = prev.acceptedCryptocurrencies.includes(crypto)
      return {
        ...prev,
        acceptedCryptocurrencies: isSelected
          ? prev.acceptedCryptocurrencies.filter(c => c !== crypto)
          : [...prev.acceptedCryptocurrencies, crypto],
      }
    })
  }

  const handleWalletChange = (crypto: string, address: string) => {
    setFormData(prev => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [crypto]: address,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('El nombre del vendedor es requerido', 'error')
      return
    }

    const vendorData: CryptoVendor['data'] = {
      contact:
        formData.contactName.trim() ||
        formData.contactEmail.trim() ||
        formData.contactPhone.trim() ||
        formData.contactAddress.trim()
          ? {
              name: formData.contactName.trim() || undefined,
              email: formData.contactEmail.trim() || undefined,
              phone: formData.contactPhone.trim() || undefined,
              address: formData.contactAddress.trim() || undefined,
            }
          : undefined,
      acceptedCryptocurrencies: formData.acceptedCryptocurrencies.length > 0 ? formData.acceptedCryptocurrencies : undefined,
      wallets: Object.keys(formData.wallets).length > 0 ? formData.wallets : undefined,
      businessType: formData.businessType.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      discount:
        formData.discountPercentage.trim() || formData.discountMinAmount.trim()
          ? {
              percentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : undefined,
              minAmount: formData.discountMinAmount ? parseFloat(formData.discountMinAmount) : undefined,
            }
          : undefined,
    }

    if (editingId) {
      const updatedVendor: CryptoVendor = {
        id: editingId,
        name: formData.name.trim(),
        data: vendorData,
      }
      setVendors(prev => prev.map(v => (v.id === editingId ? updatedVendor : v)))
      setEditingId(null)
      showNotification('Vendedor actualizado', 'success')
    } else {
      const newVendor: CryptoVendor = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        data: vendorData,
      }
      setVendors(prev => [...prev, newVendor])
      showNotification('Vendedor agregado', 'success')
    }

    // Limpiar formulario
    setFormData({
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactAddress: '',
      acceptedCryptocurrencies: [],
      wallets: {},
      businessType: '',
      notes: '',
      discountPercentage: '',
      discountMinAmount: '',
    })
  }

  const handleEdit = (vendor: CryptoVendor) => {
    setFormData({
      name: vendor.name,
      contactName: vendor.data.contact?.name || '',
      contactEmail: vendor.data.contact?.email || '',
      contactPhone: vendor.data.contact?.phone || '',
      contactAddress: vendor.data.contact?.address || '',
      acceptedCryptocurrencies: vendor.data.acceptedCryptocurrencies || [],
      wallets: vendor.data.wallets || {},
      businessType: vendor.data.businessType || '',
      notes: vendor.data.notes || '',
      discountPercentage: vendor.data.discount?.percentage?.toString() || '',
      discountMinAmount: vendor.data.discount?.minAmount?.toString() || '',
    })
    setEditingId(vendor.id)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactAddress: '',
      acceptedCryptocurrencies: [],
      wallets: {},
      businessType: '',
      notes: '',
      discountPercentage: '',
      discountMinAmount: '',
    })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vendedor?')) {
      setVendors(prev => prev.filter(v => v.id !== id))
      showNotification('Vendedor eliminado', 'success')
    }
  }

  const handleSaveClick = () => {
    if (vendors.length === 0) {
      showNotification('Debes agregar al menos un vendedor antes de guardar', 'error')
      return
    }
    setShowSaveModal(true)
  }

  const handleSaveRecord = async () => {
    if (!listName.trim()) {
      showNotification('El nombre de la lista es requerido', 'error')
      return
    }

    if (vendors.length === 0) {
      showNotification('Debes agregar al menos un vendedor antes de guardar', 'error')
      return
    }

    try {
      setIsSaving(true)

      const vendorListData = {
        name: listName.trim(),
        data: {
          items: vendors.map(vendor => ({
            name: vendor.name,
            data: vendor.data,
          })),
          created_at: new Date().toISOString(),
        },
      }

      await api.createCryptoVendor(vendorListData)

      showNotification('Lista de vendedores guardada exitosamente', 'success')

      await loadRecords()

      setShowSaveModal(false)
      setListName('')
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al guardar la lista. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadRecord = async (record: CryptoVendorRecord) => {
    try {
      const response = await api.getCryptoVendors(record.id)
      if (response.vendors && response.vendors.length > 0) {
        const itemRecord = response.vendors[0]

        if (itemRecord.data && itemRecord.data.items && Array.isArray(itemRecord.data.items)) {
          const loadedVendors: CryptoVendor[] = itemRecord.data.items.map((item: any, index: number) => ({
            id: Date.now().toString() + index.toString(),
            name: item.name || '',
            data: item.data || {},
          }))
          setVendors(loadedVendors)
          setListName(itemRecord.name)
        } else {
          const loadedVendor: CryptoVendor = {
            id: itemRecord.id,
            name: itemRecord.name,
            data: itemRecord.data || {},
          }
          setVendors([loadedVendor])
          setListName(itemRecord.name)
        }

        setShowRecordsModal(false)
        showNotification(`Lista "${record.name}" cargada`, 'success')
      } else {
        showNotification('El registro no tiene datos válidos', 'error')
      }
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al cargar el registro. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDeleteRecord = async (recordId: string, recordName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el registro "${recordName}"?`)) {
      return
    }

    try {
      await api.deleteCryptoVendor(recordId)
      showNotification('Registro eliminado', 'success')
      await loadRecords()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar el registro. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  return (
    <div className="app-page">
      <div className="app-page-content cryptovendors-content">
        {/* Toolbar */}
        <div className="cryptovendors-toolbar">
          <button
            className="cryptovendors-toolbar-button"
            onClick={() => navigate('/finanzas')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="cryptovendors-toolbar-icon" />
          </button>
          <button
            className="cryptovendors-toolbar-button"
            onClick={() => {
              loadRecords()
              setShowRecordsModal(true)
            }}
            aria-label="Ver registros guardados"
            type="button"
          >
            <FolderIcon className="cryptovendors-toolbar-icon" />
          </button>
        </div>

        <h1 className="cryptovendors-page-title">Vendedores de Cripto</h1>
        <p className="cryptovendors-page-subtitle">
          Gestiona los vendedores que aceptan pagos con criptomonedas: contacto, wallets, criptomonedas aceptadas y más
        </p>

        {/* Formulario para agregar vendedor */}
        <div className="cryptovendors-form-section">
          <h2 className="cryptovendors-section-title">
            {editingId ? 'Editar Vendedor' : 'Agregar Vendedor'}
          </h2>
          <form onSubmit={handleSubmit} className="cryptovendors-form">
            <div className="cryptovendors-form-group">
              <label htmlFor="name" className="cryptovendors-form-label">
                <StoreIcon className="cryptovendors-label-icon" />
                Nombre del Vendedor *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="cryptovendors-form-input"
                placeholder="Ej: Tienda de Electrónica XYZ"
                required
              />
            </div>

            <div className="cryptovendors-form-section-divider">
              <h3 className="cryptovendors-form-subsection-title">
                <PersonIcon className="cryptovendors-label-icon" />
                Información de Contacto
              </h3>
            </div>

            <div className="cryptovendors-form-row">
              <div className="cryptovendors-form-group">
                <label htmlFor="contactName" className="cryptovendors-form-label">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="Ej: Carlos Rodríguez"
                />
              </div>

              <div className="cryptovendors-form-group">
                <label htmlFor="contactEmail" className="cryptovendors-form-label">
                  <EmailIcon className="cryptovendors-label-icon" />
                  Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="carlos@tiendaxyz.com"
                />
              </div>
            </div>

            <div className="cryptovendors-form-row">
              <div className="cryptovendors-form-group">
                <label htmlFor="contactPhone" className="cryptovendors-form-label">
                  <PhoneIcon className="cryptovendors-label-icon" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div className="cryptovendors-form-group">
                <label htmlFor="contactAddress" className="cryptovendors-form-label">
                  <LocationOnIcon className="cryptovendors-label-icon" />
                  Dirección
                </label>
                <input
                  type="text"
                  id="contactAddress"
                  name="contactAddress"
                  value={formData.contactAddress}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="Calle 100 #50-30, Bogotá"
                />
              </div>
            </div>

            <div className="cryptovendors-form-section-divider">
              <h3 className="cryptovendors-form-subsection-title">
                <CurrencyBitcoinIcon className="cryptovendors-label-icon" />
                Criptomonedas Aceptadas
              </h3>
            </div>

            <div className="cryptovendors-form-group">
              <label className="cryptovendors-form-label">Selecciona las criptomonedas aceptadas</label>
              <div className="cryptovendors-crypto-grid">
                {CRYPTO_OPTIONS.map(crypto => (
                  <label key={crypto} className="cryptovendors-crypto-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.acceptedCryptocurrencies.includes(crypto)}
                      onChange={() => handleCryptoToggle(crypto)}
                    />
                    <span>{crypto}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.acceptedCryptocurrencies.length > 0 && (
              <div className="cryptovendors-form-group">
                <label className="cryptovendors-form-label">
                  <AccountBalanceWalletIcon className="cryptovendors-label-icon" />
                  Direcciones de Wallet
                </label>
                {formData.acceptedCryptocurrencies.map(crypto => (
                  <div key={crypto} className="cryptovendors-form-group" style={{ marginTop: 'var(--spacing-sm)' }}>
                    <label htmlFor={`wallet-${crypto}`} className="cryptovendors-form-label" style={{ fontSize: 'var(--font-size-sm)' }}>
                      {crypto}
                    </label>
                    <input
                      type="text"
                      id={`wallet-${crypto}`}
                      value={formData.wallets[crypto] || ''}
                      onChange={e => handleWalletChange(crypto, e.target.value)}
                      className="cryptovendors-form-input"
                      placeholder={`Dirección de wallet ${crypto}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="cryptovendors-form-row">
              <div className="cryptovendors-form-group">
                <label htmlFor="businessType" className="cryptovendors-form-label">
                  <BusinessIcon className="cryptovendors-label-icon" />
                  Tipo de Negocio
                </label>
                <input
                  type="text"
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="Ej: Retail, Online, Servicios"
                />
              </div>
            </div>

            <div className="cryptovendors-form-section-divider">
              <h3 className="cryptovendors-form-subsection-title">
                <PercentIcon className="cryptovendors-label-icon" />
                Descuentos (Opcional)
              </h3>
            </div>

            <div className="cryptovendors-form-row">
              <div className="cryptovendors-form-group">
                <label htmlFor="discountPercentage" className="cryptovendors-form-label">
                  Porcentaje de Descuento
                </label>
                <input
                  type="number"
                  id="discountPercentage"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="cryptovendors-form-group">
                <label htmlFor="discountMinAmount" className="cryptovendors-form-label">
                  Monto Mínimo (COP)
                </label>
                <input
                  type="number"
                  id="discountMinAmount"
                  name="discountMinAmount"
                  value={formData.discountMinAmount}
                  onChange={handleChange}
                  className="cryptovendors-form-input"
                  placeholder="100000"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="cryptovendors-form-group">
              <label htmlFor="notes" className="cryptovendors-form-label">
                <DescriptionIcon className="cryptovendors-label-icon" />
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="cryptovendors-form-input"
                placeholder="Ej: Acepta pagos en cripto desde $50.000 COP"
                rows={3}
              />
            </div>

            <div className="cryptovendors-form-actions">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="cryptovendors-form-button cryptovendors-form-button-secondary"
                >
                  Cancelar
                </button>
              )}
              <button type="submit" className="cryptovendors-form-button cryptovendors-form-button-primary">
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>

        {vendors.length > 0 && (
          <div className="cryptovendors-list-section">
            <div className="cryptovendors-section-header">
              <h2 className="cryptovendors-section-title">
                Vendedores ({vendors.length})
              </h2>
              <button
                className="cryptovendors-save-button"
                onClick={handleSaveClick}
                disabled={isSaving}
                type="button"
              >
                <SaveIcon className="cryptovendors-save-icon" />
                Guardar Lista
              </button>
            </div>
            <div className="cryptovendors-list">
              {vendors.map(vendor => (
                <div key={vendor.id} className="cryptovendors-item">
                  <div className="cryptovendors-item-content">
                    <div className="cryptovendors-item-header">
                      <h3 className="cryptovendors-item-name">{vendor.name}</h3>
                      {vendor.data.businessType && (
                        <span className="cryptovendors-item-category">
                          {vendor.data.businessType}
                        </span>
                      )}
                    </div>
                    <div className="cryptovendors-item-meta">
                      {vendor.data.contact?.name && (
                        <>
                          <span className="cryptovendors-item-meta-item">
                            <strong>{vendor.data.contact.name}</strong>
                          </span>
                        </>
                      )}
                      {vendor.data.acceptedCryptocurrencies && vendor.data.acceptedCryptocurrencies.length > 0 && (
                        <>
                          <span className="cryptovendors-item-separator">•</span>
                          <span className="cryptovendors-item-meta-item">
                            <CurrencyBitcoinIcon style={{ width: 16, height: 16, verticalAlign: 'middle', marginRight: 4 }} />
                            {vendor.data.acceptedCryptocurrencies.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="cryptovendors-item-details">
                      {vendor.data.contact?.email && (
                        <div className="cryptovendors-item-detail">
                          <EmailIcon className="cryptovendors-item-detail-icon" />
                          <span>{vendor.data.contact.email}</span>
                        </div>
                      )}
                      {vendor.data.contact?.phone && (
                        <div className="cryptovendors-item-detail">
                          <PhoneIcon className="cryptovendors-item-detail-icon" />
                          <span>{vendor.data.contact.phone}</span>
                        </div>
                      )}
                      {vendor.data.contact?.address && (
                        <div className="cryptovendors-item-detail">
                          <LocationOnIcon className="cryptovendors-item-detail-icon" />
                          <span>{vendor.data.contact.address}</span>
                        </div>
                      )}
                      {vendor.data.discount && (
                        <div className="cryptovendors-item-detail">
                          <PercentIcon className="cryptovendors-item-detail-icon" />
                          <span>
                            Descuento: {vendor.data.discount.percentage}% 
                            {vendor.data.discount.minAmount && ` (mín. ${vendor.data.discount.minAmount.toLocaleString('es-CO')} COP)`}
                          </span>
                        </div>
                      )}
                      {vendor.data.notes && (
                        <div className="cryptovendors-item-detail">
                          <DescriptionIcon className="cryptovendors-item-detail-icon" />
                          <span>{vendor.data.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="cryptovendors-item-actions">
                    <button
                      className="cryptovendors-item-action-button"
                      onClick={() => handleEdit(vendor)}
                      aria-label="Editar"
                      type="button"
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="cryptovendors-item-action-button cryptovendors-item-action-button-delete"
                      onClick={() => handleDelete(vendor.id)}
                      aria-label="Eliminar"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal para guardar lista */}
        {showSaveModal && (
          <div className="cryptovendors-modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="cryptovendors-modal" onClick={e => e.stopPropagation()}>
              <div className="cryptovendors-modal-header">
                <h2 className="cryptovendors-modal-title">Guardar Lista de Vendedores</h2>
                <button
                  className="cryptovendors-modal-close"
                  onClick={() => setShowSaveModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="cryptovendors-modal-content">
                <div className="cryptovendors-form-group">
                  <label htmlFor="listName" className="cryptovendors-form-label">
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    id="listName"
                    value={listName}
                    onChange={e => setListName(e.target.value)}
                    className="cryptovendors-form-input"
                    placeholder="Ej: Vendedores Bogotá"
                    required
                  />
                </div>
                <div className="cryptovendors-form-actions">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="cryptovendors-form-button cryptovendors-form-button-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecord}
                    disabled={isSaving || !listName.trim()}
                    className="cryptovendors-form-button cryptovendors-form-button-primary"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para ver registros guardados */}
        {showRecordsModal && (
          <div className="cryptovendors-modal-overlay" onClick={() => setShowRecordsModal(false)}>
            <div className="cryptovendors-modal" onClick={e => e.stopPropagation()}>
              <div className="cryptovendors-modal-header">
                <h2 className="cryptovendors-modal-title">Registros Guardados</h2>
                <button
                  className="cryptovendors-modal-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="cryptovendors-modal-content">
                {isLoadingRecords ? (
                  <div className="cryptovendors-modal-loading">Cargando...</div>
                ) : records.length === 0 ? (
                  <div className="cryptovendors-modal-empty">No hay registros guardados</div>
                ) : (
                  <div className="cryptovendors-records-list">
                    {records.map(record => (
                      <div key={record.id} className="cryptovendors-record-item">
                        <div className="cryptovendors-record-content">
                          <h3 className="cryptovendors-record-name">{record.name}</h3>
                          <div className="cryptovendors-record-meta">
                            <span>1 vendedor</span>
                          </div>
                          {record.created_at && (
                            <p className="cryptovendors-record-date">
                              Creado: {new Date(record.created_at).toLocaleDateString('es-CO')}
                            </p>
                          )}
                        </div>
                        <div className="cryptovendors-record-actions">
                          <button
                            className="cryptovendors-record-action-button"
                            onClick={() => handleLoadRecord(record)}
                            type="button"
                          >
                            Cargar
                          </button>
                          <button
                            className="cryptovendors-record-action-button cryptovendors-record-action-button-delete"
                            onClick={() => handleDeleteRecord(record.id, record.name)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CryptoVendors
