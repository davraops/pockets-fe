# Space Audit — Cripto Wallet

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/cripto-wallet`  
**Archivos:** `CriptoWallet.tsx`, `CriptoWallet.css`, `crud-crypto-rows.css`, `crud.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

CRUD de direcciones y wallets cripto. Primera pantalla del **sub-hub cripto**.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `btn-submit` bajo el resumen |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Finanzas]  [⋮ debug — condicional]
Cripto Wallet (h1)
┌── crud-summary-strip ──────────────────────┐
│ Total | Criptos | Bitcoin | Ethereum      │
└────────────────────────────────────────────┘
[ Agregar wallet — btn-submit ]
[ crud-crypto-list — filas wallet ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Strip + CTA; toolbar estándar |
| **Jerarquía visual** | 4.0 | Resumen → CTA → filas |
| **Botones y acciones** | 4.2 | CTA visible; ⋮ solo debug |
| **Densidad / escaneo** | 3.9 | Dirección truncada en meta |
| **Consistencia de layout** | 4.0 | `crud-crypto-row` compartido |
| **Legibilidad tipográfica** | 4.0 | Sentence case en strip |

**Promedio:** **4.0 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Agregar en ⋮ | `crud-primary-cta` visible |
| P0 Sin resumen | `crud-summary-strip` 4 cols |
| P1 Toolbar custom | `app-toolbar` estándar |
| P3 empty CTA duplicado | CTA único arriba |
| P3 Ancho estrecho | `app-page-content-wide` |

---

## Abierto

_Ninguno._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | CTA visible, strip, crud-crypto-row — **4.0/5** |
