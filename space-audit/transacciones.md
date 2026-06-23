# Space Audit — Transacciones

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/transacciones`  
**Archivos:** `Transacciones.tsx`, `Transacciones.css`, `crud-list-rows.css`, `crud-row-slots.css`, `crud-forms.css`  
**Score Space:** **4.2 / 5**

---

## Resumen ejecutivo

CRUD principal de movimientos. Tras el polish: **CTA visible**, resumen unificado, modal con secciones, **filas alineadas con el resto de CRUD** (`crud-inset-row` en `glass-group`).

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
Transacciones (h1)
┌── crud-summary-strip ──────────────────────┐
│ Ingresos | Egresos | Balance | Ahorro    │
└──────────────────────────────────────────┘
[ Agregar transacción — btn-submit ]
┌── glass-group ─────────────────────────────┐
│ crud-inset-row × N (tipo: accent + monto) │
└────────────────────────────────────────────┘
```

**Modal:** Información general → Cuenta y vínculos (toggles condicionales agrupados).

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Chrome tokenizado; CTA fijo; lista inset sin gap entre cards |
| **Jerarquía visual** | 4.2 | Resumen → CTA → filas en contenedor único |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 4.0 | Strip full-width; filas tall con meta en secondary |
| **Consistencia de layout** | 4.4 | Mismo patrón que Cuentas/Deudas (glass-group + inset) |
| **Legibilidad tipográfica** | 4.0 | Montos tabulares; acento por tipo |

**Promedio:** **4.2 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 summary duplicado | `crud-summary-strip` |
| P2 modal denso | `crud-form-section-title` × 2 |
| Empty CTA duplicado | Un solo CTA arriba |
| P3 filas card sueltas | `crud-inset-row` + `crud-row-accent-*` en `glass-group` |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Filas unificadas a crud-inset-row — **4.2/5** |
| 2026-06-22 | CTA visible, modal secciones, strip — **4.0/5** |
| 2026-06-22 | Estimación inicial — 2.5/5 |
