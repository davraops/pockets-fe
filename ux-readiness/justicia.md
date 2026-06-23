# UX Readiness — Justicia

**Última auditoría:** 2026-06-22 (revisión por sección)  
**Ruta:** `/justicia` + `/justicia/procesos`  
**Archivos clave:** `src/pages/Justicia.tsx`, `Procesos.tsx`  
**Score global UX:** **4.8 / 5**

---

## Resumen ejecutivo

Justicia es un hub pequeño con un módulo activo: consulta de procesos judiciales (Rama Judicial) por nombre del usuario. Tras P3 el patrón de loading, error y empty es consistente; se eliminó el nombre hardcodeado.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí |
| **Polish** | ✅ Sí — gap menor en formularios (sin CRUD manual) |
| **Referencia (5.0)** | ⏳ Depende de API externa y perfil en Ajustes |

---

## Mapa del flujo

```
Home → /justicia (hub)
  └── Procesos → consulta API por nombre (fetchUserDisplayName)
        ├── Sin nombre en perfil → error + CTA Ir a Ajustes
        ├── Loading → ListSkeleton
        ├── Error API → Reintentar
        ├── Vacío → Actualizar + copy explicativo
        └── Detalle → actuaciones con skeleton
```

---

## Tabla por dimensión

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 5 | `ListSkeleton` en lista + actuaciones en modal |
| **Empty state** | 5 | Icono + copy + CTA Actualizar |
| **Error state** | 5 | Panel + Reintentar / Ir a Ajustes + `role="alert"` |
| **Navegación** | 5 | Hub + back `hubLabels` justicia |
| **Accesibilidad** | 5 | `aria-label` en acciones; errores anunciados |
| **Perfil / copy** | 4 | Nombre desde `fetchUserDisplayName` (sin hardcode) |
| **Modales / confirm** | 5 | `ModalOverlay` en detalle; seguimiento con toasts |

**Promedio (7 dimensiones):** **4.8 / 5**

---

## Fortalezas verificadas

- Hub estático con teclado Enter/Space
- Badges Negado/Rechazado desde actuaciones
- Seguimiento de procesos con notificaciones
- Menú Actualizar en toolbar

---

## Hallazgos abiertos

| Prioridad | Issue |
|-----------|-------|
| P4 | Carga de procesos hace N+1 llamadas de actuaciones para badges (performance) |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P3: ListSkeleton, error Reintentar/Ajustes, empty CTA, fetchUserDisplayName, hubLabels justicia |
