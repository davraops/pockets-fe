# Pockets API - Frontend Reference

Guía completa de endpoints para integración frontend.

## Configuración Base

### URLs Base

```javascript
// Producción (AWS)
const API_BASE_URL = 'https://x1bom9m0bd.execute-api.us-east-1.amazonaws.com/dev';

// Desarrollo Local
const API_BASE_URL_LOCAL = 'http://localhost:3000';

// Usar según el entorno
const API_URL = process.env.NODE_ENV === 'production' 
  ? API_BASE_URL 
  : API_BASE_URL_LOCAL;
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

> **🔒 Aislamiento de Datos por Usuario:** Todos los endpoints filtran automáticamente los datos por el usuario autenticado. Esto significa que:
> - Cada usuario solo verá y gestionará sus propios datos (cuentas bancarias, presupuestos, transacciones, deudas)
> - Los nuevos registros se asignan automáticamente al usuario autenticado
> - No es necesario pasar `user_id` en los requests; el sistema lo obtiene del token JWT
> - Los exchange rates son globales y compartidos entre todos los usuarios

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

// Transacción de egreso con budget_id (opcional)
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

// Transacción de egreso sin budget_id (también válido)
await createTransaction({
  date: "2024-01-15",
  type: "egreso",
  amount: 50000,
  description: "Compra de supermercado",
  category: "Compras",
  currency: "COP",
  bank_account_id: "uuid-of-bank-account"
});

// Transacción de ingreso con deudor (pago de deuda)
await createTransaction({
  date: "2024-01-15",
  type: "ingreso",
  amount: 10000,
  description: "Pago parcial de Juan Pérez",
  category: "Préstamo",
  currency: "COP",
  bank_account_id: "uuid-of-bank-account",
  debtor_id: "uuid-of-debtor"
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

**Request Body (Ingreso con deudor - pago de deuda):**
```json
{
  "date": "2024-01-15",
  "type": "ingreso",
  "amount": 10000,
  "description": "Pago parcial de Juan Pérez",
  "category": "Préstamo",
  "currency": "COP",
  "bank_account_id": "uuid-of-bank-account",
  "debtor_id": "uuid-of-debtor"
}
```

**Request Body (Egreso con presupuesto):**
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

**Request Body (Egreso sin presupuesto):**
```json
{
  "date": "2024-01-15",
  "type": "egreso",
  "amount": 50000,
  "description": "Compra de supermercado",
  "category": "Compras",
  "currency": "COP",
  "bank_account_id": "uuid-of-bank-account"
}
```

**Request Body (Egreso con tarjeta de crédito):**
```json
{
  "date": "2024-01-15",
  "type": "egreso",
  "amount": 50000,
  "description": "Compra con tarjeta de crédito",
  "category": "Compras",
  "currency": "COP",
  "bank_account_id": null,
  "credit_card_id": "uuid-of-credit-card"
}
```

**Request Body (Egreso como pago de deuda):**
```json
{
  "date": "2024-01-15",
  "type": "egreso",
  "amount": 50000,
  "description": "Pago de deuda",
  "category": "Pago de Deuda",
  "currency": "COP",
  "bank_account_id": "uuid-of-bank-account",
  "debt_id": "uuid-of-debt"
}
```

**⚠️ Validación importante:**
- Los egresos y ahorros pueden tener `budget_id` (opcional) - si se proporciona, se valida que el presupuesto exista y pertenezca al usuario
- Los ingresos **no pueden** tener `budget_id` (debe ser null o no enviarse)
- Si un egreso o ahorro tiene `budget_id`, no puede exceder el `max_amount` del presupuesto asociado
- Si un egreso o ahorro no tiene `budget_id`, se crea sin asociación a presupuesto
- **Para transacciones de tipo "egreso"**: Puedes usar `bank_account_id` O `credit_card_id` (pero no ambos)
  - Si usas `credit_card_id`, `bank_account_id` debe ser `null` (el dinero se carga a la tarjeta de crédito)
  - Si usas `bank_account_id`, `credit_card_id` debe ser `null` o no enviarse
  - Puedes usar `debt_id` (opcional) para asociar la transacción con un pago de deuda de tarjeta de crédito
  - `debt_id` solo se permite para transacciones tipo "egreso"
- **Para transacciones de tipo "ingreso"**: 
  - Solo se permite `bank_account_id` (no se puede usar `credit_card_id` ni `debt_id`)
  - Puedes usar `debtor_id` (opcional) para asociar el ingreso con un pago de deudor
  - `debtor_id` solo se permite para transacciones tipo "ingreso"
- **Para transacciones de tipo "ahorro"**: Solo se permite `bank_account_id` (no se puede usar `credit_card_id`, `debt_id` ni `debtor_id`)

**⚠️ Actualización Manual Requerida:**
- Después de crear/actualizar/eliminar una transacción, el frontend DEBE actualizar manualmente:
  - El `balance` de la cuenta bancaria si la transacción tiene `bank_account_id` (`PUT /bank-accounts/{id}`)
  - El `used_credit` de la tarjeta de crédito si la transacción tiene `credit_card_id` (`PUT /credit-cards/{id}`)
  - El `total_spent` del presupuesto si la transacción tiene `budget_id` (`PUT /budgets/{id}`)

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
- `type` - Filtrar por tipo ("ingreso", "egreso" o "ahorro")
- `category` - Filtrar por categoría
- `start_date` - Fecha inicio (YYYY-MM-DD)
- `end_date` - Fecha fin (YYYY-MM-DD)

**Response (200):**
```json
{
  "count": 4,
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
      "credit_card_id": null,
      "debt_id": null,
      "debtor_id": null,
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
      "credit_card_id": null,
      "debt_id": null,
      "debtor_id": null,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "uuid-here-3",
      "date": "2024-01-15",
      "type": "egreso",
      "amount": 50000,
      "description": "Compra con tarjeta de crédito",
      "budget_id": null,
      "category": "Compras",
      "currency": "COP",
      "bank_account_id": null,
      "credit_card_id": "uuid-of-credit-card",
      "debt_id": null,
      "debtor_id": null,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "uuid-here-4",
      "date": "2024-01-15",
      "type": "egreso",
      "amount": 50000,
      "description": "Pago de deuda",
      "budget_id": null,
      "category": "Pago de Deuda",
      "currency": "COP",
      "bank_account_id": "uuid-of-bank-account",
      "credit_card_id": null,
      "debt_id": "uuid-of-debt",
      "debtor_id": null,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "uuid-here-5",
      "date": "2024-01-15",
      "type": "ingreso",
      "amount": 10000,
      "description": "Pago parcial de Juan Pérez",
      "budget_id": null,
      "category": "Préstamo",
      "currency": "COP",
      "bank_account_id": "uuid-of-bank-account",
      "credit_card_id": null,
      "debt_id": null,
      "debtor_id": "uuid-of-debtor",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

#### DELETE /transactions/{id}
Eliminar una transacción específica.

**⚠️ IMPORTANTE**: Después de eliminar una transacción, el frontend DEBE revertir manualmente:
- El `balance` de la cuenta bancaria:
  - Si era **ingreso**: Resta el monto (`balance = balance - amount`)
  - Si era **egreso/ahorro**: Suma el monto (`balance = balance + amount`)
- El `total_spent` del presupuesto (si tenía `budget_id`):
  - Resta el monto (`total_spent = total_spent - amount`)

**URL:** `DELETE ${API_URL}/transactions/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteTransaction = async (transactionId) => {
  // Primero obtener la transacción para saber qué revertir
  const transaction = await getTransactions({ id: transactionId });
  
  if (!transaction.transactions || transaction.transactions.length === 0) {
    throw new Error('Transaction not found');
  }
  
  const tx = transaction.transactions[0];
  
  // Eliminar la transacción
  const response = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (response.ok) {
    // Revertir balance de cuenta bancaria
    const bankAccount = await getBankAccount(tx.bank_account_id);
    let newBalance = parseFloat(bankAccount.accounts[0].balance.original.amount);
    
    if (tx.type === 'ingreso') {
      newBalance -= parseFloat(tx.amount);
    } else if (tx.type === 'egreso' || tx.type === 'ahorro') {
      newBalance += parseFloat(tx.amount);
    }
    
    await updateBankAccount(tx.bank_account_id, {
      balance: newBalance
    });
    
    // Revertir total_spent del presupuesto si tenía budget_id
    if (tx.budget_id) {
      const budget = await getBudget(tx.budget_id);
      const newTotalSpent = parseFloat(budget.budgets[0].total_spent) - parseFloat(tx.amount);
      
      await updateBudget(tx.budget_id, {
        total_spent: Math.max(0, newTotalSpent) // No permitir valores negativos
      });
    }
  }
  
  return result;
};
```

**Response (200):**
```json
{
  "message": "Transaction deleted successfully",
  "deleted_transaction": {
    "id": "uuid-here",
    "type": "egreso",
    "amount": 50000,
    "bank_account_id": "uuid-of-bank-account",
    "budget_id": "uuid-of-budget"
  }
}
```

---

#### DELETE /transactions/all
Eliminar todas las transacciones del usuario autenticado.

**⚠️ IMPORTANTE**: Después de eliminar todas las transacciones, el frontend DEBE revertir manualmente:
- Los `balance` de todas las cuentas bancarias afectadas
- Los `total_spent` de todos los presupuestos afectados

**URL:** `DELETE ${API_URL}/transactions/all`

**Nota:** La ruta es `/transactions/all` (no `/transactions`). Esto evita conflictos con la ruta `/transactions/{id}`.

**Ejemplo JavaScript:**
```javascript
const deleteAllTransactions = async () => {
  // Primero obtener todas las transacciones para saber qué revertir
  const allTransactions = await getTransactions();
  
  // Eliminar todas las transacciones
  const response = await fetch(`${API_URL}/transactions/all`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (response.ok) {
    // Agrupar por cuenta bancaria y presupuesto
    const balanceChanges = {};
    const budgetChanges = {};
    
    allTransactions.transactions.forEach(tx => {
      // Calcular cambios de balance
      if (!balanceChanges[tx.bank_account_id]) {
        balanceChanges[tx.bank_account_id] = 0;
      }
      
      if (tx.type === 'ingreso') {
        balanceChanges[tx.bank_account_id] -= parseFloat(tx.amount);
      } else if (tx.type === 'egreso' || tx.type === 'ahorro') {
        balanceChanges[tx.bank_account_id] += parseFloat(tx.amount);
      }
      
      // Calcular cambios de presupuesto
      if (tx.budget_id) {
        if (!budgetChanges[tx.budget_id]) {
          budgetChanges[tx.budget_id] = 0;
        }
        budgetChanges[tx.budget_id] -= parseFloat(tx.amount);
      }
    });
    
    // Aplicar cambios de balance
    for (const [accountId, change] of Object.entries(balanceChanges)) {
      const account = await getBankAccount(accountId);
      const currentBalance = parseFloat(account.accounts[0].balance.original.amount);
      await updateBankAccount(accountId, {
        balance: currentBalance + change
      });
    }
    
    // Aplicar cambios de presupuesto
    for (const [budgetId, change] of Object.entries(budgetChanges)) {
      const budget = await getBudget(budgetId);
      const currentTotalSpent = parseFloat(budget.budgets[0].total_spent);
      await updateBudget(budgetId, {
        total_spent: Math.max(0, currentTotalSpent + change)
      });
    }
  }
  
  return result;
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 5 transaction(s)",
  "deleted_count": 5,
  "deleted_transactions": [
    {
      "id": "uuid-here-1",
      "type": "ingreso",
      "amount": 1000000,
      "bank_account_id": "uuid-of-bank-account-1",
      "budget_id": null
    },
    {
      "id": "uuid-here-2",
      "type": "egreso",
      "amount": 50000,
      "bank_account_id": "uuid-of-bank-account-1",
      "budget_id": "uuid-of-budget-1"
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
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(debtData),
  });
  return response.json();
};

// Uso
const newDebt = await createDebt({
  value: 5000000,
  currency: "COP",
  concept: "Tarjeta de crédito",
  owed: 3000000,
  reference: "TARJ-1234",
  cut_date: "2024-02-15",
  interest_rate: 2.5,
  overdue_interest: 5.0,
  minimum_payment: 150000,
  has_insurance: true,
  insurance_value: 50000
});
```

**Request Body:**
```json
{
  "value": 5000000,
  "currency": "COP",
  "concept": "Tarjeta de crédito",
  "owed": 3000000,
  "reference": "TARJ-1234",
  "cut_date": "2024-02-15",
  "interest_rate": 2.5,
  "overdue_interest": 5.0,
  "minimum_payment": 150000,
  "has_insurance": true,
  "insurance_value": 50000
}
```

**Campos Requeridos:**
- `value` - Valor total de la deuda (número positivo)
- `currency` - Código de moneda (3 letras mayúsculas, ej: USD, EUR, COP)
- `concept` - Descripción/concepto de la deuda
- `owed` - Monto actualmente adeudado (número positivo)
- `cut_date` - Fecha de corte en formato YYYY-MM-DD

**Campos Opcionales:**
- `reference` - Número de referencia o identificador
- `interest_rate` - Porcentaje de tasa de interés (default: 0.00)
- `overdue_interest` - Porcentaje de interés en mora (default: 0.00)
- `minimum_payment` - Monto de pago mínimo (default: 0.00)
- `has_insurance` - Si la deuda tiene seguro (default: false)
- `insurance_value` - Valor del seguro (default: 0.00)

**Response (201):**
```json
{
  "message": "Debt created successfully",
  "debt": {
    "id": "uuid-here",
    "value": 5000000,
    "currency": "COP",
    "concept": "Tarjeta de crédito",
    "owed": 3000000,
    "reference": "TARJ-1234",
    "cut_date": "2024-02-15",
    "interest_rate": 2.5,
    "overdue_interest": 5.0,
    "minimum_payment": 150000,
    "has_insurance": true,
    "insurance_value": 50000,
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
  const token = localStorage.getItem('authToken');
  const url = debtId 
    ? `${API_URL}/debts?id=${debtId}`
    : `${API_URL}/debts`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
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
      "value": 5000000,
      "currency": "COP",
      "concept": "Tarjeta de crédito",
      "owed": 3000000,
      "reference": "TARJ-1234",
      "cut_date": "2024-02-15",
      "interest_rate": 2.5,
      "overdue_interest": 5.0,
      "minimum_payment": 150000,
      "has_insurance": true,
      "insurance_value": 50000,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `cut_date` (descendente) y luego por `created_at` (descendente).

---

#### PUT /debts/{id}
Actualizar una deuda específica.

**URL:** `PUT ${API_URL}/debts/{id}`

**Ejemplo JavaScript:**
```javascript
const updateDebt = async (debtId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debts/${debtId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el monto adeudado
await updateDebt('uuid-here', {
  owed: 2500000
});

// Uso - actualizar múltiples campos
await updateDebt('uuid-here', {
  owed: 2500000,
  minimum_payment: 200000,
  cut_date: "2024-03-15"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "value": 5000000,
  "currency": "COP",
  "concept": "Tarjeta de crédito actualizada",
  "owed": 2500000,
  "reference": "TARJ-1234",
  "cut_date": "2024-03-15",
  "interest_rate": 3.0,
  "overdue_interest": 6.0,
  "minimum_payment": 200000,
  "has_insurance": false,
  "insurance_value": 0
}
```

---

#### DELETE /debts/{id}
Eliminar una deuda específica.

**URL:** `DELETE ${API_URL}/debts/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteDebt = async (debtId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debts/${debtId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
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
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debts`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Debtors (Deudores - Personas que te deben dinero)

#### POST /debtors
Crear un nuevo deudor (persona que te debe dinero).

**URL:** `POST ${API_URL}/debtors`

**Ejemplo JavaScript:**
```javascript
const createDebtor = async (debtorData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debtors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(debtorData),
  });
  return response.json();
};

// Uso
const newDebtor = await createDebtor({
  debtor_name: "Juan Pérez",
  concept: "Préstamo personal",
  value: 50000,
  total_paid: 10000
});
```

**Request Body:**
```json
{
  "debtor_name": "Juan Pérez",
  "concept": "Préstamo personal",
  "value": 50000,
  "total_paid": 10000
}
```

**Campos Requeridos:**
- `debtor_name` - Nombre del deudor (string, no vacío)
- `concept` - Concepto o descripción de la deuda (string, no vacío)
- `value` - Valor total de la deuda (número positivo)

**Campos Opcionales:**
- `total_paid` - Total pagado hasta el momento (número, default: 0, no puede exceder `value`)

**Response (201):**
```json
{
  "message": "Debtor created successfully",
  "debtor": {
    "id": "uuid-here",
    "debtor_name": "Juan Pérez",
    "concept": "Préstamo personal",
    "value": 50000,
    "total_paid": 10000,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

**Nota:** El campo `total_paid` no puede exceder el `value` de la deuda. Si intentas crear un deudor con `total_paid > value`, recibirás un error 400.

---

#### GET /debtors
Obtener deudores (personas que te deben dinero).

**URL:** `GET ${API_URL}/debtors?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getDebtors = async (debtorId = null) => {
  const token = localStorage.getItem('authToken');
  const url = debtorId 
    ? `${API_URL}/debtors?id=${debtorId}`
    : `${API_URL}/debtors`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los deudores
const allDebtors = await getDebtors();

// Obtener deudor específico
const debtor = await getDebtors('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "debtors": [
    {
      "id": "uuid-here",
      "debtor_name": "Juan Pérez",
      "concept": "Préstamo personal",
      "value": 50000,
      "total_paid": 10000,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    },
    {
      "id": "uuid-here-2",
      "debtor_name": "María García",
      "concept": "Dinero prestado para emergencia",
      "value": 100000,
      "total_paid": 0,
      "created_at": "2024-01-10T00:00:00.000Z",
      "updated_at": "2024-01-10T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `created_at` (descendente).

---

#### PUT /debtors/{id}
Actualizar un deudor específico.

**URL:** `PUT ${API_URL}/debtors/{id}`

**Ejemplo JavaScript:**
```javascript
const updateDebtor = async (debtorId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debtors/${debtorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el total pagado
await updateDebtor('uuid-here', {
  total_paid: 25000
});

// Uso - actualizar múltiples campos
await updateDebtor('uuid-here', {
  debtor_name: "Juan Pérez Actualizado",
  concept: "Préstamo personal - actualizado",
  value: 60000,
  total_paid: 30000
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "debtor_name": "Juan Pérez Actualizado",
  "concept": "Préstamo personal - actualizado",
  "value": 60000,
  "total_paid": 30000
}
```

**Nota:** Si actualizas `total_paid`, no puede exceder el `value` (ya sea el valor actual o el nuevo valor si también lo actualizas).

---

#### DELETE /debtors/{id}
Eliminar un deudor específico.

**URL:** `DELETE ${API_URL}/debtors/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteDebtor = async (debtorId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debtors/${debtorId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Debtor deleted successfully",
  "deleted_debtor": {
    "id": "uuid-here",
    "debtor_name": "Juan Pérez",
    "concept": "Préstamo personal",
    "value": 50000
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /debtors
Eliminar todos los deudores.

**URL:** `DELETE ${API_URL}/debtors`

**Ejemplo JavaScript:**
```javascript
const deleteAllDebtors = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/debtors`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 3 debtor(s)",
  "deleted_count": 3,
  "deleted_debtors": [
    {
      "id": "uuid-here",
      "debtor_name": "Juan Pérez",
      "concept": "Préstamo personal",
      "value": 50000
    }
  ]
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Cards (Tarjetas de Débito)

#### POST /cards
Crear una nueva tarjeta de débito.

**URL:** `POST ${API_URL}/cards`

**Request Body:**
```json
{
  "card_name": "Tarjeta Débito Principal",
  "bank_account_id": "uuid-de-cuenta-bancaria",
  "last_4_digits": "1234",
  "expiration_date": "2025-12-31",
  "is_virtual": false
}
```

**Ejemplo JavaScript:**
```javascript
const createCard = async (cardData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(cardData),
  });
  return response.json();
};

// Uso
const newCard = await createCard({
  card_name: "Tarjeta Débito Principal",
  bank_account_id: "uuid-de-cuenta-bancaria",
  last_4_digits: "1234",
  expiration_date: "2025-12-31",
  is_virtual: false
});
```

**Campos Requeridos:**
- `card_name` - Nombre de la tarjeta (string, no vacío)
- `bank_account_id` - ID de la cuenta bancaria asociada (UUID, debe pertenecer al usuario)
- `last_4_digits` - Últimos 4 dígitos de la tarjeta (string, exactamente 4 dígitos)
- `expiration_date` - Fecha de vencimiento en formato YYYY-MM-DD (no puede ser en el pasado)

**Campos Opcionales:**
- `is_virtual` - Indica si la tarjeta es virtual o física (boolean, default: false)

**Response (201):**
```json
{
  "message": "Card created successfully",
  "card": {
    "id": "uuid-here",
    "card_name": "Tarjeta Débito Principal",
    "bank_account_id": "uuid-de-cuenta-bancaria",
    "bank_account": {
      "id": "uuid-de-cuenta-bancaria",
      "account_name": "Cuenta Principal",
      "bank": "Banco Nacional"
    },
    "last_4_digits": "1234",
    "expiration_date": "2025-12-31",
    "is_virtual": false,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /cards
Obtener tarjetas de débito.

**URL:** `GET ${API_URL}/cards?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getCards = async (cardId = null) => {
  const token = localStorage.getItem('authToken');
  const url = cardId 
    ? `${API_URL}/cards?id=${cardId}`
    : `${API_URL}/cards`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las tarjetas
const allCards = await getCards();

// Obtener tarjeta específica
const card = await getCards('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "cards": [
    {
      "id": "uuid-here",
      "card_name": "Tarjeta Débito Principal",
      "bank_account_id": "uuid-de-cuenta-bancaria",
      "bank_account": {
        "id": "uuid-de-cuenta-bancaria",
        "account_name": "Cuenta Principal",
        "bank": "Banco Nacional",
        "currency": "COP"
      },
      "last_4_digits": "1234",
      "expiration_date": "2025-12-31",
      "is_virtual": false,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `expiration_date` (ascendente) y luego por `created_at` (descendente).

---

#### PUT /cards/{id}
Actualizar una tarjeta específica.

**URL:** `PUT ${API_URL}/cards/{id}`

**Ejemplo JavaScript:**
```javascript
const updateCard = async (cardId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cards/${cardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo la fecha de vencimiento
await updateCard('uuid-here', {
  expiration_date: "2026-12-31"
});

// Uso - actualizar múltiples campos
await updateCard('uuid-here', {
  card_name: "Tarjeta Débito Actualizada",
  bank_account_id: "nueva-cuenta-uuid",
  last_4_digits: "5678",
  is_virtual: true
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "card_name": "Tarjeta Débito Actualizada",
  "bank_account_id": "nueva-cuenta-uuid",
  "last_4_digits": "5678",
  "expiration_date": "2026-12-31",
  "is_virtual": true
}
```

**Nota:** Si actualizas `bank_account_id`, la nueva cuenta bancaria debe pertenecer al usuario autenticado.

---

#### DELETE /cards/{id}
Eliminar una tarjeta específica.

**URL:** `DELETE ${API_URL}/cards/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteCard = async (cardId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cards/${cardId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /cards
Eliminar todas las tarjetas.

**URL:** `DELETE ${API_URL}/cards`

**Ejemplo JavaScript:**
```javascript
const deleteAllCards = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cards`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Projects (Proyectos de Ahorro)

#### POST /projects
Crear un nuevo proyecto de ahorro.

**URL:** `POST ${API_URL}/projects`

**Request Body:**
```json
{
  "name": "Viaje a Europa",
  "target_amount": 5000000,
  "duration_months": 6,
  "end_date": "2024-12-31",
  "start_date": "2024-06-01",
  "current_amount": 0,
  "status": "active",
  "budget_id": "uuid-del-presupuesto"
}
```

**Ejemplo JavaScript:**
```javascript
const createProject = async (projectData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(projectData),
  });
  return response.json();
};

// Uso
const newProject = await createProject({
  name: "Viaje a Europa",
  target_amount: 5000000,
  duration_months: 6,
  end_date: "2024-12-31"
});
```

**Campos Requeridos:**
- `name` - Nombre del proyecto (string, no vacío)
- `target_amount` - Monto objetivo del ahorro (number, positivo)
- `duration_months` - Duración en meses (integer, entre 1 y 9)
- `end_date` - Fecha de finalización en formato YYYY-MM-DD

**Campos Opcionales:**
- `start_date` - Fecha de inicio en formato YYYY-MM-DD (default: fecha actual)
- `current_amount` - Monto actual ahorrado (number, default: 0, no puede exceder target_amount)
- `status` - Estado del proyecto: 'active', 'completed', 'cancelled' (default: 'active')
- `budget_id` - ID del presupuesto asociado (UUID, debe pertenecer al usuario)

**Response (201):**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid-here",
    "name": "Viaje a Europa",
    "target_amount": 5000000,
    "current_amount": 0,
    "remaining": 5000000,
    "progress_percentage": 0,
    "start_date": "2024-06-01",
    "end_date": "2024-12-31",
    "duration_months": 6,
    "status": "active",
    "budget_id": "uuid-del-presupuesto",
    "created_at": "2024-06-01T00:00:00.000Z",
    "updated_at": "2024-06-01T00:00:00.000Z"
  }
}
```

---

#### GET /projects
Obtener proyectos de ahorro.

**URL:** `GET ${API_URL}/projects?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getProjects = async (projectId = null) => {
  const token = localStorage.getItem('authToken');
  const url = projectId 
    ? `${API_URL}/projects?id=${projectId}`
    : `${API_URL}/projects`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los proyectos
const allProjects = await getProjects();

// Obtener proyecto específico
const project = await getProjects('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "projects": [
    {
      "id": "uuid-here",
      "name": "Viaje a Europa",
      "target_amount": 5000000,
      "current_amount": 1500000,
      "remaining": 3500000,
      "progress_percentage": 30,
      "start_date": "2024-06-01",
      "end_date": "2024-12-31",
      "duration_months": 6,
      "status": "active",
      "budget_id": "uuid-del-presupuesto",
      "budget": {
        "id": "uuid-del-presupuesto",
        "name": "Viaje a Europa",
        "max_amount": 5000000,
        "total_spent": 1500000
      },
      "created_at": "2024-06-01T00:00:00.000Z",
      "updated_at": "2024-06-01T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `end_date` (ascendente) y luego por `created_at` (descendente).

---

#### PUT /projects/{id}
Actualizar un proyecto específico.

**URL:** `PUT ${API_URL}/projects/{id}`

**Ejemplo JavaScript:**
```javascript
const updateProject = async (projectId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar monto actual
await updateProject('uuid-here', {
  current_amount: 2000000
});

// Uso - marcar como completado
await updateProject('uuid-here', {
  status: "completed"
});

// Uso - actualizar múltiples campos
await updateProject('uuid-here', {
  name: "Viaje a Europa Actualizado",
  current_amount: 2500000,
  budget_id: "nuevo-presupuesto-uuid"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "name": "Viaje a Europa Actualizado",
  "target_amount": 6000000,
  "current_amount": 2000000,
  "start_date": "2024-07-01",
  "end_date": "2025-01-31",
  "duration_months": 7,
  "status": "active",
  "budget_id": "nuevo-presupuesto-uuid"
}
```

**Nota:** Si actualizas `budget_id`, el nuevo presupuesto debe pertenecer al usuario autenticado. Puedes establecer `budget_id` a `null` para desvincular el presupuesto.

---

#### DELETE /projects/{id}
Eliminar un proyecto específico.

**URL:** `DELETE ${API_URL}/projects/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteProject = async (projectId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Project deleted successfully",
  "deleted_project": {
    "id": "uuid-here",
    "name": "Viaje a Europa",
    "target_amount": 5000000,
    "current_amount": 1500000
  },
  "note": "Budget association was removed. Budget was not deleted."
}
```

**⚠️ Advertencia:** Esta operación es irreversible. El presupuesto asociado NO se elimina automáticamente.

---

#### DELETE /projects
Eliminar todos los proyectos.

**URL:** `DELETE ${API_URL}/projects`

**Ejemplo JavaScript:**
```javascript
const deleteAllProjects = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/projects`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Credit Cards (Tarjetas de Crédito)

#### POST /credit-cards
Crear una nueva tarjeta de crédito.

**URL:** `POST ${API_URL}/credit-cards`

**Request Body:**
```json
{
  "name": "Visa Gold",
  "bank": "Banco Nacional",
  "credit_limit": 5000000,
  "monthly_rate": 2.5,
  "management_fee": 25000,
  "cut_date": "2024-02-15",
  "used_credit": 1500000,
  "benefits": ["Millas", "Cashback 2%", "Seguro de viaje"]
}
```

**Ejemplo JavaScript:**
```javascript
const createCreditCard = async (creditCardData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/credit-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(creditCardData),
  });
  return response.json();
};

// Uso
const newCreditCard = await createCreditCard({
  name: "Visa Gold",
  bank: "Banco Nacional",
  credit_limit: 5000000,
  monthly_rate: 2.5,
  management_fee: 25000,
  cut_date: "2024-02-15",
  used_credit: 1500000,
  benefits: ["Millas", "Cashback 2%", "Seguro de viaje"]
});
```

**Campos Requeridos:**
- `name` - Nombre de la tarjeta de crédito (string, no vacío)
- `bank` - Banco emisor (string, no vacío)
- `credit_limit` - Cupo de crédito (número positivo)
- `monthly_rate` - Tasa mensual de interés (número positivo)

**Campos Opcionales:**
- `management_fee` - Cuota de manejo (número positivo, default: 0.00)
- `cut_date` - Fecha de corte en formato YYYY-MM-DD (opcional)
- `used_credit` - Monto del cupo utilizado (número positivo, default: 0.00, no puede exceder `credit_limit`)
- `benefits` - Lista de beneficios (array de strings, default: [])

**Response (201):**
```json
{
  "message": "Credit card created successfully",
  "credit_card": {
    "id": "uuid-here",
    "name": "Visa Gold",
    "bank": "Banco Nacional",
    "credit_limit": 5000000,
    "monthly_rate": 2.5,
    "management_fee": 25000,
    "cut_date": "2024-02-15",
    "used_credit": 1500000,
    "available_credit": 3500000,
    "benefits": ["Millas", "Cashback 2%", "Seguro de viaje"],
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /credit-cards
Obtener tarjetas de crédito.

**URL:** `GET ${API_URL}/credit-cards?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getCreditCards = async (creditCardId = null) => {
  const token = localStorage.getItem('authToken');
  const url = creditCardId 
    ? `${API_URL}/credit-cards?id=${creditCardId}`
    : `${API_URL}/credit-cards`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las tarjetas de crédito
const allCreditCards = await getCreditCards();

// Obtener tarjeta específica
const creditCard = await getCreditCards('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "credit_cards": [
    {
      "id": "uuid-here",
      "name": "Visa Gold",
      "bank": "Banco Nacional",
      "credit_limit": 5000000,
      "monthly_rate": 2.5,
      "management_fee": 25000,
      "cut_date": "2024-02-15",
      "used_credit": 1500000,
      "available_credit": 3500000,
      "benefits": ["Millas", "Cashback 2%", "Seguro de viaje"],
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `created_at` (descendente).

---

#### PUT /credit-cards/{id}
Actualizar una tarjeta de crédito específica.

**URL:** `PUT ${API_URL}/credit-cards/{id}`

**Ejemplo JavaScript:**
```javascript
const updateCreditCard = async (creditCardId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/credit-cards/${creditCardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el cupo de crédito
await updateCreditCard('uuid-here', {
  credit_limit: 6000000
});

// Uso - actualizar múltiples campos
await updateCreditCard('uuid-here', {
  name: "Visa Platinum",
  credit_limit: 6000000,
  monthly_rate: 2.0,
  management_fee: 30000,
  cut_date: "2024-03-15",
  used_credit: 2000000,
  benefits: ["Millas", "Cashback 3%", "Seguro de viaje", "Lounge acceso"]
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "name": "Visa Platinum",
  "bank": "Banco Nacional",
  "credit_limit": 6000000,
  "monthly_rate": 2.0,
  "management_fee": 30000,
  "cut_date": "2024-03-15",
  "used_credit": 2000000,
  "benefits": ["Millas", "Cashback 3%", "Seguro de viaje", "Lounge acceso"]
}
```

**Response (200):**
```json
{
  "message": "Credit card updated successfully",
  "credit_card": {
    "id": "uuid-here",
    "name": "Visa Platinum",
    "bank": "Banco Nacional",
    "credit_limit": 6000000,
    "monthly_rate": 2.0,
    "management_fee": 30000,
    "cut_date": "2024-03-15",
    "used_credit": 2000000,
    "available_credit": 4000000,
    "benefits": ["Millas", "Cashback 3%", "Seguro de viaje", "Lounge acceso"],
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

**Notas:**
- El campo `benefits` debe ser un array de strings. Todos los elementos del array deben ser strings.
- El campo `used_credit` no puede exceder `credit_limit`. Si se actualiza `credit_limit` y `used_credit` al mismo tiempo, se valida contra el nuevo `credit_limit`.
- El campo `available_credit` se calcula automáticamente como `credit_limit - used_credit` y se incluye en todas las respuestas.

---

#### DELETE /credit-cards/{id}
Eliminar una tarjeta de crédito específica.

**URL:** `DELETE ${API_URL}/credit-cards/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteCreditCard = async (creditCardId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/credit-cards/${creditCardId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /credit-cards
Eliminar todas las tarjetas de crédito.

**URL:** `DELETE ${API_URL}/credit-cards`

**Ejemplo JavaScript:**
```javascript
const deleteAllCreditCards = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/credit-cards`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Subscriptions (Suscripciones Activas)

#### POST /subscriptions
Crear una nueva suscripción activa.

**URL:** `POST ${API_URL}/subscriptions`

**Request Body:**
```json
{
  "name": "Netflix",
  "price": 15.99,
  "cut_date": "2024-02-15",
  "card_id": "uuid-de-tarjeta",
  "is_family": false
}
```

**Ejemplo JavaScript:**
```javascript
const createSubscription = async (subscriptionData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(subscriptionData),
  });
  return response.json();
};

// Uso
const newSubscription = await createSubscription({
  name: "Netflix",
  price: 15.99,
  cut_date: "2024-02-15",
  card_id: "uuid-de-tarjeta",
  is_family: false
});
```

**Campos Requeridos:**
- `name` - Nombre de la suscripción (string, no vacío)
- `price` - Precio de la suscripción (número positivo)
- `cut_date` - Fecha de corte en formato YYYY-MM-DD
- `card_id` - ID de la tarjeta de débito asociada (debe pertenecer al usuario)

**Campos Opcionales:**
- `is_family` - Indica si la suscripción es familiar (boolean, default: false)

**Response (201):**
```json
{
  "message": "Subscription created successfully",
  "subscription": {
    "id": "uuid-here",
    "name": "Netflix",
    "price": 15.99,
    "cut_date": "2024-02-15",
    "card_id": "uuid-de-tarjeta",
    "is_family": false,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /subscriptions
Obtener suscripciones activas.

**URL:** `GET ${API_URL}/subscriptions?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getSubscriptions = async (subscriptionId = null) => {
  const token = localStorage.getItem('authToken');
  const url = subscriptionId 
    ? `${API_URL}/subscriptions?id=${subscriptionId}`
    : `${API_URL}/subscriptions`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las suscripciones
const allSubscriptions = await getSubscriptions();

// Obtener suscripción específica
const subscription = await getSubscriptions('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "subscriptions": [
    {
      "id": "uuid-here",
      "name": "Netflix",
      "price": 15.99,
      "cut_date": "2024-02-15",
      "card_id": "uuid-de-tarjeta",
      "is_family": false,
      "card": {
        "id": "uuid-de-tarjeta",
        "card_name": "Tarjeta Débito Principal",
        "issuing_bank": "Banco Nacional",
        "last_4_digits": "1234",
        "expiration_date": "2025-12-31"
      },
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados incluyen información de la tarjeta asociada y están ordenados por `cut_date` (ascendente) y luego por `created_at` (descendente).

---

#### PUT /subscriptions/{id}
Actualizar una suscripción específica.

**URL:** `PUT ${API_URL}/subscriptions/{id}`

**Ejemplo JavaScript:**
```javascript
const updateSubscription = async (subscriptionId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el precio
await updateSubscription('uuid-here', {
  price: 19.99
});

// Uso - actualizar múltiples campos
await updateSubscription('uuid-here', {
  name: "Netflix Premium",
  price: 19.99,
  cut_date: "2024-03-15",
  card_id: "nueva-tarjeta-uuid",
  is_family: true
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "name": "Netflix Premium",
  "price": 19.99,
  "cut_date": "2024-03-15",
  "card_id": "nueva-tarjeta-uuid",
  "is_family": true
}
```

**Nota:** Si actualizas `card_id`, la nueva tarjeta debe pertenecer al usuario autenticado.

---

#### DELETE /subscriptions/{id}
Eliminar una suscripción específica.

**URL:** `DELETE ${API_URL}/subscriptions/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteSubscription = async (subscriptionId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /subscriptions
Eliminar todas las suscripciones.

**URL:** `DELETE ${API_URL}/subscriptions`

**Ejemplo JavaScript:**
```javascript
const deleteAllSubscriptions = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/subscriptions`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Cryptocurrencies (Criptomonedas)

#### POST /cryptocurrencies
Crear una nueva criptomoneda.

**URL:** `POST ${API_URL}/cryptocurrencies`

**Request Body:**
```json
{
  "crypto_name": "Bitcoin",
  "purchase_value": 45000.50,
  "purchase_date": "2024-01-15",
  "wallet_id": "123e4567-e89b-12d3-a456-426614174000",
  "units_purchased": 0.5,
  "purchase_cost": 22500.25,
  "currency": "USD"
}
```

**Ejemplo JavaScript:**
```javascript
const createCryptocurrency = async (cryptoData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cryptocurrencies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(cryptoData),
  });
  return response.json();
};

// Uso
const newCrypto = await createCryptocurrency({
  crypto_name: "Bitcoin",
  purchase_value: 45000.50,
  purchase_date: "2024-01-15",
  wallet_id: "123e4567-e89b-12d3-a456-426614174000",
  units_purchased: 0.5,
  purchase_cost: 22500.25,
  currency: "USD"
});
```

**Campos Requeridos:**
- `crypto_name` - Nombre de la criptomoneda (string, no vacío)
- `purchase_value` - Precio unitario al momento de compra (número positivo, hasta 8 decimales)
- `purchase_date` - Fecha de compra en formato YYYY-MM-DD
- `wallet_id` - ID del wallet (UUID válido)
- `units_purchased` - Cantidad de unidades compradas (número positivo, hasta 8 decimales)
- `purchase_cost` - Costo total de la compra (número positivo)
- `currency` - Moneda de la compra (3 letras mayúsculas, ej: USD, EUR, COP)

**Response (201):**
```json
{
  "message": "Cryptocurrency created successfully",
  "cryptocurrency": {
    "id": "uuid-here",
    "crypto_name": "Bitcoin",
    "purchase_value": 45000.50,
    "purchase_date": "2024-01-15",
    "wallet_id": "123e4567-e89b-12d3-a456-426614174000",
    "units_purchased": 0.5,
    "purchase_cost": 22500.25,
    "currency": "USD",
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /cryptocurrencies
Obtener criptomonedas.

**URL:** `GET ${API_URL}/cryptocurrencies?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getCryptocurrencies = async (cryptoId = null) => {
  const token = localStorage.getItem('authToken');
  const url = cryptoId 
    ? `${API_URL}/cryptocurrencies?id=${cryptoId}`
    : `${API_URL}/cryptocurrencies`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las criptomonedas
const allCryptos = await getCryptocurrencies();

// Obtener criptomoneda específica
const crypto = await getCryptocurrencies('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "cryptocurrencies": [
    {
      "id": "uuid-here",
      "crypto_name": "Bitcoin",
      "purchase_value": 45000.50,
      "purchase_date": "2024-01-15",
      "wallet_id": "123e4567-e89b-12d3-a456-426614174000",
      "units_purchased": 0.5,
      "purchase_cost": 22500.25,
      "currency": "USD",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `purchase_date` (descendente) y luego por `created_at` (descendente).

---

#### PUT /cryptocurrencies/{id}
Actualizar una criptomoneda específica.

**URL:** `PUT ${API_URL}/cryptocurrencies/{id}`

**Ejemplo JavaScript:**
```javascript
const updateCryptocurrency = async (cryptoId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cryptocurrencies/${cryptoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el purchase_value
await updateCryptocurrency('uuid-here', {
  purchase_value: 46000.00
});

// Uso - actualizar múltiples campos
await updateCryptocurrency('uuid-here', {
  crypto_name: "Ethereum",
  purchase_value: 3000.00,
  units_purchased: 1.5,
  purchase_cost: 4500.00
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "crypto_name": "Ethereum",
  "purchase_value": 3000.00,
  "purchase_date": "2024-01-20",
  "wallet_id": "nuevo-wallet-uuid",
  "units_purchased": 1.5,
  "purchase_cost": 4500.00,
  "currency": "USD"
}
```

---

#### DELETE /cryptocurrencies/{id}
Eliminar una criptomoneda específica.

**URL:** `DELETE ${API_URL}/cryptocurrencies/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteCryptocurrency = async (cryptoId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cryptocurrencies/${cryptoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Cryptocurrency deleted successfully",
  "deleted_cryptocurrency": {
    "id": "uuid-here",
    "crypto_name": "Bitcoin",
    "purchase_cost": 22500.25,
    "currency": "USD"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /cryptocurrencies
Eliminar todas las criptomonedas.

**URL:** `DELETE ${API_URL}/cryptocurrencies`

**Ejemplo JavaScript:**
```javascript
const deleteAllCryptocurrencies = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cryptocurrencies`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 3 cryptocurrency(ies)",
  "deleted_count": 3,
  "deleted_cryptocurrencies": [
    {
      "id": "uuid-here",
      "crypto_name": "Bitcoin",
      "purchase_cost": 22500.25,
      "currency": "USD"
    }
  ]
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### CDTs (Certificados de Depósito a Término)

#### POST /cdts
Crear un nuevo CDT.

**URL:** `POST ${API_URL}/cdts`

**Request Body:**
```json
{
  "name": "CDT Banco Popular",
  "value": 10000000,
  "rate": 8.5,
  "withdrawal_date": "2025-12-31",
  "duration": 365,
  "issuer": "Banco Popular"
}
```

**Ejemplo JavaScript:**
```javascript
const createCDT = async (cdtData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cdts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(cdtData),
  });
  return response.json();
};

// Uso
const newCDT = await createCDT({
  name: "CDT Banco Popular",
  value: 10000000,
  rate: 8.5,
  withdrawal_date: "2025-12-31",
  duration: 365,
  issuer: "Banco Popular"
});
```

**Campos Requeridos:**
- `name` - Nombre del CDT (string, no vacío)
- `value` - Valor del CDT (número positivo)
- `rate` - Tasa de interés (número no negativo, puede ser decimal)
- `withdrawal_date` - Fecha de retiro en formato YYYY-MM-DD

**Campos Opcionales:**
- `duration` - Duración del CDT en días (número entero positivo, ej: 30, 90, 180, 365)
- `issuer` - Entidad emisora del CDT (string, ej: "Banco Popular", "TRI", "Banco de Bogotá")

**Response (201):**
```json
{
  "message": "CDT created successfully",
  "cdt": {
    "id": "uuid-here",
    "name": "CDT Banco Popular",
    "value": 10000000,
    "rate": 8.5,
    "withdrawal_date": "2025-12-31",
    "duration": 365,
    "issuer": "Banco Popular",
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /cdts
Obtener CDTs.

**URL:** `GET ${API_URL}/cdts?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getCDTs = async (cdtId = null) => {
  const token = localStorage.getItem('authToken');
  const url = cdtId 
    ? `${API_URL}/cdts?id=${cdtId}`
    : `${API_URL}/cdts`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los CDTs
const allCDTs = await getCDTs();

// Obtener CDT específico
const cdt = await getCDTs('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "cdts": [
    {
      "id": "uuid-here",
      "name": "CDT Banco Popular",
      "value": 10000000,
      "rate": 8.5,
      "withdrawal_date": "2025-12-31",
      "duration": 365,
      "issuer": "Banco Popular",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `withdrawal_date` (ascendente) y luego por `created_at` (descendente).

---

#### PUT /cdts/{id}
Actualizar un CDT específico.

**URL:** `PUT ${API_URL}/cdts/{id}`

**Ejemplo JavaScript:**
```javascript
const updateCDT = async (cdtId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cdts/${cdtId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el valor
await updateCDT('uuid-here', {
  value: 12000000
});

// Uso - actualizar múltiples campos
await updateCDT('uuid-here', {
  name: "CDT Actualizado",
  value: 12000000,
  rate: 9.0,
  withdrawal_date: "2026-01-31",
  duration: 180,
  issuer: "TRI"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "name": "CDT Actualizado",
  "value": 12000000,
  "rate": 9.0,
  "withdrawal_date": "2026-01-31",
  "duration": 180,
  "issuer": "TRI"
}
```

---

#### DELETE /cdts/{id}
Eliminar un CDT específico.

**URL:** `DELETE ${API_URL}/cdts/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteCDT = async (cdtId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cdts/${cdtId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "CDT deleted successfully",
  "deleted_cdt": {
    "id": "uuid-here",
    "name": "CDT Banco Popular",
    "value": 10000000
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /cdts
Eliminar todos los CDTs.

**URL:** `DELETE ${API_URL}/cdts`

**Ejemplo JavaScript:**
```javascript
const deleteAllCDTs = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/cdts`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 3 CDT(s)",
  "deleted_count": 3,
  "deleted_cdts": [
    {
      "id": "uuid-here",
      "name": "CDT Banco Popular",
      "value": 10000000
    }
  ]
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Notes (Notas/Cuadernos)

#### POST /notes
Crear una nueva nota.

**URL:** `POST ${API_URL}/notes`

**Request Body:**
```json
{
  "title": "Mi primera nota",
  "content": "Este es el contenido de mi nota. Puedo escribir texto libre aquí."
}
```

**Ejemplo JavaScript:**
```javascript
const createNote = async (noteData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(noteData),
  });
  return response.json();
};

// Uso
const newNote = await createNote({
  title: "Mi primera nota",
  content: "Este es el contenido de mi nota. Puedo escribir texto libre aquí."
});
```

**Campos Requeridos:**
- `title` - Título de la nota (string, no vacío)
- `content` - Contenido de la nota (string, texto libre)

**Nota de Seguridad:** El contenido y título se sanitizan automáticamente para prevenir script injection. Se eliminan tags `<script>`, event handlers (onclick, etc.), y protocolos javascript:.

**Response (201):**
```json
{
  "message": "Note created successfully",
  "note": {
    "id": "uuid-here",
    "title": "Mi primera nota",
    "content": "Este es el contenido de mi nota. Puedo escribir texto libre aquí.",
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /notes
Obtener notas.

**URL:** `GET ${API_URL}/notes?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getNotes = async (noteId = null) => {
  const token = localStorage.getItem('authToken');
  const url = noteId 
    ? `${API_URL}/notes?id=${noteId}`
    : `${API_URL}/notes`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las notas
const allNotes = await getNotes();

// Obtener nota específica
const note = await getNotes('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "notes": [
    {
      "id": "uuid-here",
      "title": "Mi primera nota",
      "content": "Este es el contenido de mi nota. Puedo escribir texto libre aquí.",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `created_at` (descendente, más recientes primero).

---

#### PUT /notes/{id}
Actualizar una nota específica.

**URL:** `PUT ${API_URL}/notes/{id}`

**Ejemplo JavaScript:**
```javascript
const updateNote = async (noteId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el título
await updateNote('uuid-here', {
  title: "Título actualizado"
});

// Uso - actualizar múltiples campos
await updateNote('uuid-here', {
  title: "Nota actualizada",
  content: "Nuevo contenido de la nota"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "title": "Nota actualizada",
  "content": "Nuevo contenido de la nota"
}
```

**Nota de Seguridad:** El contenido y título se sanitizan automáticamente antes de guardarse.

---

#### DELETE /notes/{id}
Eliminar una nota específica.

**URL:** `DELETE ${API_URL}/notes/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteNote = async (noteId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Note deleted successfully",
  "deleted_note": {
    "id": "uuid-here",
    "title": "Mi primera nota"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /notes
Eliminar todas las notas.

**URL:** `DELETE ${API_URL}/notes`

**Ejemplo JavaScript:**
```javascript
const deleteAllNotes = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notes`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 3 note(s)",
  "deleted_count": 3,
  "deleted_notes": [
    {
      "id": "uuid-here",
      "title": "Mi primera nota"
    }
  ]
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Secrets (Secretos)

#### POST /secrets
Crear un nuevo secreto. El valor se hashea automáticamente antes de guardarse.

**URL:** `POST ${API_URL}/secrets`

**Request Body:**
```json
{
  "title": "API Key de GitHub",
  "value": "ghp_xxxxxxxxxxxxxxxxxxxx"
}
```

**Ejemplo JavaScript:**
```javascript
const createSecret = async (secretData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/secrets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(secretData),
  });
  return response.json();
};

// Uso
const newSecret = await createSecret({
  title: "API Key de GitHub",
  value: "ghp_xxxxxxxxxxxxxxxxxxxx"
});
```

**Campos Requeridos:**
- `title` - Título del secreto (string, no vacío)
- `value` - Valor del secreto en texto plano (string, no vacío)

**Nota de Seguridad:** 
- El valor se encripta automáticamente usando AES-256-CBC con JWT_TOKEN_PASSPHRASE antes de guardarse
- El valor encriptado se puede desencriptar usando el endpoint `/secrets/{id}/value` con la contraseña del usuario
- El título se sanitiza para prevenir script injection

**Response (201):**
```json
{
  "message": "Secret created successfully",
  "secret": {
    "id": "uuid-here",
    "title": "API Key de GitHub",
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /secrets
Obtener secretos. **Nota:** El hash nunca se devuelve por seguridad.

**URL:** `GET ${API_URL}/secrets?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getSecrets = async (secretId = null) => {
  const token = localStorage.getItem('authToken');
  const url = secretId 
    ? `${API_URL}/secrets?id=${secretId}`
    : `${API_URL}/secrets`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los secretos
const allSecrets = await getSecrets();

// Obtener secreto específico
const secret = await getSecrets('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "secrets": [
    {
      "id": "uuid-here",
      "title": "API Key de GitHub",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `created_at` (descendente, más recientes primero). El valor encriptado nunca se incluye en la respuesta por seguridad. Use `/secrets/{id}/value` para obtener el valor desencriptado.

---

#### PUT /secrets/{id}
Actualizar un secreto específico. Si se proporciona `value`, se hasheará antes de guardarse.

**URL:** `PUT ${API_URL}/secrets/{id}`

**Ejemplo JavaScript:**
```javascript
const updateSecret = async (secretId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/secrets/${secretId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el título
await updateSecret('uuid-here', {
  title: "API Key de GitHub (Actualizada)"
});

// Uso - actualizar el valor (se hasheará automáticamente)
await updateSecret('uuid-here', {
  value: "nuevo-valor-secreto"
});

// Uso - actualizar ambos
await updateSecret('uuid-here', {
  title: "API Key de GitHub (Actualizada)",
  value: "nuevo-valor-secreto"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "title": "API Key de GitHub (Actualizada)",
  "value": "nuevo-valor-secreto"
}
```

**Nota de Seguridad:** Si se proporciona `value`, se encriptará automáticamente antes de guardarse.

---

#### POST /secrets/{id}/verify
Verificar si un valor coincide con el secreto almacenado.

**URL:** `POST ${API_URL}/secrets/{id}/verify`

**Ejemplo JavaScript:**
```javascript
const verifySecret = async (secretId, value) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/secrets/${secretId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify({ value }),
  });
  return response.json();
};

// Uso
const result = await verifySecret('uuid-here', 'mi-valor-a-verificar');
if (result.verified) {
  console.log('El valor coincide');
} else {
  console.log('El valor no coincide');
}
```

**Request Body:**
```json
{
  "value": "mi-valor-a-verificar"
}
```

**Response (200):**
```json
{
  "message": "Secret value matches",
  "secret_id": "uuid-here",
  "title": "API Key de GitHub",
  "verified": true
}
```

**Nota:** Este endpoint desencripta el valor almacenado y lo compara con el valor proporcionado. El valor original se desencripta temporalmente para la comparación.

---

#### POST /secrets/{id}/value
Obtener el valor original de un secreto (requiere contraseña de usuario). El valor se desencripta y se devuelve en texto plano.

**URL:** `POST ${API_URL}/secrets/{id}/value`

**Ejemplo JavaScript:**
```javascript
const getSecretValue = async (secretId, password) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/secrets/${secretId}/value`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify({ password }),
  });
  return response.json();
};

// Uso
const result = await getSecretValue('uuid-here', 'mi-password');
console.log('Valor del secreto:', result.secret.value);
```

**Request Body:**
```json
{
  "password": "mi-password-de-usuario"
}
```

**Campos Requeridos:**
- `password` - Contraseña del usuario (string, no vacío)

**Response (200):**
```json
{
  "message": "Secret accessed successfully",
  "secret": {
    "id": "uuid-here",
    "title": "API Key de GitHub",
    "value": "ghp_xxxxxxxxxxxxxxxxxxxx",
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

**Notas de Seguridad:**
- Requiere la contraseña del usuario para acceder al secreto
- El valor se encripta usando AES-256-CBC con JWT_TOKEN_PASSPHRASE como clave
- El valor se desencripta y se devuelve en texto plano solo si la contraseña es correcta
- Este endpoint es más sensible que otros, ya que expone el valor original del secreto

**Error Responses:**
- `400`: Password requerido o formato inválido
- `403`: Contraseña incorrecta
- `404`: Secreto no encontrado o no pertenece al usuario

---

#### DELETE /secrets/{id}
Eliminar un secreto específico.

**URL:** `DELETE ${API_URL}/secrets/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteSecret = async (secretId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/secrets/${secretId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Secret deleted successfully",
  "deleted_secret": {
    "id": "uuid-here",
    "title": "API Key de GitHub"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /secrets
Eliminar todos los secretos.

**URL:** `DELETE ${API_URL}/secrets`

**Ejemplo JavaScript:**
```javascript
const deleteAllSecrets = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/secrets`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 3 secret(s)",
  "deleted_count": 3,
  "deleted_secrets": [
    {
      "id": "uuid-here",
      "title": "API Key de GitHub"
    }
  ]
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Events (Eventos / Calendario)

#### POST /events
Crear un nuevo evento en el calendario.

**URL:** `POST ${API_URL}/events`

**Request Body:**
```json
{
  "title": "Reunión de trabajo",
  "description": "Reunión con el equipo para revisar el proyecto",
  "event_date": "2024-02-15",
  "event_time": "14:30",
  "is_all_day": false,
  "is_recurring": false,
  "location": "Oficina principal",
  "color": "#FF5733",
  "reminder_minutes": 15
}
```

**Ejemplo JavaScript:**
```javascript
const createEvent = async (eventData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

// Evento simple (una sola vez)
const simpleEvent = await createEvent({
  title: "Cumpleaños de Juan",
  event_date: "2024-03-20",
  is_all_day: true,
  is_recurring: false
});

// Evento recurrente (semanal)
const recurringEvent = await createEvent({
  title: "Reunión semanal",
  description: "Reunión de equipo cada lunes",
  event_date: "2024-02-12",
  event_time: "10:00",
  is_all_day: false,
  is_recurring: true,
  recurrence_frequency: "weekly",
  recurrence_interval: 1,
  recurrence_end_date: "2024-12-31",
  location: "Sala de conferencias",
  color: "#3498db",
  reminder_minutes: 30
});
```

**Campos Requeridos:**
- `title` - Título del evento (string, no vacío)
- `event_date` - Fecha del evento en formato YYYY-MM-DD (string)

**Campos Opcionales:**
- `description` - Descripción del evento (string)
- `event_time` - Hora del evento en formato HH:MM o HH:MM:SS (string, requerido si `is_all_day` es false)
- `is_all_day` - Si el evento es de todo el día (boolean, default: false)
- `is_recurring` - Si el evento es recurrente (boolean, default: false)
- `recurrence_frequency` - Frecuencia de recurrencia: 'daily', 'weekly', 'monthly', 'yearly', 'custom' (string, requerido si `is_recurring` es true)
- `recurrence_interval` - Intervalo de recurrencia: cada X días/semanas/meses/años (integer, default: 1)
- `recurrence_end_date` - Fecha de fin de recurrencia en formato YYYY-MM-DD (string, opcional)
- `recurrence_count` - Número de ocurrencias (integer, opcional, si no se especifica es infinito o hasta end_date)
- `location` - Ubicación del evento (string)
- `color` - Color en formato hexadecimal para UI (string, ej: "#FF5733")
- `reminder_minutes` - Recordatorio X minutos antes del evento (integer, opcional)

**Response (201):**
```json
{
  "message": "Event created successfully",
  "event": {
    "id": "uuid-here",
    "title": "Reunión de trabajo",
    "description": "Reunión con el equipo",
    "event_date": "2024-02-15",
    "event_time": "14:30:00",
    "is_all_day": false,
    "is_recurring": false,
    "recurrence_frequency": null,
    "recurrence_interval": null,
    "recurrence_end_date": null,
    "recurrence_count": null,
    "location": "Oficina principal",
    "color": "#FF5733",
    "reminder_minutes": 15,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /events
Obtener eventos. Permite filtrar por ID, rango de fechas, o obtener todos.

**URL:** `GET ${API_URL}/events?id={id}` o `GET ${API_URL}/events?start_date=2024-02-01&end_date=2024-02-28`

**Query Parameters:**
- `id` (opcional) - ID del evento específico
- `start_date` (opcional) - Fecha de inicio del rango (YYYY-MM-DD)
- `end_date` (opcional) - Fecha de fin del rango (YYYY-MM-DD)

**Ejemplo JavaScript:**
```javascript
const getEvents = async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams();
  if (filters.id) params.append('id', filters.id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  
  const url = `${API_URL}/events${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los eventos
const allEvents = await getEvents();

// Obtener eventos de un rango de fechas
const februaryEvents = await getEvents({
  start_date: "2024-02-01",
  end_date: "2024-02-28"
});

// Obtener un evento específico
const specificEvent = await getEvents({ id: "uuid-here" });
```

**Response (200):**
```json
{
  "count": 2,
  "events": [
    {
      "id": "uuid-here",
      "title": "Reunión de trabajo",
      "description": "Reunión con el equipo",
      "event_date": "2024-02-15",
      "event_time": "14:30:00",
      "is_all_day": false,
      "is_recurring": false,
      "recurrence_frequency": null,
      "recurrence_interval": null,
      "recurrence_end_date": null,
      "recurrence_count": null,
      "location": "Oficina principal",
      "color": "#FF5733",
      "reminder_minutes": 15,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los eventos están ordenados por fecha y hora (ascendente).

---

#### PUT /events/{id}
Actualizar un evento existente.

**URL:** `PUT ${API_URL}/events/{id}`

**Ejemplo JavaScript:**
```javascript
const updateEvent = async (eventId, eventData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

// Actualizar solo el título
await updateEvent('uuid-here', {
  title: "Reunión de trabajo (Actualizada)"
});

// Cambiar a evento de todo el día
await updateEvent('uuid-here', {
  is_all_day: true
});

// Hacer el evento recurrente
await updateEvent('uuid-here', {
  is_recurring: true,
  recurrence_frequency: "weekly",
  recurrence_interval: 1,
  recurrence_end_date: "2024-12-31"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "title": "Reunión de trabajo (Actualizada)",
  "description": "Nueva descripción",
  "event_date": "2024-02-16",
  "event_time": "15:00",
  "is_all_day": false,
  "is_recurring": true,
  "recurrence_frequency": "weekly",
  "recurrence_interval": 1,
  "recurrence_end_date": "2024-12-31",
  "location": "Nueva ubicación",
  "color": "#2ecc71",
  "reminder_minutes": 30
}
```

**Nota:** Si cambias `is_all_day` a `true`, el `event_time` se establecerá automáticamente a `null`. Si cambias `is_recurring` a `false`, todos los campos de recurrencia se limpiarán.

---

#### DELETE /events/{id}
Eliminar un evento específico.

**URL:** `DELETE ${API_URL}/events/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteEvent = async (eventId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Event deleted successfully",
  "deleted_event": {
    "id": "uuid-here",
    "title": "Reunión de trabajo"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /events
Eliminar todos los eventos.

**URL:** `DELETE ${API_URL}/events`

**Ejemplo JavaScript:**
```javascript
const deleteAllEvents = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/events`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 5 event(s)",
  "deleted_count": 5,
  "deleted_events": [
    {
      "id": "uuid-here",
      "title": "Reunión de trabajo"
    }
  ]
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### Crypto Exchange Rates (Tasas de Cambio de Criptomonedas)

#### GET /crypto-exchange-rates/sync
Sincronizar tasas de cambio de criptomonedas desde CoinAPI. Este endpoint obtiene los precios actuales y calcula las tendencias diarias y mensuales para BTC, ETH y QRL, guardándolos en la base de datos.

**URL:** `GET ${API_URL}/crypto-exchange-rates/sync`

**Ejemplo JavaScript:**
```javascript
const syncCryptoExchangeRates = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/crypto-exchange-rates/sync`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Uso
const result = await syncCryptoExchangeRates();
```

**Response (200):**
```json
{
  "message": "Successfully synced 3 cryptocurrency exchange rate(s)",
  "crypto_exchange_rates": [
    {
      "id": "uuid-here",
      "crypto_name": "BTC",
      "value_in_usdt": 87528.92667621,
      "daily_trend": 0.7945,
      "monthly_trend": -21.1575,
      "date": "2025-11-24T05:00:00.000Z",
      "created_at": "2025-11-24T16:10:57.430Z",
      "updated_at": "2025-11-24T16:46:46.712Z"
    },
    {
      "id": "uuid-here-2",
      "crypto_name": "ETH",
      "value_in_usdt": 2865.87069161,
      "daily_trend": 2.2713,
      "monthly_trend": -27.1728,
      "date": "2025-11-24T05:00:00.000Z",
      "created_at": "2025-11-24T16:46:47.180Z",
      "updated_at": "2025-11-24T16:46:47.180Z"
    },
    {
      "id": "uuid-here-3",
      "crypto_name": "QRL",
      "value_in_usdt": 1.7721,
      "daily_trend": 3.5226,
      "monthly_trend": 0,
      "date": "2025-11-24T05:00:00.000Z",
      "created_at": "2025-11-24T16:46:49.150Z",
      "updated_at": "2025-11-24T16:46:49.150Z"
    }
  ]
}
```

**Notas:**
- Este endpoint sincroniza automáticamente BTC, ETH y QRL desde CoinAPI
- Las tasas se actualizan diariamente (UPSERT por `crypto_name` y `date`)
- Las tendencias se calculan comparando el precio actual con:
  - **daily_trend**: Precio de hace 1 día
  - **monthly_trend**: Precio de hace 1 mes
- Si alguna criptomoneda falla al sincronizarse, se incluirá en el array `errors` (si existe) pero las demás se guardarán correctamente

**Error Responses:**
- `500`: Error al sincronizar las tasas de cambio (API no disponible o error de base de datos)
- `401`: No autenticado

---

### Wallets (Billeteras de Criptomonedas)

#### POST /wallets
Crear una nueva wallet.

**URL:** `POST ${API_URL}/wallets`

**Request Body:**
```json
{
  "wallet_name": "My Bitcoin Wallet",
  "crypto_name": "Bitcoin",
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

**Ejemplo JavaScript:**
```javascript
const createWallet = async (walletData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(walletData),
  });
  return response.json();
};

// Uso
const newWallet = await createWallet({
  wallet_name: "My Bitcoin Wallet",
  crypto_name: "Bitcoin",
  address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
});
```

**Campos Requeridos:**
- `wallet_name` - Nombre de la wallet (string, no vacío)
- `crypto_name` - Nombre de la criptomoneda asociada (string, no vacío)
- `address` - Dirección de la wallet (string, no vacío)

**Response (201):**
```json
{
  "message": "Wallet created successfully",
  "wallet": {
    "id": "uuid-here",
    "wallet_name": "My Bitcoin Wallet",
    "crypto_name": "Bitcoin",
    "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z"
  }
}
```

---

#### GET /wallets
Obtener wallets.

**URL:** `GET ${API_URL}/wallets?id={uuid}` (opcional)

**Ejemplo JavaScript:**
```javascript
const getWallets = async (walletId = null) => {
  const token = localStorage.getItem('authToken');
  const url = walletId 
    ? `${API_URL}/wallets?id=${walletId}`
    : `${API_URL}/wallets`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las wallets
const allWallets = await getWallets();

// Obtener wallet específica
const wallet = await getWallets('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "wallets": [
    {
      "id": "uuid-here",
      "wallet_name": "My Bitcoin Wallet",
      "crypto_name": "Bitcoin",
      "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

**Nota:** Los resultados están ordenados por `wallet_name` (ascendente) y luego por `created_at` (descendente).

---

#### PUT /wallets/{id}
Actualizar una wallet específica.

**URL:** `PUT ${API_URL}/wallets/{id}`

**Ejemplo JavaScript:**
```javascript
const updateWallet = async (walletId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/wallets/${walletId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};

// Uso - actualizar solo el nombre
await updateWallet('uuid-here', {
  wallet_name: "Updated Wallet Name"
});

// Uso - actualizar múltiples campos
await updateWallet('uuid-here', {
  wallet_name: "My Ethereum Wallet",
  crypto_name: "Ethereum",
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "wallet_name": "My Ethereum Wallet",
  "crypto_name": "Ethereum",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

---

#### DELETE /wallets/{id}
Eliminar una wallet específica.

**URL:** `DELETE ${API_URL}/wallets/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteWallet = async (walletId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/wallets/${walletId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Wallet deleted successfully",
  "deleted_wallet": {
    "id": "uuid-here",
    "wallet_name": "My Bitcoin Wallet",
    "crypto_name": "Bitcoin"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /wallets
Eliminar todas las wallets.

**URL:** `DELETE ${API_URL}/wallets`

**Ejemplo JavaScript:**
```javascript
const deleteAllWallets = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/wallets`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};
```

**Response (200):**
```json
{
  "message": "Successfully deleted 3 wallet(s)",
  "deleted_count": 3,
  "deleted_wallets": [
    {
      "id": "uuid-here",
      "wallet_name": "My Bitcoin Wallet",
      "crypto_name": "Bitcoin"
    }
  ]
}
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

1. **Balance Manual**: Los balances de las cuentas bancarias NO se actualizan automáticamente. El frontend debe actualizar manualmente el balance de la cuenta bancaria cuando se crean, actualizan o eliminan transacciones:
   - **Ingreso**: Suma el monto al balance (`balance = balance + amount`)
   - **Egreso/Ahorro**: Resta el monto del balance (`balance = balance - amount`)
   - Usa el endpoint `PUT /bank-accounts/{id}` para actualizar el balance

2. **Total Gastado Manual**: El campo `total_spent` de los presupuestos NO se actualiza automáticamente. El frontend debe actualizar manualmente el `total_spent` cuando se crean, actualizan o eliminan transacciones de tipo "egreso" o "ahorro" con `budget_id`:
   - **Crear transacción**: Suma el monto al `total_spent` (`total_spent = total_spent + amount`)
   - **Eliminar transacción**: Resta el monto del `total_spent` (`total_spent = total_spent - amount`)
   - **Actualizar transacción**: Revierte el monto anterior y aplica el nuevo monto
   - Usa el endpoint `PUT /budgets/{id}` para actualizar el `total_spent`

3. **Validación de Presupuestos**: 
   - Los egresos pueden crearse con o sin `budget_id`. Si se proporciona `budget_id`, se valida que el presupuesto exista, pertenezca al usuario y que la transacción no exceda el `max_amount` del presupuesto.
   - Si un egreso tiene `budget_id` y se intenta crear una transacción que exceda el límite del presupuesto, se recibirá un error 400.
   - Los egresos sin `budget_id` se crean normalmente sin validación de presupuesto.

4. **Soft Delete vs Hard Delete**: 
   - **Soft Delete** (`DELETE /budgets/{id}`): Marca el presupuesto como eliminado (`status = 'deleted'`) pero mantiene los datos. Las transacciones asociadas se mantienen. Se puede restaurar con `/restore`.
   - **Hard Delete** (`DELETE /budgets/{id}/hard`): Elimina físicamente el presupuesto y todas sus transacciones asociadas. **IRREVERSIBLE**. Los balances de las cuentas se actualizan automáticamente.

5. **Presupuestos Eliminados**: Por defecto, los endpoints GET solo muestran presupuestos activos. Usa `include_deleted=true` para incluir presupuestos eliminados.

6. **Transacciones con Presupuestos Eliminados**: No se pueden crear nuevas transacciones para presupuestos eliminados. Primero debes restaurar el presupuesto.

7. **Formato de Fechas**: Las fechas deben estar en formato `YYYY-MM-DD` (ej: "2024-01-15").

8. **Formato de Monedas**: Las monedas deben ser códigos de 3 letras en mayúsculas (ej: "USD", "EUR", "COP").

9. **UUIDs**: Todos los IDs son UUIDs (identificadores únicos universales).

10. **Deudas**: Las deudas permiten gestionar obligaciones financieras con información detallada sobre tasas de interés, pagos mínimos, seguros y fechas de corte. Los campos numéricos deben ser valores positivos y las fechas deben estar en formato `YYYY-MM-DD`. Los nombres de campos están en inglés: `value`, `currency`, `concept`, `owed`, `reference`, `cut_date`, `interest_rate`, `overdue_interest`, `minimum_payment`, `has_insurance`, `insurance_value`.

11. **Tarjetas de Débito**: Las tarjetas permiten almacenar información de tarjetas de débito asociadas a una cuenta bancaria. El campo `bank_account_id` debe referenciar una cuenta bancaria que pertenezca al usuario autenticado. El campo `last_4_digits` debe ser exactamente 4 dígitos y la fecha de vencimiento (`expiration_date`) no puede ser en el pasado. El campo `is_virtual` es opcional (default: false) e indica si la tarjeta es virtual o física. Los nombres de campos están en inglés: `card_name`, `bank_account_id`, `last_4_digits`, `expiration_date`, `is_virtual`. Las respuestas incluyen información de la cuenta bancaria asociada.

12. **Tarjetas de Crédito**: Las tarjetas de crédito permiten gestionar información de tarjetas de crédito con nombre, banco, cupo de crédito, tasa mensual, cuota de manejo, fecha de corte, cupo utilizado y beneficios. El campo `benefits` es un array de strings que almacena la lista de beneficios de la tarjeta. El campo `cut_date` es opcional y debe estar en formato YYYY-MM-DD. El campo `used_credit` es opcional (default: 0.00) y representa cuánto del cupo se ha gastado; no puede exceder `credit_limit`. La respuesta incluye también `available_credit` que se calcula automáticamente como `credit_limit - used_credit`. Los nombres de campos están en inglés: `name`, `bank`, `credit_limit`, `monthly_rate`, `management_fee`, `cut_date`, `used_credit`, `available_credit`, `benefits`. El campo `benefits` debe ser un array de strings y todos los elementos deben ser strings.

13. **Suscripciones Activas**: Las suscripciones permiten gestionar servicios de suscripción activos con nombre, precio, fecha de corte, tarjeta de débito asociada y si es familiar o no. El `card_id` debe referenciar una tarjeta que pertenezca al usuario autenticado. El campo `is_family` es opcional (default: false) e indica si la suscripción es familiar. Los nombres de campos están en inglés: `name`, `price`, `cut_date`, `is_family`. Las suscripciones incluyen información de la tarjeta asociada en las respuestas GET.

14. **Proyectos de Ahorro**: Los proyectos permiten gestionar metas de ahorro con duración máxima de 9 meses (por inflación). El campo `duration_months` debe estar entre 1 y 9. El campo `target_amount` es el monto objetivo y `current_amount` es el monto actual ahorrado (no puede exceder `target_amount`). El campo `budget_id` es opcional y permite asociar un presupuesto al proyecto. El campo `status` puede ser 'active', 'completed' o 'cancelled' (default: 'active'). La respuesta incluye `remaining` (monto restante) y `progress_percentage` (porcentaje de progreso) calculados automáticamente. Los nombres de campos están en inglés: `name`, `target_amount`, `current_amount`, `start_date`, `end_date`, `duration_months`, `status`, `budget_id`. El frontend debe manejar la creación del presupuesto asociado y su eliminación cuando el proyecto se completa.

15. **Autenticación**: 
    - **⚠️ REQUERIDA**: Todos los endpoints requieren autenticación JWT, excepto `/auth/register` y `/auth/login`.
    - **Registro**: El `password_hash` debe ser generado en el cliente usando bcrypt antes de enviarlo al servidor.
    - **Login**: El password se envía en texto plano y el servidor lo hashea para comparar con el hash almacenado.
    - **Tokens JWT**: Los tokens expiran después de 1 día. Deben incluirse en requests como `Authorization: Bearer <token>`.
    - **Manejo de Token**: Guarda el token después del login y úsalo en todos los requests protegidos.
    - **Errores 401**: Si recibes un 401, el token es inválido o expirado. Redirige al usuario al login.
    - **JWT_TOKEN_PASSPHRASE**: Debe configurarse en el archivo `.env` para firmar y verificar tokens.

16. **🔒 Aislamiento de Datos por Usuario**:
    - **Filtrado Automático**: Todos los endpoints filtran automáticamente los datos por el usuario autenticado usando el token JWT.
    - **Sin `user_id` Requerido**: No necesitas pasar `user_id` en los requests; el sistema lo obtiene automáticamente del token.
    - **Asignación Automática**: Los nuevos registros (cuentas bancarias, presupuestos, transacciones, deudas, tarjetas, suscripciones, proyectos) se asignan automáticamente al usuario autenticado.
    - **Seguridad**: Cada usuario solo puede ver, crear, actualizar y eliminar sus propios datos. Si intentas acceder a datos de otro usuario, recibirás un error 404.
    - **Exchange Rates Globales**: Los exchange rates son compartidos entre todos los usuarios y no requieren filtrado por usuario.
    - **Transacciones**: Al crear una transacción, el sistema verifica automáticamente que la cuenta bancaria y el presupuesto (si aplica) pertenezcan al usuario autenticado.

## Ejemplo de Cliente API Completo

```javascript
// api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class PocketsAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
  }

  // Método para establecer el token de autenticación
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Método para obtener el token desde localStorage
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Determinar si el endpoint requiere autenticación
    const requiresAuth = !endpoint.startsWith('/auth/register') && 
                        !endpoint.startsWith('/auth/login');
    
    // Obtener token si es necesario
    const token = requiresAuth ? this.getToken() : null;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && requiresAuth && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Manejar errores de autenticación
      if (response.status === 401) {
        // Token inválido o expirado
        this.setToken(null);
        throw { 
          response, 
          data: { 
            ...data,
            message: 'Authentication failed. Please login again.',
            requiresLogin: true
          } 
        };
      }

      if (!response.ok) {
        throw { response, data };
      }

      return data;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      throw { response: null, data: { error: 'Error de conexión' } };
    }
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

  // CDTs
  async createCDT(data) {
    return this.request('/cdts', {
      method: 'POST',
      body: data,
    });
  }

  async getCDTs(cdtId = null) {
    const endpoint = cdtId ? `/cdts?id=${cdtId}` : '/cdts';
    return this.request(endpoint);
  }

  async updateCDT(cdtId, updates) {
    return this.request(`/cdts/${cdtId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteCDT(cdtId) {
    return this.request(`/cdts/${cdtId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllCDTs() {
    return this.request('/cdts', {
      method: 'DELETE',
    });
  }

  // Notes
  async createNote(data) {
    return this.request('/notes', {
      method: 'POST',
      body: data,
    });
  }

  async getNotes(noteId = null) {
    const endpoint = noteId ? `/notes?id=${noteId}` : '/notes';
    return this.request(endpoint);
  }

  async updateNote(noteId, updates) {
    return this.request(`/notes/${noteId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteNote(noteId) {
    return this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllNotes() {
    return this.request('/notes', {
      method: 'DELETE',
    });
  }

  // Secrets
  async createSecret(data) {
    return this.request('/secrets', {
      method: 'POST',
      body: data,
    });
  }

  async getSecrets(secretId = null) {
    const endpoint = secretId ? `/secrets?id=${secretId}` : '/secrets';
    return this.request(endpoint);
  }

  async updateSecret(secretId, updates) {
    return this.request(`/secrets/${secretId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async verifySecret(secretId, value) {
    return this.request(`/secrets/${secretId}/verify`, {
      method: 'POST',
      body: { value },
    });
  }

  async getSecretValue(secretId, password, valueToVerify = null) {
    const body = { password };
    if (valueToVerify) {
      body.value = valueToVerify;
    }
    return this.request(`/secrets/${secretId}/value`, {
      method: 'POST',
      body,
    });
  }

  async deleteSecret(secretId) {
    return this.request(`/secrets/${secretId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllSecrets() {
    return this.request('/secrets', {
      method: 'DELETE',
    });
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: eventData,
    });
  }

  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.id) params.append('id', filters.id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    return this.request(`/events${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  }

  async updateEvent(eventId, eventData) {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: eventData,
    });
  }

  async deleteEvent(eventId) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllEvents() {
    return this.request('/events', {
      method: 'DELETE',
    });
  }

  async syncCryptoExchangeRates() {
    return this.request('/crypto-exchange-rates/sync', {
      method: 'GET',
    });
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

  // Cards
  async createCard(data) {
    return this.request('/cards', {
      method: 'POST',
      body: data,
    });
  }

  async getCards(cardId = null) {
    const endpoint = cardId ? `/cards?id=${cardId}` : '/cards';
    return this.request(endpoint);
  }

  async updateCard(cardId, updates) {
    return this.request(`/cards/${cardId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteCard(cardId) {
    return this.request(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllCards() {
    return this.request('/cards', {
      method: 'DELETE',
    });
  }

  // Credit Cards
  async createCreditCard(data) {
    return this.request('/credit-cards', {
      method: 'POST',
      body: data,
    });
  }

  async getCreditCards(creditCardId = null) {
    const endpoint = creditCardId ? `/credit-cards?id=${creditCardId}` : '/credit-cards';
    return this.request(endpoint);
  }

  async updateCreditCard(creditCardId, updates) {
    return this.request(`/credit-cards/${creditCardId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteCreditCard(creditCardId) {
    return this.request(`/credit-cards/${creditCardId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllCreditCards() {
    return this.request('/credit-cards', {
      method: 'DELETE',
    });
  }

  // Subscriptions
  async createSubscription(data) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: data,
    });
  }

  async getSubscriptions(subscriptionId = null) {
    const endpoint = subscriptionId ? `/subscriptions?id=${subscriptionId}` : '/subscriptions';
    return this.request(endpoint);
  }

  async updateSubscription(subscriptionId, updates) {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteSubscription(subscriptionId) {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllSubscriptions() {
    return this.request('/subscriptions', {
      method: 'DELETE',
    });
  }

  // Projects
  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: data,
    });
  }

  async getProjects(projectId = null) {
    const endpoint = projectId ? `/projects?id=${projectId}` : '/projects';
    return this.request(endpoint);
  }

  async updateProject(projectId, updates) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllProjects() {
    return this.request('/projects', {
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
export const api = new PocketsAPI(API_URL);
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

// Crear tarjeta de crédito
const creditCard = await api.createCreditCard({
  name: "Visa Gold",
  bank: "Banco Nacional",
  credit_limit: 5000000,
  monthly_rate: 2.5,
  management_fee: 25000,
  cut_date: "2024-02-15",
  used_credit: 1500000,
  benefits: ["Millas", "Cashback 2%", "Seguro de viaje"]
});

// Obtener todas las tarjetas de crédito
const allCreditCards = await api.getCreditCards();

// Obtener tarjeta de crédito específica
const specificCreditCard = await api.getCreditCards(creditCard.credit_card.id);

// Actualizar tarjeta de crédito
await api.updateCreditCard(creditCard.credit_card.id, {
  credit_limit: 6000000,
  cut_date: "2024-03-15",
  used_credit: 2000000,
  benefits: ["Millas", "Cashback 3%", "Seguro de viaje", "Lounge acceso"]
});

// Eliminar tarjeta de crédito específica
await api.deleteCreditCard(creditCard.credit_card.id);

// Eliminar todas las tarjetas de crédito
await api.deleteAllCreditCards();

// Crear proyecto de ahorro
const project = await api.createProject({
  name: "Viaje a Europa",
  target_amount: 5000000,
  duration_months: 6,
  end_date: "2024-12-31"
});

// Obtener todos los proyectos
const allProjects = await api.getProjects();

// Obtener proyecto específico
const specificProject = await api.getProjects(project.project.id);

// Actualizar proyecto
await api.updateProject(project.project.id, {
  current_amount: 2000000,
  status: "active"
});

// Eliminar proyecto específico
await api.deleteProject(project.project.id);

// Eliminar todos los proyectos
await api.deleteAllProjects();

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


