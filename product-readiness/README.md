# Product Readiness Audit — Pockets FE

Auditoría sección por sección para evaluar si cada módulo está listo para usuarios reales (no solo para desarrollo interno).

**Ver en el navegador (dev):** [http://localhost:3000/product-readiness](http://localhost:3000/product-readiness)

## Criterios de evaluación

Cada sub-módulo se califica en una escala **1–5**:

| Score | Significado |
|-------|-------------|
| **5** | Listo para producción: CRUD completo, errores visibles, empty states, sin deuda técnica bloqueante |
| **4** | Funcional con gaps menores (copy, polish, edge cases) |
| **3** | Usable pero con huecos importantes (CRUD incompleto, errores silenciosos, UX inconsistente) |
| **2** | Parcialmente implementado o frágil |
| **1** | Placeholder o no funcional |

### Dimensiones revisadas

- **Funcionalidad** — CRUD, integración API, reglas de negocio
- **UX** — loading, empty state, errores visibles, validación de formularios
- **Consistencia** — notificaciones vs `alert()`, copy, navegación (StatusBar)
- **Producción** — debug expuesto, `console.log` en flujos críticos, datos de prueba
- **Arquitectura** — servicio API correcto (core / financial / lifestyle)

## Autenticación y cuentas

Pockets FE es **invite-only**: no hay registro público ni flujo de recuperación de contraseña en la UI.

| Aspecto | Estado |
|---------|--------|
| Login (`/auth/login`) | ✅ Implementado |
| Registro de cuenta | ❌ No expuesto — cuentas creadas por administrador |
| Olvidé mi contraseña | ❌ Sin endpoint — copy en login indica contactar administrador |
| JWT + expiración | ✅ `isAuthenticated()` + redirect en 401 vía `AuthSessionRedirect` |

## Secciones de la app

| Sección | Ruta base | Documento | Score global | Estado |
|---------|-----------|-----------|:------------:|--------|
| **Finanzas** | `/finanzas` | [finanzas.md](./finanzas.md) | **5.0 / 5** | ✅ Production-ready |
| **Registros (Utilidades)** | `/registros` | [registros.md](./registros.md) | **5.0 / 5** | ✅ Production-ready |
| Lifestyle (Tiempo) | `/tiempo` | — | — | Pendiente |
| Notificaciones | `/notificaciones` | — | — | Pendiente |
| Justicia | `/justicia` | — | — | Pendiente |
| Trabajo | `/trabajo` | — | Pendiente |

## Resumen ejecutivo — Finanzas (2026-06-22)

- **17 pantallas**, ~20.5k líneas de código
- **16 módulos en 4/5**, Transacciones en **5/5**
- **Backend:** POST/PUT/DELETE transacciones atómicos (pockets-core)

## Resumen ejecutivo — Registros (2026-06-22)

- **9 pantallas**, ~7.6k líneas de código
- **7 módulos en 4/5**, Hub y Calculadora en **5/5**
- **P1–P4 cerrados** en FE; E2E en `e2e/smoke/registros.spec.ts`
- **Code-split:** Empleados, Vehículos, Secretos, Patrimonio (`React.lazy`)

\*E2E auth smoke corre sin credenciales; flujos CRUD requieren `E2E_USERNAME` / `E2E_PASSWORD`. Ver [e2e/README.md](../e2e/README.md).

## E2E (Playwright)

| Suite | Archivo | Backend |
|-------|---------|---------|
| Auth | `e2e/smoke/auth.spec.ts` | Opcional |
| Finanzas | `e2e/smoke/finanzas.spec.ts` | core + financial |
| Registros | `e2e/smoke/registros.spec.ts` | lifestyle |
| Tiempo | `e2e/smoke/tiempo.spec.ts` | lifestyle (metas, valores) |
| Trabajo | `e2e/smoke/trabajo.spec.ts` | lifestyle (hiring) |
| Archivos | `e2e/smoke/archivos.spec.ts` | lifestyle + S3 |
| Justicia | `e2e/smoke/justicia.spec.ts` | Mocked (sin Rama Judicial) |

```bash
npm run test:e2e:smoke          # todos los smoke
npm run test:e2e:nightly        # presigned upload (@nightly)
```

Stack local y variables: [e2e/README.md](../e2e/README.md).

## Cómo usar estos documentos

1. Revisar la tabla de prioridades (P0 → P3) de cada sección
2. Marcar ítems resueltos con fecha en el changelog de cada doc
3. Avanzar sección por sección hasta completar la tabla de arriba
