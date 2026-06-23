# Space Audit — Deudas

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/deudas`  
**Archivos:** `Deudas.tsx`, `Deudas.css`, `crud-card-rows.css`, `crud.css`  
**Score Space:** **3.9 / 5**

---

## Resumen ejecutivo

CRUD de deudas con barra de progreso por ítem. Tras el polish: **CTA visible**, resumen unificado siempre visible, orden por tasa en toolbar.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 1 (P2 — banner educativo largo) |

---

## Mapa de layout

```
[← Finanzas]  [↕ tasa]  [⋮ debug — condicional]
Deudas (h1)
┌── crud-summary-strip--danger ──────────────┐
│ Total adeudado | Activas | Tasa promedio   │
└────────────────────────────────────────────┘
[ Agregar deuda — btn-submit ]
[ debts-advice-banner — si hay deudas ]
[ crud-card-list — filas con progreso ]
```

**Nota:** `crud-card-row` es el patrón correcto aquí (barra de progreso + sombra por ítem), no `crud-inset-row`.

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.8 | Strip + CTA fijos; banner educativo largo |
| **Jerarquía visual** | 4.0 | Resumen → CTA → consejo → filas |
| **Botones y acciones** | 4.2 | CTA visible; orden en toolbar; ⋮ solo debug |
| **Densidad / escaneo** | 3.8 | Card rows con progreso; banner ocupa scroll |
| **Consistencia de layout** | 4.0 | Strip + CTA alineados con Cuentas/Transacciones |
| **Legibilidad tipográfica** | 4.0 | Labels sentence case en strip |

**Promedio:** **3.9 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 resumen solo con datos | Strip siempre visible ($0 si vacío) |
| P1 ordenar en ⋮ | Botón ↑/↓ en toolbar |
| Empty CTA duplicado | Un solo CTA arriba |
| CSS muerto | `debts-summary-block`, `add-debt-button` |

---

## Abierto

| P | Issue |
|---|-------|
| P2 | `debts-advice-banner` ~120px — colapsable o enlace a guía |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, orden toolbar, strip fijo — **3.9/5** |
| 2026-06-22 | Estimación inicial — 2.5/5 |
