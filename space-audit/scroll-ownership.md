# Space Audit — Scroll ownership

**Última auditoría:** 2026-06-25  
**Regla:** una superficie de scroll por vista (documento **o** contenedor interno fijo, no ambos en competencia).

---

## Resumen

| Área | Antes | Después |
|------|-------|---------|
| Home `/` | `hub-home-main` + `hub-home-apps` con scroll propio | Un solo owner: `.hub-home-body` |
| Hubs sección (Finanzas, Trabajo, Tiempo, Registros) | Aside sticky con `max-height` + `overflow-y` | Aside sticky sin scroll interno; página scrollea |
| Utilidades (Calculadora, Generador) | Aside/historial con `max-height` + scroll | Historial crece; scroll de página |
| CRUD estándar | `body` + `.app-page-container` con `overflow-y: auto` | Solo `body` / viewport |
| Cuadernos | Workspace split (excepción documentada) | Hasta 2 owners internos (lista + editor) |

---

## Mapa Home (post-fix)

```
┌──────────── viewport 100dvh ────────────┐
│ hub-shell-home (overflow: hidden)       │
│   hub-card-home (flex column)           │
│     header (fijo)                       │
│     hub-home-body ← ÚNICO SCROLL        │
│       main (dashboard)                  │
│       aside (launcher apps)             │
└─────────────────────────────────────────┘
```

---

## Excepciones aceptables

| Superficie | Motivo |
|------------|--------|
| Modales (`modal-overlay`, `role="dialog"`) | Contenido acotado sobre overlay |
| Pickers Cuadernos (emoji, cover, block menu) | Popover acotado |
| Cuadernos desktop | Editor + sidebar en split view |
| Tablas/listas dentro de modales | Densidad en overlay |

---

## Automatización

| Comando | Qué hace |
|---------|----------|
| `npm run audit:scroll-ownership` | Regresión estática en CSS (selectores conocidos) |
| `npm run test:e2e:audit` | Playwright: cuenta scroll owners por ruta |

Rutas E2E: `/`, hubs, `/registros/calculadora`, `/registros/generador-contrasenas`, `/registros/cuadernos` (whitelist ×2).

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-25 | Dimensión Scroll ownership — fixes P0/P1 + script + E2E |
