# UX Readiness — Notificaciones

**Última auditoría:** 2026-06-22 (revisión por sección)  
**Ruta:** `/notificaciones`  
**Archivo clave:** `src/pages/Notificaciones.tsx`  
**Score global UX:** **5 / 5**

---

## Resumen ejecutivo

Bandeja de notificaciones del sistema (rutinas, presupuestos, transacciones, etc.) con filtros Todas / No leídas / Leídas. Tras P3 la experiencia es consistente con el resto de secciones auditadas.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí |
| **Polish** | ✅ Sí — referencia para empty con filtros |
| **Referencia (5.0)** | ✅ Alcanzado |

---

## Mapa del flujo

```
Home → badge poll 30s → /notificaciones
  ├── Filtros: Todas | No leídas | Leídas
  ├── Acciones por ítem: marcar leída / eliminar
  ├── Menú: marcar todas leídas | eliminar todas
  └── Loading → ListSkeleton (solo carga inicial)
        Error → Reintentar + role="alert"
        Empty → copy según filtro activo
```

**Nota:** Las notificaciones son generadas por el backend; no hay formulario de creación en UI (solo debug gateado).

---

## Tabla por dimensión

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 5 | `ListSkeleton`; lista visible al marcar leída/eliminar (sin flash de carga) |
| **Empty state** | 5 | Icono + copy contextual por filtro + subtext en vacío total |
| **Error state** | 5 | Panel + Reintentar + `role="alert"` |
| **Navegación** | 5 | Back "Volver al inicio"; filtros persistentes |
| **Accesibilidad** | 5 | `aria-label` en acciones; errores `role="alert"` |
| **Modales / confirm** | 5 | `useConfirm()` en deletes; debug gateado |
| **Feedback** | 5 | Toasts en acciones; badge Home sincronizado vía API |

**Promedio (7 dimensiones):** **5 / 5**

---

## Fortalezas verificadas

- Empty state consciente del filtro (patrón referencia en baseline)
- Indicador de prioridad por color en cada ítem
- `devError` en carga y acciones
- Acciones no ocultan la lista durante refresh

---

## Hallazgos abiertos

Sin hallazgos abiertos.

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P3: ListSkeleton, error Reintentar, devError, lista estable en acciones, empty subtext |
