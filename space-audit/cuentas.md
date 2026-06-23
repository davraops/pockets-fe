# Space Audit — Cuentas

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/cuentas`  
**Archivos:** `Cuentas.tsx`, `Cuentas.css`, `crud-list-rows.css`, `crud.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

CRUD de cuentas bancarias. Tras el polish: **CTA visible**, resumen unificado con tasas y total, filas inset ya alineadas con el resto de Finanzas.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
Cuentas (h1)
┌── crud-summary-strip ──────────────────────┐
│ USD | EUR | Total                          │
└────────────────────────────────────────────┘
[ Agregar cuenta — btn-submit ]
┌── glass-group ─────────────────────────────┐
│ crud-inset-row × N (nombre + balance)      │
└────────────────────────────────────────────┘
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Strip full-width; CTA fijo antes de lista |
| **Jerarquía visual** | 4.2 | Resumen → CTA → filas |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 4.0 | Lista inset compacta; meta banco/tarjetas |
| **Consistencia de layout** | 4.2 | Mismo patrón que Transacciones (strip + CTA + inset) |
| **Legibilidad tipográfica** | 4.0 | Labels sentence case en strip |

**Promedio:** **4.0 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 resumen centrado | `crud-summary-strip` (USD, EUR, Total) |
| P2 labels ALL CAPS | Strip compartido con sentence case |
| Empty CTA duplicado | Un solo CTA arriba |
| Click-outside menú roto | `menuRef` en toolbar |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip, menú debug — **4.0/5** |
| 2026-06-22 | Estimación inicial — 2.6/5 |
