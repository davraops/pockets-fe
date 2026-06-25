# Pockets Services Architecture

## Overview

El proyecto Pockets está dividido en **3 servicios Serverless independientes** para evitar el límite de 500 recursos por stack de CloudFormation. Cada servicio tiene su propio API Gateway y endpoints únicos.

## Servicios

### 1. **pockets-core** (Servicio Principal)
**Archivo:** `serverless-core.yml`  
**Puerto Local:** 7000 (desarrollo offline)  
**Funciones:** 26

**Responsabilidades:**
- Autenticación (register, login)
- Cuentas bancarias (CRUD + recalculate balance)
- Presupuestos (CRUD completo con soft delete, restore, reset, recalculate)
- Borradores de Presupuestos (CRUD para guardar drafts en formato JSON)
- Transacciones (CRUD)
- Tasas de cambio fiat (USD/EUR)

**Endpoints Base:**
- Producción: `https://qe765aps3a.execute-api.us-east-1.amazonaws.com/dev`
- Local: `http://localhost:5000`

**Funciones Incluidas:**
- `register`, `login`, `updateUserDetails` (nuevo - actualizar detalles de usuario)
- `createBankAccount`, `getBankAccounts`, `updateBankAccount`, `deleteBankAccount`, `deleteAllBankAccounts`, `recalculateBalance`
- `createBudget`, `getBudgets`, `updateBudget`, `deleteBudget`, `deleteAllBudgets`, `restoreBudget`, `hardDeleteBudget`, `hardDeleteAllBudgets`, `recalculateBudget`, `resetBudgets`, `resetBudget`
- `createBudgetDraft`, `getBudgetDrafts`, `updateBudgetDraft`, `deleteBudgetDraft`, `deleteAllBudgetDrafts` (nuevo - borradores de presupuestos)
- `createTransaction`, `getTransactions`, `deleteTransaction`, `deleteAllTransactions`
- `createExchangeRate`, `getExchangeRates`, `syncExchangeRates`

**Endpoints Desplegados:**
- `POST /auth/register`, `POST /auth/login`, `PUT /user-details` (nuevo)
- `POST /bank-accounts`
- `GET /bank-accounts`
- `DELETE /bank-accounts`
- `PUT /bank-accounts/{id}`
- `DELETE /bank-accounts/{id}`
- `POST /bank-accounts/{id}/recalculate-balance`
- `POST /budgets`
- `GET /budgets`
- `PUT /budgets/{id}`
- `DELETE /budgets`
- `DELETE /budgets/{id}`
- `POST /budgets/{id}/restore`
- `DELETE /budgets/{id}/hard`
- `DELETE /budgets/hard`
- `POST /budgets/{id}/recalculate`
- `POST /budgets/reset`
- `POST /budgets/{id}/reset`
- `POST /budget-drafts`, `GET /budget-drafts`, `PUT /budget-drafts/{id}`, `DELETE /budget-drafts/{id}`, `DELETE /budget-drafts` (nuevo - borradores de presupuestos)
- `POST /transactions`
- `GET /transactions`
- `DELETE /transactions/all`
- `DELETE /transactions/{id}`
- `POST /exchange-rates`
- `GET /exchange-rates`
- `GET /exchange-rates/sync`

---

### 2. **pockets-financial** (Activos y Pasivos Financieros)
**Archivo:** `serverless-financial.yml`  
**Puerto Local:** 7001 (desarrollo offline)  
**Funciones:** 39

**Responsabilidades:**
- Deudas y deudores
- Tarjetas (débito y crédito)
- Suscripciones
- Criptomonedas
- Wallets
- CDTs (Certificados de Depósito a Término)
- Proyectos

**Endpoints Base:**
- Producción: `https://l1nfx233y1.execute-api.us-east-1.amazonaws.com/dev`
- Local: `http://localhost:5001`

**Funciones Incluidas:**
- `createDebt`, `getDebts`, `updateDebt`, `deleteDebt`, `deleteAllDebts`
- `createDebtor`, `getDebtors`, `updateDebtor`, `deleteDebtor`, `deleteAllDebtors`
- `createCard`, `getCards`, `updateCard`, `deleteCard`, `deleteAllCards`
- `createCreditCard`, `getCreditCards`, `updateCreditCard`, `deleteCreditCard`, `deleteAllCreditCards`
- `createSubscription`, `getSubscriptions`, `updateSubscription`, `deleteSubscription`, `deleteAllSubscriptions`
- `createCryptocurrency`, `getCryptocurrencies`, `updateCryptocurrency`, `deleteCryptocurrency`, `deleteAllCryptocurrencies`
- `createWallet`, `getWallets`, `updateWallet`, `deleteWallet`, `deleteAllWallets`
- `createCDT`, `getCDTs`, `updateCDT`, `deleteCDT`, `deleteAllCDTs`
- `createProject`, `getProjects`, `updateProject`, `deleteProject`, `deleteAllProjects`

