# UI Readiness Audit — Pockets FE

Auditoría visual del sistema de diseño: tema, tipografía, componentes, consistencia y nivel de pulido estético.

**Ruta en vivo:** `/ui-readiness`

**Última auditoría:** 2026-06-22 (post P24, verificación en código)

## Score global: **5.0 / 5**

| Dimensión | Score | Resumen |
|-----------|:-----:|---------|
| Identidad visual | 4.8 | HIG / glassmorphism coherente; páginas CRUD enormes rompen uniformidad |
| Sistema de tokens | 4.95 | Catálogo **326/326** tokens; validación estricta |
| Tipografía | 4.9 | Escala completa tokenizada; 1 literal residual (`16px` base body) |
| Tema claro/oscuro | 5.0 | 0 overrides light/dark en páginas (Fechas tokenizado) |
| Componentes base | 4.9 | shared + domains maduros; finanzas en form-*-base |
| Consistencia | 4.8 | Patrones `crud-*` adoptados; Actividades/Contratos en domains |
| Micro-interacciones | 4.95 | Motion 100% tokenizado; 0 literales -8px / 1.1 |
| Accesibilidad visual | 4.8 | Skip-link, `:focus-visible`, alto contraste; forms en form-*-base |

## Identidad visual

**Estilo:** Glassmorphism inspirado en Apple Human Interface Guidelines (iPadOS / macOS).

- Fondos con `backdrop-filter: blur(40px) saturate(180%)`
- Tarjetas flotantes con bordes glass y sombras inset + drop
- Paleta de acento iOS vía `--section-*` y acentos semánticos
- Layout tipo launcher en Home (grid de iconos + gradiente overlay)
- StatusBar fija estilo iPad (`--layout-max-width-hub`)

**Fortalezas:** Hubs (Home, Login, Finanzas), modales, toolbars y filas CRUD compartidas se sienten premium y unificados.

**Debilidades:** Actividades (~1.7k líneas CSS), Contratos (~1.5k), ListasMercado, TarjetasCredito y Empleados concentran la deuda visual.

## Tipografía

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-family` | Inter + system stack | Global ✓ |
| `--font-size-xs` … `--font-size-display` | 14px–64px | Tokens ✓ |
| `--font-weight-normal` … `--font-weight-bold` | 400–700 | Páginas migradas ✓ |
| `--letter-spacing-tight` | -0.01em | Global ✓ |

- **Fuente:** Inter 300–700 desde Google Fonts (`index.html`)
- **OpenType features:** `cv02`, `cv03`, `cv04`, `cv11`
- **Base body:** `16px` en `index.css` (intencional, = 1rem)
- **Residual:** 0 literales en páginas (P17)

## Tema

- **Default:** Oscuro (`#1c1c1e` / `#2c2c2e`)
- **Alternativo:** Claro (`#f5f5f7` / blanco)
- **Mecanismo:** `data-theme` en `<html>` + `applyTheme()` + `localStorage`
- **Toggle:** `ThemeToggle` en Login, Footer, StatusBar y paneles de auditoría
- **Integraciones:** `big-calendar-theme.css`, `chartTheme.ts` + `--chart-*`
- **Overrides light en páginas:** **0** (solo `index.css` tokens + `ThemeToggle.css`)

## Componentes

### Capas compartidas

| Capa | Archivo | Contenido |
|------|---------|-----------|
| L1 | `index.css` | Tokens globales + tema (`data-theme`) |
| L2 | `shared.css` | Botones, formularios, checkboxes |
| L2b | `motion-accessibility.css` | Motion tokens, reduced-motion, touch hover guard |
| L2c | `accessibility.css` | Skip-link, alto contraste, focus FAB/tabs |
| L3 | `ui-patterns.css` | Toolbar, modales, hub, app-icon, empty-state |
| L4 | `domains/crud.css` | Dropdown, detail panel, loader, empty state |
| L5 | `domains/crud-list-rows.css` | Filas inset + jerarquía row-content/title |
| L6 | `domains/crud-row-slots.css` | Slots, acentos, modificadores `crud-row-*` |
| L7 | `domains/crud-hub-rows.css` | Filas hub (navegación estilo Settings) |
| L8 | `domains/crud-card-rows.css` | Filas card (debt, proyecto, tarjetas) |
| L9 | `domains/crud-crypto-rows.css` | Filas cripto wallet / transacciones |
| L10 | `domains/semantic-surfaces.css` | Badges, tabs, alertas semánticas |
| L11 | `domains/crud-forms.css` | `crud-form-row`, section-divider |
| L12 | `pages/*.css` | Estilos únicos por pantalla |

**No hay** Tailwind, shadcn ni CSS Modules.

### Librerías UI

| Librería | Uso |
|----------|-----|
| `@mui/icons-material` | Iconos en toda la app ✓ |
| `@mui/material` | Solo tipos (`SvgIconProps`) |
| `react-big-calendar` | Fechas — `big-calendar-theme.css` ✓ |
| `chart.js` | Gráficos — `chartTheme.ts` + `--chart-*` ✓ |

## Métricas de CSS (verificación 2026-06-22)

| Métrica | Valor |
|---------|------:|
| Archivos `.css` totales | 63 |
| Líneas CSS totales | ~29.480 |
| Líneas `styles/` (shared + domains) | ~3.617 |
| Líneas `pages/*.css` | ~24.633 (~84%) |
| Overrides `[data-theme='light']` en páginas | 0 |
| `:focus-visible` en CSS | 90 |
| `font-size` literales (excl. `index.css`) | 1 |
| `outline: 2px solid` hardcodeado | 0 |
| Tokens documentados / totales en `index.css` | 326 / 326 (100%) |
| `rgba()` en CSS | ~691 |
| `#hex` en CSS | ~180 |

