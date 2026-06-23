# Space Audit — Notificaciones

**Ruta:** `/notificaciones`  
**Score Space:** **4.0 / 5**

---

## Resumen

Bandeja de alertas del sistema con filtros y acciones por ítem. No hay creación manual (solo debug gateado).

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P0 Marcar todas en ⋮ | CTA visible `crud-primary-cta` |
| P0 Eliminar todas en ⋮ | Botón soft danger visible debajo del CTA |
| P2 subtitle | Conteo movido a `crud-summary-strip` |
| P2 strip | Total · No leídas · Leídas |
| P3 ⋮ | Solo debug (`isDebugToolsEnabled`) |
| P3 retry | `btn-base btn-secondary finanzas-stats-retry-button` |
| P3 filtro | Badge no leídas usa `unreadCount` global |

## Excepciones documentadas

- Acciones por ítem (marcar leída / eliminar) permanecen en cada fila.
- Empty state sin CTA duplicado (no aplica: no hay acción de crear).

**Score:** **4.0 / 5**
