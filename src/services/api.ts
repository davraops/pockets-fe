// API Client for Pockets Backend
// Arquitectura de múltiples servicios: 3 servicios independientes
// Para desarrollo local, configurar variables de entorno en el archivo .env

// Configuración de APIs por servicio - URLs de producción
const API_CONFIG = {
  core: 'https://qe765aps3a.execute-api.us-east-1.amazonaws.com/dev',
  financial: 'https://l1nfx233y1.execute-api.us-east-1.amazonaws.com/dev',
  lifestyle: 'https://kstxcg0o0g.execute-api.us-east-1.amazonaws.com/dev'
}

class PocketsAPI {
  private coreURL: string
  private financialURL: string
  private lifestyleURL: string

  constructor() {
    this.coreURL = API_CONFIG.core
    this.financialURL = API_CONFIG.financial
    this.lifestyleURL = API_CONFIG.lifestyle
  }

  /**
   * Determina qué servicio usar según el endpoint
   */
  private getServiceForEndpoint(endpoint: string): 'core' | 'financial' | 'lifestyle' {
    if (
      endpoint.startsWith('/auth/') ||
      endpoint.startsWith('/bank-accounts') ||
      endpoint.startsWith('/budgets') ||
      endpoint.startsWith('/transactions') ||
      endpoint.startsWith('/exchange-rates')
    ) {
      return 'core'
    } else if (
      endpoint.startsWith('/debts') ||
      endpoint.startsWith('/debtors') ||
      endpoint.startsWith('/cards') ||
      endpoint.startsWith('/credit-cards') ||
      endpoint.startsWith('/subscriptions') ||
      endpoint.startsWith('/cryptocurrencies') ||
      endpoint.startsWith('/wallets') ||
      endpoint.startsWith('/cdts') ||
      endpoint.startsWith('/projects')
    ) {
      return 'financial'
    } else if (
      endpoint.startsWith('/routines') ||
      endpoint.startsWith('/routine-completions') ||
      endpoint.startsWith('/events') ||
      endpoint.startsWith('/notes') ||
      endpoint.startsWith('/diary-entries') ||
      endpoint.startsWith('/files') ||
      endpoint.startsWith('/secrets') ||
      endpoint.startsWith('/notifications') ||
      endpoint.startsWith('/crypto-exchange-rates') ||
      endpoint.startsWith('/judicial-processes') ||
      endpoint.startsWith('/shopping-lists') ||
      endpoint.startsWith('/employees') ||
      endpoint.startsWith('/vehicles') ||
      endpoint.startsWith('/patrimony')
    ) {
      return 'lifestyle'
    }
    return 'core' // Default
  }