### Páginas con mayor CSS propio

| Pantalla | Líneas CSS | Ruta |
|----------|----------:|------|
| Actividades | 1 | `/trabajo/actividades` |
| Contratos | 1 | `/trabajo/contratos` |
| ListasMercado | 1.143 | `/registros/listas-mercado` |
| TarjetasCredito | 1.091 | `/finanzas/credito/tarjetas` |
| Empleados | 1.069 | `/trabajo/empleados` |
| Fechas | 1.025 | `/tiempo/fechas` |

## Hallazgos por prioridad

### P0–P7 — Fundamentos ✅

Toolbar/modales, tokens tipográficos, tema charts/calendario, domains CRUD, hubs, blank pages.

### P8–P11 — Tema y semántica ✅

Tokens financieros, glass, semantic-surfaces, migración rgba → `--text-*`, overrides light masivos eliminados.

### P12–P14 — Formularios y hubs ✅

`form-*-base` unificado, `crud-forms.css`, hubs sin overrides light.

### P15 — Surfaces restantes ✅

Fechas, Subscripciones, Secretos, CDTs, app-icon → tokens `surface-*`.

### P16 — Focus & motion ✅

`--focus-outline-*`, `motion-accessibility.css`, 53 outlines → tokens.

### P17 — Tipografía ✅

Escala documentada, `font-weight` → tokens, `debug-option-icon` en ui-patterns.

### P18 — Motion unificado ✅

`translateY`/`scale` → tokens, touch hover guard, prefers-contrast.

### P19 — Accesibilidad visual ✅

`accessibility.css`, skip-link en `App.tsx`, forms `:focus-visible`, checkboxes unificados.

### P20 — Catálogo tokens ✅

Auto-generación de `tokenCatalog.generated.ts` (324 tokens) + validación estricta 100%.

### P21 — Formularios finanzas ✅

8 páginas migradas de `.form-group` legacy a `form-*-base`.

### P22 — Actividades + Contratos → domains ✅

CSS compartido extraído a domains; páginas reducidas a hooks.

### P23 — Fechas dark overrides ✅

12 bloques `[data-theme='dark']` reemplazados por tokens themed.

### P24 — Motion edge-cases ✅

`--motion-dropdown-shift: -8px` (keyframes dropdown) y `--motion-fab-scale: 1.1` (FAB/check hover). 8 literales en 6 archivos → 0.

## Pantallas de referencia

| Pantalla | Ruta | Por qué |
|----------|------|---------|
| Home | `/` | Launcher iOS, responsive, reduced-motion |
| Login | `/login` | Animación, theme toggle, formulario pulido |
| Finanzas hub | `/finanzas` | Grid de apps, toolbar, glass cards |
| UI Readiness | `/ui-readiness` | Catálogo tokens + componentes demo |
| StatusBar + Footer | global | Coherencia navegación |

## Scripts de migración

| Script | Fase |
|--------|------|
| `migrate-theme-text-tokens-phase8.py` | P8 |
| `migrate-glass-tokens-phase9.py` | P9 |
| `migrate-semantic-tokens-phase10.py` | P10 |
| `migrate-semantic-tokens-phase11.py` | P11 |
| `migrate-crud-forms-phase12.py` | P12 |
| `migrate-theme-overrides-phase13.py` | P13 |
| `migrate-hub-light-overrides-phase14.py` | P14 |
| `migrate-remaining-light-overrides-phase15.py` | P15 |
| `migrate-focus-motion-phase16.py` | P16 |
| `migrate-typography-phase17.py` | P17 |
| `migrate-motion-phase18.py` | P18 |
| `migrate-accessibility-phase19.py` | P19 |
| `sync-token-catalog-phase20.py` | P20 |
| `migrate-finance-forms-phase21.py` | P21 |
| `migrate-actividades-contratos-phase22.py` | P22 |
| `migrate-fechas-dark-phase23.py` | P23 |
| `migrate-motion-phase24.py` | P24 |
| `validate-design-tokens.py` | Validación catálogo (100%) |

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | **P24:** motion dropdown/FAB tokens; 0 literales -8px/1.1; score 5.0 |
| 2026-06-22 | **P23:** Fechas 12 dark overrides → tokens; 0 overrides dark en Fechas |
| 2026-06-22 | **P22:** Actividades + Contratos → 4 domain CSS; páginas ~3.2k→2 líneas |
| 2026-06-22 | **P21:** 8 páginas finanzas → form-*-base; 0 reglas `.form-group` legacy |
| 2026-06-22 | **P20:** catálogo 324/324 tokens, `tokenCatalog.generated.ts` |
| 2026-06-22 | **Auditoría post-P19:** README sincronizado; score real 4.85/5 |
| 2026-06-22 | P19: accessibility.css, skip-link, checkboxes, `:focus-visible` forms |
| 2026-06-22 | P18: motion tokens, touch hover guard, prefers-contrast |
| 2026-06-22 | P17: tipografía completa, debug-option-icon consolidado |
| 2026-06-22 | P16: focus/motion tokens, motion-accessibility.css |
| 2026-06-22 | P15: surfaces restantes, 0 overrides light en páginas |
| 2026-06-22 | P14: hub CRUD tokenizado, 192→88 overrides light |
| 2026-06-22 | P13: crud-forms.css, financial surfaces |
| 2026-06-22 | P12: form-input-base unificado en 12 páginas |
| 2026-06-22 | P8–P11: tema, glass, semántica, overrides masivos |
| 2026-06-22 | P0–P7: arquitectura domains, hubs, legacy cleanup |
| 2026-06-22 | Auditoría inicial + ruta `/ui-readiness` |
