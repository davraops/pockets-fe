# Pockets API - Frontend Reference

Guía completa de endpoints para integración frontend.

## ⚠️ Arquitectura de Múltiples Servicios

**IMPORTANTE:** El proyecto Pockets está dividido en **3 servicios Serverless independientes**, cada uno con su propio API Gateway y URL base. Debes configurar **3 URLs base diferentes** en tu aplicación frontend.

Para más detalles sobre la arquitectura, consulta `SERVICES_ARCHITECTURE.md`.

## Configuración Base

### URLs Base - Múltiples Servicios

```javascript
// Configuración de APIs por servicio
const API_CONFIG = {
  core: {
    production: 'https://qe765aps3a.execute-api.us-east-1.amazonaws.com/dev',
    local: 'http://localhost:7000'
  },
  financial: {
    production: 'https://l1nfx233y1.execute-api.us-east-1.amazonaws.com/dev',
    local: 'http://localhost:7001'
  },
  lifestyle: {
    production: 'https://kstxcg0o0g.execute-api.us-east-1.amazonaws.com/dev',
    local: 'http://localhost:7002'
  }
};

// Helper para obtener la URL según el entorno
const getApiUrl = (service) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? API_CONFIG[service].production : API_CONFIG[service].local;
};

// URLs base para cada servicio
const API_CORE = getApiUrl('core');        // Autenticación, cuentas bancarias, presupuestos, transacciones, exchange rates
const API_FINANCIAL = getApiUrl('financial'); // Deudas, tarjetas, criptomonedas, wallets, CDTs, suscripciones, proyectos
const API_LIFESTYLE = getApiUrl('lifestyle'); // Rutinas, eventos, notas, secretos, notificaciones

// Ejemplo de uso
const response = await fetch(`${API_CORE}/bank-accounts`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Distribución de Endpoints por Servicio

| Servicio | Endpoints | Puerto Local |
|----------|-----------|--------------|
| **pockets-core** | `/auth/*`, `/bank-accounts/*`, `/budgets/*`, `/budget-drafts/*`, `/transactions/*`, `/exchange-rates/*`, `/user-details` | 7000 |
| **pockets-financial** | `/debts/*`, `/debtors/*`, `/cards/*`, `/credit-cards/*`, `/subscriptions/*`, `/cryptocurrencies/*`, `/wallets/*`, `/cdts/*`, `/projects/*` | 5001 |
| **pockets-lifestyle** | `/routines/*`, `/routine-completions/*`, `/events/*`, `/notes/*`, `/diary-entries/*`, `/files/*`, `/judicial-processes/*`, `/secrets/*`, `/notifications/*`, `/crypto-exchange-rates/*` | 7002 |

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
    fecha_nacimiento: "1990-01-15",
    nombre_completo: "John Michael Doe" // Opcional
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
**🔵 Servicio: pockets-core** | **URL Base:** `API_CORE`

> **Nota:** Estos endpoints están en el servicio `pockets-core`. Usa `API_CORE` como URL base.

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
**🔵 Servicio: pockets-core** | **URL Base:** `API_CORE`

> **Nota:** Estos endpoints están en el servicio `pockets-core`. Usa `API_CORE` como URL base.

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
**🔵 Servicio: pockets-core** | **URL Base:** `API_CORE`

> **Nota:** Estos endpoints están en el servicio `pockets-core`. Usa `API_CORE` como URL base.

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

### Budget Drafts (Borradores de Presupuestos)
**🔵 Servicio: pockets-core** | **URL Base:** `API_CORE`

> **Nota:** Estos endpoints están en el servicio `pockets-core`. Usa `API_CORE` como URL base.

Sistema simple para guardar borradores de presupuestos en formato JSON. Permite almacenar cualquier estructura JSON que ayude a diseñar presupuestos antes de crearlos.

#### POST /budget-drafts
Crear un nuevo borrador de presupuesto.

**URL:** `POST ${API_CORE}/budget-drafts`

**Ejemplo JavaScript:**
```javascript
const createBudgetDraft = async (draftData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_CORE}/budget-drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(draftData)
  });
  return response.json();
};

// Crear un borrador
await createBudgetDraft({
  name: 'Presupuesto Enero 2024',
  data: {
    categories: [
      { name: 'Alimentación', amount: 500000 },
      { name: 'Transporte', amount: 200000 },
      { name: 'Entretenimiento', amount: 150000 }
    ],
    total: 850000,
    notes: 'Presupuesto preliminar'
  }
});
```

**Request Body:**
```json
{
  "name": "Presupuesto Enero 2024",
  "data": {
    "categories": [
      { "name": "Alimentación", "amount": 500000 },
      { "name": "Transporte", "amount": 200000 }
    ],
    "total": 700000,
    "notes": "Presupuesto preliminar"
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del borrador
- `data` (object) - Objeto JSON con los datos del borrador (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Budget draft created successfully",
  "draft": {
    "id": "uuid-here",
    "name": "Presupuesto Enero 2024",
    "data": {
      "categories": [
        { "name": "Alimentación", "amount": 500000 },
        { "name": "Transporte", "amount": 200000 }
      ],
      "total": 700000,
      "notes": "Presupuesto preliminar"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el borrador

---

#### GET /budget-drafts
Obtener borradores de presupuestos del usuario.

**URL:** `GET ${API_CORE}/budget-drafts`

**Query Parameters (opcionales):**
- `id` (string) - Obtener borrador específico por ID

**Ejemplo JavaScript:**
```javascript
const getBudgetDrafts = async (draftId = null) => {
  const token = localStorage.getItem('authToken');
  const url = draftId 
    ? `${API_CORE}/budget-drafts?id=${draftId}`
    : `${API_CORE}/budget-drafts`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los borradores
const allDrafts = await getBudgetDrafts();

// Obtener borrador específico
const draft = await getBudgetDrafts('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "drafts": [
    {
      "id": "uuid-here",
      "name": "Presupuesto Enero 2024",
      "data": {
        "categories": [
          { "name": "Alimentación", "amount": 500000 },
          { "name": "Transporte", "amount": 200000 }
        ],
        "total": 700000,
        "notes": "Presupuesto preliminar"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /budget-drafts/{id}
Actualizar un borrador de presupuesto existente.

**URL:** `PUT ${API_CORE}/budget-drafts/{id}`

**Ejemplo JavaScript:**
```javascript
const updateBudgetDraft = async (draftId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_CORE}/budget-drafts/${draftId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateBudgetDraft('uuid-here', {
  name: 'Presupuesto Enero 2024 (Actualizado)'
});

// Actualizar solo los datos
await updateBudgetDraft('uuid-here', {
  data: {
    categories: [
      { name: 'Alimentación', amount: 600000 },
      { name: 'Transporte', amount: 250000 }
    ],
    total: 850000
  }
});

// Actualizar ambos
await updateBudgetDraft('uuid-here', {
  name: 'Presupuesto Enero 2024 (Final)',
  data: {
    categories: [
      { name: 'Alimentación', amount: 600000 },
      { name: 'Transporte', amount: 250000 }
    ],
    total: 850000
  }
});
```

**Request Body:**
```json
{
  "name": "Presupuesto Enero 2024 (Actualizado)",
  "data": {
    "categories": [
      { "name": "Alimentación", "amount": 600000 }
    ],
    "total": 600000
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del borrador
- `data` (object) - Nuevos datos JSON del borrador

**Response (200):**
```json
{
  "message": "Budget draft updated successfully",
  "draft": {
    "id": "uuid-here",
    "name": "Presupuesto Enero 2024 (Actualizado)",
    "data": {
      "categories": [
        { "name": "Alimentación", "amount": 600000 }
      ],
      "total": 600000
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Borrador no encontrado o no pertenece al usuario
- `500`: Error al actualizar el borrador

---

#### DELETE /budget-drafts/{id}
Eliminar un borrador de presupuesto específico.

**URL:** `DELETE ${API_CORE}/budget-drafts/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteBudgetDraft = async (draftId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_CORE}/budget-drafts/${draftId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar borrador
await deleteBudgetDraft('uuid-here');
```

**Response (200):**
```json
{
  "message": "Budget draft deleted successfully",
  "deleted_draft": {
    "id": "uuid-here",
    "name": "Presupuesto Enero 2024"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /budget-drafts
Eliminar todos los borradores de presupuestos del usuario.

**URL:** `DELETE ${API_CORE}/budget-drafts`

**Ejemplo JavaScript:**
```javascript
const deleteAllBudgetDrafts = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_CORE}/budget-drafts`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los borradores
await deleteAllBudgetDrafts();
```

**Response (200):**
```json
{
  "message": "All budget drafts deleted successfully",
  "deleted_count": 5
}
```

**⚠️ Advertencia:** Esta operación elimina todos los borradores del usuario y es irreversible.

---

### Shopping Lists (Listas de Mercado)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar listas de mercado en formato JSON. Permite almacenar cualquier estructura JSON que represente una lista de compras (items, categorías, cantidades, etc.).

#### POST /shopping-lists
Crear una nueva lista de mercado.

**URL:** `POST ${API_LIFESTYLE}/shopping-lists`

**Ejemplo JavaScript:**
```javascript
const createShoppingList = async (listData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/shopping-lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(listData)
  });
  return response.json();
};

// Crear una lista de mercado
await createShoppingList({
  name: 'Lista Semanal',
  data: {
    items: [
      { name: 'Leche', quantity: 2, category: 'Lácteos', checked: false },
      { name: 'Pan', quantity: 1, category: 'Panadería', checked: false },
      { name: 'Huevos', quantity: 12, category: 'Lácteos', checked: false }
    ],
    store: 'Supermercado',
    notes: 'Comprar antes del viernes'
  }
});
```

**Request Body:**
```json
{
  "name": "Lista Semanal",
  "data": {
    "items": [
      { "name": "Leche", "quantity": 2, "category": "Lácteos", "checked": false },
      { "name": "Pan", "quantity": 1, "category": "Panadería", "checked": false }
    ],
    "store": "Supermercado",
    "notes": "Comprar antes del viernes"
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título de la lista
- `data` (object) - Objeto JSON con los datos de la lista (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Shopping list created successfully",
  "list": {
    "id": "uuid-here",
    "name": "Lista Semanal",
    "data": {
      "items": [
        { "name": "Leche", "quantity": 2, "category": "Lácteos", "checked": false }
      ],
      "store": "Supermercado",
      "notes": "Comprar antes del viernes"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear la lista

---

#### GET /shopping-lists
Obtener listas de mercado del usuario.

**URL:** `GET ${API_LIFESTYLE}/shopping-lists`

**Query Parameters (opcionales):**
- `id` (string) - Obtener lista específica por ID

**Ejemplo JavaScript:**
```javascript
const getShoppingLists = async (listId = null) => {
  const token = localStorage.getItem('authToken');
  const url = listId 
    ? `${API_LIFESTYLE}/shopping-lists?id=${listId}`
    : `${API_LIFESTYLE}/shopping-lists`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las listas
const allLists = await getShoppingLists();

// Obtener lista específica
const list = await getShoppingLists('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "lists": [
    {
      "id": "uuid-here",
      "name": "Lista Semanal",
      "data": {
        "items": [
          { "name": "Leche", "quantity": 2, "category": "Lácteos", "checked": false }
        ],
        "store": "Supermercado",
        "notes": "Comprar antes del viernes"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /shopping-lists/{id}
Actualizar una lista de mercado existente.

**URL:** `PUT ${API_LIFESTYLE}/shopping-lists/{id}`

**Ejemplo JavaScript:**
```javascript
const updateShoppingList = async (listId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/shopping-lists/${listId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateShoppingList('uuid-here', {
  name: 'Lista Semanal (Actualizada)'
});

// Actualizar solo los datos
await updateShoppingList('uuid-here', {
  data: {
    items: [
      { name: 'Leche', quantity: 2, category: 'Lácteos', checked: true },
      { name: 'Pan', quantity: 1, category: 'Panadería', checked: false }
    ],
    store: 'Supermercado',
    notes: 'Comprar antes del viernes'
  }
});

// Actualizar ambos
await updateShoppingList('uuid-here', {
  name: 'Lista Semanal (Final)',
  data: {
    items: [
      { name: 'Leche', quantity: 2, category: 'Lácteos', checked: true }
    ],
    store: 'Supermercado'
  }
});
```

**Request Body:**
```json
{
  "name": "Lista Semanal (Actualizada)",
  "data": {
    "items": [
      { "name": "Leche", "quantity": 2, "category": "Lácteos", "checked": true }
    ],
    "store": "Supermercado"
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre de la lista
- `data` (object) - Nuevos datos JSON de la lista

**Response (200):**
```json
{
  "message": "Shopping list updated successfully",
  "list": {
    "id": "uuid-here",
    "name": "Lista Semanal (Actualizada)",
    "data": {
      "items": [
        { "name": "Leche", "quantity": 2, "category": "Lácteos", "checked": true }
      ],
      "store": "Supermercado"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Lista no encontrada o no pertenece al usuario
- `500`: Error al actualizar la lista

---

#### DELETE /shopping-lists/{id}
Eliminar una lista de mercado específica.

**URL:** `DELETE ${API_LIFESTYLE}/shopping-lists/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteShoppingList = async (listId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/shopping-lists/${listId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar lista
await deleteShoppingList('uuid-here');
```

**Response (200):**
```json
{
  "message": "Shopping list deleted successfully",
  "deleted_list": {
    "id": "uuid-here",
    "name": "Lista Semanal"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /shopping-lists
Eliminar todas las listas de mercado del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/shopping-lists`

**Ejemplo JavaScript:**
```javascript
const deleteAllShoppingLists = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/shopping-lists`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todas las listas
await deleteAllShoppingLists();
```

**Response (200):**
```json
{
  "message": "All shopping lists deleted successfully",
  "deleted_count": 5
}
```

**⚠️ Advertencia:** Esta operación elimina todas las listas del usuario y es irreversible.

---

### Employees (Empleados)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar registros de empleados en formato JSON. Permite almacenar cualquier estructura JSON que represente información de empleados (datos personales, salario, cargo, fechas, etc.).

#### POST /employees
Crear un nuevo registro de empleado.

**URL:** `POST ${API_LIFESTYLE}/employees`

**Ejemplo JavaScript:**
```javascript
const createEmployee = async (employeeData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(employeeData)
  });
  return response.json();
};

// Crear un registro de empleado
await createEmployee({
  name: 'Juan Pérez',
  data: {
    identification: '1234567890',
    position: 'Desarrollador Senior',
    salary: 5000000,
    startDate: '2024-01-15',
    department: 'Tecnología',
    email: 'juan.perez@empresa.com',
    phone: '+57 300 123 4567',
    address: 'Calle 123 #45-67',
    emergencyContact: {
      name: 'María Pérez',
      phone: '+57 300 987 6543',
      relationship: 'Esposa'
    }
  }
});
```

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "data": {
    "identification": "1234567890",
    "position": "Desarrollador Senior",
    "salary": 5000000,
    "startDate": "2024-01-15",
    "department": "Tecnología",
    "email": "juan.perez@empresa.com",
    "phone": "+57 300 123 4567",
    "address": "Calle 123 #45-67",
    "emergencyContact": {
      "name": "María Pérez",
      "phone": "+57 300 987 6543",
      "relationship": "Esposa"
    }
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del registro de empleado
- `data` (object) - Objeto JSON con los datos del empleado (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Employee created successfully",
  "employee": {
    "id": "uuid-here",
    "name": "Juan Pérez",
    "data": {
      "identification": "1234567890",
      "position": "Desarrollador Senior",
      "salary": 5000000,
      "startDate": "2024-01-15",
      "department": "Tecnología",
      "email": "juan.perez@empresa.com",
      "phone": "+57 300 123 4567",
      "address": "Calle 123 #45-67",
      "emergencyContact": {
        "name": "María Pérez",
        "phone": "+57 300 987 6543",
        "relationship": "Esposa"
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el empleado

---

#### GET /employees
Obtener registros de empleados del usuario.

**URL:** `GET ${API_LIFESTYLE}/employees`

**Query Parameters (opcionales):**
- `id` (string) - Obtener empleado específico por ID

**Ejemplo JavaScript:**
```javascript
const getEmployees = async (employeeId = null) => {
  const token = localStorage.getItem('authToken');
  const url = employeeId 
    ? `${API_LIFESTYLE}/employees?id=${employeeId}`
    : `${API_LIFESTYLE}/employees`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los empleados
const allEmployees = await getEmployees();

// Obtener empleado específico
const employee = await getEmployees('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "employees": [
    {
      "id": "uuid-here",
      "name": "Juan Pérez",
      "data": {
        "identification": "1234567890",
        "position": "Desarrollador Senior",
        "salary": 5000000,
        "startDate": "2024-01-15",
        "department": "Tecnología"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /employees/{id}
Actualizar un registro de empleado existente.

**URL:** `PUT ${API_LIFESTYLE}/employees/{id}`

**Ejemplo JavaScript:**
```javascript
const updateEmployee = async (employeeId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/employees/${employeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateEmployee('uuid-here', {
  name: 'Juan Pérez (Actualizado)'
});

// Actualizar solo los datos
await updateEmployee('uuid-here', {
  data: {
    identification: '1234567890',
    position: 'Desarrollador Lead',
    salary: 6000000,
    startDate: '2024-01-15',
    department: 'Tecnología'
  }
});

// Actualizar ambos
await updateEmployee('uuid-here', {
  name: 'Juan Pérez (Actualizado)',
  data: {
    identification: '1234567890',
    position: 'Desarrollador Lead',
    salary: 6000000
  }
});
```

**Request Body:**
```json
{
  "name": "Juan Pérez (Actualizado)",
  "data": {
    "identification": "1234567890",
    "position": "Desarrollador Lead",
    "salary": 6000000,
    "startDate": "2024-01-15",
    "department": "Tecnología"
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del registro
- `data` (object) - Nuevos datos JSON del empleado

**Response (200):**
```json
{
  "message": "Employee updated successfully",
  "employee": {
    "id": "uuid-here",
    "name": "Juan Pérez (Actualizado)",
    "data": {
      "identification": "1234567890",
      "position": "Desarrollador Lead",
      "salary": 6000000,
      "startDate": "2024-01-15",
      "department": "Tecnología"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Empleado no encontrado o no pertenece al usuario
- `500`: Error al actualizar el empleado

---

#### DELETE /employees/{id}
Eliminar un registro de empleado específico.

**URL:** `DELETE ${API_LIFESTYLE}/employees/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteEmployee = async (employeeId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/employees/${employeeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar empleado
await deleteEmployee('uuid-here');
```

**Response (200):**
```json
{
  "message": "Employee deleted successfully",
  "deleted_employee": {
    "id": "uuid-here",
    "name": "Juan Pérez"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /employees
Eliminar todos los registros de empleados del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/employees`

**Ejemplo JavaScript:**
```javascript
const deleteAllEmployees = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/employees`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los empleados
await deleteAllEmployees();
```

**Response (200):**
```json
{
  "message": "All employees deleted successfully",
  "deleted_count": 5
}
```

**⚠️ Advertencia:** Esta operación elimina todos los registros de empleados del usuario y es irreversible.

---

### Crypto Vendors (Vendedores que Aceptan Criptomonedas)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar registros de vendedores que aceptan pagos con criptomonedas en formato JSON. Permite almacenar cualquier estructura JSON que represente información de vendedores (contacto, criptomonedas aceptadas, direcciones de wallet, etc.).

#### POST /crypto-vendors
Crear un nuevo registro de vendedor que acepta criptomonedas.

**URL:** `POST ${API_LIFESTYLE}/crypto-vendors`

**Ejemplo JavaScript:**
```javascript
const createCryptoVendor = async (vendorData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/crypto-vendors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(vendorData)
  });
  return response.json();
};

// Crear un registro de vendedor
await createCryptoVendor({
  name: 'Tienda de Electrónica XYZ',
  data: {
    contact: {
      name: 'Carlos Rodríguez',
      email: 'carlos@tiendaxyz.com',
      phone: '+57 300 123 4567',
      address: 'Calle 100 #50-30, Bogotá'
    },
    acceptedCryptocurrencies: ['BTC', 'ETH', 'USDT'],
    wallets: {
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      USDT: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    },
    businessType: 'Retail',
    notes: 'Acepta pagos en cripto desde $50.000 COP',
    discount: {
      percentage: 5,
      minAmount: 100000
    }
  }
});
```

**Request Body:**
```json
{
  "name": "Tienda de Electrónica XYZ",
  "data": {
    "contact": {
      "name": "Carlos Rodríguez",
      "email": "carlos@tiendaxyz.com",
      "phone": "+57 300 123 4567",
      "address": "Calle 100 #50-30, Bogotá"
    },
    "acceptedCryptocurrencies": ["BTC", "ETH", "USDT"],
    "wallets": {
      "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    },
    "businessType": "Retail",
    "notes": "Acepta pagos en cripto desde $50.000 COP",
    "discount": {
      "percentage": 5,
      "minAmount": 100000
    }
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del vendedor
- `data` (object) - Objeto JSON con los datos del vendedor (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Crypto vendor created successfully",
  "vendor": {
    "id": "uuid-here",
    "name": "Tienda de Electrónica XYZ",
    "data": {
      "contact": {
        "name": "Carlos Rodríguez",
        "email": "carlos@tiendaxyz.com",
        "phone": "+57 300 123 4567",
        "address": "Calle 100 #50-30, Bogotá"
      },
      "acceptedCryptocurrencies": ["BTC", "ETH", "USDT"],
      "wallets": {
        "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
      },
      "businessType": "Retail",
      "notes": "Acepta pagos en cripto desde $50.000 COP",
      "discount": {
        "percentage": 5,
        "minAmount": 100000
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el vendedor

---

#### GET /crypto-vendors
Obtener registros de vendedores que aceptan criptomonedas del usuario.

**URL:** `GET ${API_LIFESTYLE}/crypto-vendors`

**Query Parameters (opcionales):**
- `id` (string) - Obtener vendedor específico por ID

**Ejemplo JavaScript:**
```javascript
const getCryptoVendors = async (vendorId = null) => {
  const token = localStorage.getItem('authToken');
  const url = vendorId 
    ? `${API_LIFESTYLE}/crypto-vendors?id=${vendorId}`
    : `${API_LIFESTYLE}/crypto-vendors`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los vendedores
const allVendors = await getCryptoVendors();

// Obtener vendedor específico
const vendor = await getCryptoVendors('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "vendors": [
    {
      "id": "uuid-here",
      "name": "Tienda de Electrónica XYZ",
      "data": {
        "contact": {
          "name": "Carlos Rodríguez",
          "email": "carlos@tiendaxyz.com",
          "phone": "+57 300 123 4567"
        },
        "acceptedCryptocurrencies": ["BTC", "ETH", "USDT"],
        "wallets": {
          "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        },
        "businessType": "Retail"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /crypto-vendors/{id}
Actualizar un registro de vendedor existente.

**URL:** `PUT ${API_LIFESTYLE}/crypto-vendors/{id}`

**Ejemplo JavaScript:**
```javascript
const updateCryptoVendor = async (vendorId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/crypto-vendors/${vendorId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateCryptoVendor('uuid-here', {
  name: 'Tienda de Electrónica XYZ (Actualizada)'
});

// Actualizar solo los datos
await updateCryptoVendor('uuid-here', {
  data: {
    contact: {
      name: 'Carlos Rodríguez',
      email: 'carlos.nuevo@tiendaxyz.com',
      phone: '+57 300 123 4567'
    },
    acceptedCryptocurrencies: ['BTC', 'ETH', 'USDT', 'BNB'],
    wallets: {
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      USDT: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      BNB: 'bnb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    }
  }
});

// Actualizar ambos
await updateCryptoVendor('uuid-here', {
  name: 'Tienda de Electrónica XYZ (Actualizada)',
  data: {
    contact: {
      name: 'Carlos Rodríguez',
      email: 'carlos.nuevo@tiendaxyz.com'
    },
    acceptedCryptocurrencies: ['BTC', 'ETH', 'USDT', 'BNB']
  }
});
```

**Request Body:**
```json
{
  "name": "Tienda de Electrónica XYZ (Actualizada)",
  "data": {
    "contact": {
      "name": "Carlos Rodríguez",
      "email": "carlos.nuevo@tiendaxyz.com",
      "phone": "+57 300 123 4567"
    },
    "acceptedCryptocurrencies": ["BTC", "ETH", "USDT", "BNB"],
    "wallets": {
      "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "BNB": "bnb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
    }
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del vendedor
- `data` (object) - Nuevos datos JSON del vendedor

**Response (200):**
```json
{
  "message": "Crypto vendor updated successfully",
  "vendor": {
    "id": "uuid-here",
    "name": "Tienda de Electrónica XYZ (Actualizada)",
    "data": {
      "contact": {
        "name": "Carlos Rodríguez",
        "email": "carlos.nuevo@tiendaxyz.com",
        "phone": "+57 300 123 4567"
      },
      "acceptedCryptocurrencies": ["BTC", "ETH", "USDT", "BNB"],
      "wallets": {
        "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "BNB": "bnb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Vendedor no encontrado o no pertenece al usuario
- `500`: Error al actualizar el vendedor

---

#### DELETE /crypto-vendors/{id}
Eliminar un registro de vendedor específico.

**URL:** `DELETE ${API_LIFESTYLE}/crypto-vendors/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteCryptoVendor = async (vendorId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/crypto-vendors/${vendorId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar vendedor
await deleteCryptoVendor('uuid-here');
```

**Response (200):**
```json
{
  "message": "Crypto vendor deleted successfully",
  "deleted_vendor": {
    "id": "uuid-here",
    "name": "Tienda de Electrónica XYZ"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /crypto-vendors
Eliminar todos los registros de vendedores del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/crypto-vendors`

**Ejemplo JavaScript:**
```javascript
const deleteAllCryptoVendors = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/crypto-vendors`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los vendedores
await deleteAllCryptoVendors();
```

**Response (200):**
```json
{
  "message": "All crypto vendors deleted successfully",
  "deleted_count": 5
}
```

**⚠️ Advertencia:** Esta operación elimina todos los registros de vendedores del usuario y es irreversible.

---

### Vehicles (Vehículos)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar información de vehículos en formato JSON. Permite almacenar cualquier estructura JSON que represente información de vehículos (marca, modelo, placa, año, mantenimientos, seguros, etc.).

#### POST /vehicles
Crear un nuevo registro de vehículo.

**URL:** `POST ${API_LIFESTYLE}/vehicles`

**Ejemplo JavaScript:**
```javascript
const createVehicle = async (vehicleData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(vehicleData)
  });
  return response.json();
};

// Crear un registro de vehículo
await createVehicle({
  name: 'Mi Carro Principal',
  data: {
    type: 'Automóvil',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    plate: 'ABC123',
    color: 'Blanco',
    vin: '1HGBH41JXMN109186',
    mileage: 45000,
    fuelType: 'Gasolina',
    insurance: {
      company: 'Seguros XYZ',
      policyNumber: 'POL-123456',
      expirationDate: '2024-12-31',
      coverage: 'Todo Riesgo'
    },
    maintenance: {
      lastService: '2024-01-15',
      nextService: '2024-07-15',
      serviceInterval: 10000
    },
    documents: {
      soat: {
        number: 'SOAT-789012',
        expiration: '2024-12-31'
      },
      technicalReview: {
        number: 'RT-345678',
        expiration: '2025-06-30'
      }
    },
    notes: 'Vehículo en buen estado, mantenimiento al día'
  }
});
```

**Request Body:**
```json
{
  "name": "Mi Carro Principal",
  "data": {
    "type": "Automóvil",
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "plate": "ABC123",
    "color": "Blanco",
    "vin": "1HGBH41JXMN109186",
    "mileage": 45000,
    "fuelType": "Gasolina",
    "insurance": {
      "company": "Seguros XYZ",
      "policyNumber": "POL-123456",
      "expirationDate": "2024-12-31",
      "coverage": "Todo Riesgo"
    },
    "maintenance": {
      "lastService": "2024-01-15",
      "nextService": "2024-07-15",
      "serviceInterval": 10000
    },
    "documents": {
      "soat": {
        "number": "SOAT-789012",
        "expiration": "2024-12-31"
      },
      "technicalReview": {
        "number": "RT-345678",
        "expiration": "2025-06-30"
      }
    },
    "notes": "Vehículo en buen estado, mantenimiento al día"
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del vehículo
- `data` (object) - Objeto JSON con los datos del vehículo (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Vehicle created successfully",
  "vehicle": {
    "id": "uuid-here",
    "name": "Mi Carro Principal",
    "data": {
      "type": "Automóvil",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "plate": "ABC123",
      "color": "Blanco",
      "vin": "1HGBH41JXMN109186",
      "mileage": 45000,
      "fuelType": "Gasolina",
      "insurance": {
        "company": "Seguros XYZ",
        "policyNumber": "POL-123456",
        "expirationDate": "2024-12-31",
        "coverage": "Todo Riesgo"
      },
      "maintenance": {
        "lastService": "2024-01-15",
        "nextService": "2024-07-15",
        "serviceInterval": 10000
      },
      "documents": {
        "soat": {
          "number": "SOAT-789012",
          "expiration": "2024-12-31"
        },
        "technicalReview": {
          "number": "RT-345678",
          "expiration": "2025-06-30"
        }
      },
      "notes": "Vehículo en buen estado, mantenimiento al día"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el vehículo

---

#### GET /vehicles
Obtener registros de vehículos del usuario.

**URL:** `GET ${API_LIFESTYLE}/vehicles`

**Query Parameters (opcionales):**
- `id` (string) - Obtener vehículo específico por ID

**Ejemplo JavaScript:**
```javascript
const getVehicles = async (vehicleId = null) => {
  const token = localStorage.getItem('authToken');
  const url = vehicleId 
    ? `${API_LIFESTYLE}/vehicles?id=${vehicleId}`
    : `${API_LIFESTYLE}/vehicles`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los vehículos
const allVehicles = await getVehicles();

// Obtener vehículo específico
const vehicle = await getVehicles('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "vehicles": [
    {
      "id": "uuid-here",
      "name": "Mi Carro Principal",
      "data": {
        "type": "Automóvil",
        "brand": "Toyota",
        "model": "Corolla",
        "year": 2020,
        "plate": "ABC123",
        "color": "Blanco",
        "mileage": 45000
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /vehicles/{id}
Actualizar un registro de vehículo existente.

**URL:** `PUT ${API_LIFESTYLE}/vehicles/{id}`

**Ejemplo JavaScript:**
```javascript
const updateVehicle = async (vehicleId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/vehicles/${vehicleId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateVehicle('uuid-here', {
  name: 'Mi Carro Principal (Actualizado)'
});

// Actualizar solo los datos (ej: actualizar kilometraje)
await updateVehicle('uuid-here', {
  data: {
    type: 'Automóvil',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    plate: 'ABC123',
    mileage: 48000, // Actualizado
    maintenance: {
      lastService: '2024-03-15',
      nextService: '2024-09-15',
      serviceInterval: 10000
    }
  }
});

// Actualizar ambos
await updateVehicle('uuid-here', {
  name: 'Mi Carro Principal (Actualizado)',
  data: {
    mileage: 48000,
    maintenance: {
      lastService: '2024-03-15',
      nextService: '2024-09-15'
    }
  }
});
```

**Request Body:**
```json
{
  "name": "Mi Carro Principal (Actualizado)",
  "data": {
    "mileage": 48000,
    "maintenance": {
      "lastService": "2024-03-15",
      "nextService": "2024-09-15",
      "serviceInterval": 10000
    }
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del vehículo
- `data` (object) - Nuevos datos JSON del vehículo

**Response (200):**
```json
{
  "message": "Vehicle updated successfully",
  "vehicle": {
    "id": "uuid-here",
    "name": "Mi Carro Principal (Actualizado)",
    "data": {
      "mileage": 48000,
      "maintenance": {
        "lastService": "2024-03-15",
        "nextService": "2024-09-15",
        "serviceInterval": 10000
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-03-20T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Vehículo no encontrado o no pertenece al usuario
- `500`: Error al actualizar el vehículo

---

#### DELETE /vehicles/{id}
Eliminar un registro de vehículo específico.

**URL:** `DELETE ${API_LIFESTYLE}/vehicles/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteVehicle = async (vehicleId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/vehicles/${vehicleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar vehículo
await deleteVehicle('uuid-here');
```

**Response (200):**
```json
{
  "message": "Vehicle deleted successfully",
  "deleted_vehicle": {
    "id": "uuid-here",
    "name": "Mi Carro Principal"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /vehicles
Eliminar todos los registros de vehículos del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/vehicles`

**Ejemplo JavaScript:**
```javascript
const deleteAllVehicles = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/vehicles`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los vehículos
await deleteAllVehicles();
```

**Response (200):**
```json
{
  "message": "All vehicles deleted successfully",
  "deleted_count": 3
}
```

**⚠️ Advertencia:** Esta operación elimina todos los registros de vehículos del usuario y es irreversible.

---

### Patrimony (Patrimonio - Items Valiosos)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar información de items valiosos del patrimonio en formato JSON. Permite almacenar cualquier estructura JSON que represente bienes valiosos (fecha de compra, valor de compra, descripción, categoría, etc.).

#### POST /patrimony
Crear un nuevo item de patrimonio.

**URL:** `POST ${API_LIFESTYLE}/patrimony`

**Ejemplo JavaScript:**
```javascript
const createPatrimonyItem = async (itemData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/patrimony`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(itemData)
  });
  return response.json();
};

// Crear un item de patrimonio
await createPatrimonyItem({
  name: 'Reloj Rolex Submariner',
  data: {
    category: 'Relojes',
    purchaseDate: '2020-05-15',
    purchaseValue: 15000000, // En COP
    currency: 'COP',
    description: 'Reloj Rolex Submariner Date, referencia 126610LN',
    brand: 'Rolex',
    model: 'Submariner Date',
    serialNumber: 'M126610LN-0001',
    condition: 'Excelente',
    currentValue: 18000000, // Valor actual estimado
    location: 'Casa',
    insurance: {
      company: 'Seguros XYZ',
      policyNumber: 'POL-REL-001',
      coverage: 20000000
    },
    photos: ['url1', 'url2'],
    notes: 'Reloj adquirido en tienda oficial Rolex'
  }
});
```

**Request Body:**
```json
{
  "name": "Reloj Rolex Submariner",
  "data": {
    "category": "Relojes",
    "purchaseDate": "2020-05-15",
    "purchaseValue": 15000000,
    "currency": "COP",
    "description": "Reloj Rolex Submariner Date, referencia 126610LN",
    "brand": "Rolex",
    "model": "Submariner Date",
    "serialNumber": "M126610LN-0001",
    "condition": "Excelente",
    "currentValue": 18000000,
    "location": "Casa",
    "insurance": {
      "company": "Seguros XYZ",
      "policyNumber": "POL-REL-001",
      "coverage": 20000000
    },
    "photos": ["url1", "url2"],
    "notes": "Reloj adquirido en tienda oficial Rolex"
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del item
- `data` (object) - Objeto JSON con los datos del item (cualquier estructura válida, típicamente incluye `purchaseDate` y `purchaseValue`)

**Response (201):**
```json
{
  "message": "Patrimony item created successfully",
  "item": {
    "id": "uuid-here",
    "name": "Reloj Rolex Submariner",
    "data": {
      "category": "Relojes",
      "purchaseDate": "2020-05-15",
      "purchaseValue": 15000000,
      "currency": "COP",
      "description": "Reloj Rolex Submariner Date, referencia 126610LN",
      "brand": "Rolex",
      "model": "Submariner Date",
      "serialNumber": "M126610LN-0001",
      "condition": "Excelente",
      "currentValue": 18000000,
      "location": "Casa",
      "insurance": {
        "company": "Seguros XYZ",
        "policyNumber": "POL-REL-001",
        "coverage": 20000000
      },
      "photos": ["url1", "url2"],
      "notes": "Reloj adquirido en tienda oficial Rolex"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el item

---

#### GET /patrimony
Obtener items de patrimonio del usuario.

**URL:** `GET ${API_LIFESTYLE}/patrimony`

**Query Parameters (opcionales):**
- `id` (string) - Obtener item específico por ID

**Ejemplo JavaScript:**
```javascript
const getPatrimony = async (itemId = null) => {
  const token = localStorage.getItem('authToken');
  const url = itemId 
    ? `${API_LIFESTYLE}/patrimony?id=${itemId}`
    : `${API_LIFESTYLE}/patrimony`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los items
const allItems = await getPatrimony();

// Obtener item específico
const item = await getPatrimony('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "items": [
    {
      "id": "uuid-here",
      "name": "Reloj Rolex Submariner",
      "data": {
        "category": "Relojes",
        "purchaseDate": "2020-05-15",
        "purchaseValue": 15000000,
        "currency": "COP",
        "description": "Reloj Rolex Submariner Date",
        "brand": "Rolex",
        "model": "Submariner Date",
        "currentValue": 18000000
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /patrimony/{id}
Actualizar un item de patrimonio existente.

**URL:** `PUT ${API_LIFESTYLE}/patrimony/{id}`

**Ejemplo JavaScript:**
```javascript
const updatePatrimonyItem = async (itemId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/patrimony/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updatePatrimonyItem('uuid-here', {
  name: 'Reloj Rolex Submariner (Actualizado)'
});

// Actualizar solo los datos (ej: actualizar valor actual)
await updatePatrimonyItem('uuid-here', {
  data: {
    category: 'Relojes',
    purchaseDate: '2020-05-15',
    purchaseValue: 15000000,
    currency: 'COP',
    currentValue: 20000000, // Valor actualizado
    condition: 'Excelente',
    location: 'Caja fuerte'
  }
});

// Actualizar ambos
await updatePatrimonyItem('uuid-here', {
  name: 'Reloj Rolex Submariner (Actualizado)',
  data: {
    currentValue: 20000000,
    condition: 'Excelente',
    location: 'Caja fuerte'
  }
});
```

**Request Body:**
```json
{
  "name": "Reloj Rolex Submariner (Actualizado)",
  "data": {
    "currentValue": 20000000,
    "condition": "Excelente",
    "location": "Caja fuerte"
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del item
- `data` (object) - Nuevos datos JSON del item

**Response (200):**
```json
{
  "message": "Patrimony item updated successfully",
  "item": {
    "id": "uuid-here",
    "name": "Reloj Rolex Submariner (Actualizado)",
    "data": {
      "currentValue": 20000000,
      "condition": "Excelente",
      "location": "Caja fuerte"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-03-20T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Item no encontrado o no pertenece al usuario
- `500`: Error al actualizar el item

---

#### DELETE /patrimony/{id}
Eliminar un item de patrimonio específico.

**URL:** `DELETE ${API_LIFESTYLE}/patrimony/{id}`

**Ejemplo JavaScript:**
```javascript
const deletePatrimonyItem = async (itemId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/patrimony/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar item
await deletePatrimonyItem('uuid-here');
```

**Response (200):**
```json
{
  "message": "Patrimony item deleted successfully",
  "deleted_item": {
    "id": "uuid-here",
    "name": "Reloj Rolex Submariner"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /patrimony
Eliminar todos los items de patrimonio del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/patrimony`

**Ejemplo JavaScript:**
```javascript
const deleteAllPatrimony = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/patrimony`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los items
await deleteAllPatrimony();
```

**Response (200):**
```json
{
  "message": "All patrimony items deleted successfully",
  "deleted_count": 10
}
```

**⚠️ Advertencia:** Esta operación elimina todos los items de patrimonio del usuario y es irreversible.

---

### Contracts (Contratos Activos)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar información de contratos activos en formato JSON. Permite almacenar cualquier estructura JSON que represente contratos (fecha inicio, fecha fin, valor, partes involucradas, términos, renovaciones, etc.).

#### POST /contracts
Crear un nuevo contrato.

**URL:** `POST ${API_LIFESTYLE}/contracts`

**Ejemplo JavaScript:**
```javascript
const createContract = async (contractData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(contractData)
  });
  return response.json();
};

// Crear un contrato
await createContract({
  name: 'Contrato de Arrendamiento Apartamento',
  data: {
    type: 'Arrendamiento',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    monthlyValue: 2000000, // En COP
    currency: 'COP',
    parties: {
      landlord: {
        name: 'Juan Pérez',
        identification: '1234567890',
        contact: {
          phone: '+57 300 123 4567',
          email: 'juan.perez@email.com'
        }
      },
      tenant: {
        name: 'Rafael Avella',
        identification: '9876543210'
      }
    },
    property: {
      address: 'Calle 123 #45-67, Bogotá',
      type: 'Apartamento',
      area: 80, // m²
      rooms: 3
    },
    terms: {
      deposit: 4000000, // 2 meses
      paymentDay: 5, // Día del mes
      includesUtilities: false,
      petsAllowed: false
    },
    renewal: {
      automatic: false,
      noticeDays: 30
    },
    documents: {
      contractNumber: 'CON-2024-001',
      fileUrl: 'https://example.com/contract.pdf'
    },
    notes: 'Contrato renovable anualmente'
  }
});
```

**Request Body:**
```json
{
  "name": "Contrato de Arrendamiento Apartamento",
  "data": {
    "type": "Arrendamiento",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "monthlyValue": 2000000,
    "currency": "COP",
    "parties": {
      "landlord": {
        "name": "Juan Pérez",
        "identification": "1234567890",
        "contact": {
          "phone": "+57 300 123 4567",
          "email": "juan.perez@email.com"
        }
      },
      "tenant": {
        "name": "Rafael Avella",
        "identification": "9876543210"
      }
    },
    "property": {
      "address": "Calle 123 #45-67, Bogotá",
      "type": "Apartamento",
      "area": 80,
      "rooms": 3
    },
    "terms": {
      "deposit": 4000000,
      "paymentDay": 5,
      "includesUtilities": false,
      "petsAllowed": false
    },
    "renewal": {
      "automatic": false,
      "noticeDays": 30
    },
    "documents": {
      "contractNumber": "CON-2024-001",
      "fileUrl": "https://example.com/contract.pdf"
    },
    "notes": "Contrato renovable anualmente"
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del contrato
- `data` (object) - Objeto JSON con los datos del contrato (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Contract created successfully",
  "contract": {
    "id": "uuid-here",
    "name": "Contrato de Arrendamiento Apartamento",
    "data": {
      "type": "Arrendamiento",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "monthlyValue": 2000000,
      "currency": "COP",
      "parties": {
        "landlord": {
          "name": "Juan Pérez",
          "identification": "1234567890",
          "contact": {
            "phone": "+57 300 123 4567",
            "email": "juan.perez@email.com"
          }
        },
        "tenant": {
          "name": "Rafael Avella",
          "identification": "9876543210"
        }
      },
      "property": {
        "address": "Calle 123 #45-67, Bogotá",
        "type": "Apartamento",
        "area": 80,
        "rooms": 3
      },
      "terms": {
        "deposit": 4000000,
        "paymentDay": 5,
        "includesUtilities": false,
        "petsAllowed": false
      },
      "renewal": {
        "automatic": false,
        "noticeDays": 30
      },
      "documents": {
        "contractNumber": "CON-2024-001",
        "fileUrl": "https://example.com/contract.pdf"
      },
      "notes": "Contrato renovable anualmente"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el contrato

---

#### GET /contracts
Obtener contratos del usuario.

**URL:** `GET ${API_LIFESTYLE}/contracts`

**Query Parameters (opcionales):**
- `id` (string) - Obtener contrato específico por ID

**Ejemplo JavaScript:**
```javascript
const getContracts = async (contractId = null) => {
  const token = localStorage.getItem('authToken');
  const url = contractId 
    ? `${API_LIFESTYLE}/contracts?id=${contractId}`
    : `${API_LIFESTYLE}/contracts`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los contratos
const allContracts = await getContracts();

// Obtener contrato específico
const contract = await getContracts('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "contracts": [
    {
      "id": "uuid-here",
      "name": "Contrato de Arrendamiento Apartamento",
      "data": {
        "type": "Arrendamiento",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "monthlyValue": 2000000,
        "currency": "COP",
        "parties": {
          "landlord": {
            "name": "Juan Pérez",
            "identification": "1234567890"
          },
          "tenant": {
            "name": "Rafael Avella",
            "identification": "9876543210"
          }
        },
        "property": {
          "address": "Calle 123 #45-67, Bogotá",
          "type": "Apartamento"
        }
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /contracts/{id}
Actualizar un contrato existente.

**URL:** `PUT ${API_LIFESTYLE}/contracts/{id}`

**Ejemplo JavaScript:**
```javascript
const updateContract = async (contractId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/contracts/${contractId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateContract('uuid-here', {
  name: 'Contrato de Arrendamiento Apartamento (Renovado)'
});

// Actualizar solo los datos (ej: extender fecha de fin)
await updateContract('uuid-here', {
  data: {
    type: 'Arrendamiento',
    startDate: '2024-01-01',
    endDate: '2025-12-31', // Extendido
    monthlyValue: 2100000, // Aumento
    currency: 'COP',
    renewal: {
      automatic: true,
      noticeDays: 30
    }
  }
});

// Actualizar ambos
await updateContract('uuid-here', {
  name: 'Contrato de Arrendamiento Apartamento (Renovado)',
  data: {
    endDate: '2025-12-31',
    monthlyValue: 2100000
  }
});
```

**Request Body:**
```json
{
  "name": "Contrato de Arrendamiento Apartamento (Renovado)",
  "data": {
    "endDate": "2025-12-31",
    "monthlyValue": 2100000,
    "renewal": {
      "automatic": true,
      "noticeDays": 30
    }
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del contrato
- `data` (object) - Nuevos datos JSON del contrato

**Response (200):**
```json
{
  "message": "Contract updated successfully",
  "contract": {
    "id": "uuid-here",
    "name": "Contrato de Arrendamiento Apartamento (Renovado)",
    "data": {
      "endDate": "2025-12-31",
      "monthlyValue": 2100000,
      "renewal": {
        "automatic": true,
        "noticeDays": 30
      }
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-03-20T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Contrato no encontrado o no pertenece al usuario
- `500`: Error al actualizar el contrato

---

#### DELETE /contracts/{id}
Eliminar un contrato específico.

**URL:** `DELETE ${API_LIFESTYLE}/contracts/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteContract = async (contractId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/contracts/${contractId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar contrato
await deleteContract('uuid-here');
```

**Response (200):**
```json
{
  "message": "Contract deleted successfully",
  "deleted_contract": {
    "id": "uuid-here",
    "name": "Contrato de Arrendamiento Apartamento"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /contracts
Eliminar todos los contratos del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/contracts`

**Ejemplo JavaScript:**
```javascript
const deleteAllContracts = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/contracts`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los contratos
await deleteAllContracts();
```

**Response (200):**
```json
{
  "message": "All contracts deleted successfully",
  "deleted_count": 5
}
```

**⚠️ Advertencia:** Esta operación elimina todos los contratos del usuario y es irreversible.

---

### Hiring Processes (Procesos de Contratación Abiertos)
**🟢 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple para guardar información de procesos de contratación abiertos en formato JSON. Permite almacenar cualquier estructura JSON que represente procesos de contratación activos (empresa, posición, contacto, estado, fechas, etc.).

#### POST /hiring-processes
Crear un nuevo proceso de contratación.

**URL:** `POST ${API_LIFESTYLE}/hiring-processes`

**Ejemplo JavaScript:**
```javascript
const createHiringProcess = async (processData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/hiring-processes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(processData)
  });
  return response.json();
};

// Crear un proceso de contratación
await createHiringProcess({
  name: 'Desarrollador Senior - Empresa XYZ',
  data: {
    company: 'Empresa XYZ',
    position: 'Desarrollador Senior',
    status: 'activo',
    contact: {
      name: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      phone: '+57 300 123 4567',
      role: 'Recruiter'
    },
    location: 'Bogotá, Colombia',
    salary: {
      min: 8000000,
      max: 12000000,
      currency: 'COP'
    },
    applicationDate: '2024-01-15',
    notes: 'Proceso activo, esperando respuesta'
  }
});
```

**Request Body:**
```json
{
  "name": "Desarrollador Senior - Empresa XYZ",
  "data": {
    "company": "Empresa XYZ",
    "position": "Desarrollador Senior",
    "status": "activo",
    "contact": {
      "name": "Juan Pérez",
      "email": "juan.perez@empresa.com",
      "phone": "+57 300 123 4567",
      "role": "Recruiter"
    },
    "location": "Bogotá, Colombia",
    "salary": {
      "min": 8000000,
      "max": 12000000,
      "currency": "COP"
    },
    "applicationDate": "2024-01-15",
    "notes": "Proceso activo, esperando respuesta"
  }
}
```

**Campos Requeridos:**
- `name` (string) - Nombre/título del proceso de contratación
- `data` (object) - Objeto JSON con los datos del proceso (cualquier estructura válida)

**Response (201):**
```json
{
  "message": "Hiring process created successfully",
  "hiring_process": {
    "id": "uuid-here",
    "name": "Desarrollador Senior - Empresa XYZ",
    "data": {
      "company": "Empresa XYZ",
      "position": "Desarrollador Senior",
      "status": "activo",
      "contact": {
        "name": "Juan Pérez",
        "email": "juan.perez@empresa.com",
        "phone": "+57 300 123 4567",
        "role": "Recruiter"
      },
      "location": "Bogotá, Colombia",
      "salary": {
        "min": 8000000,
        "max": 12000000,
        "currency": "COP"
      },
      "applicationDate": "2024-01-15",
      "notes": "Proceso activo, esperando respuesta"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `name` vacío, `data` no es un objeto válido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el proceso de contratación

---

#### GET /hiring-processes
Obtener procesos de contratación del usuario.

**URL:** `GET ${API_LIFESTYLE}/hiring-processes`

**Query Parameters (opcionales):**
- `id` (string) - Obtener proceso específico por ID

**Ejemplo JavaScript:**
```javascript
const getHiringProcesses = async (processId = null) => {
  const token = localStorage.getItem('authToken');
  const url = processId 
    ? `${API_LIFESTYLE}/hiring-processes?id=${processId}`
    : `${API_LIFESTYLE}/hiring-processes`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los procesos
const allProcesses = await getHiringProcesses();

// Obtener proceso específico
const process = await getHiringProcesses('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "hiring_processes": [
    {
      "id": "uuid-here",
      "name": "Desarrollador Senior - Empresa XYZ",
      "data": {
        "company": "Empresa XYZ",
        "position": "Desarrollador Senior",
        "status": "activo",
        "contact": {
          "name": "Juan Pérez",
          "email": "juan.perez@empresa.com"
        },
        "location": "Bogotá, Colombia"
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### PUT /hiring-processes/{id}
Actualizar un proceso de contratación existente.

**URL:** `PUT ${API_LIFESTYLE}/hiring-processes/{id}`

**Ejemplo JavaScript:**
```javascript
const updateHiringProcess = async (processId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/hiring-processes/${processId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el nombre
await updateHiringProcess('uuid-here', {
  name: 'Desarrollador Senior - Empresa XYZ (Actualizado)'
});

// Actualizar solo los datos (ej: cambiar estado)
await updateHiringProcess('uuid-here', {
  data: {
    company: 'Empresa XYZ',
    position: 'Desarrollador Senior',
    status: 'en_revision', // Cambiado
    contact: {
      name: 'Juan Pérez',
      email: 'juan.perez@empresa.com'
    }
  }
});

// Actualizar ambos
await updateHiringProcess('uuid-here', {
  name: 'Desarrollador Senior - Empresa XYZ (Actualizado)',
  data: {
    status: 'en_revision',
    notes: 'Actualizado: proceso en revisión'
  }
});
```

**Request Body:**
```json
{
  "name": "Desarrollador Senior - Empresa XYZ (Actualizado)",
  "data": {
    "status": "en_revision",
    "notes": "Actualizado: proceso en revisión"
  }
}
```

**Campos Opcionales (puedes actualizar uno o ambos):**
- `name` (string) - Nuevo nombre del proceso
- `data` (object) - Nuevos datos JSON del proceso

**Response (200):**
```json
{
  "message": "Hiring process updated successfully",
  "hiring_process": {
    "id": "uuid-here",
    "name": "Desarrollador Senior - Empresa XYZ (Actualizado)",
    "data": {
      "status": "en_revision",
      "notes": "Actualizado: proceso en revisión"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T15:45:00Z"
  }
}
```

**Errores:**
- `400`: ID faltante, `name` vacío, `data` no es un objeto válido, ningún campo para actualizar
- `401`: Token de autenticación inválido o faltante
- `404`: Proceso no encontrado o no pertenece al usuario
- `500`: Error al actualizar el proceso

---

#### DELETE /hiring-processes/{id}
Eliminar un proceso de contratación específico.

**URL:** `DELETE ${API_LIFESTYLE}/hiring-processes/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteHiringProcess = async (processId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/hiring-processes/${processId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar proceso
await deleteHiringProcess('uuid-here');
```

**Response (200):**
```json
{
  "message": "Hiring process deleted successfully",
  "deleted_hiring_process": {
    "id": "uuid-here",
    "name": "Desarrollador Senior - Empresa XYZ"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

#### DELETE /hiring-processes
Eliminar todos los procesos de contratación del usuario.

**URL:** `DELETE ${API_LIFESTYLE}/hiring-processes`

**Ejemplo JavaScript:**
```javascript
const deleteAllHiringProcesses = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/hiring-processes`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar todos los procesos
await deleteAllHiringProcesses();
```

**Response (200):**
```json
{
  "message": "All hiring processes deleted successfully",
  "deleted_count": 5
}
```

**⚠️ Advertencia:** Esta operación elimina todos los procesos de contratación del usuario y es irreversible.

---

### Transactions
**🔵 Servicio: pockets-core** | **URL Base:** `API_CORE`

> **Nota:** Estos endpoints están en el servicio `pockets-core`. Usa `API_CORE` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

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

### Diary Entries (Entradas de Diario)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema simple de diario con fecha y contenido. Solo se permite una entrada por fecha por usuario.

#### POST /diary-entries
Crear una nueva entrada de diario.

**URL:** `POST ${API_LIFESTYLE}/diary-entries`

**Request Body:**
```json
{
  "entry_date": "2024-01-15",
  "content": "Hoy fue un día increíble. Hice muchas cosas importantes..."
}
```

**Campos:**
- `entry_date` (string, requerido): Fecha de la entrada en formato `YYYY-MM-DD`
- `content` (string, requerido): Contenido de la entrada (texto)

**Ejemplo JavaScript:**
```javascript
const createDiaryEntry = async (entryDate, content) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/diary-entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify({
      entry_date: entryDate,
      content: content
    })
  });
  return response.json();
};

// Crear entrada
const newEntry = await createDiaryEntry('2024-01-15', 'Hoy fue un día increíble...');
```

**Response (201):**
```json
{
  "message": "Diary entry created successfully",
  "entry": {
    "id": "uuid-here",
    "entry_date": "2024-01-15",
    "content": "Hoy fue un día increíble...",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Nota:** Si ya existe una entrada para esa fecha, se actualizará automáticamente con el nuevo contenido.

---

#### GET /diary-entries
Obtener entradas de diario.

**URL:** `GET ${API_LIFESTYLE}/diary-entries`

**Query Parameters (opcionales):**
- `id` (string): Obtener entrada específica por ID
- `date` (string): Obtener entrada para una fecha específica (YYYY-MM-DD)
- `start_date` (string): Obtener entradas desde esta fecha (YYYY-MM-DD)
- `end_date` (string): Obtener entradas hasta esta fecha (YYYY-MM-DD)

**Ejemplo JavaScript:**
```javascript
const getDiaryEntries = async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams(filters);
  const url = params.toString() 
    ? `${API_LIFESTYLE}/diary-entries?${params.toString()}`
    : `${API_LIFESTYLE}/diary-entries`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las entradas
const allEntries = await getDiaryEntries();

// Obtener entrada específica por ID
const entry = await getDiaryEntries({ id: 'uuid-here' });

// Obtener entrada para una fecha específica
const todayEntry = await getDiaryEntries({ date: '2024-01-15' });

// Obtener entradas en un rango de fechas
const monthEntries = await getDiaryEntries({ 
  start_date: '2024-01-01', 
  end_date: '2024-01-31' 
});
```

**Response (200):**
```json
{
  "count": 2,
  "entries": [
    {
      "id": "uuid-here",
      "entry_date": "2024-01-15",
      "content": "Hoy fue un día increíble...",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid-here-2",
      "entry_date": "2024-01-14",
      "content": "Ayer también fue genial...",
      "created_at": "2024-01-14T09:00:00Z",
      "updated_at": "2024-01-14T09:00:00Z"
    }
  ]
}
```

---

#### PUT /diary-entries/{id}
Actualizar una entrada de diario existente.

**URL:** `PUT ${API_LIFESTYLE}/diary-entries/{id}`

**Request Body:**
```json
{
  "entry_date": "2024-01-15",
  "content": "Contenido actualizado..."
}
```

**Campos (opcionales, al menos uno requerido):**
- `entry_date` (string): Nueva fecha en formato `YYYY-MM-DD`
- `content` (string): Nuevo contenido

**Ejemplo JavaScript:**
```javascript
const updateDiaryEntry = async (entryId, updates) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/diary-entries/${entryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Actualizar solo el contenido
await updateDiaryEntry('uuid-here', {
  content: 'Contenido actualizado...'
});

// Actualizar fecha y contenido
await updateDiaryEntry('uuid-here', {
  entry_date: '2024-01-16',
  content: 'Contenido actualizado...'
});
```

**Response (200):**
```json
{
  "message": "Diary entry updated successfully",
  "entry": {
    "id": "uuid-here",
    "entry_date": "2024-01-15",
    "content": "Contenido actualizado...",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

**Errores:**
- `404`: Entrada no encontrada o no pertenece al usuario
- `409`: Si se cambia la fecha a una que ya tiene una entrada

---

#### DELETE /diary-entries/{id}
Eliminar una entrada de diario específica.

**URL:** `DELETE ${API_LIFESTYLE}/diary-entries/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteDiaryEntry = async (entryId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/diary-entries/${entryId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar entrada
await deleteDiaryEntry('uuid-here');
```

**Response (200):**
```json
{
  "message": "Diary entry deleted successfully",
  "deleted_entry": {
    "id": "uuid-here",
    "entry_date": "2024-01-15"
  }
}
```

**⚠️ Advertencia:** Esta operación es irreversible.

---

### User Files (Archivos/Documentos)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema para subir y gestionar archivos (documentos, PDFs) almacenados en S3. 

**⚠️ Límite de tamaño:** Los archivos deben ser menores a 25MB. Sin embargo, debido a las limitaciones de API Gateway (10MB de payload), se recomienda mantener los archivos por debajo de 10MB para una subida directa. Para archivos más grandes (10-25MB), se recomienda usar presigned URLs (funcionalidad futura).

**Tipos de archivo permitidos:**
- PDFs (`application/pdf`)
- Documentos Word (`.doc`, `.docx`)
- Hojas de cálculo Excel (`.xls`, `.xlsx`)
- Presentaciones PowerPoint (`.ppt`, `.pptx`)
- Archivos de texto (`.txt`)
- CSV (`.csv`)
- Imágenes (JPEG, PNG, GIF)

#### POST /files
Subir un archivo a S3.

**URL:** `POST ${API_LIFESTYLE}/files`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file, requerido): El archivo a subir (máximo 25MB)
- `title` (string, requerido): Título/descripción del archivo
- `description` (string, opcional): Descripción adicional o tipo de documento

**Ejemplo JavaScript:**
```javascript
const uploadFile = async (file, title, description = null) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch(`${API_LIFESTYLE}/files`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
      // NO incluir Content-Type, el navegador lo agregará automáticamente con el boundary
    },
    body: formData
  });
  return response.json();
};

// Ejemplo de uso
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

if (file) {
  const result = await uploadFile(
    file, 
    'Contrato de arrendamiento', 
    'Contrato firmado del apartamento'
  );
  console.log('Archivo subido:', result);
}
```

**Response (201):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid-here",
    "title": "Contrato de arrendamiento",
    "description": "Contrato firmado del apartamento",
    "file_name": "contrato.pdf",
    "file_size": 1048576,
    "mime_type": "application/pdf",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Archivo faltante, título faltante, archivo vacío, tamaño excede 25MB, tipo de archivo no permitido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al subir el archivo

---

#### GET /files
Obtener lista de archivos del usuario.

**URL:** `GET ${API_LIFESTYLE}/files`

**Query Parameters (opcionales):**
- `id` (string): Obtener archivo específico por ID
- `mime_type` (string): Filtrar por tipo MIME (ej: `application/pdf`)

**Ejemplo JavaScript:**
```javascript
const getFiles = async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams(filters);
  const url = params.toString() 
    ? `${API_LIFESTYLE}/files?${params.toString()}`
    : `${API_LIFESTYLE}/files`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todos los archivos
const allFiles = await getFiles();

// Obtener archivo específico por ID
const file = await getFiles({ id: 'uuid-here' });

// Obtener solo PDFs
const pdfs = await getFiles({ mime_type: 'application/pdf' });
```

**Response (200):**
```json
{
  "count": 2,
  "files": [
    {
      "id": "uuid-here",
      "title": "Contrato de arrendamiento",
      "description": "Contrato firmado del apartamento",
      "file_name": "contrato.pdf",
      "file_size": 1048576,
      "mime_type": "application/pdf",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### GET /files/{id}
Obtener URL de descarga (presigned URL) para un archivo específico.

**URL:** `GET ${API_LIFESTYLE}/files/{id}`

**Ejemplo JavaScript:**
```javascript
const getFileDownloadUrl = async (fileId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  const data = await response.json();
  
  // La URL presigned es válida por 1 hora
  return data.download_url;
};

// Obtener URL de descarga
const downloadUrl = await getFileDownloadUrl('uuid-here');

// Descargar el archivo
window.open(downloadUrl, '_blank');

// O descargar programáticamente
const link = document.createElement('a');
link.href = downloadUrl;
link.download = 'archivo.pdf';
link.click();
```

**Response (200):**
```json
{
  "file": {
    "id": "uuid-here",
    "title": "Contrato de arrendamiento",
    "description": "Contrato firmado del apartamento",
    "file_name": "contrato.pdf",
    "file_size": 1048576,
    "mime_type": "application/pdf",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "download_url": "https://pockets-user-files-dev.s3.amazonaws.com/user-id/file-id/contrato.pdf?X-Amz-Algorithm=...",
  "expires_in": 3600
}
```

**Nota:** La URL presigned es válida por 1 hora (3600 segundos). Después de ese tiempo, necesitarás generar una nueva URL.

---

#### DELETE /files/{id}
Eliminar un archivo (de S3 y de la base de datos).

**URL:** `DELETE ${API_LIFESTYLE}/files/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteFile = async (fileId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Eliminar archivo
await deleteFile('uuid-here');
```

**Response (200):**
```json
{
  "message": "File deleted successfully",
  "deleted_file": {
    "id": "uuid-here",
    "title": "Contrato de arrendamiento",
    "file_name": "contrato.pdf"
  }
}
```

**⚠️ Advertencia:** Esta operación elimina el archivo de S3 y de la base de datos. Es irreversible.

---

### Judicial Processes (Procesos Judiciales)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Endpoints proxy para consultar procesos judiciales desde la API de la Rama Judicial de Colombia. Estos endpoints actúan como intermediarios para evitar problemas de CORS y 403 Forbidden que ocurren al hacer llamadas directas desde el navegador.

#### GET /judicial-processes
Consultar procesos judiciales por nombre completo.

**URL:** `GET ${API_LIFESTYLE}/judicial-processes`

**Query Parameters:**
- `nombre` (string, requerido) - Nombre completo de la persona a consultar (URL-encoded)
- `tipoPersona` (string, opcional) - Tipo de persona: `'nat'` (natural) o `'jur'` (jurídica). Default: `'nat'`
- `SoloActivos` (string, opcional) - Si solo se deben mostrar procesos activos. Default: `'false'` (valores: `'true'` o `'false'`)
- `pagina` (integer, opcional) - Número de página para paginación. Default: `1`

**Ejemplo JavaScript:**
```javascript
const getJudicialProcesses = async (nombre, filters = {}) => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams({
    nombre: nombre,
    tipoPersona: filters.tipoPersona || 'nat',
    SoloActivos: filters.soloActivos || 'false',
    pagina: filters.pagina || '1'
  });
  
  const response = await fetch(`${API_LIFESTYLE}/judicial-processes?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`, // ⚠️ REQUERIDO
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Consultar procesos por nombre
const procesos = await getJudicialProcesses('Rafael Augusto Avella Pena');

// Con filtros
const procesosActivos = await getJudicialProcesses('Rafael Augusto Avella Pena', {
  tipoPersona: 'nat',
  soloActivos: 'true',
  pagina: 1
});
```

**Response (200):**
```json
{
  "procesos": [
    {
      "idProceso": 216809590,
      "idConexion": 12345,
      "llaveProceso": "11001-00331-2023-00001-01",
      "fechaProceso": "2023-01-15T00:00:00",
      "fechaUltimaActuacion": "2024-01-20T00:00:00",
      "despacho": "JUZGADO 001 CIVIL MUNICIPAL DE BOGOTÁ",
      "departamento": "CUNDINAMARCA",
      "sujetosProcesales": "DEMANDANTE: JUAN PÉREZ | DEMANDADO: RAFAEL AUGUSTO AVELLA PENA",
      "esPrivado": false,
      "cantFilas": 10
    }
  ],
  "paginacion": {
    "pagina": 1,
    "totalPaginas": 1,
    "totalRegistros": 1
  }
}
```

**Errores:**
- `400`: Parámetro `nombre` faltante o inválido, `tipoPersona` inválido, `pagina` inválida
- `401`: Token de autenticación inválido o faltante
- `500`: Error de conexión con la API externa
- `504`: Timeout al consultar la API externa

---

#### GET /judicial-processes/{idProceso}/actuaciones
Obtener las actuaciones (acciones/procedimientos) de un proceso judicial específico.

**URL:** `GET ${API_LIFESTYLE}/judicial-processes/{idProceso}/actuaciones`

**Path Parameters:**
- `idProceso` (integer, requerido) - ID del proceso judicial

**Query Parameters:**
- `pagina` (integer, opcional) - Número de página para paginación. Default: `1`

**Ejemplo JavaScript:**
```javascript
const getProcessActuaciones = async (idProceso, pagina = 1) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    `${API_LIFESTYLE}/judicial-processes/${idProceso}/actuaciones?pagina=${pagina}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`, // ⚠️ REQUERIDO
        'Content-Type': 'application/json'
      }
    }
  );
  return response.json();
};

// Obtener actuaciones de un proceso
const actuaciones = await getProcessActuaciones(216809590);
```

**Response (200):**
```json
{
  "actuaciones": [
    {
      "idRegActuacion": 123456,
      "llaveProceso": "11001-00331-2023-00001-01",
      "consActuacion": 1,
      "fechaActuacion": "2023-01-20T00:00:00",
      "actuacion": "ADMISIÓN DE LA DEMANDA",
      "anotacion": "Se admite la demanda presentada por el demandante.",
      "fechaInicial": null,
      "fechaFinal": null,
      "fechaRegistro": "2023-01-20T10:30:00",
      "codRegla": "001",
      "conDocumentos": true,
      "cant": 1
    }
  ],
  "paginacion": {
    "pagina": 1,
    "totalPaginas": 1,
    "totalRegistros": 2
  }
}
```

**Errores:**
- `400`: Parámetro `idProceso` faltante o inválido, `pagina` inválida
- `401`: Token de autenticación inválido o faltante
- `404`: Proceso no encontrado
- `500`: Error de conexión con la API externa
- `504`: Timeout al consultar la API externa

**Nota:** Estos endpoints actúan como proxy a la API externa de la Rama Judicial de Colombia (`https://consultaprocesos.ramajudicial.gov.co:448/api/v2`). Las respuestas pueden tardar hasta 30 segundos debido a la latencia de la API externa.

---

#### POST /judicial-processes/tracking
Agregar un proceso judicial a la lista de seguimiento. El sistema verificará automáticamente cada día si hay nuevas actuaciones y creará notificaciones cuando las detecte.

**URL:** `POST ${API_LIFESTYLE}/judicial-processes/tracking`

**Ejemplo JavaScript:**
```javascript
const addProcessTracking = async (processData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/judicial-processes/tracking`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // ⚠️ REQUERIDO
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(processData)
  });
  return response.json();
};

// Agregar proceso a seguimiento
await addProcessTracking({
  id_proceso: 216809590,
  llave_proceso: "11001-00331-2023-00001-01",
  nombre_persona: "Rafael Augusto Avella Pena",
  despacho: "JUZGADO 001 CIVIL MUNICIPAL DE BOGOTÁ",
  departamento: "CUNDINAMARCA"
});
```

**Request Body:**
```json
{
  "id_proceso": 216809590,
  "llave_proceso": "11001-00331-2023-00001-01",
  "nombre_persona": "Rafael Augusto Avella Pena",
  "despacho": "JUZGADO 001 CIVIL MUNICIPAL DE BOGOTÁ",
  "departamento": "CUNDINAMARCA"
}
```

**Campos Requeridos:**
- `id_proceso` (integer) - ID del proceso judicial
- `llave_proceso` (string) - Llave única del proceso (ej: "11001-00331-2023-00001-01")
- `nombre_persona` (string) - Nombre completo de la persona en el proceso

**Campos Opcionales:**
- `despacho` (string) - Nombre del despacho/juzgado
- `departamento` (string) - Departamento donde se encuentra el proceso

**Response (201):**
```json
{
  "message": "Process tracking created successfully",
  "tracking": {
    "id": "uuid-here",
    "id_proceso": 216809590,
    "llave_proceso": "11001-00331-2023-00001-01",
    "nombre_persona": "Rafael Augusto Avella Pena",
    "despacho": "JUZGADO 001 CIVIL MUNICIPAL DE BOGOTÁ",
    "departamento": "CUNDINAMARCA",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Response (200) - Si el proceso ya estaba en seguimiento:**
```json
{
  "message": "Process tracking reactivated",
  "tracking": {
    "id": "uuid-here",
    "id_proceso": 216809590,
    "llave_proceso": "11001-00331-2023-00001-01",
    "nombre_persona": "Rafael Augusto Avella Pena",
    "is_active": true,
    "created_at": "2024-01-10T08:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, `id_proceso` inválido
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear el seguimiento

---

#### GET /judicial-processes/tracking
Obtener todos los procesos judiciales que el usuario está siguiendo.

**URL:** `GET ${API_LIFESTYLE}/judicial-processes/tracking`

**Query Parameters (opcionales):**
- `active_only` (string) - Si es `'true'`, solo retorna procesos activos. Default: `'false'`

**Ejemplo JavaScript:**
```javascript
const getProcessTracking = async (activeOnly = false) => {
  const token = localStorage.getItem('authToken');
  const params = activeOnly ? '?active_only=true' : '';
  const response = await fetch(`${API_LIFESTYLE}/judicial-processes/tracking${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`, // ⚠️ REQUERIDO
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Obtener todos los procesos en seguimiento
const allTracking = await getProcessTracking();

// Solo procesos activos
const activeTracking = await getProcessTracking(true);
```

**Response (200):**
```json
{
  "count": 2,
  "tracking": [
    {
      "id": "uuid-here",
      "id_proceso": 216809590,
      "llave_proceso": "11001-00331-2023-00001-01",
      "nombre_persona": "Rafael Augusto Avella Pena",
      "despacho": "JUZGADO 001 CIVIL MUNICIPAL DE BOGOTÁ",
      "departamento": "CUNDINAMARCA",
      "ultima_actuacion_fecha": "2024-01-20T00:00:00Z",
      "ultima_verificacion": "2024-01-21T08:00:00Z",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-21T08:00:00Z"
    }
  ]
}
```

---

#### DELETE /judicial-processes/tracking/{id}
Remover un proceso de la lista de seguimiento (soft delete - se marca como inactivo).

**URL:** `DELETE ${API_LIFESTYLE}/judicial-processes/tracking/{id}`

**Ejemplo JavaScript:**
```javascript
const removeProcessTracking = async (trackingId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/judicial-processes/tracking/${trackingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Remover proceso de seguimiento
await removeProcessTracking('uuid-here');
```

**Response (200):**
```json
{
  "message": "Process tracking removed successfully",
  "deleted_tracking": {
    "id": "uuid-here",
    "id_proceso": 216809590,
    "llave_proceso": "11001-00331-2023-00001-01",
    "nombre_persona": "Rafael Augusto Avella Pena"
  }
}
```

**Errores:**
- `400`: ID de seguimiento faltante
- `401`: Token de autenticación inválido o faltante
- `404`: Seguimiento no encontrado o no pertenece al usuario
- `500`: Error al eliminar el seguimiento

**Nota:** Este es un soft delete. El proceso se marca como `is_active = false` pero no se elimina de la base de datos. Puedes reactivarlo agregándolo nuevamente con `POST /judicial-processes/tracking`.

---

### ⚙️ Verificación Automática

El sistema verifica automáticamente todos los procesos en seguimiento **diariamente a las 3:00 AM UTC-5** (8:00 AM UTC). Cuando se detecta una nueva actuación:

1. Se crea automáticamente una notificación de tipo `judicial_process`
2. La notificación incluye detalles de la nueva actuación en el campo `metadata`
3. El seguimiento se actualiza con la fecha e ID de la última actuación

**Ejemplo de notificación automática:**
```json
{
  "id": "notification-uuid",
  "type": "judicial_process",
  "title": "Nueva actuación en proceso judicial",
  "message": "Se registró una nueva actuación en el proceso 11001-00331-2023-00001-01 de Rafael Augusto Avella Pena",
  "priority": "normal",
  "is_read": false,
  "metadata": {
    "id_proceso": 216809590,
    "llave_proceso": "11001-00331-2023-00001-01",
    "nombre_persona": "Rafael Augusto Avella Pena",
    "actuacion": "ADMISIÓN DE LA DEMANDA",
    "fecha_actuacion": "2024-01-20T00:00:00",
    "id_reg_actuacion": 123456
  },
  "created_at": "2024-01-21T08:00:00Z"
}
```

Para recibir estas notificaciones, asegúrate de consultar regularmente el endpoint `GET /notifications` con filtro `type=judicial_process` o `is_read=false`.

---

### Secrets (Secretos)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

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
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

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

### Routines (Rutinas / Hábitos)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema para gestionar rutinas y hábitos con diferentes frecuencias (diarias, semanales, mensuales) y sus completados.

**⚠️ Importante:** Las rutinas no tienen campo de `status`. Una rutina simplemente existe o no existe. Cuando se elimina una rutina, se elimina permanentemente de la base de datos (hard delete) junto con todos sus completados asociados.

**📝 Nota sobre duración:**
- **Rutinas (`duration`)**: Duración **esperada o estimada** de la rutina en minutos. Es un valor de referencia que indica cuánto tiempo se espera que tome completar la rutina.
- **Completions (`duration`)**: Duración **real** del completado en minutos. Es el tiempo que realmente tomó completar la rutina en esa ocasión específica.

**📊 Campos de Estadísticas (incluidos en todas las respuestas):**
- `current_streak` - Racha actual (días/sesiones consecutivas desde hoy/ayer hacia atrás). Se lee directamente de la base de datos.
- `longest_streak` - Racha más larga histórica. Se lee directamente de la base de datos.
- `last_completed_date` - Última fecha de completado en formato YYYY-MM-DD (o `null` si nunca se ha completado). Calculado desde `routine_completions`.
- `total_completions` - Total de completados de la rutina. Calculado desde `routine_completions`.
- `completions_this_month` - Completados en el mes actual. Calculado desde `routine_completions`.

#### POST /routines
Crear una nueva rutina.

**URL:** `POST ${API_URL}/routines`

**Request Body:**
```json
{
  "title": "Ejercicio matutino",
  "description": "30 minutos de ejercicio cada mañana",
  "frequency": "daily",
  "scheduled_time": "07:00",
  "duration": 30
}
```

**Ejemplo JavaScript:**
```javascript
const createRoutine = async (routineData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/routines`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(routineData),
  });
  return response.json();
};

// Rutina diaria
const dailyRoutine = await createRoutine({
  title: "Meditación",
  frequency: "daily",
  scheduled_time: "06:00",
  description: "15 minutos de meditación",
  duration: 15 // Duración esperada en minutos
});

// Rutina semanal (lunes, miércoles, viernes)
const weeklyRoutine = await createRoutine({
  title: "Gimnasio",
  frequency: "weekly",
  days_of_week: [1, 3, 5], // Lunes, Miércoles, Viernes
  scheduled_time: "18:00",
  description: "Entrenamiento de fuerza",
  duration: 60 // Duración esperada: 1 hora
});

// Rutina mensual (día 1 de cada mes)
const monthlyRoutine = await createRoutine({
  title: "Revisión de gastos",
  frequency: "monthly",
  day_of_month: 1,
  scheduled_time: "09:00",
  description: "Revisar y planificar gastos del mes",
  duration: 45 // Duración esperada: 45 minutos
});
```

**Campos Requeridos:**
- `title` - Título de la rutina (string, no vacío)
- `frequency` - Frecuencia: 'daily', 'weekly', 'monthly' (string)

**Campos Condicionales:**
- `days_of_week` - Array de días [0-6] donde 0=Domingo, 6=Sábado (requerido si frequency='weekly')
- `day_of_month` - Día del mes 1-31 (requerido si frequency='monthly')

**Campos Opcionales:**
- `description` - Descripción de la rutina (string)
- `scheduled_time` - Hora programada en formato HH:MM o HH:MM:SS (string)
- `duration` - Duración esperada de la rutina en minutos (integer, no negativo)
- `start_date` - Fecha de inicio en formato YYYY-MM-DD (date, opcional)
- `end_date` - Fecha de fin en formato YYYY-MM-DD (date, opcional)
- `is_active` - Si la rutina está activa (boolean, default: true)
- `color` - Color de la rutina en formato hexadecimal (string, opcional)
- `target_count` - Cantidad objetivo de completados (integer, opcional)

**Response (201):**
```json
{
  "message": "Routine created successfully",
  "routine": {
    "id": "uuid-here",
    "title": "Ejercicio matutino",
    "description": "30 minutos de ejercicio cada mañana",
    "frequency": "daily",
    "days_of_week": null,
    "day_of_month": null,
    "scheduled_time": "07:00:00",
    "duration": 30,
    "start_date": null,
    "end_date": null,
    "is_active": true,
    "color": null,
    "target_count": null,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-15T00:00:00.000Z",
    "current_streak": 0,
    "longest_streak": 0,
    "last_completed_date": null,
    "total_completions": 0,
    "completions_this_month": 0
  }
}
```

---

#### GET /routines
Obtener todas las rutinas del usuario.

**URL:** `GET ${API_URL}/routines?id={id}`

**Query Parameters:**
- `id` (opcional) - ID de la rutina específica

**Ejemplo JavaScript:**
```javascript
const getRoutines = async (routineId = null) => {
  const token = localStorage.getItem('authToken');
  const url = routineId ? `${API_URL}/routines?id=${routineId}` : `${API_URL}/routines`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las rutinas
const allRoutines = await getRoutines();

// Obtener una rutina específica
const specificRoutine = await getRoutines('uuid-here');
```

**Response (200):**
```json
{
  "count": 2,
  "routines": [
    {
      "id": "uuid-here",
      "title": "Ejercicio matutino",
      "description": "30 minutos de ejercicio cada mañana",
      "frequency": "daily",
      "days_of_week": null,
      "day_of_month": null,
      "scheduled_time": "07:00:00",
      "duration": 30,
      "start_date": "2024-01-01",
      "end_date": null,
      "is_active": true,
      "color": "#FF5733",
      "target_count": 1,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z",
      "current_streak": 14,
      "longest_streak": 30,
      "last_completed_date": "2024-02-15",
      "total_completions": 45,
      "completions_this_month": 14
    }
  ]
}
```

**Nota:** Las rutinas están ordenadas por fecha de creación (descendente, más recientes primero).

**Campos de Estadísticas:**
- `current_streak` - Racha actual (días/sesiones consecutivas desde hoy/ayer hacia atrás)
- `longest_streak` - Racha más larga histórica
- `last_completed_date` - Última fecha de completado (YYYY-MM-DD o null)
- `total_completions` - Total de completados de la rutina
- `completions_this_month` - Completados en el mes actual

---

#### GET /routines/by-date
Obtener las rutinas que deben completarse en una fecha específica.

**URL:** `GET ${API_URL}/routines/by-date?date=YYYY-MM-DD`

**Query Parameters:**
- `date` (opcional) - Fecha en formato YYYY-MM-DD (default: hoy)

**Ejemplo JavaScript:**
```javascript
const getRoutinesByDate = async (date = null) => {
  const token = localStorage.getItem('authToken');
  const url = date 
    ? `${API_URL}/routines/by-date?date=${date}`
    : `${API_URL}/routines/by-date`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener rutinas de hoy
const todayRoutines = await getRoutinesByDate();

// Obtener rutinas de una fecha específica
const specificDateRoutines = await getRoutinesByDate('2024-02-15');
```

**Response (200):**
```json
{
  "date": "2024-02-15",
  "count": 2,
  "routines": [
    {
      "id": "uuid-here",
      "title": "Ejercicio matutino",
      "frequency": "daily",
      "scheduled_time": "07:00:00",
      "duration": 30,
      "start_date": "2024-01-01",
      "end_date": null,
      "is_active": true,
      "color": "#FF5733",
      "target_count": 1,
      "current_streak": 14,
      "longest_streak": 30,
      "last_completed_date": "2024-02-15",
      "total_completions": 45,
      "completions_this_month": 14,
      ...
    },
    {
      "id": "uuid-here-2",
      "title": "Gimnasio",
      "frequency": "weekly",
      "days_of_week": [1, 3, 5], // Si hoy es lunes, miércoles o viernes
      "duration": 60,
      "start_date": null,
      "end_date": null,
      "is_active": true,
      "color": null,
      "target_count": null,
      "current_streak": 6,
      "longest_streak": 12,
      "last_completed_date": "2024-02-14",
      "total_completions": 24,
      "completions_this_month": 6,
      ...
    }
  ]
}
```

**Lógica de filtrado:**
- **Rutinas diarias:** Siempre incluidas
- **Rutinas semanales:** Incluidas si el día de la semana está en `days_of_week`
- **Rutinas mensuales:** Incluidas si el día del mes coincide con `day_of_month`

---

#### PUT /routines/{id}
Actualizar una rutina existente.

**URL:** `PUT ${API_URL}/routines/{id}`

**Ejemplo JavaScript:**
```javascript
const updateRoutine = async (routineId, routineData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/routines/${routineId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(routineData),
  });
  return response.json();
};

// Actualizar título
await updateRoutine('uuid-here', {
  title: "Ejercicio matutino (Actualizado)"
});

// Cambiar la hora programada
await updateRoutine('uuid-here', {
  scheduled_time: "08:00"
});
```

**Request Body (todos los campos son opcionales, pero al menos uno es requerido):**
```json
{
  "title": "Ejercicio matutino (Actualizado)",
  "description": "Nueva descripción",
  "frequency": "daily",
  "scheduled_time": "08:00",
  "duration": 45,
  "start_date": "2024-01-01",
  "end_date": null,
  "is_active": true,
  "color": "#FF5733",
  "target_count": 1,
  "days_of_week": [1, 3, 5],
  "day_of_month": 1
}
```

**Nota:** Si cambias `frequency`, debes proporcionar los campos correspondientes (`days_of_week` para weekly, `day_of_month` para monthly).

**Response (200):**
```json
{
  "message": "Routine updated successfully",
  "routine": {
    "id": "uuid-here",
    "title": "Ejercicio matutino (Actualizado)",
    "description": "Nueva descripción",
    "frequency": "daily",
    "days_of_week": null,
    "day_of_month": null,
    "scheduled_time": "08:00:00",
    "duration": 45,
    "start_date": "2024-01-01",
    "end_date": null,
    "is_active": true,
    "color": "#FF5733",
    "target_count": 1,
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-16T00:00:00.000Z",
    "current_streak": 14,
    "longest_streak": 30,
    "last_completed_date": "2024-02-15",
    "total_completions": 45,
    "completions_this_month": 14
  }
}
```

---

#### DELETE /routines/{id}
Eliminar una rutina específica.

**URL:** `DELETE ${API_URL}/routines/{id}`

**⚠️ Advertencia:** Esta operación eliminará permanentemente la rutina y todos sus completados asociados (CASCADE). No hay soft delete - la rutina se elimina completamente de la base de datos.

---

#### DELETE /routines
Eliminar todas las rutinas del usuario.

**URL:** `DELETE ${API_URL}/routines`

**⚠️ Advertencia:** Esta operación eliminará permanentemente todas las rutinas y sus completados asociados. No hay soft delete - las rutinas se eliminan completamente de la base de datos.

---

### Routine Completions (Completados de Rutinas)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

Sistema para marcar cuando se completa una rutina. Almacena fecha, hora y duración real (en minutos) del completado.

**📝 Nota sobre duración:**
- El campo `duration` en completions representa la **duración real** que tomó completar la rutina en esa ocasión específica (en minutos).
- Este valor puede diferir de la `duration` esperada definida en la rutina, permitiendo comparar el tiempo estimado vs el tiempo real.
- Si no se proporciona `duration` al crear un completado, el valor será `null`.

#### POST /routine-completions
Crear una marcación de completado.

**URL:** `POST ${API_URL}/routine-completions`

**Request Body:**
```json
{
  "routine_id": "uuid-here",
  "completed_date": "2024-02-15",
  "completed_time": "07:30",
  "duration": 30
}
```

**Ejemplo JavaScript:**
```javascript
const createRoutineCompletion = async (completionData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/routine-completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(completionData),
  });
  return response.json();
};

// Completado simple (fecha y hora actuales)
const completion = await createRoutineCompletion({
  routine_id: "uuid-here"
});

// Completado con fecha, hora y duración específicas
const detailedCompletion = await createRoutineCompletion({
  routine_id: "uuid-here",
  completed_date: "2024-02-15",
  completed_time: "07:30",
  duration: 30 // Duración en minutos
});
```

**Campos Requeridos:**
- `routine_id` - ID de la rutina (UUID)

**Campos Opcionales:**
- `completed_date` - Fecha de completado en formato YYYY-MM-DD (string, default: hoy)
- `completed_time` - Hora de completado en formato HH:MM o HH:MM:SS (string)
- `duration` - Duración del completado en minutos (integer, no negativo)

**Response (201):**
```json
{
  "message": "Routine completion created successfully",
  "completion": {
    "id": "uuid-here",
    "routine_id": "uuid-here",
    "completed_date": "2024-02-15",
    "completed_time": "07:30:00",
    "duration": 30,
    "created_at": "2024-02-15T07:30:00.000Z",
    "updated_at": "2024-02-15T07:30:00.000Z"
  }
}
```

---

#### GET /routine-completions
Obtener la última marcación de cada rutina del usuario.

**URL:** `GET ${API_URL}/routine-completions`

**Ejemplo JavaScript:**
```javascript
const getRoutineCompletions = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/routine-completions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

const completions = await getRoutineCompletions();
```

**Response (200):**
```json
{
  "count": 3,
  "completions": [
    {
      "id": "uuid-here",
      "routine_id": "uuid-routine-1",
      "completed_date": "2024-02-15",
      "completed_time": "07:30:00",
      "duration": 30,
      "created_at": "2024-02-15T07:30:00.000Z",
      "updated_at": "2024-02-15T07:30:00.000Z"
    },
    {
      "id": "uuid-here-2",
      "routine_id": "uuid-routine-2",
      "completed_date": "2024-02-14",
      "completed_time": "18:00:00",
      "duration": 45,
      "created_at": "2024-02-14T18:00:00.000Z",
      "updated_at": "2024-02-14T18:00:00.000Z"
    }
  ]
}
```

**Nota:** Este endpoint devuelve solo la **última marcación** de cada rutina del usuario. Si una rutina no tiene completados, no aparecerá en la respuesta.

---

#### DELETE /routine-completions/{id}
Eliminar una marcación específica.

**URL:** `DELETE ${API_URL}/routine-completions/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteRoutineCompletion = async (completionId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/routine-completions/${completionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

await deleteRoutineCompletion('uuid-here');
```

**Response (200):**
```json
{
  "message": "Routine completion deleted successfully",
  "deleted_completion": {
    "id": "uuid-here",
    "routine_id": "uuid-here",
    "completed_date": "2024-02-15",
    "completed_time": "07:30:00",
    "duration": 30
  }
}
```

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
**🟢 Servicio: pockets-financial** | **URL Base:** `API_FINANCIAL`

> **Nota:** Estos endpoints están en el servicio `pockets-financial`. Usa `API_FINANCIAL` como URL base.

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
**🔵 Servicio: pockets-core** | **URL Base:** `API_CORE`

> **Nota:** Estos endpoints están en el servicio `pockets-core`. Usa `API_CORE` como URL base.

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
  fecha_nacimiento: "1990-01-15",
  nombre_completo: "John Michael Doe" // Opcional
});
```

**Request Body:**
```json
{
  "username": "johndoe",
  "password_hash": "$2a$10$hashedpasswordhere...",
  "nombre_usuario": "John Doe",
  "fecha_nacimiento": "1990-01-15",
  "nombre_completo": "John Michael Doe"
}
```

**Campos Requeridos:**
- `username` - Nombre de usuario único (case-insensitive)
- `password_hash` - Hash bcrypt del password (generado en el cliente)
- `nombre_usuario` - Nombre de usuario (display name)
- `fecha_nacimiento` - Fecha de nacimiento en formato YYYY-MM-DD

**Campos Opcionales:**
- `nombre_completo` - Nombre completo del usuario (ej: "Rafael Augusto Avella Pena")

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "user_details": {
      "nombre_usuario": "John Doe",
      "fecha_nacimiento": "1990-01-15",
      "nombre_completo": "John Michael Doe"
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
      "fecha_nacimiento": "1990-01-15",
      "nombre_completo": "John Michael Doe"
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

#### PUT /user-details
Actualizar los detalles del usuario autenticado (nombre_usuario, fecha_nacimiento, nombre_completo).

**URL:** `PUT ${API_CORE}/user-details`

**Ejemplo JavaScript:**
```javascript
const updateUserDetails = async (details) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_CORE}/user-details`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(details),
  });
  return response.json();
};

// Actualizar solo nombre_completo
await updateUserDetails({
  nombre_completo: "Rafael Augusto Avella Pena"
});

// Actualizar múltiples campos
await updateUserDetails({
  nombre_usuario: "John",
  fecha_nacimiento: "1990-01-15",
  nombre_completo: "John Michael Doe"
});
```

**Request Body:**
```json
{
  "nombre_usuario": "John",
  "fecha_nacimiento": "1990-01-15",
  "nombre_completo": "John Michael Doe"
}
```

**Campos Opcionales (puedes actualizar uno o varios):**
- `nombre_usuario` - Nombre de usuario (display name)
- `fecha_nacimiento` - Fecha de nacimiento en formato YYYY-MM-DD
- `nombre_completo` - Nombre completo del usuario

**Response (200):**
```json
{
  "message": "User details updated successfully",
  "user": {
    "id": "uuid-here",
    "username": "johndoe",
    "user_details": {
      "nombre_usuario": "John",
      "fecha_nacimiento": "1990-01-15",
      "nombre_completo": "John Michael Doe"
    },
    "created_at": "2024-01-15T00:00:00.000Z",
    "updated_at": "2024-01-16T10:30:00.000Z"
  }
}
```

**Nota:** 
- Solo necesitas enviar los campos que deseas actualizar
- Los campos no enviados se mantienen con sus valores actuales
- Todos los campos son opcionales en el request, pero si se envían deben tener valores válidos

---

### Notifications (Notificaciones)
**🟡 Servicio: pockets-lifestyle** | **URL Base:** `API_LIFESTYLE`

> **Nota:** Estos endpoints están en el servicio `pockets-lifestyle`. Usa `API_LIFESTYLE` como URL base.

El sistema de notificaciones permite gestionar alertas y recordatorios para el usuario. Las notificaciones pueden ser creadas manualmente o automáticamente por el sistema, y pueden ser consultadas, marcadas como leídas o eliminadas.

#### POST /notifications
Crear una nueva notificación para el usuario autenticado.

**URL:** `POST ${API_LIFESTYLE}/notifications`

**Ejemplo JavaScript:**
```javascript
const createNotification = async (notificationData) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_LIFESTYLE}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify(notificationData)
  });
  return response.json();
};

// Crear notificación básica
await createNotification({
  type: 'general',
  title: 'Recordatorio importante',
  message: 'No olvides revisar tu presupuesto mensual'
});

// Crear notificación con prioridad y metadata
await createNotification({
  type: 'routine',
  title: 'Rutina completada',
  message: 'Has completado tu rutina de ejercicio',
  priority: 'high',
  metadata: {
    routine_id: 'uuid-here',
    completion_date: '2024-01-15'
  }
});
```

**Request Body:**
```json
{
  "type": "general",
  "title": "Recordatorio importante",
  "message": "No olvides revisar tu presupuesto mensual",
  "priority": "normal",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Campos Requeridos:**
- `type` (string) - Tipo de notificación: `'general'`, `'routine'`, `'budget'`, `'transaction'`, `'judicial_process'`, `'system'`
- `title` (string) - Título de la notificación
- `message` (string) - Mensaje de la notificación

**Campos Opcionales:**
- `priority` (string) - Prioridad: `'low'`, `'normal'`, `'high'`, `'urgent'`. Default: `'normal'`
- `metadata` (object) - Metadatos adicionales en formato JSON. Default: `null`

**Response (201):**
```json
{
  "message": "Notification created successfully",
  "notification": {
    "id": "uuid-here",
    "type": "general",
    "title": "Recordatorio importante",
    "message": "No olvides revisar tu presupuesto mensual",
    "priority": "normal",
    "is_read": false,
    "metadata": {
      "custom_field": "value"
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Errores:**
- `400`: Campos requeridos faltantes, tipo o prioridad inválidos, título o mensaje vacíos
- `401`: Token de autenticación inválido o faltante
- `500`: Error al crear la notificación

---

#### GET /notifications
Obtener notificaciones del usuario con filtros y paginación.

**URL:** `GET ${API_URL}/notifications`

**Query Parameters:**
- `is_read` (opcional) - Filtrar por estado de lectura: `"true"` o `"false"`
- `type` (opcional) - Filtrar por tipo de notificación
- `priority` (opcional) - Filtrar por prioridad: `"low"`, `"normal"`, `"high"`, `"urgent"`
- `limit` (opcional) - Límite de resultados (default: 50, máximo: 100)
- `offset` (opcional) - Offset para paginación (default: 0)

**Ejemplo JavaScript:**
```javascript
const getNotifications = async (filters = {}) => {
  const token = localStorage.getItem('authToken');
  const params = new URLSearchParams();
  
  if (filters.is_read !== undefined) params.append('is_read', filters.is_read);
  if (filters.type) params.append('type', filters.type);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  
  const url = `${API_URL}/notifications${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

// Obtener todas las notificaciones
const allNotifications = await getNotifications();

// Obtener solo no leídas
const unreadNotifications = await getNotifications({ is_read: 'false' });

// Obtener notificaciones de rutinas
const routineNotifications = await getNotifications({ type: 'routine_streak_alert' });

// Paginación
const page1 = await getNotifications({ limit: 20, offset: 0 });
const page2 = await getNotifications({ limit: 20, offset: 20 });
```

**Response (200):**
```json
{
  "count": 10,
  "total": 25,
  "unread_count": 5,
  "limit": 50,
  "offset": 0,
  "notifications": [
    {
      "id": "uuid-here",
      "type": "routine_streak_alert",
      "title": "¡Racha en riesgo!",
      "message": "Tu racha de 5 días está en riesgo. Completa tu rutina hoy para mantenerla.",
      "is_read": false,
      "priority": "high",
      "metadata": {
        "routine_id": "routine-uuid",
        "streak_count": 5
      },
      "created_at": "2024-02-15T08:00:00.000Z",
      "read_at": null
    }
  ]
}
```

**Campos de Respuesta:**
- `count` - Número de notificaciones en esta página
- `total` - Total de notificaciones que coinciden con los filtros
- `unread_count` - Total de notificaciones no leídas del usuario
- `limit` - Límite aplicado
- `offset` - Offset aplicado
- `notifications` - Array de notificaciones

**Nota:** Las notificaciones están ordenadas por fecha de creación (descendente, más recientes primero).

---

#### PUT /notifications/{id}/read
Marcar una notificación como leída o no leída.

**URL:** `PUT ${API_URL}/notifications/{id}/read`

**Ejemplo JavaScript:**
```javascript
const markNotificationRead = async (notificationId, isRead = true) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify({ is_read: isRead })
  });
  return response.json();
};

// Marcar como leída
await markNotificationRead('uuid-here', true);

// Marcar como no leída
await markNotificationRead('uuid-here', false);
```

**Request Body (opcional):**
```json
{
  "is_read": true
}
```

**Response (200):**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "uuid-here",
    "type": "routine_streak_alert",
    "title": "¡Racha en riesgo!",
    "message": "Tu racha de 5 días está en riesgo...",
    "is_read": true,
    "priority": "high",
    "metadata": { ... },
    "created_at": "2024-02-15T08:00:00.000Z",
    "read_at": "2024-02-15T10:30:00.000Z"
  }
}
```

**Nota:** El campo `read_at` se actualiza automáticamente cuando se marca como leída.

---

#### POST /notifications/mark-all-read
Marcar todas las notificaciones como leídas o no leídas.

**URL:** `POST ${API_URL}/notifications/mark-all-read`

**Ejemplo JavaScript:**
```javascript
const markAllNotificationsRead = async (isRead = true) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    },
    body: JSON.stringify({ is_read: isRead })
  });
  return response.json();
};

// Marcar todas como leídas
await markAllNotificationsRead(true);
```

**Request Body (opcional):**
```json
{
  "is_read": true
}
```

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "affected_count": 5
}
```

---

#### DELETE /notifications/{id}
Eliminar una notificación específica.

**URL:** `DELETE ${API_URL}/notifications/{id}`

**Ejemplo JavaScript:**
```javascript
const deleteNotification = async (notificationId) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

await deleteNotification('uuid-here');
```

**Response (200):**
```json
{
  "message": "Notification deleted successfully",
  "deleted_notification": {
    "id": "uuid-here",
    "type": "routine_streak_alert",
    "title": "¡Racha en riesgo!"
  }
}
```

---

#### DELETE /notifications
Eliminar todas las notificaciones del usuario.

**URL:** `DELETE ${API_URL}/notifications`

**Ejemplo JavaScript:**
```javascript
const deleteAllNotifications = async () => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}` // ⚠️ REQUERIDO
    }
  });
  return response.json();
};

await deleteAllNotifications();
```

**Response (200):**
```json
{
  "message": "All notifications deleted successfully",
  "deleted_count": 25
}
```

---

#### Tipos de Notificaciones

El sistema soporta los siguientes tipos de notificaciones:

- `routine_reminder` - Recordatorio de rutina programada
- `routine_streak_alert` - Alerta de racha en riesgo
- `routine_streak_milestone` - Hito de racha alcanzado (ej: 7 días, 30 días)
- `budget_alert` - Alerta de presupuesto (80%, 90% usado)
- `budget_exceeded` - Presupuesto excedido
- `debt_due` - Deuda próxima a vencer
- `debt_overdue` - Deuda vencida
- `subscription_payment` - Pago de suscripción próximo
- `subscription_renewal` - Renovación de suscripción
- `credit_card_cut_date` - Fecha de corte de tarjeta de crédito
- `credit_card_payment_due` - Pago de tarjeta de crédito próximo
- `event_reminder` - Recordatorio de evento
- `cdt_maturity` - Vencimiento de CDT
- `crypto_price_alert` - Alerta de precio de criptomoneda
- `system` - Notificación del sistema
- `general` - Notificación general

#### Prioridades

- `low` - Baja prioridad
- `normal` - Prioridad normal (default)
- `high` - Alta prioridad
- `urgent` - Urgente

#### Metadata

El campo `metadata` contiene información adicional en formato JSON que puede incluir:
- IDs relacionados (routine_id, budget_id, debt_id, etc.)
- Valores numéricos (amounts, counts, etc.)
- Fechas importantes
- Cualquier otro dato relevante para el frontend

**Ejemplo de metadata:**
```json
{
  "routine_id": "uuid-here",
  "streak_count": 5,
  "target_streak": 7
}
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

17. **🏗️ Arquitectura de Múltiples Servicios**:
    - **⚠️ IMPORTANTE**: El proyecto está dividido en 3 servicios Serverless independientes, cada uno con su propio API Gateway.
    - **3 URLs Base**: Debes configurar 3 URLs base diferentes en tu aplicación:
      - `API_CORE`: Autenticación, cuentas bancarias, presupuestos, transacciones, exchange rates
      - `API_FINANCIAL`: Deudas, tarjetas, criptomonedas, wallets, CDTs, suscripciones, proyectos
      - `API_LIFESTYLE`: Rutinas, eventos, notas, secretos, notificaciones
    - **Mismo Token JWT**: Todos los servicios comparten el mismo `JWT_TOKEN_PASSPHRASE`, por lo que un token generado en `pockets-core` funciona en todos los servicios.
    - **Misma Base de Datos**: Todos los servicios comparten la misma base de datos PostgreSQL.
    - **CORS Configurado**: Todos los servicios tienen la misma configuración CORS.
    - **Ver `SERVICES_ARCHITECTURE.md`**: Para más detalles sobre la arquitectura y cómo desplegar los servicios.

## Ejemplo de Cliente API Completo

```javascript
// api.js
// Configuración de APIs por servicio
const API_CONFIG = {
  core: {
    production: process.env.REACT_APP_API_CORE_URL || 'https://qe765aps3a.execute-api.us-east-1.amazonaws.com/dev',
    local: 'http://localhost:7000'
  },
  financial: {
    production: process.env.REACT_APP_API_FINANCIAL_URL || 'https://l1nfx233y1.execute-api.us-east-1.amazonaws.com/dev',
    local: 'http://localhost:7001'
  },
  lifestyle: {
    production: process.env.REACT_APP_API_LIFESTYLE_URL || 'https://kstxcg0o0g.execute-api.us-east-1.amazonaws.com/dev',
    local: 'http://localhost:7002'
  }
};

// Helper para obtener la URL según el entorno
const getApiUrl = (service) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? API_CONFIG[service].production : API_CONFIG[service].local;
};

class PocketsAPI {
  constructor() {
    this.coreURL = getApiUrl('core');
    this.financialURL = getApiUrl('financial');
    this.lifestyleURL = getApiUrl('lifestyle');
    this.token = null;
  }
  
  // Método helper para determinar qué servicio usar según el endpoint
  getServiceForEndpoint(endpoint) {
    if (endpoint.startsWith('/auth/') || 
        endpoint.startsWith('/bank-accounts') || 
        endpoint.startsWith('/budgets') || 
        endpoint.startsWith('/transactions') || 
        endpoint.startsWith('/exchange-rates')) {
      return 'core';
    } else if (endpoint.startsWith('/debts') || 
               endpoint.startsWith('/debtors') || 
               endpoint.startsWith('/cards') || 
               endpoint.startsWith('/credit-cards') || 
               endpoint.startsWith('/subscriptions') || 
               endpoint.startsWith('/cryptocurrencies') || 
               endpoint.startsWith('/wallets') || 
               endpoint.startsWith('/cdts') || 
               endpoint.startsWith('/projects')) {
      return 'financial';
    } else if (endpoint.startsWith('/routines') || 
               endpoint.startsWith('/routine-completions') || 
               endpoint.startsWith('/events') || 
               endpoint.startsWith('/notes') || 
               endpoint.startsWith('/secrets') || 
               endpoint.startsWith('/notifications') || 
               endpoint.startsWith('/crypto-exchange-rates')) {
      return 'lifestyle';
    }
    return 'core'; // Default
  }
  
  // Método helper para obtener la URL base según el servicio
  getBaseURL(service) {
    switch(service) {
      case 'core': return this.coreURL;
      case 'financial': return this.financialURL;
      case 'lifestyle': return this.lifestyleURL;
      default: return this.coreURL;
    }
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
    // Determinar qué servicio usar según el endpoint
    const service = this.getServiceForEndpoint(endpoint);
    const baseURL = this.getBaseURL(service);
    const url = `${baseURL}${endpoint}`;
    
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

  async createRoutine(routineData) {
    return this.request('/routines', {
      method: 'POST',
      body: routineData,
    });
  }

  async getRoutines(routineId = null) {
    const url = routineId ? `/routines?id=${routineId}` : '/routines';
    return this.request(url, {
      method: 'GET',
    });
  }

  async updateRoutine(routineId, routineData) {
    return this.request(`/routines/${routineId}`, {
      method: 'PUT',
      body: routineData,
    });
  }

  async deleteRoutine(routineId) {
    return this.request(`/routines/${routineId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllRoutines() {
    return this.request('/routines', {
      method: 'DELETE',
    });
  }

  async createRoutineCompletion(completionData) {
    return this.request('/routine-completions', {
      method: 'POST',
      body: completionData,
    });
  }

  async getRoutineCompletions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.id) params.append('id', filters.id);
    if (filters.routine_id) params.append('routine_id', filters.routine_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    return this.request(`/routine-completions${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  }

  async updateRoutineCompletion(completionId, completionData) {
    return this.request(`/routine-completions/${completionId}`, {
      method: 'PUT',
      body: completionData,
    });
  }

  async deleteRoutineCompletion(completionId) {
    return this.request(`/routine-completions/${completionId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllRoutineCompletions(routineId = null) {
    const url = routineId 
      ? `/routine-completions?routine_id=${routineId}`
      : '/routine-completions';
    return this.request(url, {
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
export const api = new PocketsAPI();
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


