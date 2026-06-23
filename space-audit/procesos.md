# Space Audit — Procesos

**Ruta:** `/justicia/procesos`  
**Score Space:** **3.9 / 5**

---

## Resumen

Consulta de procesos judiciales (API externa). No es CRUD manual: acción primaria es **actualizar** la consulta, no crear registros.

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Actualizar en ⋮ | CTA visible `crud-primary-cta` + menú eliminado |
| P2 subtitle | `procesos-page-subtitle` eliminado |
| P2 strip | `crud-summary-strip` (total, en seguimiento, en trámite) |
| P3 empty CTA duplicado | Guía al CTA superior |
| P3 retry | `btn-base btn-secondary finanzas-stats-retry-button` |

## Excepciones documentadas

- Sin menú ⋮ (no hay acciones debug ni secundarias ocultas).
- Lista ya en `glass-group` + `crud-inset-row`.
- Seguimiento y actuaciones viven en modal de detalle.

**Score:** **3.9 / 5**
