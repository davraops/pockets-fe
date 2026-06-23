# UX Readiness Audit — Pockets FE

Auditoría centrada en experiencia de usuario: feedback, navegación, accesibilidad, copy y consistencia visual. Complementa [product-readiness](../product-readiness/README.md), que cubre funcionalidad y arquitectura.

**Ruta en vivo:** `/ux-readiness`  
**Documentación:** `ux-readiness/` (este directorio)  
**Fecha de inicio:** 2026-06-22  
**Score global estimado:** **5.0 / 5**

---

## Criterios de evaluación

Cada dimensión se califica **1–5** por pantalla o sección:

| Score | Significado |
|-------|-------------|
| **5** | Referencia en la app: completo, accesible, sin deuda visible |
| **4** | Sólido con gaps menores (copy, polish) |
| **3** | Usable pero inconsistente con el resto de la app |
| **2** | Huecos importantes que afectan confianza o tareas clave |
| **1** | Bloqueante o ausente |

### Dimensiones UX

| Dimensión | Qué revisamos |
|-----------|---------------|
| **Loading** | Spinners, skeletons, botones deshabilitados durante submit |
| **Empty state** | Icono, copy, CTA primario |
| **Error state** | Visible al usuario (no solo `console.error`) |
| **Formularios** | Validación inline, `aria-*`, feedback al enviar |
| **Navegación** | Back, StatusBar, nombres coherentes entre hubs |
| **Notificaciones** | Toast vs `alert()` vs silencio |
| **Accesibilidad** | Labels, teclado, modales como diálogos |
| **Tema** | Dark/light en todas las superficies |
| **Responsive** | 768px / 480px, touch targets |
| **Copy** | Español consistente, sin texto de debug |
| **Modales** | Cierre, focus trap, Escape |
| **Confirmación destructiva** | Antes de eliminar o acciones irreversibles |

### Umbrales de release (sugeridos)

- **Ship:** ninguna dimensión en 1; P0 resueltos; promedio sección ≥ 3
- **Polish:** promedio sección ≥ 3.5; Login y flujos primarios ≥ 4

---

## Secciones de la app

| Sección | Ruta base | Documento | Score UX | Estado |
|---------|-----------|-----------|:--------:|--------|
| Baseline transversal | — | [baseline.md](./baseline.md) | **3.3** | ✅ Auditado |
| **Login** | `/login` | [login.md](./login.md) | **5** | ✅ Auditado 2026-06-22 |
| Home | `/` | [home.md](./home.md) | **4.8** | ✅ Auditado 2026-06-22 |
| **Finanzas** | `/finanzas` | [finanzas.md](./finanzas.md) | **5** | ✅ Auditado 2026-06-22 |
| Utilidades (Registros) | `/registros` | [registros.md](./registros.md) | **5** | ✅ Auditado 2026-06-22 |
| Lifestyle (Tiempo) | `/tiempo` | [tiempo.md](./tiempo.md) | **5** | ✅ Auditado 2026-06-22 |
| Notificaciones | `/notificaciones` | [notificaciones.md](./notificaciones.md) | **5** | ✅ Auditado 2026-06-22 |
| Justicia | `/justicia` | [justicia.md](./justicia.md) | **4.8** | ✅ Auditado 2026-06-22 |
| Trabajo | `/trabajo` | [trabajo.md](./trabajo.md) | **5** | ✅ Auditado 2026-06-22 |

---

## Resumen ejecutivo

### Fortalezas

- Patrón hub iOS Settings consistente en las 6 secciones principales
- `Login.tsx` como referencia de formulario accesible (`aria-*`, loading, errores inline)
- Sistema de toasts (`NotificationContext`) adoptado en ~31 pantallas
- Tema dark/light con variables CSS y `ThemeToggle` global
- `useConfirm()` + `ConfirmDialog` antes de deletes en 28 páginas (reemplaza `window.confirm`)

