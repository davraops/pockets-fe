# Space Audit — Ajustes

**Ruta:** `/ajustes`  
**Score Space:** **4.0 / 5**

---

## Resumen

Hub de configuración (perfil, apariencia, finanzas). No es CRUD: tres secciones en `crud-hub-list` con zonas peligrosas como referencia de copy + botón debajo.

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P2 subtitle | `ajustes-page-subtitle` eliminado |
| P2 ancho | `app-page-content-wide crud-page-content` |
| P2 strip | `crud-summary-strip` (nombre, tema, cuenta) |
| P3 botones custom | Guardar → `btn-base btn-accent btn-block btn-submit` |
| P3 botones custom | Peligro → `btn-base` + `ajustes-danger-button` (soft danger intencional) |
| P3 input custom | `form-input-base` + `form-label-base` |
| P3 import Finanzas.css | Eliminado (`crud-hub-list` vía domains) |

## Excepciones documentadas

- Sin CTA de página ni menú ⋮ (no aplica a settings).
- Botones destructivos mantienen estilo soft danger (no `btn-danger` sólido) — patrón referencia para acciones irreversibles con contexto arriba.

**Score:** **4.0 / 5**
