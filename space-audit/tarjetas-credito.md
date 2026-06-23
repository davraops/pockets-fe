# Space Audit — Tarjetas de crédito

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/tarjetas-credito`  
**Archivos:** `TarjetasCredito.tsx`, `TarjetasCredito.css`, `crud-card-rows.css`, `crud.css`  
**Score Space:** **3.9 / 5**

---

## Resumen ejecutivo

CRUD de tarjetas de crédito con uso de cupo por fila. Tras el polish: **CTA visible**, resumen unificado, beneficios en toolbar.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 1 (P2 — banner de uso responsable) |

---

## Mapa de layout

```
[← Finanzas]  [🏷 beneficios]  [⋮ debug — condicional]
Tarjetas de Crédito (h1)
┌── crud-summary-strip ──────────────────────┐
│ Cupo total | Disponible                    │
└────────────────────────────────────────────┘
[ Agregar tarjeta — btn-submit ]
[ credit-warning-banner ]
[ crud-card-list — filas con progreso cupo ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.8 | Strip + CTA + banner educativo fijo |
| **Jerarquía visual** | 4.0 | Resumen → CTA → aviso → filas |
| **Botones y acciones** | 4.2 | CTA visible; beneficios en toolbar; ⋮ solo debug |
| **Densidad / escaneo** | 3.8 | Card rows con barra de cupo |
| **Consistencia de layout** | 4.0 | Strip + CTA alineados con resto Finanzas |
| **Legibilidad tipográfica** | 4.0 | Sentence case en strip |

**Promedio:** **3.9 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 summary centrado | `crud-summary-strip` full-width |
| P1 beneficios en ⋮ | Botón LocalOffer en toolbar |
| Resumen condicional | Strip siempre visible |
| Empty CTA duplicado | Un solo CTA arriba |

---

## Abierto

| P | Issue |
|---|-------|
| P2 | `credit-warning-banner` siempre visible — colapsable o link |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip, beneficios toolbar — **3.9/5** |
| 2026-06-22 | Estimación inicial — ~2.5/5 |
