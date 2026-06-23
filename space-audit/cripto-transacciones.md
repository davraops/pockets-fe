# Space Audit — Mi Cripto (Transacciones)

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/cripto-transacciones`  
**Archivos:** `CriptoTransacciones.tsx`, `CriptoTransacciones.css`, `crud-crypto-rows.css`  
**Score Space:** **3.9 / 5**

---

## Resumen ejecutivo

CRUD de posiciones y movimientos cripto con tasas USDT y filtro por activo.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 1 (P3) |

---

## Mapa de layout

```
[← Finanzas]  [↻ Sync tasas]  [⋮ debug]
Mi Cripto (h1)
┌── crud-summary-strip ───────────────────────────┐
│ Transacciones | Valor USDT | Posiciones | Tasas │
└─────────────────────────────────────────────────┘
[ Agregar transacción — btn-submit ]
[ Filtro select ]
[ crud-crypto-list ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.9 | Highlight cards eliminados → strip |
| **Jerarquía visual** | 4.0 | Resumen → CTA → filtro → lista |
| **Botones y acciones** | 4.2 | CTA + sync en toolbar |
| **Densidad / escaneo** | 3.8 | Filas crypto con fees y unidades |
| **Consistencia de layout** | 3.9 | Patrón Finanzas + filas cripto |
| **Legibilidad tipográfica** | 3.9 | Strip sentence case |

**Promedio:** **3.9 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar + sync en ⋮ | CTA visible; sync en toolbar |
| P0 Highlight cards por cripto | `crud-summary-strip` agregado |
| P1 Toolbar custom | `app-toolbar` estándar |
| P3 empty CTA duplicado | CTA único arriba |

---

## Abierto

| Prioridad | Hallazgo |
|-----------|----------|
| P3 | Filtro select custom — migrar a chips toolbar si crece catálogo |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Strip, CTA, sync toolbar — **3.9/5** |
