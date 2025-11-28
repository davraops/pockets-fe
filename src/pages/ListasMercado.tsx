import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import FolderIcon from '@mui/icons-material/Folder'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import StoreIcon from '@mui/icons-material/Store'
import { api } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { getTranslatedErrorMessage } from '../utils/errorTranslations'
import './AppPage.css'
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
  const [listName, setListName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [showListsModal, setShowListsModal] = useState(false)

  useEffect(() => {
    calculateCategoriesAndStores()
  }, [items])

  useEffect(() => {
    loadLists()
  }, [])

  const calculateCategoriesAndStores = () => {
    const uniqueCategories = Array.from(new Set(items.map(item => item.category).filter(Boolean)))
    const uniqueStores = Array.from(new Set(items.map(item => item.store).filter(Boolean)))
    setCategories(uniqueCategories)
    setStores(uniqueStores)
  }

  const loadLists = async () => {
    try {
      setIsLoadingLists(true)
      const response = await api.getShoppingLists()
      if (response.lists && Array.isArray(response.lists)) {
        setLists(response.lists)
      }
    } catch (err: any) {
      console.error('Error al cargar listas:', err)
    } finally {
      setIsLoadingLists(false)
    }
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

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
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
      setShowListsModal(false)
      showNotification(`Lista "${list.name}" cargada`, 'success')
    } else {
      showNotification('La lista no tiene datos válidos', 'error')
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la lista "${listName}"?`)) {
      return
    }

    try {
      await api.deleteShoppingList(listId)
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

      await api.createShoppingList(listData)
      showNotification('Lista guardada exitosamente', 'success')
      
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

  return (
    <div className="app-page-container">
      <div className="app-page-content listas-content">
        {/* Toolbar */}
        <div className="listas-toolbar">
          <button
            className="listas-toolbar-button"
            onClick={() => navigate('/finanzas')}
            aria-label="Volver"
            type="button"
          >
            <ArrowBackIcon className="listas-toolbar-icon" />
          </button>
          <button
            className="listas-toolbar-button"
            onClick={() => {
              loadLists()
              setShowListsModal(true)
            }}
            aria-label="Ver listas guardadas"
            type="button"
          >
            <FolderIcon className="listas-toolbar-icon" />
          </button>
        </div>

        <h1 className="listas-page-title">Listas de Mercado</h1>
        <p className="listas-page-subtitle">
          Crea y gestiona tus listas de compras con productos, cantidades y categorías
        </p>

        {/* Formulario para agregar productos */}
        <div className="listas-form-section">
          <h2 className="listas-section-title">
            {editingId ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="listas-form">
            <div className="listas-form-group">
              <label htmlFor="name" className="listas-form-label">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="listas-form-input"
                placeholder="Ej: Leche, Pan, Huevos..."
                required
              />
            </div>

            <div className="listas-form-row">
              <div className="listas-form-group">
                <label htmlFor="quantity" className="listas-form-label">
                  Cantidad *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="listas-form-input"
                  placeholder="1"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="listas-form-group">
                <label htmlFor="packaging" className="listas-form-label">
                  Embalaje *
                </label>
                <input
                  type="text"
                  id="packaging"
                  name="packaging"
                  value={formData.packaging}
                  onChange={handleChange}
                  className="listas-form-input"
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

            <div className="listas-form-group">
              <label htmlFor="category" className="listas-form-label">
                Categoría *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="listas-form-input"
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

            <div className="listas-form-row">
              <div className="listas-form-group">
                <label htmlFor="store" className="listas-form-label">
                  <StoreIcon className="listas-label-icon" />
                  Sitio donde se compra *
                </label>
                <input
                  type="text"
                  id="store"
                  name="store"
                  value={formData.store}
                  onChange={handleChange}
                  className="listas-form-input"
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

              <div className="listas-form-group">
                <label htmlFor="price" className="listas-form-label">
                  Precio de Compra
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="listas-form-input"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="listas-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="listas-form-button listas-form-button-secondary"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="listas-form-button listas-form-button-primary"
              >
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>

        {/* Lista de productos */}
        {items.length > 0 && (
          <div className="listas-items-section">
            <div className="listas-section-header">
              <h2 className="listas-section-title">
                Productos ({checkedCount}/{totalItems})
              </h2>
              {items.some(item => item.price > 0) && (
                <div className="listas-total">
                  Total: ${items.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
            <div className="listas-items-list">
              {items.map(item => (
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
                      <span className="listas-item-category">{item.category}</span>
                      <span className="listas-item-separator">•</span>
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
        )}

        {/* Guardar lista */}
        {items.length > 0 && (
          <div className="listas-save-section">
            <h2 className="listas-section-title">Guardar Lista</h2>
            <div className="listas-save-form">
              <input
                type="text"
                value={listName}
                onChange={e => setListName(e.target.value)}
                className="listas-form-input"
                placeholder="Nombre de la lista (ej: Lista Semanal)"
              />
              <button
                className="listas-save-button"
                onClick={handleSaveList}
                disabled={isSaving || !listName.trim()}
                type="button"
              >
                <SaveIcon className="listas-save-icon" />
                {isSaving ? 'Guardando...' : 'Guardar Lista'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="listas-empty-state">
            <p className="listas-empty-text">
              Agrega productos para comenzar tu lista de mercado
            </p>
          </div>
        )}

        {/* Modal de Listas */}
        {showListsModal && (
          <div className="listas-modal-overlay" onClick={() => setShowListsModal(false)}>
            <div className="listas-modal" onClick={e => e.stopPropagation()}>
              <div className="listas-modal-header">
                <h2 className="listas-modal-title">Listas Guardadas</h2>
                <button
                  className="listas-modal-close"
                  onClick={() => setShowListsModal(false)}
                  aria-label="Cerrar"
                  type="button"
                >
                  ×
                </button>
              </div>
              <div className="listas-modal-content">
                {isLoadingLists ? (
                  <div className="listas-loading">
                    <p>Cargando listas...</p>
                  </div>
                ) : lists.length === 0 ? (
                  <div className="listas-empty-state">
                    <p className="listas-empty-text">No hay listas guardadas</p>
                  </div>
                ) : (
                  <div className="listas-lists-list">
                    {lists.map(list => (
                      <div key={list.id} className="listas-list-item">
                        <div
                          className="listas-list-content"
                          onClick={() => handleLoadList(list)}
                        >
                          <h3 className="listas-list-name">{list.name}</h3>
                          <div className="listas-list-info">
                            {list.data.items && (
                              <span className="listas-list-meta">
                                {list.data.items.length} {list.data.items.length === 1 ? 'producto' : 'productos'}
                              </span>
                            )}
                            {list.data.items && (
                              <>
                                <span className="listas-list-separator">•</span>
                                <span className="listas-list-meta">
                                  {list.data.items.filter((i: any) => i.checked).length} comprados
                                </span>
                              </>
                            )}
                          </div>
                          {list.created_at && (
                            <p className="listas-list-date">
                              Creada: {new Date(list.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                        <button
                          className="listas-list-delete"
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ListasMercado