  /**
   * Obtiene la URL base según el servicio
   */
  private getBaseURL(service: 'core' | 'financial' | 'lifestyle'): string {
    switch (service) {
      case 'core':
        return this.coreURL
      case 'financial':
        return this.financialURL
      case 'lifestyle':
        return this.lifestyleURL
      default:
        return this.coreURL
    }
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

  /**
   * Método base para realizar requests a la API.
   *
   * 🔒 Aislamiento de Datos por Usuario:
   * - Todos los endpoints filtran automáticamente los datos por el usuario autenticado usando el token JWT.
   * - No es necesario pasar `user_id` en los requests; el sistema lo obtiene automáticamente del token.
   * - Los nuevos registros se asignan automáticamente al usuario autenticado.
   * - Los exchange rates son globales y compartidos entre todos los usuarios.
   *
   * 🏗️ Arquitectura de Múltiples Servicios:
   * - Determina automáticamente qué servicio usar según el endpoint.
   * - Usa la URL base correcta para cada servicio (core, financial, lifestyle).
   */
  private async request(endpoint: string, options: any = {}) {
    const service = this.getServiceForEndpoint(endpoint)
    const baseURL = this.getBaseURL(service)
    const url = `${baseURL}${endpoint}`
    const token = this.getToken()

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // Incluir token JWT en todos los endpoints excepto /auth/register y /auth/login
        // El backend usa este token para filtrar automáticamente los datos por usuario
        ...(token && !endpoint.startsWith('/auth/') && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body)
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
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw {
        response: null,
        data: { error: 'Error de conexión', details: { message: errorMessage } },
      }
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

  /**
   * Obtiene el username del usuario autenticado desde el token JWT.
   * Retorna null si no hay token o si no se puede decodificar.
   */
  getCurrentUsername(): string | null {
    const token = this.getToken()
    if (!token) {
      return null
    }

    try {
      // Los tokens JWT tienen el formato: header.payload.signature
      // Necesitamos decodificar el payload (segunda parte)
      const parts = token.split('.')
      if (parts.length !== 3) {
        return null
      }

      // Decodificar el payload (base64url)
      const payload = parts[1]
      // Reemplazar caracteres base64url por base64 estándar
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      // Agregar padding si es necesario
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
      const decoded = atob(padded)
      const parsed = JSON.parse(decoded)

      // El username está en el campo 'username' del payload
      return parsed.username || null
    } catch (error) {
      console.error('Error al decodificar token:', error)
      return null
    }
  }

  /**
   * Verifica si el usuario actual es "testuser".
   * Útil para mostrar funcionalidades de debug solo a usuarios de prueba.
   */
  isTestUser(): boolean {
    const username = this.getCurrentUsername()
    return username === 'testuser'
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

  async updateBankAccount(
    accountId: string,
    updates: {
      account_name?: string
      bank?: string
      currency?: string
      account_id?: string
      balance?: number
    }
  ) {
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

  async deleteAllBankAccounts() {
    return this.request('/bank-accounts', {
      method: 'DELETE',
    })
  }

  // Exchange Rates
  async getExchangeRates(filters: { origin?: string; target?: string } = {}) {
    const params = new URLSearchParams()
    if (filters.origin) params.append('origin', filters.origin)
    if (filters.target) params.append('target', filters.target)

    const endpoint = params.toString() ? `/exchange-rates?${params.toString()}` : '/exchange-rates'

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

    const endpoint = params.toString() ? `/budgets?${params.toString()}` : '/budgets'

    return this.request(endpoint)
  }

  async updateBudget(
    budgetId: string,
    updates: {
      name?: string
      max_amount?: number
      total_spent?: number
      periodicity?: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
    }
  ) {
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

  // Budget Drafts
  async createBudgetDraft(data: {
    name: string
    data: any // JSON object
  }) {
    return this.request('/budget-drafts', {
      method: 'POST',
      body: data,
    })
  }

  async getBudgetDrafts(draftId: string | null = null) {
    const endpoint = draftId ? `/budget-drafts?id=${draftId}` : '/budget-drafts'
    return this.request(endpoint)
  }

  async updateBudgetDraft(
    draftId: string,
    updates: {
      name?: string
      data?: any
    }
  ) {
    return this.request(`/budget-drafts/${draftId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteBudgetDraft(draftId: string) {
    return this.request(`/budget-drafts/${draftId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllBudgetDrafts() {
    return this.request('/budget-drafts', {
      method: 'DELETE',
    })
  }

  // Transactions
  async createTransaction(data: {
    date: string
    type: 'ingreso' | 'egreso' | 'ahorro'
    amount: number
    description: string
    category: string
    currency: string
    bank_account_id: string | null
    budget_id?: string | null
    credit_card_id?: string | null
    debt_id?: string | null
    debtor_id?: string | null
  }) {
    return this.request('/transactions', {
      method: 'POST',
      body: data,
    })
  }

  async getTransactions(
    filters: {
      id?: string
      bank_account_id?: string
      budget_id?: string
      type?: 'ingreso' | 'egreso' | 'ahorro'
      category?: string
      start_date?: string
      end_date?: string
    } = {}
  ) {
    const params = new URLSearchParams()
    if (filters.id) params.append('id', filters.id)
    if (filters.bank_account_id) params.append('bank_account_id', filters.bank_account_id)
    if (filters.budget_id) params.append('budget_id', filters.budget_id)
    if (filters.type) params.append('type', filters.type)
    if (filters.category) params.append('category', filters.category)
    if (filters.start_date) params.append('start_date', filters.start_date)
    if (filters.end_date) params.append('end_date', filters.end_date)

    const endpoint = params.toString() ? `/transactions?${params.toString()}` : '/transactions'

    return this.request(endpoint)
  }

  async deleteTransaction(transactionId: string) {
    return this.request(`/transactions/${transactionId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllTransactions() {
    return this.request('/transactions/all', {
      method: 'DELETE',
    })
  }

  // Debts
  async createDebt(data: {
    value: number
    currency: string
    concept: string
    owed: number
    cut_date: string
    reference?: string
    interest_rate?: number
    overdue_interest?: number
    minimum_payment?: number
    has_insurance?: boolean
    insurance_value?: number
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

  async updateDebt(
    debtId: string,
    updates: {
      value?: number
      currency?: string
      concept?: string
      owed?: number
      reference?: string
      cut_date?: string
      interest_rate?: number
      overdue_interest?: number
      minimum_payment?: number
      has_insurance?: boolean
      insurance_value?: number
    }
  ) {
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

  // Cards
  async createCard(data: {
    card_name: string
    bank_account_id: string
    last_4_digits: string
    expiration_date: string
    is_virtual?: boolean
  }) {
    return this.request('/cards', {
      method: 'POST',
      body: data,
    })
  }

  async getCards(cardId: string | null = null) {
    const endpoint = cardId ? `/cards?id=${cardId}` : '/cards'
    return this.request(endpoint)
  }

  async updateCard(
    cardId: string,
    updates: {
      card_name?: string
      bank_account_id?: string
      last_4_digits?: string
      expiration_date?: string
      is_virtual?: boolean
    }
  ) {
    return this.request(`/cards/${cardId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteCard(cardId: string) {
    return this.request(`/cards/${cardId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllCards() {
    return this.request('/cards', {
      method: 'DELETE',
    })
  }

  // Subscriptions
  async createSubscription(data: {
    name: string
    price: number
    cut_date: string
    card_id: string
    is_family?: boolean
  }) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: data,
    })
  }

  async getSubscriptions(subscriptionId: string | null = null) {
    const endpoint = subscriptionId ? `/subscriptions?id=${subscriptionId}` : '/subscriptions'
    return this.request(endpoint)
  }

  async updateSubscription(
    subscriptionId: string,
    updates: {
      name?: string
      price?: number
      cut_date?: string
      card_id?: string
      is_family?: boolean
    }
  ) {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteSubscription(subscriptionId: string) {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllSubscriptions() {
    return this.request('/subscriptions', {
      method: 'DELETE',
    })
  }

  // Credit Cards
  async createCreditCard(data: {
    name: string
    bank: string
    credit_limit: number
    monthly_rate: number
    management_fee?: number
    cut_date?: string
    used_credit?: number
    benefits?: string[]
  }) {
    return this.request('/credit-cards', {
      method: 'POST',
      body: data,
    })
  }

  async getCreditCards(creditCardId: string | null = null) {
    const endpoint = creditCardId ? `/credit-cards?id=${creditCardId}` : '/credit-cards'
    return this.request(endpoint)
  }

  async updateCreditCard(
    creditCardId: string,
    updates: {
      name?: string
      bank?: string
      credit_limit?: number
      monthly_rate?: number
      management_fee?: number
      cut_date?: string
      used_credit?: number
      benefits?: string[]
    }
  ) {
    return this.request(`/credit-cards/${creditCardId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteCreditCard(creditCardId: string) {
    return this.request(`/credit-cards/${creditCardId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllCreditCards() {
    return this.request('/credit-cards', {
      method: 'DELETE',
    })
  }

  // Projects
  async createProject(data: {
    name: string
    target_amount: number
    duration_months: number
    end_date: string
    start_date?: string
    current_amount?: number
    status?: 'active' | 'completed' | 'cancelled'
    budget_id?: string | null
  }) {
    return this.request('/projects', {
      method: 'POST',
      body: data,
    })
  }

  async getProjects(projectId: string | null = null) {
    const endpoint = projectId ? `/projects?id=${projectId}` : '/projects'
    return this.request(endpoint)
  }

  async updateProject(
    projectId: string,
    updates: {
      name?: string
      target_amount?: number
      current_amount?: number
      start_date?: string
      end_date?: string
      duration_months?: number
      status?: 'active' | 'completed' | 'cancelled'
      budget_id?: string | null
    }
  ) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllProjects() {
    return this.request('/projects', {
      method: 'DELETE',
    })
  }

  // Debtors (Deudores - Personas que te deben dinero)
  async createDebtor(data: {
    debtor_name: string
    concept: string
    value: number
    total_paid?: number
  }) {
    return this.request('/debtors', {
      method: 'POST',
      body: data,
    })
  }

  async getDebtors(debtorId: string | null = null) {
    const endpoint = debtorId ? `/debtors?id=${debtorId}` : '/debtors'
    return this.request(endpoint)
  }

  async updateDebtor(
    debtorId: string,
    updates: {
      debtor_name?: string
      concept?: string
      value?: number
      total_paid?: number
    }
  ) {
    return this.request(`/debtors/${debtorId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteDebtor(debtorId: string) {
    return this.request(`/debtors/${debtorId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllDebtors() {
    return this.request('/debtors', {
      method: 'DELETE',
    })
  }

  // Wallets (Crypto Wallets)
  async createWallet(data: {
    wallet_name: string
    crypto_name: string
    address: string
  }) {
    return this.request('/wallets', {
      method: 'POST',
      body: data,
    })
  }

  async getWallets(walletId: string | null = null) {
    const endpoint = walletId ? `/wallets?id=${walletId}` : '/wallets'
    return this.request(endpoint)
  }

  async updateWallet(
    walletId: string,
    updates: {
      wallet_name?: string
      crypto_name?: string
      address?: string
    }
  ) {
    return this.request(`/wallets/${walletId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteWallet(walletId: string) {
    return this.request(`/wallets/${walletId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllWallets() {
    return this.request('/wallets', {
      method: 'DELETE',
    })
  }

  // Cryptocurrencies
  async createCryptocurrency(data: {
    crypto_name: string
    purchase_value: number
    purchase_date: string
    wallet_id: string
    units_purchased: number
    purchase_cost: number
    currency: string
  }) {
    return this.request('/cryptocurrencies', {
      method: 'POST',
      body: data,
    })
  }

  async getCryptocurrencies(cryptoId: string | null = null) {
    const endpoint = cryptoId ? `/cryptocurrencies?id=${cryptoId}` : '/cryptocurrencies'
    return this.request(endpoint)
  }

  async updateCryptocurrency(
    cryptoId: string,
    updates: {
      crypto_name?: string
      purchase_value?: number
      purchase_date?: string
      wallet_id?: string
      units_purchased?: number
      purchase_cost?: number
      currency?: string
    }
  ) {
    return this.request(`/cryptocurrencies/${cryptoId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteCryptocurrency(cryptoId: string) {
    return this.request(`/cryptocurrencies/${cryptoId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllCryptocurrencies() {
    return this.request('/cryptocurrencies', {
      method: 'DELETE',
    })
  }

  // Crypto Exchange Rates
  async syncCryptoExchangeRates() {
    return this.request('/crypto-exchange-rates/sync', {
      method: 'GET',
    })
  }

  async getCryptoExchangeRates() {
    return this.request('/crypto-exchange-rates', {
      method: 'GET',
    })
  }

  // CDTs
  async createCDT(data: {
    name: string
    value: number
    rate: number
    withdrawal_date: string
    duration?: number | null
    issuer?: string | null
  }) {
    return this.request('/cdts', {
      method: 'POST',
      body: data,
    })
  }

  async getCDTs(cdtId: string | null = null) {
    const endpoint = cdtId ? `/cdts?id=${cdtId}` : '/cdts'
    return this.request(endpoint)
  }

  async updateCDT(
    cdtId: string,
    updates: {
      name?: string
      value?: number
      rate?: number
      withdrawal_date?: string
      duration?: number | null
      issuer?: string | null
    }
  ) {
    return this.request(`/cdts/${cdtId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteCDT(cdtId: string) {
    return this.request(`/cdts/${cdtId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllCDTs() {
    return this.request('/cdts', {
      method: 'DELETE',
    })
  }

  // Notes (Cuadernos)
  async createNote(data: { title: string; content: string }) {
    return this.request('/notes', {
      method: 'POST',
      body: data,
    })
  }

  async getNotes(noteId: string | null = null) {
    const endpoint = noteId ? `/notes?id=${noteId}` : '/notes'
    return this.request(endpoint)
  }

  async updateNote(
    noteId: string,
    updates: {
      title?: string
      content?: string
    }
  ) {
    return this.request(`/notes/${noteId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteNote(noteId: string) {
    return this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllNotes() {
    return this.request('/notes', {
      method: 'DELETE',
    })
  }

  // Secrets
  async createSecret(data: { title: string; value: string }) {
    return this.request('/secrets', {
      method: 'POST',
      body: data,
    })
  }

  async getSecrets(secretId: string | null = null) {
    const endpoint = secretId ? `/secrets?id=${secretId}` : '/secrets'
    return this.request(endpoint)
  }

  async updateSecret(
    secretId: string,
    updates: {
      title?: string
      value?: string
    }
  ) {
    return this.request(`/secrets/${secretId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async verifySecret(secretId: string, value: string) {
    return this.request(`/secrets/${secretId}/verify`, {
      method: 'POST',
      body: { value },
    })
  }

  async getSecretValue(secretId: string, password: string) {
    return this.request(`/secrets/${secretId}/value`, {
      method: 'POST',
      body: { password },
    })
  }

  async deleteSecret(secretId: string) {
    return this.request(`/secrets/${secretId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllSecrets() {
    return this.request('/secrets', {
      method: 'DELETE',
    })
  }

  // Events (Fechas)
  async createEvent(data: {
    title: string
    event_date: string
    description?: string
    event_time?: string
    is_all_day?: boolean
    is_recurring?: boolean
    recurrence_frequency?: string
    recurrence_interval?: number
    recurrence_end_date?: string
    recurrence_count?: number
    location?: string
    color?: string
    reminder_minutes?: number
  }) {
    return this.request('/events', {
      method: 'POST',
      body: data,
    })
  }

  async getEvents(filters?: {
    id?: string
    start_date?: string
    end_date?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.id) params.append('id', filters.id)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)

    const queryString = params.toString()
    const endpoint = queryString ? `/events?${queryString}` : '/events'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updateEvent(
    eventId: string,
    updates: {
      title?: string
      description?: string
      event_date?: string
      event_time?: string
      is_all_day?: boolean
      is_recurring?: boolean
      recurrence_frequency?: string
      recurrence_interval?: number
      recurrence_end_date?: string
      recurrence_count?: number
      location?: string
      color?: string
      reminder_minutes?: number
    }
  ) {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteEvent(eventId: string) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllEvents() {
    return this.request('/events', {
      method: 'DELETE',
    })
  }

  // Routines (Rutinas)
  async createRoutine(data: {
    title: string
    frequency: 'daily' | 'weekly' | 'monthly'
    description?: string
    scheduled_time?: string
    start_date?: string
    end_date?: string
    is_active?: boolean
    color?: string
    target_count?: number
    days_of_week?: number[]
    day_of_month?: number
    duration?: number
  }) {
    return this.request('/routines', {
      method: 'POST',
      body: data,
    })
  }

  async getRoutines(routineId: string | null = null) {
    const endpoint = routineId ? `/routines?id=${routineId}` : '/routines'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async getRoutinesByDate(date?: string) {
    const endpoint = date ? `/routines/by-date?date=${date}` : '/routines/by-date'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updateRoutine(
    routineId: string,
    updates: {
      title?: string
      description?: string
      frequency?: 'daily' | 'weekly' | 'monthly'
      scheduled_time?: string
      start_date?: string
      end_date?: string
      is_active?: boolean
      color?: string
      target_count?: number
      days_of_week?: number[]
      day_of_month?: number
      duration?: number
      current_streak?: number
      longest_streak?: number
    }
  ) {
    return this.request(`/routines/${routineId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteRoutine(routineId: string) {
    return this.request(`/routines/${routineId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllRoutines() {
    return this.request('/routines', {
      method: 'DELETE',
    })
  }

  // Routine Completions (Completados de Rutinas)
  async createRoutineCompletion(data: {
    routine_id: string
    completed_date?: string
    completed_time?: string
    notes?: string
    value?: number
    duration?: number
  }) {
    return this.request('/routine-completions', {
      method: 'POST',
      body: data,
    })
  }

  async getRoutineCompletions(filters?: {
    id?: string
    routine_id?: string
    start_date?: string
    end_date?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.id) params.append('id', filters.id)
    if (filters?.routine_id) params.append('routine_id', filters.routine_id)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)

    const queryString = params.toString()
    const endpoint = queryString ? `/routine-completions?${queryString}` : '/routine-completions'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updateRoutineCompletion(
    completionId: string,
    updates: {
      completed_date?: string
      completed_time?: string
      notes?: string
      value?: number
      duration?: number
    }
  ) {
    return this.request(`/routine-completions/${completionId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteRoutineCompletion(completionId: string) {
    return this.request(`/routine-completions/${completionId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllRoutineCompletions(routineId?: string) {
    const endpoint = routineId ? `/routine-completions?routine_id=${routineId}` : '/routine-completions'
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }

  // Notifications (Notificaciones)
  async getNotifications(filters?: {
    is_read?: string
    type?: string
    priority?: string
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.is_read !== undefined) params.append('is_read', filters.is_read)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async markNotificationRead(notificationId: string, isRead: boolean = true) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
      body: { is_read: isRead },
    })
  }

  async markAllNotificationsRead(isRead: boolean = true) {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
      body: { is_read: isRead },
    })
  }

  async deleteNotification(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllNotifications() {
    return this.request('/notifications', {
      method: 'DELETE',
    })
  }

  async createNotification(data: {
    type: string // Tipos válidos: 'general', 'routine', 'budget', 'transaction', 'judicial_process', 'system', y otros tipos específicos
    title: string
    message: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    metadata?: any
  }) {
    return this.request('/notifications', {
      method: 'POST',
      body: data,
    })
  }

  // Diary Entries (Entradas de Diario)
  async createDiaryEntry(data: { entry_date: string; content: string }) {
    return this.request('/diary-entries', {
      method: 'POST',
      body: data,
    })
  }

  async getDiaryEntries(filters?: {
    id?: string
    date?: string
    start_date?: string
    end_date?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.id) params.append('id', filters.id)
    if (filters?.date) params.append('date', filters.date)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)

    const queryString = params.toString()
    const endpoint = queryString ? `/diary-entries?${queryString}` : '/diary-entries'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updateDiaryEntry(entryId: string, updates: { entry_date?: string; content?: string }) {
    return this.request(`/diary-entries/${entryId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteDiaryEntry(entryId: string) {
    return this.request(`/diary-entries/${entryId}`, {
      method: 'DELETE',
    })
  }

  // User Files (Archivos/Documentos)
  async uploadFile(file: File, title: string, description?: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    if (description) {
      formData.append('description', description)
    }

    const service = this.getServiceForEndpoint('/files')
    const baseURL = this.getBaseURL(service)
    const url = `${baseURL}/files`
    const token = this.getToken()

    const config: RequestInit = {
      method: 'POST',
      headers: {
        // NO incluir Content-Type, el navegador lo agregará automáticamente con el boundary
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          this.logout()
          throw { response, data, isUnauthorized: true }
        }
        throw { response, data }
      }

      return data
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw error
      }
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      throw {
        response: null,
        data: { error: 'Error de conexión', details: { message: errorMessage } },
      }
    }
  }

  async getFiles(filters?: {
    id?: string
    mime_type?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.id) params.append('id', filters.id)
    if (filters?.mime_type) params.append('mime_type', filters.mime_type)

    const queryString = params.toString()
    const endpoint = queryString ? `/files?${queryString}` : '/files'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async getFileDownloadUrl(fileId: string) {
    return this.request(`/files/${fileId}`, {
      method: 'GET',
    })
  }

  async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    })
  }

  // Judicial Processes (Procesos Judiciales) - Proxy endpoints en pockets-lifestyle
  // Estos endpoints actúan como proxy a la API externa de la Rama Judicial de Colombia
  // para evitar problemas de CORS y 403 Forbidden
  async getJudicialProcesses(nombreCompleto: string, tipoPersona: 'nat' | 'jur' = 'nat', soloActivos: boolean = false, pagina: number = 1) {
    const params = new URLSearchParams({
      nombre: nombreCompleto,
      tipoPersona: tipoPersona,
      SoloActivos: soloActivos ? 'true' : 'false', // La API espera string 'true' o 'false'
      pagina: pagina.toString(),
    })

    return await this.request(`/judicial-processes?${params.toString()}`)
  }

  async getProcessActuaciones(idProceso: number, pagina: number = 1) {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
    })

    return await this.request(`/judicial-processes/${idProceso}/actuaciones?${params.toString()}`)
  }

  // Judicial Process Tracking (Seguimiento de Procesos Judiciales)
  async addProcessTracking(data: {
    id_proceso: number
    llave_proceso: string
    nombre_persona: string
    despacho?: string
    departamento?: string
  }) {
    return await this.request('/judicial-processes/tracking', {
      method: 'POST',
      body: data,
    })
  }

  async getProcessTracking(activeOnly: boolean = false) {
    const params = new URLSearchParams()
    if (activeOnly) {
      params.append('active_only', 'true')
    }
    const queryString = params.toString()
    return await this.request(`/judicial-processes/tracking${queryString ? `?${queryString}` : ''}`)
  }

  async removeProcessTracking(trackingId: string) {
    return await this.request(`/judicial-processes/tracking/${trackingId}`, {
      method: 'DELETE',
    })
  }

  // Shopping Lists (Listas de Mercado)
  async createShoppingList(data: {
    name: string
    data: any // JSON object
  }) {
    return this.request('/shopping-lists', {
      method: 'POST',
      body: data,
    })
  }

  async getShoppingLists(listId: string | null = null) {
    const endpoint = listId ? `/shopping-lists?id=${listId}` : '/shopping-lists'
    return this.request(endpoint)
  }

  async updateShoppingList(
    listId: string,
    updates: {
      name?: string
      data?: any
    }
  ) {
    return this.request(`/shopping-lists/${listId}`, {
      method: 'PUT',
      body: updates,
    })
  }

  async deleteShoppingList(listId: string) {
    return this.request(`/shopping-lists/${listId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllShoppingLists() {
    return this.request('/shopping-lists', {
      method: 'DELETE',
    })
  }

  // Employees
  async createEmployee(data: {
    name: string
    data: any // JSON object
  }) {
    return this.request('/employees', {
      method: 'POST',
      body: data,
    })
  }

  async getEmployees(employeeId: string | null = null) {
    const endpoint = employeeId ? `/employees?id=${employeeId}` : '/employees'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updateEmployee(employeeId: string, data: {
    name?: string
    data?: any // JSON object
  }) {
    return this.request(`/employees/${employeeId}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteEmployee(employeeId: string) {
    return this.request(`/employees/${employeeId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllEmployees() {
    return this.request('/employees', {
      method: 'DELETE',
    })
  }

  // Vehicles
  async createVehicle(data: {
    name: string
    data: any // JSON object
  }) {
    return this.request('/vehicles', {
      method: 'POST',
      body: data,
    })
  }

  async getVehicles(vehicleId: string | null = null) {
    const endpoint = vehicleId ? `/vehicles?id=${vehicleId}` : '/vehicles'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updateVehicle(vehicleId: string, data: {
    name?: string
    data?: any // JSON object
  }) {
    return this.request(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteVehicle(vehicleId: string) {
    return this.request(`/vehicles/${vehicleId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllVehicles() {
    return this.request('/vehicles', {
      method: 'DELETE',
    })
  }

  // Patrimony
  async createPatrimonyItem(data: {
    name: string
    data: any // JSON object
  }) {
    return this.request('/patrimony', {
      method: 'POST',
      body: data,
    })
  }

  async getPatrimony(itemId: string | null = null) {
    const endpoint = itemId ? `/patrimony?id=${itemId}` : '/patrimony'
    return this.request(endpoint, {
      method: 'GET',
    })
  }

  async updatePatrimonyItem(itemId: string, data: {
    name?: string
    data?: any // JSON object
  }) {
    return this.request(`/patrimony/${itemId}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deletePatrimonyItem(itemId: string) {
    return this.request(`/patrimony/${itemId}`, {
      method: 'DELETE',
    })
  }

  async deleteAllPatrimony() {
    return this.request('/patrimony', {
      method: 'DELETE',
    })
  }
}

export const api = new PocketsAPI()
