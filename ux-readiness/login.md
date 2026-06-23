# UX Readiness — Login

**Última auditoría:** 2026-06-22 (revisión por sección)  
**Ruta:** `/login`  
**Archivos:** `src/pages/Login.tsx`, `Login.css`  
**Integraciones:** `ProtectedRoute.tsx`, `api.login()` / `isAuthenticated()`, `errorTranslations.ts`, `ThemeToggle`, `StatusBar` (solo `document.title`)  
**Score global:** **4.9 / 5** — Referencia de formularios; listo para ship; gaps menores documentados abajo

---

## Resumen ejecutivo

Login es la pantalla con mejor UX de Pockets FE. Cubre el flujo crítico de entrada con validación accesible, feedback claro y preservación de deep links. Tras los fixes P2 (branding, autofocus, foco en error, toggle 44px) y esta revisión por sección, **no hay hallazgos P0 ni P1**.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí — ninguna dimensión &lt; 3 |
| **Polish** | ✅ Sí — promedio ≥ 4.5 |
| **Referencia** | Usar como plantilla para modales CRUD del resto de la app |

---

## Mapa del flujo

```
Usuario sin token válido
       │
       ▼
ProtectedRoute ──► Navigate /login + state.from (location completa)
       │
       ▼
Login.tsx
  ├── isAuthenticated()? → redirect a from.pathname o /
  ├── validateForm() → errores inline por campo
  ├── api.login() → token + expires_at en localStorage
  └── Éxito → navigate(from, replace)
       │
       ▼
Home o ruta protegida original
```

**Shell:** Sin `StatusBar` ni `Footer` visibles. `StatusBar` retorna `null` en `/login` pero actualiza `document.title` a **"Pockets - Iniciar Sesión"**.

**Logout voluntario:** `Home` → `useConfirm()` → `api.logout()` → `/login` sin `state.from` (re-login lleva a `/`).

---

## Tabla por dimensión

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 5 | Inputs + toggle deshabilitados; submit `disabled` + `aria-busy` + spinner + "Iniciando sesión…" |
| **Empty state** | N/A | No aplica |
| **Error state** | 5 | Banner general `role="alert"` + foco programático; errores por campo; `getTranslatedErrorMessage` para API/red |
| **Formularios** | 5 | `noValidate` + validación custom; limpieza al tipear; `aria-invalid` / `aria-describedby`; `onInvalid` custom |
| **Navegación** | 5 | Post-login a `state.from`; sesión existente redirige sin mostrar formulario |
| **Notificaciones** | 5 | Errores inline (correcto — no necesita toast en login) |
| **Accesibilidad** | 5 | Labels, toggle 44px, autofocus, foco al error; `<h1>` incluye "Pockets" audible para SR |
| **Tema** | 5 | `ThemeToggle` en card; variables CSS; gradiente adaptativo dark/light |
| **Responsive** | 5 | `100dvh` móvil; touch targets 48–52px; card con scroll interno |
| **Copy** | 5 | Español consistente; marca visible en `<h1>` |
| **Modales** | N/A | No aplica |
| **Confirmación destructiva** | N/A | No aplica |

**Promedio:** **4.9 / 5** (redondeo visual en dashboard: **5 / 5**)

---

## Recorrido revisado (manual)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Abrir `/login` sin sesión | Formulario visible; foco en usuario |
| 2 | Submit vacío | Errores por campo; `aria-invalid` activo |
| 3 | Credenciales incorrectas | Banner rojo; foco al banner; mensaje en español |
| 4 | Credenciales correctas | Redirect a `/` o ruta `from` |
| 5 | Visitar `/login` con token válido | Redirect inmediato sin formulario |
| 6 | Deep link: `/finanzas/cuentas` sin token | Login → tras éxito vuelve a cuentas |
| 7 | Toggle contraseña | `aria-label` alterna; área táctil 44px |
| 8 | Submit durante loading | Doble envío bloqueado |
| 9 | Tema dark/light en card | Contraste legible en ambos modos |
| 10 | `prefers-reduced-motion` | Sin slideUp/shake/spinner animado |

---

## Fortalezas

### 1. Formulario — plantilla para el resto de la app

- Validación antes de red
- Errores limpian al tipear
- `aria-describedby` enlazado a `id` del mensaje de error

### 2. Submit bloqueado con feedback explícito

Al enviar: limpia errores previos, `isLoading`, deshabilita campos, muestra spinner inline.

### 3. Errores de red traducidos

`api.request()` envuelve fallos de fetch; `getTranslatedErrorMessage` muestra español al usuario (`invalid credentials` → "Credenciales incorrectas").

