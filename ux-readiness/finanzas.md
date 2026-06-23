# UX Readiness — Finanzas

**Última auditoría:** 2026-06-22 (revisión por sección)  
**Ruta:** `/finanzas` + 16 sub-rutas  
**Archivos clave:** `src/pages/Finanzas.tsx`, `Transacciones.tsx`, `Cuentas.tsx`, `Presupuestos.tsx`, `Deudas.tsx`, …  
**Product-readiness:** [finanzas.md](../product-readiness/finanzas.md) (CRUD, APIs)  
**Score global UX:** **5 / 5**

---

## Resumen ejecutivo

Finanzas es el **hub más grande** de Pockets: dashboard con estadísticas agregadas + 16 módulos CRUD. Tras P3–P4 el patrón UX es consistente en loading, empty, error, responsive y modales.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí — ninguna dimensión &lt; 3 |
| **Polish** | ✅ Sí — 10/12 dimensiones en 5 |
| **Referencia (5.0)** | ✅ Alcanzado — 12/12 dimensiones UX en 5 |

---

## Mapa del flujo

```
Home → /finanzas (hub)
  ├── Stats agregadas (Promise.allSettled)
  │     ├── Éxito total → filas con montos
  │     ├── Fallo parcial → banner amarillo + "No disponible" por fila
  │     └── Fallo total → toolbar + Reintentar + Volver al inicio
  └── Tap en fila → sub-módulo (/cuentas, /transacciones, …)
        ├── Loading → ListSkeleton en hub + CRUD
        ├── Error → toolbar + Reintentar + back a Finanzas
        └── Empty → icono + copy + CTA
```

**Shell:** `StatusBar` con títulos vía `getRouteTitle()`. Back "Volver a Finanzas" en sub-módulos.

---

## Tabla por dimensión (hub + módulos core)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 5 | `ListSkeleton` en hub + 15 módulos CRUD; borradores en Diseñador |
| **Empty state** | 5 | CTA en todos los módulos con lista vacía |
| **Error state** | 5 | Toolbar + Reintentar + `role="alert"` en todos los CRUD |
| **Formularios** | 5 | Modal Transacciones: `noValidate`, `aria-*`, foco al primer error |
| **Navegación** | 5 | 16 rutas enlazadas; sin huérfanas; back coherente |
| **Notificaciones** | 5 | `useNotification` en todos los CRUD; hub e Inflación N/A |
| **Accesibilidad** | 5 | Errores `role="alert"`; foco automático en campos inválidos |
| **Tema** | 5 | Dark/light en todas las superficies |
| **Responsive** | 5 | Filas con layout corregido; resumen en grid 2×2; modales scrollables |
| **Copy** | 5 | Español consistente; sin texto de debug en UI |
| **Modales** | 5 | Focus trap, Escape, `aria-modal` |
| **Confirmación destructiva** | 5 | `useConfirm()` en 28 páginas Finanzas |

**Promedio (12 dimensiones):** **5 / 5**

---

## Recorrido revisado (manual)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Cargar `/finanzas` | Skeleton de stats → filas con montos |
| 2 | API stats falla total | Toolbar + mensaje + Reintentar + Volver al inicio |
| 3 | API stats falla parcial | Banner amarillo; filas afectadas "No disponible" |
| 4 | Tap Cuentas → lista vacía | Empty + CTA "Agregar cuenta" |
| 5 | Tap Transacciones → error API | Back + Reintentar |
| 6 | Transacciones vacías | Empty + CTA "Agregar transacción" |
| 7 | Presupuestos / Deudas error | Back + Reintentar |
| 8 | Delete con confirm | `useConfirm()` in-app |
| 9 | Tema dark/light | Legible en hub y modales |
| 10 | 480px | Hub y listas usables |

---

## Fortalezas verificadas

- Hub con **degradación elegante** (`Promise.allSettled` + avisos por fila)
- **Error total del hub** con navegación (no deja al usuario atrapado)
- **ListSkeleton** en hub y 16 módulos (incl. Archivos)
- **Empty CTAs** en todos los módulos con lista vacía (incl. Tarjetas, Subscripciones, Listas)
- **Errores con Reintentar** en todos los módulos CRUD (+ Archivos)
- **Modal Transacciones** al nivel Login: `noValidate`, `aria-invalid`, foco al primer error
- `devError` / `devLog` / `devWarn` gateados en 15 páginas
- Patrón CRUD + modales alineado con el resto de la app
- Debug gateado (`isDebugToolsEnabled`)

---

## Hallazgos abiertos

Sin hallazgos abiertos — P5 completado (2026-06-22).

**Mantenimiento técnico (no UX score):** rollback manual en create/delete de Transacciones.

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Auditoría inicial UX; score 3.2 (estimado baseline) |
| 2026-06-22 | Hub loadError: toolbar + Volver al inicio |
| 2026-06-22 | Empty CTA: Transacciones, Presupuestos, Deudas |
| 2026-06-22 | Error + Reintentar: Transacciones, Presupuestos, Deudas |
| 2026-06-22 | `devError` en `Finanzas.tsx` |
| 2026-06-22 | P3: ListSkeleton en 17 pantallas; empty CTAs; devError/log gateados |
| 2026-06-22 | P4: error unificado (toolbar + Reintentar) en 9 módulos restantes |
| 2026-06-22 | Transacciones móvil: clases CSS corregidas, grid resumen, filas compactas |
| 2026-06-22 | P5: modal Transacciones al nivel Login (aria, foco, noValidate) |
| 2026-06-22 | Score **5 / 5** — referencia UX de sección |

---

## Plan de pruebas

- [ ] Hub con red lenta → skeleton visible antes de stats
- [ ] Simular fallo total de stats → Reintentar recupera datos
- [ ] Simular fallo de un endpoint → banner parcial + fila "No disponible"
- [ ] Lista vacía en Transacciones → CTA abre modal de alta
- [ ] Error en Presupuestos → back a Finanzas funciona
- [ ] Eliminar ítem → confirmación antes de borrar
- [ ] Teclado: Tab por filas del hub, Enter abre módulo
