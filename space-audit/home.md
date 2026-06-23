# Space Audit — Home

**Última auditoría:** 2026-06-22 (re-auditoría + polish P4/P5)  
**Ruta:** `/`  
**Archivos:** `src/pages/Home.tsx`, `src/App.tsx`, `ui-patterns.css` (`hub-*`)  
**Complementa:** [ux-readiness/home.md](../ux-readiness/home.md) (UX 4.8/5)  
**Score Space:** **5 / 5**

---

## Resumen ejecutivo

Home usa **shell inmersivo** igual que Login: sin StatusBar ni Footer, viewport completo para el launcher. El footer (tema + Salir) queda **fijo al pie de la card**; solo el grid hace scroll en pantallas cortas.

| Veredicto | Detalle |
|-----------|---------|
| **Referencia launcher** | ✅ Par con Login (animación, contraste alto) |
| **Hallazgos abiertos** | Ninguno |

---

## Mapa de layout

```
┌────────────────── viewport 100dvh ──────────────────┐
│  hub-shell (padding lg, sin chrome global)          │
│    ┌────────── hub-card (flex column) ──────────┐   │
│    │  Pockets — Aplicaciones                    │   │
│    │  Hola, {nombre}                            │   │
│    │  ┌ hub-card-scroll (overflow) ─────────┐   │   │
│    │  │  [ flex wrap 7 × app-icon ]         │   │   │
│    │  └─────────────────────────────────────┘   │   │
│    │  ─── hub-card-footer (fijo) ───          │   │
│    │  mobile: [ ThemeToggle | Salir ]         │   │
│    │  desktop: [ ThemeToggle ] + [ Salir ]    │   │
│    └──────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 5 | 0px chrome; footer siempre visible en card |
| **Jerarquía visual** | 5 | h1 único + saludo + grid + footer |
| **Botones y acciones** | 5 | Apps visibles; Salir separado y accesible |
| **Densidad / escaneo** | 5 | Flex centrado (4+3); logout fuera del scan |
| **Consistencia de layout** | 5 | hub-* + paridad auth-card (animación, contraste) |
| **Legibilidad tipográfica** | 5 | auth-card-title; app-name sm |

**Promedio:** **5 / 5**

---

## Polish P4/P5 (2026-06-22)

| Cambio | Detalle |
|--------|---------|
| Footer fijo | `hub-card` flex; scroll en `hub-card-scroll` |
| Mobile compacto | Tema + Salir en una fila ≤768px |
| Paridad Login | `auth-card-enter`, `prefers-contrast: high` |
| CSS tokens | `--app-color` en `.app-icon-bg` |
| Grid centrado | Flex wrap + `justify-content: center` |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P4/P5 polish — footer fijo, paridad Login |
| 2026-06-22 | Shell inmersivo — **5/5** |
| 2026-06-22 | hub-*, logout footer, limpieza Finanzas.css — 4.9/5 |