**Endpoints Desplegados:**
- `POST /debts`, `GET /debts`, `PUT /debts/{id}`, `DELETE /debts/{id}`, `DELETE /debts`
- `POST /debtors`, `GET /debtors`, `PUT /debtors/{id}`, `DELETE /debtors/{id}`, `DELETE /debtors`
- `POST /cards`, `GET /cards`, `PUT /cards/{id}`, `DELETE /cards/{id}`, `DELETE /cards`
- `POST /credit-cards`, `GET /credit-cards`, `PUT /credit-cards/{id}`, `DELETE /credit-cards/{id}`, `DELETE /credit-cards`
- `POST /subscriptions`, `GET /subscriptions`, `PUT /subscriptions/{id}`, `DELETE /subscriptions/{id}`, `DELETE /subscriptions`
- `POST /cryptocurrencies`, `GET /cryptocurrencies`, `PUT /cryptocurrencies/{id}`, `DELETE /cryptocurrencies/{id}`, `DELETE /cryptocurrencies`
- `POST /wallets`, `GET /wallets`, `PUT /wallets/{id}`, `DELETE /wallets/{id}`, `DELETE /wallets`
- `POST /cdts`, `GET /cdts`, `PUT /cdts/{id}`, `DELETE /cdts/{id}`, `DELETE /cdts`
- `POST /projects`, `GET /projects`, `PUT /projects/{id}`, `DELETE /projects/{id}`, `DELETE /projects`

---

### 3. **pockets-lifestyle** (Rutinas y Estilo de Vida)
**Archivo:** `serverless-lifestyle.yml`  
**Puerto Local:** 7002 (desarrollo offline)  
**Funciones:** 67

**Responsabilidades:**
- Rutinas y completaciones
- Eventos
- Notas
- Diario (entradas diarias) - Sistema simple con fecha y contenido
- Archivos/Documentos - Sistema de subida y gestión de archivos en S3 (PDFs, documentos, < 25MB)
- Procesos Judiciales - Endpoints proxy para consultar procesos desde la API de la Rama Judicial de Colombia, con sistema de seguimiento automático y notificaciones
- Listas de Mercado - Sistema simple para guardar listas de compras en formato JSON
- Empleados - Sistema simple para guardar registros de empleados en formato JSON
- Crypto Vendors - Sistema simple para guardar vendedores que aceptan criptomonedas en formato JSON
- Vehículos - Sistema simple para guardar información de vehículos en formato JSON
- Patrimonio - Sistema simple para guardar items valiosos del patrimonio en formato JSON (fecha de compra, valor de compra, etc.)
- Contratos - Sistema simple para guardar contratos activos en formato JSON (fecha inicio, fecha fin, valor, partes, términos, etc.)
- Actividades de Clientes - Sistema simple para guardar actividades con clientes en formato JSON (reuniones, llamadas, seguimientos, propuestas, etc.)
- Secretos
- Notificaciones - Sistema completo de notificaciones con filtros y paginación
- Funciones programadas (scheduled)

**Endpoints Base:**
- Producción: `https://kstxcg0o0g.execute-api.us-east-1.amazonaws.com/dev`
- Local: `http://localhost:5002`

