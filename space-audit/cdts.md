# Space Audit — CDTs

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/cdts`  
**Archivos:** `CDTs.tsx`, `CDTs.css`, `crud.css`, `crud-list-rows.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

CRUD de certificados de depósito a término. Primera pantalla del **sub-hub ahorro** con patrón strip + CTA unificado.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
CDTs (h1)
┌── crud-summary-strip --success ─────────────┐
│ Total | Invertido | Tasa prom. | Ganancia real │
└─────────────────────────────────────────────┘
[ Agregar CDT — btn-submit ]
[ glass-group — crud-inset-row --tall + progreso ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Strip + CTA; sin FAB flotante |
| **Jerarquía visual** | 4.0 | Resumen → CTA → filas con progreso |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 3.9 | Filas altas por barra de progreso |
| **Consistencia de layout** | 4.0 | Mismo patrón Finanzas CRUD |
| **Legibilidad tipográfica** | 4.0 | Sentence case en strip |

**Promedio:** **4.0 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ + FAB duplicado | `crud-primary-cta` visible; FAB eliminado |
| P0 Sin resumen | `crud-summary-strip--success` (4 métricas) |
| P2 subtitle redundante | Eliminado `cdts-page-subtitle` |
| Empty CTA duplicado | Un solo CTA arriba |
| Error inline en empty | Panel `finanzas-stats-retry-button` |
| CSS muerto | `cdts-fab`, `cdts-empty-button`, `cdts-list` |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip, sin FAB — **4.0/5** |
| 2026-06-22 | Estimación inicial — ~2.8/5 |
