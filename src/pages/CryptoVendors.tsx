import { useState, useEffect, useRef } from 'react'
import CrudSummaryStrip from '../components/crud/CrudSummaryStrip'
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
import WarningIcon from '@mui/icons-material/Warning'
import SyncIcon from '@mui/icons-material/Sync'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import ListSkeleton from '../components/ListSkeleton'
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
  const { confirm } = useConfirm()
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
  const [recordsLoadError, setRecordsLoadError] = useState<string | null>(null)
  const [showRecordsModal, setShowRecordsModal] = useState(false)
  const [loadedRecordId, setLoadedRecordId] = useState<string | null>(null)
  const [listName, setListName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      setIsLoadingRecords(true)
      setRecordsLoadError(null)
      const response = await api.getCryptoVendors()
      if (response.vendors && Array.isArray(response.vendors)) {
        setRecords(response.vendors)
      } else {
        setRecords([])
      }
    } catch (err: any) {
      devError('Error al cargar registros de crypto vendors:', err)
      setRecords([])
      setRecordsLoadError(
        getTranslatedErrorMessage(
          err,
          'Error al cargar los registros. Por favor, intenta de nuevo.'
        )
      )
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

  const handleDelete = async (id: string) => {
    if ((await confirm({ message: '¿Estás seguro de que quieres eliminar este vendedor?', variant: 'danger' }))) {
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

      if (loadedRecordId) {
        await api.updateCryptoVendor(loadedRecordId, vendorListData)
        showNotification('Lista de vendedores actualizada exitosamente', 'success')
      } else {
        await api.createCryptoVendor(vendorListData)
        showNotification('Lista de vendedores guardada exitosamente', 'success')
      }

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
          setLoadedRecordId(itemRecord.id)
        } else {
          const loadedVendor: CryptoVendor = {
            id: itemRecord.id,
            name: itemRecord.name,
            data: itemRecord.data || {},
          }
          setVendors([loadedVendor])
          setListName(itemRecord.name)
          setLoadedRecordId(itemRecord.id)
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
    if (!(await confirm({ message: `¿Estás seguro de que quieres eliminar el registro "${recordName}"?`, variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteCryptoVendor(recordId)
      if (loadedRecordId === recordId) {
        setLoadedRecordId(null)
      }
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

  const handleDebugCreateRecords = async () => {
    if (!isDebugToolsEnabled()) return
    try {
      setIsDebugLoading(true)
      const demoRecords = [
        {
          name: 'Comercios Bogotá',
          data: {
            items: [
              {
                name: 'Café Blockchain',
                data: {
                  contact: { name: 'Ana', email: 'ana@cafe.demo', phone: '+57 300 000 0001' },
                  acceptedCryptocurrencies: ['BTC', 'USDT'],
                  businessType: 'Restaurante',
                },
              },
            ],
            created_at: new Date().toISOString(),
          },
        },
        {
          name: 'Tiendas Medellín',
          data: {
            items: [
              {
                name: 'Tech Store Crypto',
                data: {
                  contact: { name: 'Luis', email: 'luis@tech.demo' },
                  acceptedCryptocurrencies: ['ETH', 'USDC'],
                  discount: { percentage: 5, minAmount: 100000 },
                },
              },
            ],
            created_at: new Date().toISOString(),
          },
        },
      ]

      for (const record of demoRecords) {
        await api.createCryptoVendor(record)
      }

      await loadRecords()
      setIsDebugModalOpen(false)
      showNotification(`${demoRecords.length} registros demo creados`, 'success')
    } catch (err: any) {
      showNotification(
        getTranslatedErrorMessage(err, 'Error al crear registros demo. Por favor, intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleDebugDeleteAllRecords = async () => {
    if (!isDestructiveDebugEnabled()) return
    if (
      !(await confirm({
        message: '¿Eliminar TODOS los registros de vendedores? Esta acción es irreversible.',
        variant: 'danger',
      }))
    ) {
      return
    }

    try {
      setIsDebugLoading(true)
      await api.deleteAllCryptoVendors()
      setLoadedRecordId(null)
      await loadRecords()
      setIsDebugModalOpen(false)
      showNotification('Todos los registros fueron eliminados', 'success')
    } catch (err: any) {
      showNotification(
        getTranslatedErrorMessage(err, 'Error al eliminar los registros. Por favor, intenta de nuevo.'),
        'error'
      )
    } finally {
      setIsDebugLoading(false)
    }
  }

  const calculateHighlights = () => {
    const totalVendors = vendors.length
    const withDiscount = vendors.filter(v => v.data.discount?.percentage).length
    const cryptoTypes = new Set(
      vendors.flatMap(v => v.data.acceptedCryptocurrencies ?? [])
    ).size
    const listaLabel = listName.trim() ? listName.trim() : 'Borrador'

    return { totalVendors, withDiscount, cryptoTypes, listaLabel }
  }

  const highlights = calculateHighlights()

  return (
    <div className="app-page">
      <div className="app-page-content app-page-content-wide crud-page-content cryptovendors-content">
        {/* Toolbar */}
        <div className="app-toolbar">
          <button
            className="app-toolbar-button"
            onClick={() => navigate('/finanzas')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="app-toolbar-icon" />
          </button>
          {isDebugToolsEnabled() && (
            <div className="app-toolbar-menu-container" ref={menuRef}>
              <button
                className="app-toolbar-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Opciones"
                aria-expanded={isMenuOpen}
                type="button"
              >
                <MoreVertIcon className="app-toolbar-icon" />
              </button>
              {isMenuOpen && (
                <div className="crud-dropdown-menu">
                  <button
                    className="crud-dropdown-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsDebugModalOpen(true)
                    }}
                    type="button"
                  >
                    <span>🐛 Debug</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            className="app-toolbar-button"
            onClick={() => {
              loadRecords()
              setShowRecordsModal(true)
            }}
            aria-label="Ver registros guardados"
            type="button"
          >
            <FolderIcon className="app-toolbar-icon" />
          </button>
        </div>

        <h1 className="app-page-title">Vendedores de Cripto</h1>

        <CrudSummaryStrip
          ariaLabel="Resumen de vendedores"
          items={[
            { label: 'Vendedores', value: highlights.totalVendors, tone: 'info' },
            { label: 'Con descuento', value: highlights.withDiscount, tone: 'available' },
            { label: 'Criptos', value: highlights.cryptoTypes, tone: 'info' },
            {
              label: 'Lista',
              value: highlights.listaLabel,
              tone: 'info',
              emphasis: true,
            },
          ]}
        />

        {/* Formulario para agregar vendedor */}
        <div className="cryptovendors-form-section">
          <h2 className="cryptovendors-section-title">
            {editingId ? 'Editar Vendedor' : 'Agregar Vendedor'}
          </h2>
          <form onSubmit={handleSubmit} className="cryptovendors-form">
            <div className="form-group-base form-group-base--compact">
              <label htmlFor="name" className="form-label-base form-label-base--inline">
                <StoreIcon className="form-label-icon" />
                Nombre del Vendedor *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input-base"
                placeholder="Ej: Tienda de Electrónica XYZ"
                required
              />
            </div>

            <div className="crud-form-section-divider">
              <h3 className="cryptovendors-form-subsection-title">
                <PersonIcon className="form-label-icon" />
                Información de Contacto
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="contactName" className="form-label-base form-label-base--inline">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="Ej: Carlos Rodríguez"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="contactEmail" className="form-label-base form-label-base--inline">
                  <EmailIcon className="form-label-icon" />
                  Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="carlos@tiendaxyz.com"
                />
              </div>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="contactPhone" className="form-label-base form-label-base--inline">
                  <PhoneIcon className="form-label-icon" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="contactAddress" className="form-label-base form-label-base--inline">
                  <LocationOnIcon className="form-label-icon" />
                  Dirección
                </label>
                <input
                  type="text"
                  id="contactAddress"
                  name="contactAddress"
                  value={formData.contactAddress}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="Calle 100 #50-30, Bogotá"
                />
              </div>
            </div>

            <div className="crud-form-section-divider">
              <h3 className="cryptovendors-form-subsection-title">
                <CurrencyBitcoinIcon className="form-label-icon" />
                Criptomonedas Aceptadas
              </h3>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label className="form-label-base form-label-base--inline">Selecciona las criptomonedas aceptadas</label>
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
              <div className="form-group-base form-group-base--compact">
                <label className="form-label-base form-label-base--inline">
                  <AccountBalanceWalletIcon className="form-label-icon" />
                  Direcciones de Wallet
                </label>
                {formData.acceptedCryptocurrencies.map(crypto => (
                  <div key={crypto} className="form-group-base form-group-base--compact" style={{ marginTop: 'var(--spacing-sm)' }}>
                    <label htmlFor={`wallet-${crypto}`} className="form-label-base form-label-base--inline" style={{ fontSize: 'var(--font-size-sm)' }}>
                      {crypto}
                    </label>
                    <input
                      type="text"
                      id={`wallet-${crypto}`}
                      value={formData.wallets[crypto] || ''}
                      onChange={e => handleWalletChange(crypto, e.target.value)}
                      className="form-input-base"
                      placeholder={`Dirección de wallet ${crypto}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="businessType" className="form-label-base form-label-base--inline">
                  <BusinessIcon className="form-label-icon" />
                  Tipo de Negocio
                </label>
                <input
                  type="text"
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="Ej: Retail, Online, Servicios"
                />
              </div>
            </div>

            <div className="crud-form-section-divider">
              <h3 className="cryptovendors-form-subsection-title">
                <PercentIcon className="form-label-icon" />
                Descuentos (Opcional)
              </h3>
            </div>

            <div className="crud-form-row">
              <div className="form-group-base form-group-base--compact">
                <label htmlFor="discountPercentage" className="form-label-base form-label-base--inline">
                  Porcentaje de Descuento
                </label>
                <input
                  type="number"
                  id="discountPercentage"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group-base form-group-base--compact">
                <label htmlFor="discountMinAmount" className="form-label-base form-label-base--inline">
                  Monto Mínimo (COP)
                </label>
                <input
                  type="number"
                  id="discountMinAmount"
                  name="discountMinAmount"
                  value={formData.discountMinAmount}
                  onChange={handleChange}
                  className="form-input-base"
                  placeholder="100000"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div className="form-group-base form-group-base--compact">
              <label htmlFor="notes" className="form-label-base form-label-base--inline">
                <DescriptionIcon className="form-label-icon" />
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input-base"
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
          <ModalOverlay onClose={() => setShowSaveModal(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-guardar-lista-de-vendedores">Guardar Lista de Vendedores</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setShowSaveModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                <div className="form-group-base form-group-base--compact">
                  <label htmlFor="listName" className="form-label-base form-label-base--inline">
                    Nombre de la Lista *
                  </label>
                  <input
                    type="text"
                    id="listName"
                    value={listName}
                    onChange={e => setListName(e.target.value)}
                    className="form-input-base"
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
                    {isSaving ? 'Guardando...' : loadedRecordId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}

        {/* Modal para ver registros guardados */}
        {showRecordsModal && (
          <ModalOverlay onClose={() => setShowRecordsModal(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-registros-guardados">Registros Guardados</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setShowRecordsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                {isLoadingRecords ? (
                  <ListSkeleton variant="inset-row" count={3} aria-label="Cargando registros" />
                ) : recordsLoadError && records.length === 0 ? (
                  <div className="cryptovendors-empty-state cryptovendors-error-state" role="alert">
                    <WarningIcon className="cryptovendors-error-icon" aria-hidden="true" />
                    <p className="cryptovendors-empty-text">{recordsLoadError}</p>
                    <button className="cryptovendors-retry-button" onClick={loadRecords} type="button">
                      <SyncIcon aria-hidden="true" />
                      <span>Reintentar</span>
                    </button>
                  </div>
                ) : records.length === 0 ? (
                  <div className="modal-panel-empty">No hay registros guardados</div>
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
          </ModalOverlay>
        )}

        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title">🐛 Debug - Vendedores Cripto</h2>
                <button
                  className="modal-panel-close"
                  onClick={() => setIsDebugModalOpen(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                <div className="debug-options">
                  <button
                    className="debug-option-button"
                    onClick={handleDebugCreateRecords}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear registros demo</h3>
                      <p className="debug-option-description">
                        Crea 2 listas de vendedores de ejemplo
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button debug-option-button-danger"
                    onClick={handleDebugDeleteAllRecords}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar todos los registros</h3>
                      <p className="debug-option-description">
                        Elimina permanentemente todos los registros guardados
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    </div>
  )
}

export default CryptoVendors
