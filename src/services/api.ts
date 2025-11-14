// API Client for Pockets Backend
// Por defecto usa la URL de producción (AWS)
// Para desarrollo local, configurar VITE_API_URL en el archivo .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://x1bom9m0bd.execute-api.us-east-1.amazonaws.com/dev'

class PocketsAPI {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken')
  }

  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('tokenExpiresAt')
    if (!expiresAt) {
      // Si no hay fecha de expiración, asumimos que el token es válido
      // (para tokens que no tienen expiración o para compatibilidad hacia atrás)
      return false
    }

    try {
      const expirationDate = new Date(expiresAt)
      const now = new Date()
      // Verificar si el token está expirado (con un margen de 1 minuto para evitar problemas de sincronización)
      return expirationDate.getTime() <= now.getTime() + 60000
    } catch (error) {
      // Si hay error al parsear la fecha, asumimos que está expirado para ser seguros
      console.error('Error al verificar expiración del token:', error)
      return true
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && !endpoint.startsWith('/auth/') && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Si recibimos un 401 (Unauthorized), el token puede estar expirado o ser inválido
        if (response.status === 401) {
          // Limpiar el token y redirigir al login
          this.logout()
          // Lanzar error para que el componente pueda manejar la redirección
          throw { response, data, isUnauthorized: true }
        }
        throw { response, data }
      }

      return data
    } catch (error: any) {
      if (error.response) {
        throw error
      }
      throw { response: null, data: { error: 'Error de conexión', details: { message: error.message } } }
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    
    // Guardar token automáticamente después del login
    if (result.token) {
      localStorage.setItem('authToken', result.token)
      if (result.expires_at) {
        localStorage.setItem('tokenExpiresAt', result.expires_at)
      }
    }
    
    return result
  }

  logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('tokenExpiresAt')
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) {
      return false
    }

    // Verificar si el token está expirado
    if (this.isTokenExpired()) {
      // Limpiar el token expirado
      this.logout()
      return false
    }

    return true
  }

  // Bank Accounts
  async createBankAccount(data: {
    account_name: string
    bank: string
    currency: string
    account_id: string
    balance: number
  }) {
    return this.request('/bank-accounts', {
      method: 'POST',
      body: data,
    })
  }

  async getBankAccounts(accountId: string | null = null) {
    const endpoint = accountId ? `/bank-accounts?id=${accountId}` : '/bank-accounts'
    return this.request(endpoint)
  }

  async updateBankAccount(accountId: string, updates: {
    account_name?: string
    bank?: string
    currency?: string
    account_id?: string
    balance?: number
  }) {
    return this.request(`/bank-accounts/${accountId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteBankAccount(accountId: string) {
    return this.request(`/bank-accounts/${accountId}`, {
      method: 'DELETE',
    })
  }

  // Exchange Rates
  async getExchangeRates(filters: { origin?: string; target?: string } = {}) {
    const params = new URLSearchParams()
    if (filters.origin) params.append('origin', filters.origin)
    if (filters.target) params.append('target', filters.target)

    const endpoint = params.toString()
      ? `/exchange-rates?${params.toString()}`
      : '/exchange-rates'

    return this.request(endpoint)
  }

  async syncExchangeRates() {
    return this.request('/exchange-rates/sync', {
      method: 'GET',
    })
  }

  // Budgets
  async createBudget(data: {
    name: string
    max_amount: number
    periodicity?: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  }) {
    return this.request('/budgets', {
      method: 'POST',
      body: data,
    })
  }

  async getBudgets(budgetId: string | null = null, includeDeleted: boolean = false) {
    const params = new URLSearchParams()
    if (budgetId) params.append('id', budgetId)
    if (includeDeleted) params.append('include_deleted', 'true')
    
    const endpoint = params.toString()
      ? `/budgets?${params.toString()}`
      : '/budgets'
    
    return this.request(endpoint)
  }

  async updateBudget(budgetId: string, updates: {
    name?: string
    max_amount?: number
    periodicity?: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  }) {
    return this.request(`/budgets/${budgetId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteBudget(budgetId: string) {
    return this.request(`/budgets/${budgetId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllBudgets() {
    return this.request('/budgets', {
      method: 'DELETE',
    })
  }

  async hardDeleteBudget(budgetId: string) {
    return this.request(`/budgets/${budgetId}/hard`, {
      method: 'DELETE',
    })
  }

  async hardDeleteAllBudgets() {
    return this.request('/budgets/hard', {
      method: 'DELETE',
    })
  }

  async restoreBudget(budgetId: string) {
    return this.request(`/budgets/${budgetId}/restore`, {
      method: 'POST',
    })
  }

  async resetBudget(budgetId: string) {
    return this.request(`/budgets/${budgetId}/reset`, {
      method: 'POST',
    })
  }

  async recalculateBudget(budgetId: string) {
    return this.request(`/budgets/${budgetId}/recalculate`, {
      method: 'POST',
    })
  }

  // Transactions
  async createTransaction(data: {
    date: string
    type: 'ingreso' | 'egreso'
    amount: number
    description: string
    category: string
    currency: string
    bank_account_id: string
    budget_id?: string
  }) {
    return this.request('/transactions', {
      method: 'POST',
      body: data,
    })
  }

  async getTransactions(filters: {
    id?: string
    bank_account_id?: string
    budget_id?: string
    type?: 'ingreso' | 'egreso'
    category?: string
    start_date?: string
    end_date?: string
  } = {}) {
    const params = new URLSearchParams()
    if (filters.id) params.append('id', filters.id)
    if (filters.bank_account_id) params.append('bank_account_id', filters.bank_account_id)
    if (filters.budget_id) params.append('budget_id', filters.budget_id)
    if (filters.type) params.append('type', filters.type)
    if (filters.category) params.append('category', filters.category)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)

    const endpoint = params.toString()
      ? `/transactions?${params.toString()}`
      : '/transactions'

    return this.request(endpoint)
  }

  // Debts
  async createDebt(data: {
    valor: number
    divisa: string
    concepto: string
    adeudado: number
    fecha_corte: string
    referencia?: string
    tasa_interes?: number
    interes_en_mora?: number
    pago_minimo?: number
    tiene_seguro?: boolean
    valor_seguro?: number
  }) {
    return this.request('/debts', {
      method: 'POST',
      body: data,
    })
  }

  async getDebts(debtId: string | null = null) {
    const endpoint = debtId ? `/debts?id=${debtId}` : '/debts'
    return this.request(endpoint)
  }

  async updateDebt(debtId: string, updates: {
    valor?: number
    divisa?: string
    concepto?: string
    adeudado?: number
    referencia?: string
    fecha_corte?: string
    tasa_interes?: number
    interes_en_mora?: number
    pago_minimo?: number
    tiene_seguro?: boolean
    valor_seguro?: number
  }) {
    return this.request(`/debts/${debtId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteDebt(debtId: string) {
    return this.request(`/debts/${debtId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllDebts() {
    return this.request('/debts', {
      method: 'DELETE',
    })
  }
}

export const api = new PocketsAPI(API_BASE_URL)

