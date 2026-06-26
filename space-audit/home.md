# Space Audit — Home

**Última auditoría:** 2026-06-25 (scroll ownership)  
**Ruta:** `/`  
**Archivos:** `src/pages/Home.tsx`, `src/pages/Home.css`, `ui-patterns.css` (`hub-*`)  
**Complementa:** [ux-readiness/home.md](../ux-readiness/home.md) (UX 4.8/5), [scroll-ownership.md](./scroll-ownership.md)  
**Score Space:** **5 / 5**

---

## Resumen ejecutivo

Home usa **shell inmersivo** sin StatusBar ni Footer. El header y la toolbar quedan fijos en la card; **un solo scroll** en `.hub-home-body` (dashboard + launcher).

| Veredicto | Detalle |
|-----------|---------|
| **Referencia launcher** | ✅ Par con Login (animación, contraste alto) |
| **Scroll ownership** | ✅ Un owner (`.hub-home-body`) |
| **Hallazgos abiertos** | Ninguno |

---

## Mapa de layout

```
┌────────────────── viewport 100dvh ──────────────────┐
│  hub-shell-home (padding, sin chrome global)        │
│    ┌────────── hub-card-home (flex column) ─────┐   │
│    │  Pockets — Aplicaciones + saludo (fijo)   │   │
│    │  ┌ hub-home-body (overflow-y: auto) ────┐  │   │
│    │  │  main: HomeDashboard                 │  │   │
│    │  │  aside: lista de apps (glass-group)  │  │   │
│    │  └──────────────────────────────────────┘  │   │
│    └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 5 | 0px chrome; header fijo, cuerpo scrollea |
| **Jerarquía visual** | 5 | h1 único + saludo + dashboard + apps |
| **Botones y acciones** | 5 | Apps visibles; Salir en toolbar |
| **Densidad / escaneo** | 5 | Dashboard + filas de app; sin doble scroll |
| **Consistencia de layout** | 5 | hub-* + paridad auth-card |
| **Scroll ownership** | 5 | Sin `hub-home-main` / `hub-home-apps` con scroll |

**Promedio:** **5 / 5**

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-25 | Scroll ownership — un owner en `.hub-home-body` |
| 2026-06-22 | P4/P5 polish — footer fijo, paridad Login |
| 2026-06-22 | Shell inmersivo — **5/5** |
