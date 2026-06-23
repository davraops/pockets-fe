# Space Audit — Subscripciones

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/subscripciones`  
**Archivos:** `Subscripciones.tsx`, `Subscripciones.css`, `crud-card-rows.css`, `crud.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

CRUD de subscripciones vinculadas a tarjetas de débito. Cierra el **sub-hub crédito** con el mismo patrón strip + CTA que el resto de Finanzas.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
Subscripciones (h1)
┌── crud-summary-strip ──────────────────────┐
│ Total | Mensual | Familiares | Individuales │
└────────────────────────────────────────────┘
[ Agregar subscripción — btn-submit ]
[ crud-card-list — filas subscription ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Strip + CTA; sin banner fijo |
| **Jerarquía visual** | 4.2 | Resumen → CTA → filas |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 4.0 | Precio + corte + tag familiar por fila |
| **Consistencia de layout** | 4.2 | Patrón unificado sub-hub crédito |
| **Legibilidad tipográfica** | 4.0 | Sentence case en strip |

**Promedio:** **4.0 / 5**

---

## Sub-hub crédito — resumen

| Pantalla | Score |
|----------|-------|
| Deudas | 3.9 |
| Me Deben | 3.9 |
| Tarjetas de crédito | 3.9 |
| Tarjetas de débito | 4.0 |
| **Subscripciones** | **4.0** |

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 summary centrado | `crud-summary-strip` |
| P2 labels ALL CAPS | Strip compartido |
| Resumen condicional | Strip siempre visible |
| Empty CTA duplicado | Un solo CTA arriba |
| Lista custom | `crud-card-list` |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip — **4.0/5**; sub-hub crédito cerrado |
| 2026-06-22 | Estimación inicial — ~2.5/5 |