### 4. CSS con criterio a11y

- `prefers-reduced-motion: reduce`
- `prefers-contrast: high`
- Touch targets ≥ 44px en desktop, ≥ 48px en móvil

### 5. Integración ProtectedRoute

`state.from` preserva deep links tras autenticación.

### 6. Higiene transversal

Sin `alert()`, sin menús debug, sin `"Frontend says:"`.

---

## Hallazgos

### Resueltos en esta auditoría

| # | Issue | Fix |
|---|-------|-----|
| 1 | Wordmark "Pockets" con `aria-hidden` — SR no oía la marca | `<h1>` con `Pockets` + `Iniciar sesión` sin ocultar texto |
| 2 | Hover scale en ícono candado (confuso en touch) | Eliminado `.login-icon:hover { transform }` |

### Resueltos previamente (P2)

| # | Issue | Estado |
|---|-------|--------|
| 3 | Sin autofocus en usuario | ✅ `usernameRef` + focus en mount |
| 4 | Foco no iba al error general | ✅ `errorRef` + `tabIndex={-1}` |
| 5 | Toggle contraseña 40px | ✅ 44px en `Login.css` |

### ~~P3~~ ✅ — Resueltos (2026-06-22)

| # | Issue | Fix |
|---|-------|-----|
| 6 | `console.error` en catch | `devError()` — solo en DEV |
| 7 | Foco al primer campo inválido | `focusFirstInvalidField()` tras `validateForm` |
| 8 | Sin "Olvidé mi contraseña" | Copy: cuentas asignadas por administrador |
| 9 | Sin registro de cuenta | Documentado en `product-readiness/README.md` |
| 10 | 401 mid-session sin redirect | `pockets:auth-unauthorized` + `AuthSessionRedirect` |

---

## Integraciones relacionadas

### ProtectedRoute

Guarda `state.from` con la ubicación completa. Login usa `from.pathname` tras éxito.

**Gap transversal:** ~~en 401, `api.logout()` limpia token pero no navega a `/login`~~ ✅ Resuelto con `AuthSessionRedirect`.

### StatusBar / título

`document.title` = "Pockets - Iniciar Sesión" vía effect en `StatusBar.tsx` (L17–18). Barra visual correctamente oculta.

### ThemeToggle

`aria-label` y `aria-pressed` correctos. Usuario puede elegir tema antes de entrar; post-login hay toggle en StatusBar/Footer.

---

## Comparación con baseline app-wide

| Métrica | App | Login |
|---------|-----|-------|
| `alert()` | 0 ✅ | ✅ ausente |
| `window.confirm` | 0 ✅ | N/A |
| Errores solo consola | ⚠️ en algunas páginas | ✅ siempre visible |
| `aria-*` en forms | ⚠️ parcial | ✅ completo |
| Skeletons | 3 páginas | N/A (form estático) |

---

## Checklist de referencia (copiar a otros formularios)

- [ ] `noValidate` + validación explícita antes de API
- [ ] Errores por campo: `role="alert"` + `aria-invalid` + `aria-describedby`
- [ ] Limpiar error del campo al `onChange`
- [ ] Banner general con `role="alert"` + foco para fallos de servidor
- [ ] Submit: `disabled` + `aria-busy` + spinner + texto de progreso
- [ ] Deshabilitar inputs durante submit
- [ ] `getTranslatedErrorMessage` en catch
- [ ] `autoComplete="username"` / `current-password`
- [ ] Touch targets ≥ 44px
- [ ] `prefers-reduced-motion` para animaciones no esenciales
- [ ] Marca/app name en `<h1>` accesible (no solo visual con `aria-hidden`)

---

## Plan de pruebas (regresión Login)

```
[ ] Submit vacío → errores en usuario y contraseña
[ ] Usuario inválido → banner + foco en banner
[ ] Login OK desde /login → /
[ ] Login OK desde ruta protegida → vuelve a esa ruta
[ ] Token válido en /login → redirect sin form
[ ] Logout desde Home → confirm → login → re-login → /
[ ] Toggle tema en login persiste post-login
[ ] VoiceOver/NVDA: h1 anuncia "Pockets Iniciar sesión"
[ ] Teclado: Tab orden lógico usuario → contraseña → toggle → submit
```

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Auditoría inicial — score 4.5/5 |
| 2026-06-22 | P2: branding, autofocus, foco error, toggle 44px |
| 2026-06-22 | **P3:** devError, foco validación, copy invite-only, redirect 401 global |
