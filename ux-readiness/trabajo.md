# UX Readiness — Trabajo

**Última auditoría:** 2026-06-22 (revisión por sección)  
**Ruta:** `/trabajo` + `/trabajo/contratos` + `/trabajo/actividades`  
**Archivos clave:** `src/pages/Trabajo.tsx`, `Contratos.tsx`, `Actividades.tsx`  
**Score global UX:** **5 / 5**

---

## Resumen ejecutivo

Trabajo agrupa contratos laborales y actividades de clientes. Tras P3–P5 el patrón de loading, error, empty y formularios es consistente con Utilidades y Finanzas.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí |
| **Polish** | ✅ Sí — 7/7 dimensiones core en 5 |
| **Referencia (5.0)** | ✅ Alcanzado — formularios con patrón Login |

---

## Mapa del flujo

```
Home → /trabajo (hub estático)
  ├── Contratos → CRUD con menú Crear + modal grande
  └── Actividades → tabs Activas/Completadas + filtro cliente
        ├── Loading → ListSkeleton
        ├── Error → Reintentar + role="alert"
        ├── Empty → icono + copy contextual + empty-state-cta (lista vacía)
        └── Formularios → noValidate, aria-*, foco al primer error
```

**Shell:** Back "Volver a Trabajo" en sub-módulos (`hubLabels.ts`).

---

## Tabla por dimensión

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 5 | `ListSkeleton` en Contratos y Actividades |
| **Empty state** | 5 | `empty-state-cta`; copy por tab/filtro en Actividades |
| **Error state** | 5 | Panel + Reintentar + `role="alert"` |
| **Formularios** | 5 | `noValidate`, `aria-invalid`/`aria-describedby`, foco al primer error |
| **Navegación** | 5 | Hub + 2 rutas; back vía `hubLabels` trabajo |
| **Accesibilidad** | 5 | Errores inline `role="alert"`; labels en toolbar |
| **Modales / confirm** | 5 | `ModalOverlay`, `useConfirm()` en deletes |

**Promedio (7 dimensiones):** **5 / 5**

---

## Fortalezas verificadas

- Hub `Trabajo.tsx` estático — carga instantánea; back "Volver al inicio"
- Contratos: total ingresos, badges tipo/exclusividad, modal multi-sección
- Actividades: tabs, filtro por cliente, prioridad y completar inline
- `devError` en 2 páginas vía `scripts/gate-trabajo-logs.mjs`

---

## Hallazgos abiertos

Sin hallazgos abiertos tras P3–P5.

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P3: ListSkeleton, error Reintentar, empty CTA, devError, hubLabels trabajo |
| 2026-06-22 | P5: formularios Login-level en Contratos (name, clientName) y Actividades (name, client) |
