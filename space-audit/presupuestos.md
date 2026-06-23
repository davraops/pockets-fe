# Space Audit — Presupuestos

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/presupuestos`  
**Archivos:** `Presupuestos.tsx`, `Presupuestos.css`, `crud-list-rows.css`, `crud.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

CRUD de presupuestos con barra de progreso por ítem. Tras el polish: **CTA visible**, resumen unificado, archivados en toolbar.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [📦 archivados]  [⋮ debug — condicional]
Presupuestos (h1)
┌── crud-summary-strip--success ─────────────┐
│ Presupuestado | Gastado | Disponible       │
└────────────────────────────────────────────┘
[ Agregar presupuesto — btn-submit ]
┌── glass-group ─────────────────────────────┐
│ crud-inset-row--tall × N (+ progreso)      │
└────────────────────────────────────────────┘
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Strip + CTA fijos; filas tall con progreso inline |
| **Jerarquía visual** | 4.2 | Resumen → CTA → filas |
| **Botones y acciones** | 4.2 | CTA visible; archivados en toolbar; ⋮ solo debug |
| **Densidad / escaneo** | 4.0 | % usado + gastado/máximo en secondary |
| **Consistencia de layout** | 4.2 | Patrón alineado con Cuentas/Transacciones |
| **Legibilidad tipográfica** | 4.0 | Labels sentence case en strip |

**Promedio:** **4.0 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P1 archivados en ⋮ | Botón Archive en toolbar |
| Empty CTA duplicado | Un solo CTA arriba |
| Click-outside menú roto | `menuRef` |
| CSS muerto | `add-budget-button`, `budgets-summary-block` |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, archivados toolbar — **4.0/5** |
| 2026-06-22 | Estimación inicial — ~2.5/5 (strip ya migrado) |