**Funciones Incluidas:**
- `createRoutine`, `getRoutines`, `getRoutinesByDate`, `updateRoutine`, `deleteRoutine`, `deleteAllRoutines`
- `createRoutineCompletion`, `getRoutineCompletions`, `deleteRoutineCompletion`
- `checkRoutineStreaks` (scheduled - diario 1 AM UTC-5)
- `syncAllExchangeRates` (scheduled - diario 1 AM UTC-5)
- `createEvent`, `getEvents`, `updateEvent`, `deleteEvent`, `deleteAllEvents`
- `syncCryptoExchangeRates` (HTTP endpoint)
- `createNote`, `getNotes`, `updateNote`, `deleteNote`, `deleteAllNotes`
- `createDiaryEntry`, `getDiaryEntries`, `updateDiaryEntry`, `deleteDiaryEntry` (diario simple)
- `uploadFile`, `getFiles`, `getFile`, `deleteFile` (gestión de archivos en S3)
- `getJudicialProcesses`, `getJudicialProcessActuaciones` (proxy para procesos judiciales)
- `createJudicialProcessTracking`, `getJudicialProcessTracking`, `deleteJudicialProcessTracking` (nuevo - seguimiento de procesos)
- `checkJudicialProcessActuaciones` (scheduled - diario 3 AM UTC-5 para verificar nuevas actuaciones)
- `createShoppingList`, `getShoppingLists`, `updateShoppingList`, `deleteShoppingList`, `deleteAllShoppingLists` (nuevo - listas de mercado)
- `createEmployee`, `getEmployees`, `updateEmployee`, `deleteEmployee`, `deleteAllEmployees` (nuevo - empleados)
- `createCryptoVendor`, `getCryptoVendors`, `updateCryptoVendor`, `deleteCryptoVendor`, `deleteAllCryptoVendors` (nuevo - vendedores que aceptan cripto)
- `createVehicle`, `getVehicles`, `updateVehicle`, `deleteVehicle`, `deleteAllVehicles` (nuevo - vehículos)
- `createPatrimony`, `getPatrimony`, `updatePatrimony`, `deletePatrimony`, `deleteAllPatrimony` (nuevo - patrimonio/items valiosos)
- `createContract`, `getContracts`, `updateContract`, `deleteContract`, `deleteAllContracts` (nuevo - contratos activos)
- `createClientActivity`, `getClientActivities`, `updateClientActivity`, `deleteClientActivity`, `deleteAllClientActivities` (nuevo - actividades de clientes)
- `createSecret`, `getSecrets`, `updateSecret`, `verifySecret`, `getSecretValue`, `deleteSecret`, `deleteAllSecrets`
- `createNotification`, `getNotifications`, `markNotificationRead`, `deleteNotification`, `markAllNotificationsRead`, `deleteAllNotifications` (createNotification nuevo)

**Endpoints Desplegados:**
- `POST /routines`, `GET /routines`, `GET /routines/by-date`, `PUT /routines/{id}`, `DELETE /routines/{id}`, `DELETE /routines`
- `POST /routine-completions`, `GET /routine-completions`, `DELETE /routine-completions/{id}`
- `POST /events`, `GET /events`, `PUT /events/{id}`, `DELETE /events/{id}`, `DELETE /events`
- `GET /crypto-exchange-rates/sync`
- `POST /notes`, `GET /notes`, `PUT /notes/{id}`, `DELETE /notes/{id}`, `DELETE /notes`
- `POST /diary-entries`, `GET /diary-entries`, `PUT /diary-entries/{id}`, `DELETE /diary-entries/{id}`
- `POST /files`, `GET /files`, `GET /files/{id}`, `DELETE /files/{id}` (gestión de archivos)
- `GET /judicial-processes`, `GET /judicial-processes/{idProceso}/actuaciones` (procesos judiciales)
- `POST /judicial-processes/tracking`, `GET /judicial-processes/tracking`, `DELETE /judicial-processes/tracking/{id}` (nuevo - seguimiento de procesos)
- `POST /shopping-lists`, `GET /shopping-lists`, `PUT /shopping-lists/{id}`, `DELETE /shopping-lists/{id}`, `DELETE /shopping-lists` (nuevo - listas de mercado)
- `POST /employees`, `GET /employees`, `PUT /employees/{id}`, `DELETE /employees/{id}`, `DELETE /employees` (nuevo - empleados)
- `POST /crypto-vendors`, `GET /crypto-vendors`, `PUT /crypto-vendors/{id}`, `DELETE /crypto-vendors/{id}`, `DELETE /crypto-vendors` (nuevo - vendedores que aceptan cripto)
- `POST /vehicles`, `GET /vehicles`, `PUT /vehicles/{id}`, `DELETE /vehicles/{id}`, `DELETE /vehicles` (nuevo - vehículos)
- `POST /patrimony`, `GET /patrimony`, `PUT /patrimony/{id}`, `DELETE /patrimony/{id}`, `DELETE /patrimony` (nuevo - patrimonio/items valiosos)
- `POST /contracts`, `GET /contracts`, `PUT /contracts/{id}`, `DELETE /contracts/{id}`, `DELETE /contracts` (nuevo - contratos activos)
- `POST /client-activities`, `GET /client-activities`, `PUT /client-activities/{id}`, `DELETE /client-activities/{id}`, `DELETE /client-activities` (nuevo - actividades de clientes)
- `POST /hiring-processes`, `GET /hiring-processes`, `PUT /hiring-processes/{id}`, `DELETE /hiring-processes/{id}`, `DELETE /hiring-processes` (nuevo - procesos de contratación)
- `POST /secrets`, `GET /secrets`, `PUT /secrets/{id}`, `POST /secrets/{id}/verify`, `POST /secrets/{id}/value`, `DELETE /secrets/{id}`, `DELETE /secrets`
- `POST /notifications`, `GET /notifications`, `PUT /notifications/{id}/read`, `DELETE /notifications/{id}`, `POST /notifications/mark-all-read`, `DELETE /notifications`

