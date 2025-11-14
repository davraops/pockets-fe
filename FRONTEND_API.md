# Pockets API - Frontend Reference

Guía completa de endpoints para integración frontend.

## Configuración Base

### URLs Base

```javascript
// Por defecto usa la URL de producción (AWS)
// Para desarrollo local, configurar VITE_API_URL en el archivo .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://x1bom9m0bd.execute-api.us-east-1.amazonaws.com/dev';

// Ejemplo de archivo .env para desarrollo local:
// VITE_API_URL=http://localhost:3000
```

### CORS

La API está configurada para aceptar solicitudes desde:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:8080`
- `http://localhost:5173`
- `http://localhost:5174`
- `https://pockets.avellaconsulting.com`
- `https://www.pockets.avellaconsulting.com`

### Autenticación

**⚠️ IMPORTANTE:** Todos los endpoints requieren autenticación JWT, excepto:
- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Login de usuarios

#### Flujo de Autenticación

1. **Registro de Usuario:**
```javascript
import bcrypt from 'bcryptjs';

const passwordHash = await bcrypt.hash('mipassword123', 10);
const newUser = await fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: "johndoe",
    password_hash: passwordHash,
    nombre_usuario: "John Doe",
    fecha_nacimiento: "1990-01-15"
  })
});
```

2. **Login y Obtención de Token:**
```javascript
const loginResponse = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: "johndoe",
    password: "mipassword123"
  })
});

const { token, expires_at, user } = await loginResponse.json();

// Guardar token en localStorage o estado de la aplicación
localStorage.setItem('authToken', token);
localStorage.setItem('tokenExpiresAt', expires_at);
```

3. **Usar Token en Requests:**
```javascript
const token = localStorage.getItem('authToken');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO para todos los endpoints protegidos
};
```

#### Manejo de Errores de Autenticación

Si recibes un error `401 Unauthorized`, significa que:
- El token no fue proporcionado
- El token es inválido
- El token ha expirado (tokens expiran después de 1 día)

**Ejemplo de manejo:**
```javascript
try {
  const response = await fetch(`${API_URL}/bank-accounts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token inválido o expirado - redirigir a login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    return;
  }
  
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
}
```

### Headers Recomendados

```javascript
const token = localStorage.getItem('authToken');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO para todos los endpoints protegidos
};
```

---

## Endpoints

> **⚠️ Nota:** Todos los endpoints a continuación requieren autenticación JWT. Incluye el header `Authorization: Bearer <token>` en cada request.

### Bank Accounts

#### POST /bank-accounts
Crear una nueva cuenta bancaria.

**URL:** `POST ${API_URL}/bank-accounts`

**Request Body:**
```json
{
  "account_name": "Mi Cuenta de Ahorros",
  "bank": "Banco Nacional",
  "currency": "USD",
  "account_id": "US123456789",
  "balance": 1000.50
}
```

**Ejemplo JavaScript:**
```javascript
const createBankAccount = async (accountData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/bank-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(accountData),
  });
  return response.json();
};

