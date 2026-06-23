# Space Audit — Tarjetas de débito

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/tarjetas-debito`  
**Archivos:** `TarjetasDebito.tsx`, `TarjetasDebito.css`, `crud-card-rows.css`, `crud.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

CRUD de tarjetas de débito vinculadas a cuentas. Tras el polish: **CTA visible**, resumen unificado con 4 métricas, filas card estándar.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
Tarjetas de Débito (h1)
┌── crud-summary-strip ──────────────────────┐
│ Total | Físicas | Virtuales | Subscripciones │
└──────────────────────────────────────────┘
[ Agregar tarjeta — btn-submit ]
[ crud-card-list — filas débito ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Strip + CTA; sin banner fijo extra |
| **Jerarquía visual** | 4.2 | Resumen → CTA → filas |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 4.0 | Meta chips por fila (tipo, vencimiento, subs) |
| **Consistencia de layout** | 4.2 | Patrón alineado con TC y resto Finanzas |
| **Legibilidad tipográfica** | 4.0 | Sentence case en strip |

**Promedio:** **4.0 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 summary centrado | `crud-summary-strip` full-width |
| P2 labels ALL CAPS | Strip compartido |
| Resumen condicional | Strip siempre visible |
| Empty CTA duplicado | Un solo CTA arriba |
| Lista custom | `crud-card-list` compartido |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip unificado — **4.0/5** |
| 2026-06-22 | Estimación inicial — ~2.5/5 |