---

## Despliegue

### Desplegar Todos los Servicios

```bash
# Desplegar todos los servicios
npm run deploy:all

# O desplegar individualmente
npm run deploy:core
npm run deploy:financial
npm run deploy:lifestyle
```

### Desplegar un Servicio Específico

```bash
# Core
serverless deploy --config serverless-core.yml

# Financial
serverless deploy --config serverless-financial.yml

# Lifestyle
serverless deploy --config serverless-lifestyle.yml
```

### Desarrollo Local

```bash
# Core (puerto 7000)
serverless offline --config serverless-core.yml

# Financial (puerto 7001)
serverless offline --config serverless-financial.yml

# Lifestyle (puerto 7002)
serverless offline --config serverless-lifestyle.yml
```

---

## Configuración del Frontend

El frontend debe configurar **3 URLs base** diferentes, una para cada servicio:

```javascript
// Configuración de APIs
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

// Ejemplo de uso
const API_BASE = process.env.NODE_ENV === 'production' 
  ? API_CONFIG.core.production 
  : API_CONFIG.core.local;

// Para endpoints de otros servicios
const FINANCIAL_API = process.env.NODE_ENV === 'production'
  ? API_CONFIG.financial.production
  : API_CONFIG.financial.local;

const LIFESTYLE_API = process.env.NODE_ENV === 'production'
  ? API_CONFIG.lifestyle.production
  : API_CONFIG.lifestyle.local;
```

---

## Distribución de Funciones

| Servicio | Funciones | Recursos Aprox. | Descripción |
|----------|-----------|-----------------|-------------|
| **pockets-core** | 26 | ~150-200 | Funciones financieras principales y autenticación |
| **pockets-financial** | 39 | ~200-250 | Activos y pasivos financieros |
| **pockets-lifestyle** | 67 | ~200-250 | Rutinas, eventos, notas, diario, archivos, listas de mercado, empleados, crypto vendors, vehículos, patrimonio, contratos, actividades de clientes, secretos, notificaciones |
| **Total** | **97** | **~530-670** | Todos los servicios combinados |

---

## Notas Importantes

1. **Autenticación:** Todos los servicios comparten el mismo `JWT_TOKEN_PASSPHRASE` para mantener la compatibilidad de tokens entre servicios.

2. **CORS:** Todos los servicios tienen la misma configuración CORS para permitir requests desde los mismos orígenes.

3. **Base de Datos:** Todos los servicios comparten la misma base de datos PostgreSQL.

4. **Variables de Entorno:** Todos los servicios usan el mismo archivo `.env` con `serverless-dotenv-plugin`.

5. **Scheduled Functions:** Las funciones programadas (`checkRoutineStreaks`, `syncAllExchangeRates`) están en `pockets-lifestyle`.

6. **Migraciones:** Las migraciones de base de datos se ejecutan una vez y aplican a todos los servicios.

---

## Migración desde Servicio Único

Si estás migrando desde el servicio único (`serverless.yml`):

1. **Backup:** Guarda el archivo `serverless.yml` original
2. **Despliegue:** Despliega los 3 nuevos servicios
3. **Actualización Frontend:** Actualiza el frontend para usar las 3 URLs base
4. **Verificación:** Verifica que todos los endpoints funcionen correctamente
5. **Eliminación:** Una vez verificado, puedes eliminar el stack antiguo con `serverless remove`

---

## Troubleshooting

### Error: "Number of resources exceeds 500"
- Verifica que estés usando `serverless-plugin-split-stacks` en cada servicio
- Revisa la distribución de funciones entre servicios

### Error: "CORS not working"
- Verifica que la configuración CORS sea idéntica en los 3 servicios
- Asegúrate de que el origen esté en la lista de orígenes permitidos

### Error: "JWT token invalid"
- Verifica que `JWT_TOKEN_PASSPHRASE` sea el mismo en todos los servicios
- Asegúrate de que el token se esté enviando correctamente en los headers

---

## Contacto y Soporte

Para más información sobre la arquitectura o reportar problemas, consulta la documentación del proyecto o contacta al equipo de desarrollo.

