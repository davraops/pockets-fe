# Space Audit — Me Deben

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/me-deben`  
**Archivos:** `MeDeben.tsx`, `MeDeben.css`, `crud-card-rows.css`, `crud.css`  
**Score Space:** **3.9 / 5**

---

## Resumen ejecutivo

CRUD de personas que deben dinero. Tras el polish: **CTA visible**, resumen unificado con 5 métricas, filas card con progreso de cobro.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 1 (P3 — strip de 5 columnas en móvil) |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
Me Deben (h1)
┌── crud-summary-strip--success ─────────────┐
│ Total | Pendiente | Pagado | Pend. | OK  │
└────────────────────────────────────────────┘
[ Agregar deudor — btn-submit ]
[ crud-card-list — filas con progreso ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.8 | Strip de 5 cols + card rows altas |
| **Jerarquía visual** | 4.0 | Resumen → CTA → filas |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 3.8 | Progreso de cobro por fila; strip denso |
| **Consistencia de layout** | 4.0 | Strip + CTA alineados con resto Finanzas |
| **Legibilidad tipográfica** | 4.0 | Sentence case en strip |

**Promedio:** **3.9 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 summary centrado | `crud-summary-strip--success` full-width |
| P2 labels ALL CAPS | Strip compartido |
| Resumen condicional | Strip siempre visible |
| Empty CTA duplicado | Un solo CTA arriba |

---

## Abierto

| P | Issue |
|---|-------|
| P3 | Strip 5 columnas — wrap en móvil; considerar 3 métricas + detalle |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip unificado — **3.9/5** |
| 2026-06-22 | Estimación inicial — ~2.5/5 |
