import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import StoreIcon from '@mui/icons-material/Store'
import RefreshIcon from '@mui/icons-material/Refresh'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import WarningIcon from '@mui/icons-material/Warning'
import SyncIcon from '@mui/icons-material/Sync'
import { api } from '../services/api'
import { devError, isDebugToolsEnabled, isDestructiveDebugEnabled } from '../utils/debugTools'
import { useNotification } from '../contexts/NotificationContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
import ModalOverlay from '../components/ModalOverlay'
import './ListasMercado.css'

interface ShoppingItem {
  id: string
  name: string
  quantity: number
  category: string
  store: string
  packaging: string // Ej: "Unidades", "Caja x 12", "Caja x 6", etc.
  price: number // Precio de compra
  checked: boolean
}

interface ShoppingList {
  id: string
  name: string
  data: {
    items: ShoppingItem[]
    store?: string
    notes?: string
  }
  created_at: string
  updated_at: string
}

function ListasMercado() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { confirm } = useConfirm()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [formData, setFormData] = useState({
    name: '',
    quantity: '1',
    category: '',
    store: '',
    packaging: 'Unidades',
    price: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [stores, setStores] = useState<string[]>([])
  const [loadedListId, setLoadedListId] = useState<string | null>(null)
  const [listName, setListName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [listsLoadError, setListsLoadError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false)
  const [isDebugLoading, setIsDebugLoading] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    calculateCategoriesAndStores()
  }, [items])

  useEffect(() => {
    loadLists()
  }, [])

  // Cerrar menú al hacer click fuera
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

  const calculateCategoriesAndStores = () => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))
    const uniqueStores = Array.from(new Set(items.map(item => item.store).filter(Boolean)))
    setCategories(uniqueCategories)
    setStores(uniqueStores)
  }

  const loadLists = async () => {
    try {
      setIsLoadingLists(true)
      setListsLoadError(null)
      const response = await api.getShoppingLists()
      if (response.lists && Array.isArray(response.lists)) {
        setLists(response.lists)
      } else {
        setLists([])
      }
    } catch (err: any) {
      devError('Error al cargar listas:', err)
      setLists([])
      setListsLoadError(
        getTranslatedErrorMessage(
          err,
          'Error al cargar las listas. Por favor, intenta de nuevo.'
        )
      )
    } finally {
      setIsLoadingLists(false)
    }
  }

  const handleOpenAddProduct = () => {
    setEditingId(null)
    setFormData({
      name: '',
      quantity: '1',
      category: '',
      store: '',
      packaging: 'Unidades',
      price: '',
    })
    setIsFormModalOpen(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsFormModalOpen(false)

    if (!formData.name.trim()) {
      showNotification('El nombre del producto es requerido', 'error')
      return
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      showNotification('La cantidad debe ser mayor a 0', 'error')
      return
    }

    if (!formData.category.trim()) {
      showNotification('La categoría es requerida', 'error')
      return
    }

    if (!formData.store.trim()) {
      showNotification('El sitio donde se compra es requerido', 'error')
      return
    }

    if (editingId) {
      // Editar item existente
      setItems(prev =>
        prev.map(item =>
          item.id === editingId
            ? {
                ...item,
                name: formData.name.trim(),
                quantity: parseFloat(formData.quantity),
                category: formData.category.trim(),
                store: formData.store.trim(),
                packaging: formData.packaging.trim(),
                price: formData.price ? parseFloat(formData.price) : 0,
              }
            : item
        )
      )
      setEditingId(null)
      showNotification('Producto actualizado', 'success')
    } else {
      // Agregar nuevo item
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        quantity: parseFloat(formData.quantity),
        category: formData.category.trim(),
        store: formData.store.trim(),
        packaging: formData.packaging.trim(),
        price: formData.price ? parseFloat(formData.price) : 0,
        checked: false,
      }
      setItems(prev => [...prev, newItem])
      showNotification('Producto agregado', 'success')
    }

    // Limpiar formulario
    setFormData({
      name: '',
      quantity: '1',
      category: '',
      store: '',
      packaging: 'Unidades',
      price: '',
    })
  }

  const handleEdit = (item: ShoppingItem) => {
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      category: item.category,
      store: item.store,
      packaging: item.packaging || 'Unidades',
      price: item.price ? item.price.toString() : '',
    })
    setEditingId(item.id)
    setIsFormModalOpen(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      quantity: '1',
      category: '',
      store: '',
      packaging: 'Unidades',
      price: '',
    })
  }

  const handleDelete = async (id: string) => {
    if ((await confirm({ message: '¿Estás seguro de que quieres eliminar este producto?', variant: 'danger' }))) {
      setItems(prev => prev.filter(item => item.id !== id))
      showNotification('Producto eliminado', 'success')
    }
  }

  const handleToggleChecked = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const handleLoadList = (list: ShoppingList) => {
    if (list.data && list.data.items && Array.isArray(list.data.items)) {
      // Mapear items del formato API al formato interno
      const mappedItems: ShoppingItem[] = list.data.items.map((item: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: item.name || '',
        quantity: item.quantity || 1,
        category: item.category || '',
        store: item.store || list.data.store || '',
        packaging: item.packaging || 'Unidades',
        price: item.price || 0,
        checked: item.checked || false,
      }))
      setItems(mappedItems)
      setListName(list.name)
      setLoadedListId(list.id)
      showNotification(`Lista "${list.name}" cargada`, 'success')
    } else {
      showNotification('La lista no tiene datos válidos', 'error')
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!(await confirm({ message: `¿Estás seguro de que quieres eliminar la lista "${listName}"?`, variant: 'danger' }))) {
      return
    }

    try {
      await api.deleteShoppingList(listId)
      if (loadedListId === listId) {
        setLoadedListId(null)
      }
      showNotification('Lista eliminada', 'success')
      await loadLists()
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar la lista. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    }
  }

  const handleDebugCreateLists = async () => {
    if (!isDebugToolsEnabled()) return
    try {
      setIsDebugLoading(true)
      const demoLists = [
        {
          name: 'Lista Semanal',
          data: {
            items: [
              { name: 'Leche', quantity: 2, category: 'Lácteos', store: 'Supermercado', packaging: 'Botella', price: 3500, checked: false },
              { name: 'Pan', quantity: 3, category: 'Panadería', store: 'Panadería', packaging: 'Unidades', price: 1200, checked: true },
              { name: 'Huevos', quantity: 1, category: 'Lácteos', store: 'Supermercado', packaging: 'Caja x 12', price: 8500, checked: false },
            ],
          },
        },
        {
          name: 'Lista Mensual',
          data: {
            items: [
              { name: 'Arroz', quantity: 2, category: 'Granos', store: 'Supermercado', packaging: 'Bolsa', price: 12000, checked: false },
              { name: 'Aceite', quantity: 1, category: 'Aceites', store: 'Supermercado', packaging: 'Botella', price: 8500, checked: false },
              { name: 'Azúcar', quantity: 1, category: 'Endulzantes', store: 'Supermercado', packaging: 'Bolsa', price: 4500, checked: true },
            ],
          },
        },
        {
          name: 'Lista Farmacia',
          data: {
            items: [
              { name: 'Acetaminofén', quantity: 1, category: 'Medicamentos', store: 'Farmacia', packaging: 'Caja', price: 15000, checked: false },
              { name: 'Alcohol', quantity: 2, category: 'Medicamentos', store: 'Farmacia', packaging: 'Botella', price: 3500, checked: false },
            ],
          },
        },
      ]

      for (const list of demoLists) {
        await api.createShoppingList(list)
      }

      showNotification('Listas demo creadas exitosamente', 'success')
      await loadLists()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al crear listas demo. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleDebugDeleteAll = async () => {
    if (!isDebugToolsEnabled()) return
    if (!(await confirm({ message: '¿Estás seguro de que quieres eliminar TODAS las listas? Esta acción es irreversible.', variant: 'danger' }))) {
      return
    }

    try {
      setIsDebugLoading(true)
      await api.deleteAllShoppingLists()
      showNotification('Todas las listas han sido eliminadas', 'success')
      await loadLists()
      setIsDebugModalOpen(false)
    } catch (err: any) {
      const errorMessage = getTranslatedErrorMessage(
        err,
        'Error al eliminar las listas. Por favor, intenta de nuevo.'
      )
      showNotification(errorMessage, 'error')
    } finally {
      setIsDebugLoading(false)
    }
  }

  const handleSaveList = async () => {
    if (!listName.trim()) {
      showNotification('El nombre de la lista es requerido', 'error')
      return
    }

    if (items.length === 0) {
      showNotification('Debes agregar al menos un producto antes de guardar', 'error')
      return
    }

    try {
      setIsSaving(true)

      // Preparar datos en formato JSON
      const listData = {
        name: listName.trim(),
        data: {
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            store: item.store,
            packaging: item.packaging,
            price: item.price || 0,
            checked: item.checked,
          })),
          created_at: new Date().toISOString(),
        },
      }

      if (loadedListId) {
        await api.updateShoppingList(loadedListId, listData)
        showNotification('Lista actualizada exitosamente', 'success')
      } else {
        await api.createShoppingList(listData)
        showNotification('Lista guardada exitosamente', 'success')
      }
      
      // Recargar lista de listas
      await loadLists()
      
      // Limpiar después de guardar (opcional)
      // setItems([])
      // setListName('')
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

  const checkedCount = items.filter(item => item.checked).length
  const totalItems = items.length
  const pendingCount = totalItems - checkedCount
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0)

  // Organizar productos por categoría
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || 'Sin categoría'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  // Ordenar categorías y productos dentro de cada categoría (pendientes primero)
  const sortedCategories = Object.keys(itemsByCategory).sort()
  sortedCategories.forEach(category => {
    itemsByCategory[category].sort((a, b) => {
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1 // Pendientes primero
      }
      return a.name.localeCompare(b.name)
    })
  })

  return (
    <div className="app-page-container">
      <div className="app-page-content app-page-content-wide crud-page-content listas-content">
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
        </div>

        <h1 className="app-page-title">
          {listName && items.length > 0 ? listName : 'Listas de Mercado'}
        </h1>

        <div
          className="crud-summary-strip"
          role="region"
          aria-label="Resumen de lista de mercado"
        >
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Total</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              {totalItems}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Pendientes</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--expense">
              {pendingCount}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item">
            <span className="crud-summary-strip-label">Comprados</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--income">
              {checkedCount}
            </span>
          </div>
          <div className="crud-summary-strip-separator" aria-hidden="true" />
          <div className="crud-summary-strip-item crud-summary-strip-item--emphasis">
            <span className="crud-summary-strip-label">Precio</span>
            <span className="crud-summary-strip-value crud-summary-strip-value--info">
              ${totalPrice.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn-base btn-accent btn-block btn-submit crud-primary-cta"
          onClick={handleOpenAddProduct}
          aria-label="Agregar producto"
        >
          <AddIcon aria-hidden={true} />
          Agregar producto
        </button>

        {/* Lista de productos organizados por categoría */}
        {items.length > 0 && (
          <div className="listas-items-section">
            {sortedCategories.map(category => {
              const categoryItems = itemsByCategory[category]
              const categoryPending = categoryItems.filter(item => !item.checked).length
              const categoryChecked = categoryItems.filter(item => item.checked).length
              const categoryPrice = categoryItems.reduce((sum, item) => sum + (item.price || 0), 0)

              return (
                <div key={category} className="listas-category-group">
                  <div className="listas-category-header">
                    <h3 className="listas-category-title">{category}</h3>
                    <div className="listas-category-stats">
                      <span className="listas-category-count">
                        {categoryPending > 0 && (
                          <span className="listas-category-pending">{categoryPending} pendientes</span>
                        )}
                        {categoryChecked > 0 && (
                          <>
                            {categoryPending > 0 && ' • '}
                            <span className="listas-category-checked">{categoryChecked} comprados</span>
                          </>
                        )}
                      </span>
                      {categoryPrice > 0 && (
                        <span className="listas-category-price">
                          ${categoryPrice.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="listas-items-list">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className={`listas-item ${item.checked ? 'checked' : ''}`}
                      >
                        <button
                          className="listas-item-check"
                          onClick={() => handleToggleChecked(item.id)}
                          aria-label={item.checked ? 'Desmarcar' : 'Marcar como comprado'}
                          type="button"
                        >
                          {item.checked ? (
                            <CheckCircleIcon className="listas-check-icon checked" />
                          ) : (
                            <RadioButtonUncheckedIcon className="listas-check-icon" />
                          )}
                        </button>
                        <div className="listas-item-content">
                          <div className="listas-item-header">
                            <h3 className="listas-item-name">{item.name}</h3>
                            <div className="listas-item-header-right">
                              <span className="listas-item-quantity">
                                {item.quantity} {item.packaging || 'Unidades'}
                              </span>
                              {item.price > 0 && (
                                <span className="listas-item-price">
                                  ${item.price.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="listas-item-meta">
                            <span className="listas-item-store">
                              <StoreIcon className="listas-item-store-icon" />
                              {item.store}
                            </span>
                          </div>
                        </div>
                        <div className="listas-item-actions">
                          <button
                            className="listas-item-action-button"
                            onClick={() => handleEdit(item)}
                            aria-label="Editar"
                            type="button"
                          >
                            <EditIcon />
                          </button>
                          <button
                            className="listas-item-action-button listas-item-action-button-delete"
                            onClick={() => handleDelete(item.id)}
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
              )
            })}
          </div>
        )}

        {/* Guardar lista */}
        {items.length > 0 && (
          <div className="listas-save-section">
            <div className="listas-save-form">
              <input
                type="text"
                value={listName}
                onChange={e => setListName(e.target.value)}
                className="form-input-base"
                placeholder="Nombre de la lista (ej: Lista Semanal)"
              />
              <button
                className="listas-save-button"
                onClick={handleSaveList}
                disabled={isSaving || !listName.trim()}
                type="button"
              >
                <SaveIcon className="listas-save-icon" />
                {isSaving ? 'Guardando...' : loadedListId ? 'Actualizar Lista' : 'Guardar Lista'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="empty-state">
            <StoreIcon className="empty-state-icon" aria-hidden="true" />
            <p className="empty-text">Agrega productos para comenzar tu lista de mercado</p>
            <p className="empty-subtext">Usa el botón de arriba para agregar el primero</p>
          </div>
        )}

        {/* Formulario en modal */}
        {isFormModalOpen && (
          <ModalOverlay onClose={() => handleCancelEdit()} className="modal-overlay">
            <div className="listas-modal listas-modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-editingid-editar-producto-agregar-producto">
                  {editingId ? 'Editar Producto' : 'Agregar Producto'}
                </h2>
                <button
                  className="modal-panel-close"
                  onClick={() => handleCancelEdit()}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="modal-panel-content">
                <form onSubmit={handleSubmit} className="listas-form">
                  <div className="form-group-base form-group-base--compact">
                    <label htmlFor="name" className="form-label-base form-label-base--inline">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input-base"
                      placeholder="Ej: Leche, Pan, Huevos..."
                      required
                    />
                  </div>

                  <div className="crud-form-row">
                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="quantity" className="form-label-base form-label-base--inline">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="1"
                        min="1"
                        step="1"
                        required
                      />
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="packaging" className="form-label-base form-label-base--inline">
                        Embalaje *
                      </label>
                      <input
                        type="text"
                        id="packaging"
                        name="packaging"
                        value={formData.packaging}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Ej: Unidades, Caja x 12, Caja x 6..."
                        list="packaging-list"
                        required
                      />
                      <datalist id="packaging-list">
                        <option value="Unidades" />
                        <option value="Caja x 6" />
                        <option value="Caja x 12" />
                        <option value="Caja x 24" />
                        <option value="Paquete" />
                        <option value="Bolsa" />
                        <option value="Botella" />
                        <option value="Lata" />
                      </datalist>
                    </div>
                  </div>

                  <div className="form-group-base form-group-base--compact">
                    <label htmlFor="category" className="form-label-base form-label-base--inline">
                      Categoría *
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="form-input-base"
                      placeholder="Ej: Lácteos, Panadería..."
                      list="categories-list"
                      required
                    />
                    <datalist id="categories-list">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="crud-form-row">
                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="store" className="form-label-base form-label-base--inline">
                        <StoreIcon className="form-label-icon" />
                        Sitio donde se compra *
                      </label>
                      <input
                        type="text"
                        id="store"
                        name="store"
                        value={formData.store}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="Ej: Supermercado, Tienda, Farmacia..."
                        list="stores-list"
                        required
                      />
                      <datalist id="stores-list">
                        {stores.map(store => (
                          <option key={store} value={store} />
                        ))}
                      </datalist>
                    </div>

                    <div className="form-group-base form-group-base--compact">
                      <label htmlFor="price" className="form-label-base form-label-base--inline">
                        Precio de Compra
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="form-input-base"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="listas-form-actions">
                    <button
                      type="button"
                      className="listas-form-button listas-form-button-secondary"
                      onClick={() => handleCancelEdit()}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="listas-form-button listas-form-button-primary"
                    >
                      {editingId ? 'Actualizar' : 'Agregar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalOverlay>
        )}


        {/* Listas Guardadas */}
        {(lists.length > 0 || listsLoadError) && (
          <div className="listas-saved-section">
            <div className="listas-section-header">
              <h2 className="listas-section-title">
                Listas Guardadas{lists.length > 0 ? ` (${lists.length})` : ''}
              </h2>
              <button
                className="listas-refresh-button"
                onClick={loadLists}
                aria-label="Actualizar listas"
                type="button"
                disabled={isLoadingLists}
              >
                <RefreshIcon className="listas-refresh-icon" />
              </button>
            </div>
            {isLoadingLists ? (
              <div className="listas-loading">
                <p>Cargando listas...</p>
              </div>
            ) : listsLoadError && lists.length === 0 ? (
              <div className="listas-empty-state listas-error-state" role="alert">
                <WarningIcon className="listas-error-icon" aria-hidden="true" />
                <p className="listas-empty-text">{listsLoadError}</p>
                <button className="listas-retry-button" onClick={loadLists} type="button">
                  <SyncIcon aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            ) : (
              <div className="listas-saved-list">
                {lists.map(list => (
                  <div key={list.id} className="listas-saved-item">
                    <div
                      className="listas-saved-content"
                      onClick={() => handleLoadList(list)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h3 className="listas-saved-name">{list.name}</h3>
                      <div className="listas-saved-info">
                        {list.data.items && (
                          <span className="listas-saved-meta">
                            {list.data.items.length} {list.data.items.length === 1 ? 'producto' : 'productos'}
                          </span>
                        )}
                        {list.data.items && (
                          <>
                            <span className="listas-saved-separator">•</span>
                            <span className="listas-saved-meta">
                              {list.data.items.filter((i: any) => i.checked).length} comprados
                            </span>
                          </>
                        )}
                      </div>
                      {list.created_at && (
                        <p className="listas-saved-date">
                          Creada: {new Date(list.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      className="listas-saved-delete"
                      onClick={() => handleDeleteList(list.id, list.name)}
                      aria-label="Eliminar lista"
                      type="button"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Debug */}
        {isDebugModalOpen && isDebugToolsEnabled() && (
          <ModalOverlay onClose={() => setIsDebugModalOpen(false)} className="modal-overlay">
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
              <div className="modal-panel-header">
                <h2 className="modal-panel-title" id="modal-panel-title-debug-listas-de-mercado">🐛 Debug - Listas de Mercado</h2>
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
                    onClick={handleDebugCreateLists}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">📦</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Crear Listas Demo</h3>
                      <p className="debug-option-description">
                        Crea 3 listas de ejemplo con productos predefinidos
                      </p>
                    </div>
                  </button>
                  <button
                    className="debug-option-button debug-option-button-danger"
                    onClick={handleDebugDeleteAll}
                    disabled={isDebugLoading}
                    type="button"
                  >
                    <span className="debug-option-icon">🗑️</span>
                    <div className="debug-option-info">
                      <h3 className="debug-option-title">Eliminar Todas las Listas</h3>
                      <p className="debug-option-description">
                        Elimina permanentemente todas las listas guardadas
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

export default ListasMercado