// Uso
const newAccount = await createBankAccount({
  account_name: "Mi Cuenta de Ahorros",
  bank: "Banco Nacional",
  currency: "USD",
  account_id: "US123456789",
  balance: 1000.50
});
```

**Response (201):**
```json
{
  "message": "Bank account created successfully",
  "account": {
    "id": "uuid-here",
    "account_name": "Mi Cuenta de Ahorros",
    "bank": "Banco Nacional",
    "currency": "USD",
    "account_id": "US123456789",
    "balance": 1000.50,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### GET /bank-accounts
Obtener cuentas bancarias con balance convertido a COP.

**URL:** `GET ${API_URL}/bank-accounts?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getBankAccounts = async (accountId = null) => {
  const url = accountId 
    ? `${API_URL}/bank-accounts?id=${accountId}`
    : `${API_URL}/bank-accounts`;
  
  const response = await fetch(url);
  return response.json();
};

// Obtener todas las cuentas
const allAccounts = await getBankAccounts();

// Obtener cuenta específica
const account = await getBankAccounts('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "accounts": [
    {
      "id": "uuid-here",
      "account_name": "Mi Cuenta de Ahorros",
      "bank": "Banco Nacional",
      "currency": "USD",
      "account_id": "US123456789",
      "balance": {
        "original": {
          "amount": 1000.50,
          "currency": "USD"
        },
        "cop": {
          "amount": 4100500.00,
          "currency": "COP"
        },
        "conversion_rate": 4100.0,
        "conversion_available": true
      },
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### PUT /bank-accounts/{id}
Actualizar una cuenta bancaria específica.

**URL:** `PUT ${API_URL}/bank-accounts/{id}`

**Ejemplo JavaScript:**
```javascript
const updateBankAccount = async (accountId, updates) => {
  const response = await fetch(`${API_URL}/bank-accounts/${accountId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el nombre
await updateBankAccount('uuid-here', {
  account_name: "Nuevo Nombre"
});

// Uso - actualizar múltiples campos
await updateBankAccount('uuid-here', {
  account_name: "Nuevo Nombre",
  balance: 2000.00,
  currency: "EUR"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "account_name": "Nuevo Nombre",
  "bank": "Nuevo Banco",
  "currency": "EUR",
  "account_id": "NUEVO123456789",
  "balance": 2000.00
}
```

---

#### DELETE /bank-accounts/{id}
Eliminar una cuenta bancaria específica.

**URL:** `DELETE ${API_URL}/bank-accounts/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteBankAccount = async (accountId) => {
  const response = await fetch(`${API_URL}/bank-accounts/${accountId}`, {
    method: 'DELETE',
  });
  return response.json();
};
```

---

#### DELETE /bank-accounts
Eliminar todas las cuentas bancarias.

**URL:** `DELETE ${API_URL}/bank-accounts`

**Ejemplo JavaScript:**
```javascript
const deleteAllBankAccounts = async () => {
  const response = await fetch(`${API_URL}/bank-accounts`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### POST /bank-accounts/{id}/recalculate-balance
Recalcular el balance de una cuenta bancaria.

**URL:** `POST ${API_URL}/bank-accounts/{id}/recalculate-balance`

**Ejemplo JavaScript:**
```javascript
const recalculateBalance = async (accountId) => {
  const response = await fetch(`${API_URL}/bank-accounts/${accountId}/recalculate-balance`, {
    method: 'POST',
  });
  return response.json();
};
```

---

### Exchange Rates

#### POST /exchange-rates
Crear o actualizar una tasa de cambio.

**URL:** `POST ${API_URL}/exchange-rates`

**Ejemplo JavaScript:**
```javascript
const createExchangeRate = async (rateData) => {
  const response = await fetch(`${API_URL}/exchange-rates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rateData),
  });
  return response.json();
};

// Uso
await createExchangeRate({
  origin: "USD",
  target: "COP",
  exchange_rate: 4100.5
});
```

**Request Body:**
```json
{
  "origin": "USD",
  "target": "COP",
  "exchange_rate": 4100.5
}
```

---

#### GET /exchange-rates
Obtener tasas de cambio con filtros opcionales.

**URL:** `GET ${API_URL}/exchange-rates?origin={currency}&target={currency}`

**Ejemplo JavaScript:**
```javascript
const getExchangeRates = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.origin) params.append('origin', filters.origin);
  if (filters.target) params.append('target', filters.target);
  
  const url = params.toString() 
    ? `${API_URL}/exchange-rates?${params.toString()}`
    : `${API_URL}/exchange-rates`;
  
  const response = await fetch(url);
  return response.json();
};

// Obtener todas las tasas
const allRates = await getExchangeRates();

// Filtrar por origen
const usdRates = await getExchangeRates({ origin: 'USD' });

// Filtrar por par específico
const usdToCop = await getExchangeRates({ origin: 'USD', target: 'COP' });
```

---

#### GET /exchange-rates/sync
Sincronizar tasas de cambio desde API externa (USD->COP y EUR->COP).

**URL:** `GET ${API_URL}/exchange-rates/sync`

**Ejemplo JavaScript:**
```javascript
const syncExchangeRates = async () => {
  const response = await fetch(`${API_URL}/exchange-rates/sync`, {
    method: 'GET',
  });
  return response.json();
};
```

---

### Budgets

#### POST /budgets
Crear un nuevo presupuesto.

**URL:** `POST ${API_URL}/budgets`

**Ejemplo JavaScript:**
```javascript
const createBudget = async (budgetData) => {
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(budgetData),
  });
  return response.json();
};

// Uso
const newBudget = await createBudget({
  name: "Compras Mensuales",
  max_amount: 500000
});
```

**Request Body:**
```json
{
  "name": "Compras Mensuales",
  "max_amount": 500000
}
```

**Response (201):**
```json
{
  "message": "Budget created successfully",
  "budget": {
    "id": "uuid-here",
    "name": "Compras Mensuales",
    "max_amount": 500000,
    "total_spent": 0,
    "remaining": 500000,
    "is_over_budget": false,
    "percentage_used": 0,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### GET /budgets
Obtener presupuestos con métricas de gasto.

**URL:** `GET ${API_URL}/budgets?id={uuid}&include_deleted={true|false}` (opcional)

**Query Parameters:**
- `id` - ID del presupuesto específico (opcional)
- `include_deleted` - Incluir presupuestos eliminados (opcional, default: false)

**Ejemplo JavaScript:**
```javascript
const getBudgets = async (budgetId = null, includeDeleted = false) => {
  const params = new URLSearchParams();
  if (budgetId) params.append('id', budgetId);
  if (includeDeleted) params.append('include_deleted', 'true');
  
  const url = params.toString() 
    ? `${API_URL}/budgets?${params.toString()}`
    : `${API_URL}/budgets`;
  
  const response = await fetch(url);
  return response.json();
};

// Obtener solo presupuestos activos (por defecto)
const activeBudgets = await getBudgets();

// Obtener todos los presupuestos incluyendo eliminados
const allBudgets = await getBudgets(null, true);

// Obtener presupuesto específico (activo o eliminado)
const budget = await getBudgets('uuid-here', true);
```

**Response (200):**
```json
{
  "count": 2,
  "budgets": [
    {
      "id": "uuid-here",
      "name": "Compras Mensuales",
      "max_amount": 500000,
      "total_spent": 150000,
      "remaining": 350000,
      "is_over_budget": false,
      "percentage_used": 30.00,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Por defecto, solo se muestran presupuestos con `status = 'active'`. Usa `include_deleted=true` para incluir presupuestos eliminados.

---

#### PUT /budgets/{id}
Actualizar un presupuesto específico.

**URL:** `PUT ${API_URL}/budgets/{id}`

**Ejemplo JavaScript:**
```javascript
const updateBudget = async (budgetId, updates) => {
  const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso
await updateBudget('uuid-here', {
  name: "Nuevo Nombre",
  max_amount: 600000
});
```

**Request Body (al menos uno requerido):**
```json
{
  "name": "Nuevo Nombre",
  "max_amount": 600000
}
```

---

#### DELETE /budgets/{id}
Eliminar un presupuesto específico (soft delete - se puede restaurar).

**URL:** `DELETE ${API_URL}/budgets/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteBudget = async (budgetId) => {
  const response = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**Nota:** Este es un "soft delete". El presupuesto se marca como eliminado (`status = 'deleted'`) pero no se elimina físicamente. Las transacciones asociadas se mantienen. Puedes restaurarlo usando el endpoint `/restore`.

---

#### DELETE /budgets
Eliminar todos los presupuestos (soft delete - se pueden restaurar).

**URL:** `DELETE ${API_URL}/budgets`

**Ejemplo JavaScript:**
```javascript
const deleteAllBudgets = async () => {
  const response = await fetch(`${API_URL}/budgets`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**Nota:** Este es un "soft delete". Todos los presupuestos activos se marcan como eliminados pero no se eliminan físicamente.

---

#### DELETE /budgets/{id}/hard
Eliminar permanentemente un presupuesto y todas sus transacciones asociadas.

**URL:** `DELETE ${API_URL}/budgets/{id}/hard`

**Ejemplo JavaScript:**
```javascript
const hardDeleteBudget = async (budgetId) => {
  const response = await fetch(`${API_URL}/budgets/${budgetId}/hard`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**⚠️ ADVERTENCIA CRÍTICA:** Esta operación es **IRREVERSIBLE**. Elimina físicamente:
- El presupuesto
- Todas las transacciones asociadas al presupuesto
- Los balances de las cuentas bancarias se actualizarán automáticamente

**Response (200):**
```json
{
  "message": "Budget permanently deleted successfully",
  "warning": "This operation cannot be undone. All associated transactions have been deleted.",
  "deleted_budget": {
    "id": "uuid-here",
    "name": "Compras Mensuales",
    "max_amount": 500000,
    "total_spent": 150000
  },
  "deleted_transactions_count": 5
}
```

---

#### DELETE /budgets/hard
Eliminar permanentemente todos los presupuestos y todas sus transacciones asociadas.

**URL:** `DELETE ${API_URL}/budgets/hard`

**Ejemplo JavaScript:**
```javascript
const hardDeleteAllBudgets = async () => {
  const response = await fetch(`${API_URL}/budgets/hard`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**⚠️ ADVERTENCIA CRÍTICA:** Esta operación es **IRREVERSIBLE**. Elimina físicamente:
- Todos los presupuestos
- Todas las transacciones asociadas a presupuestos
- Los balances de las cuentas bancarias se actualizarán automáticamente

---

#### POST /budgets/{id}/restore
Restaurar un presupuesto eliminado (soft delete).

**URL:** `POST ${API_URL}/budgets/{id}/restore`

**Ejemplo JavaScript:**
```javascript
const restoreBudget = async (budgetId) => {
  const response = await fetch(`${API_URL}/budgets/${budgetId}/restore`, {
    method: 'POST',
  });
  return response.json();
};
```

**Nota:** Restaura un presupuesto que fue eliminado con soft delete, cambiando su `status` de `'deleted'` a `'active'`.

---

#### POST /budgets/{id}/recalculate
Recalcular el total gastado de un presupuesto.

**URL:** `POST ${API_URL}/budgets/{id}/recalculate`

**Ejemplo JavaScript:**
```javascript
const recalculateBudget = async (budgetId) => {
  const response = await fetch(`${API_URL}/budgets/${budgetId}/recalculate`, {
    method: 'POST',
  });
  return response.json();
};
```

---

#### POST /budgets/reset
Resetear todos los presupuestos (total_spent = 0).

**URL:** `POST ${API_URL}/budgets/reset`

**Ejemplo JavaScript:**
```javascript
const resetAllBudgets = async () => {
  const response = await fetch(`${API_URL}/budgets/reset`, {
    method: 'POST',
  });
  return response.json();
};
```

---

#### POST /budgets/{id}/reset
Resetear un presupuesto específico (total_spent = 0).

**URL:** `POST ${API_URL}/budgets/{id}/reset`

**Ejemplo JavaScript:**
```javascript
const resetBudget = async (budgetId) => {
  const response = await fetch(`${API_URL}/budgets/${budgetId}/reset`, {
    method: 'POST',
  });
  return response.json();
};
```

---

### Transactions

#### POST /transactions
Crear una nueva transacción (ingreso o egreso).

**URL:** `POST ${API_URL}/transactions`

**Ejemplo JavaScript:**
```javascript
const createTransaction = async (transactionData) => {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });
  return response.json();
};

// Transacción de ingreso
await createTransaction({
  date: "2024-01-15",
  type: "ingreso",
  amount: 1000000,
  description: "Pago de salario",
  category: "Salario",
  currency: "COP",
  bank_account_id: "uuid-of-bank-account"
});

// Transacción de egreso (requiere budget_id)
await createTransaction({
  date: "2024-01-15",
  type: "egreso",
  amount: 50000,
  description: "Compra de supermercado",
  budget_id: "uuid-of-budget",
  category: "Compras",
  currency: "COP",
  bank_account_id: "uuid-of-bank-account"
});
```

**Request Body (Ingreso):**
```json
{
  "date": "2024-01-15",
  "type": "ingreso",
  "amount": 1000000,
  "description": "Pago de salario",
  "category": "Salario",
  "currency": "COP",
  "bank_account_id": "uuid-of-bank-account"
}
```

**Request Body (Egreso):**
```json
{
  "date": "2024-01-15",
  "type": "egreso",
  "amount": 50000,
  "description": "Compra de supermercado",
  "budget_id": "uuid-of-budget",
  "category": "Compras",
  "currency": "COP",
  "bank_account_id": "uuid-of-bank-account"
}
```

**⚠️ Validación importante:**
- Los egresos **requieren** `budget_id`
- Los ingresos **no pueden** tener `budget_id`
- Los egresos no pueden exceder el `max_amount` del presupuesto asociado

**Error Response (400) - Presupuesto Excedido:**
```json
{
  "error": "Transaction would exceed budget limit",
  "budget_name": "Compras Mensuales",
  "max_amount": 500000,
  "current_spent": 450000,
  "remaining": 50000,
  "transaction_amount": 60000,
  "would_exceed_by": 10000
}
```

---

#### GET /transactions
Obtener transacciones con filtros opcionales.

**URL:** `GET ${API_URL}/transactions?{filters}`

**Ejemplo JavaScript:**
```javascript
const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.id) params.append('id', filters.id);
  if (filters.bank_account_id) params.append('bank_account_id', filters.bank_account_id);
  if (filters.budget_id) params.append('budget_id', filters.budget_id);
  if (filters.type) params.append('type', filters.type);
  if (filters.category) params.append('category', filters.category);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  
  const url = params.toString() 
    ? `${API_URL}/transactions?${params.toString()}`
    : `${API_URL}/transactions`;
  
  const response = await fetch(url);
  return response.json();
};

// Obtener todas las transacciones
const allTransactions = await getTransactions();

// Filtrar por cuenta bancaria
const accountTransactions = await getTransactions({
  bank_account_id: 'uuid-here'
});

// Filtrar por tipo y rango de fechas
const expensesInJanuary = await getTransactions({
  type: 'egreso',
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});

// Filtrar por presupuesto
const budgetTransactions = await getTransactions({
  budget_id: 'uuid-here',
  type: 'egreso'
});
```

**Query Parameters disponibles:**
- `id` - ID de transacción específica
- `bank_account_id` - Filtrar por cuenta bancaria
- `budget_id` - Filtrar por presupuesto
- `type` - Filtrar por tipo ("ingreso" o "egreso")
- `category` - Filtrar por categoría
- `start_date` - Fecha inicio (YYYY-MM-DD)
- `end_date` - Fecha fin (YYYY-MM-DD)

**Response (200):**
```json
{
  "count": 2,
  "transactions": [
    {
      "id": "uuid-here",
      "date": "2024-01-15",
      "type": "ingreso",
      "amount": 1000000,
      "description": "Pago de salario",
      "budget_id": null,
      "category": "Salario",
      "currency": "COP",
      "bank_account_id": "uuid-of-bank-account",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "uuid-here-2",
      "date": "2024-01-15",
      "type": "egreso",
      "amount": 50000,
      "description": "Compra de supermercado",
      "budget_id": "uuid-of-budget",
      "category": "Compras",
      "currency": "COP",
      "bank_account_id": "uuid-of-bank-account",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### Debts

#### POST /debts
Crear una nueva deuda.

**URL:** `POST ${API_URL}/debts`

**Ejemplo JavaScript:**
```javascript
const createDebt = async (debtData) => {
  const response = await fetch(`${API_URL}/debts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(debtData),
  });
  return response.json();
};

// Uso
const newDebt = await createDebt({
  valor: 5000000,
  divisa: "COP",
  concepto: "Tarjeta de crédito",
  adeudado: 3000000,
  referencia: "TARJ-1234",
  fecha_corte: "2024-02-15",
  tasa_interes: 2.5,
  interes_en_mora: 5.0,
  pago_minimo: 150000,
  tiene_seguro: true,
  valor_seguro: 50000
});
```

**Request Body:**
```json
{
  "valor": 5000000,
  "divisa": "COP",
  "concepto": "Tarjeta de crédito",
  "adeudado": 3000000,
  "referencia": "TARJ-1234",
  "fecha_corte": "2024-02-15",
  "tasa_interes": 2.5,
  "interes_en_mora": 5.0,
  "pago_minimo": 150000,
  "tiene_seguro": true,
  "valor_seguro": 50000
}
```

**Campos Requeridos:**
- `valor` - Valor total de la deuda (número positivo)
- `divisa` - Código de moneda (3 letras mayúsculas, ej: USD, EUR, COP)
- `concepto` - Descripción/concepto de la deuda
- `adeudado` - Monto actualmente adeudado (número positivo)
- `fecha_corte` - Fecha de corte en formato YYYY-MM-DD

**Campos Opcionales:**
- `referencia` - Número de referencia o identificador
- `tasa_interes` - Porcentaje de tasa de interés (default: 0.00)
- `interes_en_mora` - Porcentaje de interés en mora (default: 0.00)
- `pago_minimo` - Monto de pago mínimo (default: 0.00)
- `tiene_seguro` - Si la deuda tiene seguro (default: false)
- `valor_seguro` - Valor del seguro (default: 0.00)

**Response (201):**
```json
{
  "message": "Debt created successfully",
  "debt": {
    "id": "uuid-here",
    "valor": 5000000,
    "divisa": "COP",
    "concepto": "Tarjeta de crédito",
    "adeudado": 3000000,
    "referencia": "TARJ-1234",
    "fecha_corte": "2024-02-15",
    "tasa_interes": 2.5,
    "interes_en_mora": 5.0,
    "pago_minimo": 150000,
    "tiene_seguro": true,
    "valor_seguro": 50000,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /debts
Obtener deudas.

**URL:** `GET ${API_URL}/debts?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getDebts = async (debtId = null) => {
  const url = debtId 
    ? `${API_URL}/debts?id=${debtId}`
    : `${API_URL}/debts`;
  
  const response = await fetch(url);
  return response.json();
};

// Obtener todas las deudas
const allDebts = await getDebts();

// Obtener deuda específica
const debt = await getDebts('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "debts": [
    {
      "id": "uuid-here",
      "valor": 5000000,
      "divisa": "COP",
      "concepto": "Tarjeta de crédito",
      "adeudado": 3000000,
      "referencia": "TARJ-1234",
      "fecha_corte": "2024-02-15",
      "tasa_interes": 2.5,
      "interes_en_mora": 5.0,
      "pago_minimo": 150000,
      "tiene_seguro": true,
      "valor_seguro": 50000,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `fecha_corte` (descendente) y luego por `created_at` (descendente).

---

#### PUT /debts/{id}
Actualizar una deuda específica.

**URL:** `PUT ${API_URL}/debts/{id}`

**Ejemplo JavaScript:**
```javascript
const updateDebt = async (debtId, updates) => {
  const response = await fetch(`${API_URL}/debts/${debtId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el monto adeudado
await updateDebt('uuid-here', {
  adeudado: 2500000
});

// Uso - actualizar múltiples campos
await updateDebt('uuid-here', {
  adeudado: 2500000,
  pago_minimo: 200000,
  fecha_corte: "2024-03-15"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "valor": 5000000,
  "divisa": "COP",
  "concepto": "Tarjeta de crédito actualizada",
  "adeudado": 2500000,
  "referencia": "TARJ-1234",
  "fecha_corte": "2024-03-15",
  "tasa_interes": 3.0,
  "interes_en_mora": 6.0,
  "pago_minimo": 200000,
  "tiene_seguro": false,
  "valor_seguro": 0
}
```

---

#### DELETE /debts/{id}
Eliminar una deuda específica.

**URL:** `DELETE ${API_URL}/debts/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteDebt = async (debtId) => {
  const response = await fetch(`${API_URL}/debts/${debtId}`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /debts
Eliminar todas las deudas.

**URL:** `DELETE ${API_URL}/debts`

**Ejemplo JavaScript:**
```javascript
const deleteAllDebts = async () => {
  const response = await fetch(`${API_URL}/debts`, {
    method: 'DELETE',
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Authentication

#### POST /auth/register
Registrar un nuevo usuario.

**URL:** `POST ${API_URL}/auth/register`

**Ejemplo JavaScript:**
```javascript
const register = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// Uso - Nota: password_hash debe ser generado en el cliente usando bcrypt
import bcrypt from 'bcryptjs';

const password = 'mipassword123';
const passwordHash = await bcrypt.hash(password, 10);

const newUser = await register({
  username: "johndoe",
  password_hash: passwordHash,
  nombre_usuario: "John Doe",
  fecha_nacimiento: "1990-01-15"
});
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password_hash": "$2a$10$hashedpasswordhere...",
  "nombre_usuario": "John Doe",
  "fecha_nacimiento": "1990-01-15"
}
```

**Campos Requeridos:**
- `username` - Nombre de usuario único (case-insensitive)
- `password_hash` - Hash bcrypt del password (generado en el cliente)
- `nombre_usuario` - Nombre completo del usuario
- `fecha_nacimiento` - Fecha de nacimiento en formato YYYY-MM-DD

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "user_details": {
      "nombre_usuario": "John Doe",
      "fecha_nacimiento": "1990-01-15"
    },
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

**Nota:** El `password_hash` debe ser generado en el cliente usando bcrypt antes de enviarlo. El username se almacena en minúsculas para búsquedas case-insensitive.

---

#### POST /auth/login
Autenticar usuario y recibir token JWT.

**URL:** `POST ${API_URL}/auth/login`

**Ejemplo JavaScript:**
```javascript
const login = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password
    }),
  });
  return response.json();
};

// Uso
const loginResult = await login("johndoe", "mipassword123");

// Guardar el token para usar en requests posteriores
localStorage.setItem('authToken', loginResult.token);
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "plaintextpassword"
}
```

**Campos Requeridos:**
- `username` - Nombre de usuario
- `password` - Password en texto plano (se hashea y compara con el hash almacenado)

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2024-01-16T00:00:00.000Z",
  "expires_in": "1d",
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "user_details": {
      "nombre_usuario": "John Doe",
      "fecha_nacimiento": "1990-01-15"
    }
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid username or password"
}
```

**Nota:** 
- El token expira después de 1 día (24 horas)
- El token debe incluirse en requests posteriores como `Authorization: Bearer <token>`
- El password se hashea usando bcrypt y se compara con el hash almacenado

**Ejemplo de uso del token en requests:**
```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
```

---

## Códigos de Estado HTTP

- `200` - OK (operación exitosa)
- `201` - Created (recurso creado exitosamente)
- `400` - Bad Request (datos inválidos o faltantes)
- `404` - Not Found (recurso no encontrado)
- `409` - Conflict (duplicado, ej: account_id ya existe)
- `500` - Internal Server Error (error del servidor)

## Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
  "error": "Mensaje de error descriptivo",
  "details": {
    // Información adicional del error
  }
}
```

**Ejemplo de manejo de errores:**
```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const data = await apiFunction();
    return { success: true, data };
  } catch (error) {
    if (error.response) {
      // Error de la API
      const errorData = await error.response.json();
      return { 
        success: false, 
        error: errorData.error,
        details: errorData.details || {}
      };
    }
    // Error de red u otro error
    return { 
      success: false, 
      error: 'Error de conexión',
      details: { message: error.message }
    };
  }
};
```

## Notas Importantes

1. **Balance Automático**: Los balances de las cuentas bancarias se actualizan automáticamente cuando se crean/actualizan/eliminan transacciones (mediante triggers de base de datos).

2. **Total Gastado Automático**: El campo `total_spent` de los presupuestos se actualiza automáticamente cuando se crean/actualizan/eliminan transacciones de tipo "egreso" (mediante triggers de base de datos).

3. **Validación de Presupuestos**: Los egresos no pueden exceder el `max_amount` del presupuesto asociado. Si se intenta crear una transacción que exceda el límite, se recibirá un error 400.

4. **Soft Delete vs Hard Delete**: 
   - **Soft Delete** (`DELETE /budgets/{id}`): Marca el presupuesto como eliminado (`status = 'deleted'`) pero mantiene los datos. Las transacciones asociadas se mantienen. Se puede restaurar con `/restore`.
   - **Hard Delete** (`DELETE /budgets/{id}/hard`): Elimina físicamente el presupuesto y todas sus transacciones asociadas. **IRREVERSIBLE**. Los balances de las cuentas se actualizan automáticamente.

5. **Presupuestos Eliminados**: Por defecto, los endpoints GET solo muestran presupuestos activos. Usa `include_deleted=true` para incluir presupuestos eliminados.

6. **Transacciones con Presupuestos Eliminados**: No se pueden crear nuevas transacciones para presupuestos eliminados. Primero debes restaurar el presupuesto.

7. **Formato de Fechas**: Las fechas deben estar en formato `YYYY-MM-DD` (ej: "2024-01-15").

8. **Formato de Monedas**: Las monedas deben ser códigos de 3 letras en mayúsculas (ej: "USD", "EUR", "COP").

9. **UUIDs**: Todos los IDs son UUIDs (identificadores únicos universales).

10. **Deudas**: Las deudas permiten gestionar obligaciones financieras con información detallada sobre tasas de interés, pagos mínimos, seguros y fechas de corte. Los campos numéricos deben ser valores positivos y las fechas deben estar en formato `YYYY-MM-DD`.

11. **Autenticación**: 
    - **⚠️ REQUERIDA**: Todos los endpoints requieren autenticación JWT, excepto `/auth/register` y `/auth/login`.
    - **Registro**: El `password_hash` debe ser generado en el cliente usando bcrypt antes de enviarlo al servidor.
    - **Login**: El password se envía en texto plano y el servidor lo hashea para comparar con el hash almacenado.
    - **Tokens JWT**: Los tokens expiran después de 1 día. Deben incluirse en requests como `Authorization: Bearer <token>`.
    - **Manejo de Token**: Guarda el token después del login y úsalo en todos los requests protegidos.
    - **Errores 401**: Si recibes un 401, el token es inválido o expirado. Redirige al usuario al login.
    - **JWT_TOKEN_PASSPHRASE**: Debe configurarse en el archivo `.env` para firmar y verificar tokens.

## Ejemplo de Cliente API Completo

```javascript
// api.ts (TypeScript) o api.js (JavaScript)
// Por defecto usa la URL de producción (AWS)
// Para desarrollo local, configurar VITE_API_URL en el archivo .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://x1bom9m0bd.execute-api.us-east-1.amazonaws.com/dev';

class PocketsAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && !endpoint.startsWith('/auth/') && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw { response, data };
      }

      return data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      }
      throw { response: null, data: { error: 'Error de conexión', details: { message: error.message } } };
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    
    // Guardar token automáticamente después del login
    if (result.token) {
      localStorage.setItem('authToken', result.token);
      if (result.expires_at) {
        localStorage.setItem('tokenExpiresAt', result.expires_at);
      }
    }
    
    return result;
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiresAt');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Bank Accounts
  async createBankAccount(data) {
    return this.request('/bank-accounts', {
      method: 'POST',
      body: data,
    });
  }

  async getBankAccounts(accountId = null) {
    const endpoint = accountId ? `/bank-accounts?id=${accountId}` : '/bank-accounts';
    return this.request(endpoint);
  }

  async updateBankAccount(accountId, updates) {
    return this.request(`/bank-accounts/${accountId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteBankAccount(accountId) {
    return this.request(`/bank-accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // Budgets
  async createBudget(data) {
    return this.request('/budgets', {
      method: 'POST',
      body: data,
    });
  }

  async getBudgets(budgetId = null, includeDeleted = false) {
    const params = new URLSearchParams();
    if (budgetId) params.append('id', budgetId);
    if (includeDeleted) params.append('include_deleted', 'true');
    const endpoint = params.toString() 
      ? `/budgets?${params.toString()}`
      : '/budgets';
    return this.request(endpoint);
  }

  async updateBudget(budgetId, updates) {
    return this.request(`/budgets/${budgetId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteBudget(budgetId) {
    return this.request(`/budgets/${budgetId}`, {
      method: 'DELETE',
    });
  }

  async restoreBudget(budgetId) {
    return this.request(`/budgets/${budgetId}/restore`, {
      method: 'POST',
    });
  }

  async hardDeleteBudget(budgetId) {
    return this.request(`/budgets/${budgetId}/hard`, {
      method: 'DELETE',
    });
  }

  async hardDeleteAllBudgets() {
    return this.request('/budgets/hard', {
      method: 'DELETE',
    });
  }

  async resetBudget(budgetId) {
    return this.request(`/budgets/${budgetId}/reset`, {
      method: 'POST',
    });
  }

  // Transactions
  async createTransaction(data) {
    return this.request('/transactions', {
      method: 'POST',
      body: data,
    });
  }

  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters);
    const endpoint = params.toString() 
      ? `/transactions?${params.toString()}`
      : '/transactions';
    return this.request(endpoint);
  }

  // Exchange Rates
  async syncExchangeRates() {
    return this.request('/exchange-rates/sync', {
      method: 'GET',
    });
  }

  async getExchangeRates(filters = {}) {
    const params = new URLSearchParams(filters);
    const endpoint = params.toString() 
      ? `/exchange-rates?${params.toString()}`
      : '/exchange-rates';
    return this.request(endpoint);
  }

  // Debts
  async createDebt(data) {
    return this.request('/debts', {
      method: 'POST',
      body: data,
    });
  }

  async getDebts(debtId = null) {
    const endpoint = debtId ? `/debts?id=${debtId}` : '/debts';
    return this.request(endpoint);
  }

  async updateDebt(debtId, updates) {
    return this.request(`/debts/${debtId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteDebt(debtId) {
    return this.request(`/debts/${debtId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllDebts() {
    return this.request('/debts', {
      method: 'DELETE',
    });
  }

  // Authentication
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(username, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: {
        username,
        password,
      },
    });
    
    // Guardar token automáticamente después del login
    if (result.token) {
      this.setToken(result.token);
    }
    
    return result;
  }

  logout() {
    this.setToken(null);
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

// Exportar instancia
export const api = new PocketsAPI(API_BASE_URL);
```

**Uso del cliente:**
```javascript
import { api } from './api';

// 1. Primero, hacer login para obtener el token
const loginResult = await api.login("johndoe", "mipassword123");
// El token se guarda automáticamente en localStorage y se usa en todos los requests

// 2. Ahora puedes usar todos los endpoints protegidos
// El token se incluye automáticamente en cada request

// Crear cuenta bancaria
const account = await api.createBankAccount({
  account_name: "Mi Cuenta",
  bank: "Banco Nacional",
  currency: "USD",
  account_id: "US123456789",
  balance: 1000
});

// Obtener todas las cuentas
const accounts = await api.getBankAccounts();

// Crear presupuesto
const budget = await api.createBudget({
  name: "Compras Mensuales",
  max_amount: 500000
});

// Crear transacción
const transaction = await api.createTransaction({
  type: "egreso",
  amount: 50000,
  budget_id: budget.budget.id,
  currency: "COP",
  bank_account_id: account.account.id
});

// Crear deuda
const debt = await api.createDebt({
  valor: 5000000,
  divisa: "COP",
  concepto: "Tarjeta de crédito",
  adeudado: 3000000,
  referencia: "TARJ-1234",
  fecha_corte: "2024-02-15",
  tasa_interes: 2.5,
  interes_en_mora: 5.0,
  pago_minimo: 150000,
  tiene_seguro: true,
  valor_seguro: 50000
});

// Obtener todas las deudas
const allDebts = await api.getDebts();

// Obtener deuda específica
const specificDebt = await api.getDebts(debt.debt.id);

// Actualizar deuda
await api.updateDebt(debt.debt.id, {
  adeudado: 2500000,
  pago_minimo: 200000,
  fecha_corte: "2024-03-15"
});

// Eliminar deuda específica
await api.deleteDebt(debt.debt.id);

// Eliminar todas las deudas
await api.deleteAllDebts();

// Registro de usuario (password_hash debe generarse en el cliente)
import bcrypt from 'bcryptjs';
const passwordHash = await bcrypt.hash('mipassword123', 10);
const newUser = await api.register({
  username: "johndoe",
  password_hash: passwordHash,
  nombre_usuario: "John Doe",
  fecha_nacimiento: "1990-01-15"
});

// Login (el token se guarda automáticamente)
const loginResult = await api.login("johndoe", "mipassword123");
// loginResult.token ya está guardado y se usará automáticamente

// Verificar si el usuario está autenticado
if (api.isAuthenticated()) {
  console.log('Usuario autenticado');
}

// Logout (elimina el token)
api.logout();

// Manejo de errores de autenticación
try {
  const accounts = await api.getBankAccounts();
} catch (error) {
  if (error.data?.requiresLogin) {
    // Redirigir al login
    window.location.href = '/login';
  }
}
```


