# Space Audit — Finanzas hub

**Última auditoría:** 2026-06-22 (hallazgos abiertos resueltos)  
**Ruta:** `/finanzas` (+ sub-hubs `/credito`, `/cripto`, `/ahorro`)  
**Archivos:** `Finanzas.tsx`, `FinanzasSectionHub.tsx`, `ui-patterns.css`, `crud.css`, `AppPage.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

Hub de sección compacto con **10 filas** en raíz y **3 sub-hubs** para crédito, cripto y ahorro. Resumen + CTA visible; chrome vertical tokenizado; ancho unificado con CRUD (1200px).

| Veredicto | Detalle |
|-----------|---------|
| **Hallazgos abiertos** | Ninguno |
| **Sub-hubs** | `/finanzas/credito`, `/finanzas/cripto`, `/finanzas/ahorro` |

---

## Mapa de layout

```
/finanzas (hub raíz — 10 filas)
├── Cuentas y presupuestos (3)
├── Transacciones (2)
├── Crédito, cripto y ahorro (3 → sub-hubs)
└── Actividad (2)

/finanzas/credito → Deudas, TC, TD, Subscripciones
/finanzas/cripto  → Wallet, Mi Cripto, Vendedores
/finanzas/ahorro  → CDTs, Inflación
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.8 | Tokens chrome; hub raíz 10 filas |
| **Jerarquía visual** | 4.0 | Resumen → CTA → módulos → sub-hubs |
| **Botones y acciones** | 3.8 | CTA `btn-submit`; Reintentar `btn-secondary` |
| **Densidad / escaneo** | 4.2 | Sub-hubs; headers sentence case |
| **Consistencia de layout** | 4.2 | `hub-summary`, `crud-summary-strip`, ancho 1200px |
| **Legibilidad tipográfica** | 3.8 | Sentence case; `tabular-nums` |

**Promedio:** **4.0 / 5**

---

## Resueltos (ronda final)

| Hallazgo | Fix |
|----------|-----|
| P1 scroll largo | Sub-hubs crédito/cripto/ahorro; 16→10 filas |
| P1 chrome vertical | `--layout-chrome-offset-*` en `index.css` + `AppPage.css` |
| P2 summary duplicado | `crud-summary-strip` en Transacciones, Deudas, Presupuestos |
| P3 salto 800→1200px | `app-page-content-wide` en hub Finanzas |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Hallazgos abiertos cerrados — **4.0/5** |
| 2026-06-22 | Auditoría inicial + polish — 3.5/5 |
