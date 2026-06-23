# Space Audit — Vendedores de Cripto

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/crypto-vendors`  
**Archivos:** `CryptoVendors.tsx`, `CryptoVendors.css`  
**Score Space:** **3.7 / 5**

---

## Resumen ejecutivo

Pantalla **formulario + lista** (no modal CRUD). El CTA primario es el submit del formulario inline — patrón válido para alta frecuencia de campos.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ Submit visible en formulario |
| **Hallazgos abiertos** | 2 (P2) |

---

## Mapa de layout

```
[← Finanzas]  [📁 listas]  [⋮ debug]
Vendedores de Cripto (h1)
┌── crud-summary-strip ──────────────────────┐
│ Vendedores | Descuentos | Criptos | Lista │
└────────────────────────────────────────────┘
[ Formulario Agregar/Editar — secciones ]
[ Lista vendedores — cards densas ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.2 | Formulario largo antes de lista |
| **Jerarquía visual** | 3.8 | Strip → form → lista |
| **Botones y acciones** | 4.0 | Agregar en form; guardar lista visible |
| **Densidad / escaneo** | 3.2 | Items vendedor muy detallados |
| **Consistencia de layout** | 3.8 | Strip alineado; lista custom |
| **Legibilidad tipográfica** | 3.8 | Subtitle largo eliminado |

**Promedio:** **3.7 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P2 Sin resumen | `crud-summary-strip` con estado lista |
| P2 Subtitle largo | Eliminado; strip resume métricas |

---

## Abierto

| Prioridad | Hallazgo |
|-----------|----------|
| P2 | Formulario ocupa mucho vertical — considerar modal o pasos |
| P2 | `cryptovendors-item` denso — migrar a `crud-card-row` compacto |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Strip resumen — **3.7/5** |
