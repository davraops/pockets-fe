# Space Audit — Login

**Última auditoría:** 2026-06-22  
**Ruta:** `/login`  
**Archivos:** `src/pages/Login.tsx`, `ui-patterns.css` (`auth-*`), `shared.css` (`form-*--comfortable`, `form-alert-banner`, `btn-spinner`)  
**Complementa:** [ux-readiness/login.md](../ux-readiness/login.md) (UX 4.9/5)  
**Score Space:** **5 / 5** — Referencia completa de layout y design system

---

## Resumen ejecutivo

Login ocupa el viewport sin chrome, usa patrones `auth-*` compartidos y un formulario `form-*--comfortable`. Sin `Login.css` propio.

| Veredicto | Detalle |
|-----------|---------|
| **Referencia layout** | ✅ `auth-shell`, `auth-card`, `auth-form` |
| **Referencia tokens** | ✅ shared.css + ui-patterns.css |
| **Hallazgos abiertos** | Ninguno |

---

## Mapa de layout (desktop)

```
┌──────────────────────────── viewport 100vh ────────────────────┐
│  auth-shell (padding lg)                                       │
│     ┌──────────── auth-card max 440px ─────────────┐           │
│     │  Pockets — Iniciar sesión  (h1 único)        │           │
│     │  [ form-alert-banner — condicional ]         │           │
│     │  Usuario / Contraseña                        │           │
│     │  nota soporte (xs, tertiary)                 │           │
│     │  [ Iniciar sesión — btn-submit full width ]  │           │
│     │  ─── auth-card-footer ───                    │           │
│     │              [ ThemeToggle ]                 │           │
│     └──────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 5 | `auth-shell` 100vh/100dvh; sin StatusBar/Footer |
| **Jerarquía visual** | 5 | Un h1; sin icono decorativo; toggle en footer |
| **Botones y acciones** | 5 | `btn-accent btn-block btn-submit` |
| **Densidad / escaneo** | 5 | 1 bloque pre-form; soporte antes del CTA |
| **Consistencia de layout** | 5 | Sin CSS de página; `auth-*` + `form-alert-banner` |
| **Legibilidad tipográfica** | 5 | Título sentence case; sin placeholders |

**Promedio:** **5 / 5**

---

## Patrones compartidos

| Clase | Capa | Uso |
|-------|------|-----|
| `auth-shell` | ui-patterns | Viewport centrado + gradiente |
| `auth-card` | ui-patterns | Card 440px |
| `auth-form` | ui-patterns | Form con gap |
| `auth-support-note` | ui-patterns | Copy secundario |
| `auth-card-footer` | ui-patterns | Pie (tema) |
| `form-input-base--comfortable` | shared | Inputs 52px |
| `form-alert-banner` | shared | Error general |
| `btn-spinner` | shared | Loading en submit |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P5: auth-*, form-alert-banner, título unificado — **5/5** |
| 2026-06-22 | P2–P4: form comfortable, header compacto — 4.8/5 |
| 2026-06-22 | Auditoría Space inicial — 4.4/5 |
