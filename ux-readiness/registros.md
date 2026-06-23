# UX Readiness — Utilidades (Registros)

**Última auditoría:** 2026-06-22 (revisión por sección)  
**Ruta:** `/registros` + 8 sub-rutas  
**Archivos clave:** `src/pages/Registros.tsx`, `Cuadernos.tsx`, `Secretos.tsx`, `Empleados.tsx`, `Vehiculos.tsx`, `Patrimonio.tsx`, `Archivos.tsx`, `Calculadora.tsx`, `GeneradorContrasenas.tsx`  
**Score global UX:** **5 / 5**

---

## Resumen ejecutivo

Utilidades es el hub de herramientas personales: notas, secretos, RRHH ligero, vehículos, patrimonio, archivos y utilidades client-side (calculadora, generador de contraseñas). Tras P3 el patrón de loading, empty y error es consistente con Finanzas en los módulos CRUD.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí — ninguna dimensión &lt; 3 |
| **Polish** | ✅ Sí — 5/7 dimensiones core en 5 |
| **Referencia (5.0)** | ✅ Alcanzado — formularios con patrón Login |

---

## Mapa del flujo

```
Home → /registros (hub estático)
  ├── Cuadernos, Secretos → CRUD con FAB + modales
  ├── Empleados, Vehículos, Patrimonio → CRUD con menú Add + modal grande
  ├── Archivos → upload + lista (ya alineado con Finanzas)
  └── Calculadora, Generador → client-side, sin API de lista
        ├── Loading → ListSkeleton (CRUD)
        ├── Error → toolbar + Reintentar + back a Utilidades
        └── Empty → icono + copy + empty-state-cta
```

**Shell:** `StatusBar` con títulos vía `getRouteTitle()`. Back "Volver a Utilidades" en sub-módulos (`hubLabels.ts`).

---

## Tabla por dimensión

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 5 | `ListSkeleton` en 6 módulos CRUD (Cuadernos, Secretos, Empleados, Vehículos, Patrimonio, Archivos) |
| **Empty state** | 5 | `empty-state-cta` en todos los CRUD con lista vacía |
| **Error state** | 5 | Panel + Reintentar + `role="alert"` en todos los CRUD |
| **Formularios** | 5 | `noValidate`, `aria-invalid`/`aria-describedby`, foco al primer error en todos los CRUD |
| **Navegación** | 5 | 8 rutas enlazadas desde hub; sin huérfanas |
| **Accesibilidad** | 5 | Errores inline `role="alert"`; foco automático en campos inválidos |
| **Modales / confirm** | 5 | `ModalOverlay`, `useConfirm()` en deletes |

**Promedio (7 dimensiones auditadas):** **5 / 5**

---

## Recorrido revisado (manual)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Cargar `/registros` | Hub con 8 filas navegables |
| 2 | Cuadernos vacío | Skeleton → empty + CTA "Agregar nota" |
| 3 | Cuadernos error API | Mensaje + Reintentar |
| 4 | Secretos vacío | CTA "Agregar secreto" |
| 5 | Empleados vacío | CTA abre modal de formulario |
| 6 | Vehículos / Patrimonio error | Reintentar recarga lista |
| 7 | Archivos | Skeleton + empty CTA (sin regresión) |
| 8 | Calculadora copiar | `devError` en fallo de clipboard, toast al usuario |
| 9 | Delete con confirm | `useConfirm()` in-app |

---

## Fortalezas verificadas

- Hub `Registros.tsx` estático, sin llamadas API — carga instantánea
- Patrón Finanzas replicado: skeleton, error panel, empty CTA
- `devError` en 7 páginas vía `scripts/gate-utilidades-logs.mjs`
- Archivos ya tenía ListSkeleton y retry desde auditoría Finanzas
- Calculadora y Generador: sin estados de lista; copy errors gateados

---

## Hallazgos abiertos

Sin hallazgos abiertos — sección referencia UX (junto con Finanzas).

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P5: modales Cuadernos/Secretos + formularios Empleados/Vehículos/Patrimonio — patrón Login |
| 2026-06-22 | P3: ListSkeleton + error Reintentar + empty-state-cta en 5 CRUD; devError en 7 páginas; doc inicial |