### Debilidades transversales (P0)

1. **`alert()`** en 5 páginas (11 llamadas) — rompe consistencia con toasts
2. **Copy `"Frontend says:"`** en 6 páginas de Finanzas — texto de debug visible
3. **Menús debug** (`isDebugModalOpen`) en 24 páginas — riesgo de borrado accidental
4. **Errores silenciosos** en hub Finanzas y badge de Home

### Prioridades globales

| # | Prioridad | Issue |
|---|-----------|-------|
| 1 | ~~P0~~ ✅ | ~~Eliminar `alert()` y `"Frontend says:"`~~ — resuelto 2026-06-22 |
| 2 | ~~P0~~ ✅ | ~~Gatear menús debug~~ — resuelto 2026-06-22 vía `debugTools.ts` |
| 3 | ~~P0~~ ✅ | ~~Error visible cuando fallan stats del hub Finanzas~~ — resuelto 2026-06-22 |
| 4 | ~~P1~~ ✅ | Empty states con CTA — Cuentas, Archivos, Me Deben, Proyectos |
| 5 | ~~P1~~ ✅ | `ModalOverlay` + focus trap + Escape en 28 páginas |
| 6 | ~~P1~~ ✅ | `useConfirm()` + diálogo in-app — 28 páginas |
| 7 | ~~P1~~ ✅ | StatusBar títulos vía `routeTitle.ts` |
| 8 | ~~P1~~ ✅ | Nombres unificados: Utilidades/Lifestyle (`hubLabels.ts`) |
| 9 | ~~P2~~ ✅ | Login: branding Pockets, autofocus, foco en error, toggle 44px |
| 10 | ~~P2~~ ✅ | Skeletons en Cuentas, Transacciones y hub Finanzas (`ListSkeleton`) |
| 11 | ~~P2~~ ✅ | Confirmación antes de logout en Home |
| 12 | ~~P3~~ ✅ | Utilidades: skeletons, error Reintentar, empty CTAs, devError |
| 13 | ~~P5~~ ✅ | Utilidades: formularios Login-level en modales CRUD |
| 14 | ~~P3–P5~~ ✅ | Lifestyle: skeletons, error, empty CTAs, formularios, devError |
| 15 | ~~P3~~ ✅ | Notificaciones: skeleton, error Reintentar, lista estable en acciones |
| 16 | ~~P3~~ ✅ | Justicia: Procesos UX + fetchUserDisplayName + hubLabels |

---

## Archivos de referencia (patrones a copiar)

| Patrón | Archivo |
|--------|---------|
| Formulario + a11y + loading | `src/pages/Login.tsx` |
| Toasts | `src/contexts/NotificationContext.tsx` |
| Empty + CTA | `src/pages/CDTs.tsx` |
| Confirmación | `src/contexts/ConfirmContext.tsx` |
| Confirmación rica | `src/pages/TarjetasDebito.tsx` (~1385) |
| List skeletons | `src/components/ListSkeleton.tsx` |
| Hub launcher | `src/pages/Home.tsx` |
| Hub navegación (lista) | `src/pages/Registros.tsx` |
| Empty con filtros | `src/pages/Notificaciones.tsx` |

---

## Cómo usar estos documentos

1. Leer [baseline.md](./baseline.md) para hallazgos transversales
2. Auditar sección por sección; crear `finanzas.md`, `registros.md`, etc.
3. Marcar ítems resueltos con fecha en el changelog de cada doc
4. Cruzar con product-readiness: un fix puede cerrar issues en ambos audits

## Relación con product-readiness

| Audit | Enfoque |
|-------|---------|
| **product-readiness** | CRUD, APIs, reglas de negocio, deuda técnica |
| **ux-readiness** | Percepción, feedback, accesibilidad, copy, consistencia |

Un módulo puede tener score funcional 4/5 y UX 3/5 (ej. Subscripciones: CRUD completo pero usa `alert()`).
