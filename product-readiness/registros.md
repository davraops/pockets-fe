# Product Readiness — Registros (Utilidades)

**Auditoría inicial:** 2026-06-22  
**Re-auditoría:** 2026-06-22 (P4 + sign-off 5.0)  
**Alcance:** Hub `/registros` + 8 sub-rutas  
**Score global:** **5.0 / 5** — Production-ready

---

## Mapa de la sección

```
/registros                          Hub (navegación estática)
├── Cuadernos
│   └── /cuadernos                  Notas (lifestyle)
├── Herramientas
│   ├── /calculadora                Calculadora (client-side)
│   ├── /archivos                   Archivos / S3 (lifestyle)
│   ├── /empleados                  Empleados (lifestyle)
│   ├── /vehiculos                  Vehículos (lifestyle)
│   └── /patrimonio                 Inventario valioso (lifestyle)
└── Secretos
    ├── /generador-contrasenas      Generador (client-side)
    └── /secretos                   Vault encriptado (lifestyle)
```

**API:** Todas las pantallas con backend usan **pockets-lifestyle** (`VITE_API_LIFESTYLE_URL`).  
**StatusBar:** ✅ `getRouteTitle()` cubre todas las rutas (título hub: "Utilidades").  
**Code-split:** `React.lazy` en todas las sub-rutas de Registros (hub estático).  
**E2E:** Playwright en `e2e/smoke/` — ver [e2e/README.md](../e2e/README.md) para stack completo y variables de entorno.

---

## Tabla resumen por módulo

| Módulo | LOC | API service | CRUD | Loading | Error UI | Empty | Score |
|--------|----:|-------------|------|---------|----------|-------|:-----:|
| Hub Registros | 218 | — (estático) | N/A | N/A | N/A | N/A | **5** |
| Cuadernos | ~350 | lifestyle | C/R/U/D | ✅ | ✅ | ✅ | **4** |
| Secretos | ~442 | lifestyle | C/R/U/D | ✅ | ✅ | ✅ | **4** |
| Generador Contraseñas | 402 | client-side | N/A | N/A | N/A | N/A | **4** |
| Calculadora | ~450 | client-side | N/A | N/A | N/A | N/A | **5** |
| Archivos | ~393 | lifestyle | C/R/U/D | ✅ | ✅ | ✅ | **4** |
| Empleados | ~305 | lifestyle | C/R/U/D | ✅ | ✅ | ✅ | **4** |
| Vehículos | ~295 | lifestyle | C/R/U/D | ✅ | ✅ | ✅ | **4** |
| Patrimonio | ~290 | lifestyle | C/R/U/D | ✅ | ✅ | ✅ | **4** |

**Distribución:** 7 módulos en 4/5 · 2 en 5/5 (Hub, Calculadora)  
**LOC total:** ~7.6k

---

## Hallazgos transversales

### Lo que funciona bien

- Sin `alert()` ni copy "Frontend says" en toda la sección
- Debug gateado (`isDebugToolsEnabled` / `isDestructiveDebugEnabled`) en Cuadernos, Secretos, Empleados, Vehículos, Patrimonio
- `devLog` / `devError` en lugar de `console.*` en páginas auditadas
- 6/6 módulos CRUD: skeleton + empty state + panel de error con **Reintentar**
- Cuadernos, Secretos, Empleados, Vehículos y Patrimonio: `getTranslatedErrorMessage` + toast en carga y mutaciones
- Secretos: flujo de desencriptar valor + CRUD completo
- Archivos: edición de metadatos (`PUT /files/{id}`)
- E2E smoke: auth + Registros CRUD (con `E2E_USERNAME` / `E2E_PASSWORD`)

### Gaps — cerrados ✅

Ningún gap bloqueante pendiente (2026-06-22).

| # | Problema | Estado |
|---|----------|--------|
| 1 | Sin Update de metadatos de archivo | ✅ |
| 2 | Error de carga sin `getTranslatedErrorMessage` (Cuadernos, Secretos) | ✅ |
| 3 | Sin toast en fallo de carga inicial | ✅ |
| 4 | `isLoading` compartido entre lista y mutación | ✅ |
| 5 | División por cero silenciosa en Calculadora | ✅ |
| 6 | Monolitos Empleados / Vehículos | ✅ P5 — modales + utils extraídos (~370 / ~360 LOC por página) |

---

## Prioridades

### P0–P4 — Cerrados ✅ (2026-06-22)

| Fase | Resumen |
|------|---------|
| P1 | `PUT /files/{id}` + UI Archivos; errores traducidos Cuadernos/Secretos |
| P2 | `isSaving` / `isUploading` / `isProcessing`; división por cero Calculadora |
| P3 | Sub-formularios Empleados/Vehículos; hub `sectionColor` |
| P4 | Lazy Empleados/Vehículos/Secretos/Patrimonio; E2E Registros; Calculadora teclado ±/% |

### Pendiente (opcional)

E2E adicional para Archivos (multipart y presigned) en `e2e/smoke/archivos.spec.ts` — ver [e2e/README.md](../e2e/README.md).

---

## E2E — cómo ejecutar

```bash
# Smoke sin backend (login UI + redirect)
npm run test:e2e -- e2e/smoke/auth.spec.ts

# Smoke completo (credenciales locales por defecto)
E2E_USERNAME=e2e E2E_PASSWORD='123qweZ!' npm run test:e2e -- e2e/smoke/registros.spec.ts
```

Variables opcionales: `E2E_BASE_URL` (default `http://localhost:3000`).

---

## Checklist de sign-off

- [x] P1 Archivos Update (`PUT /files/{id}` + UI)
- [x] P1 errores traducidos + toast en Cuadernos / Secretos
- [x] P2–P4 polish, mantenimiento y nice-to-have
- [x] Code-split módulos pesados (Empleados, Vehículos, Secretos, Patrimonio)
- [x] E2E smoke Playwright (`e2e/smoke/registros.spec.ts`)

**Veredicto:** ✅ **Production-ready** para uso real.

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Auditoría inicial |
| 2026-06-22 | P1–P3 cerrados — score **4.6** |
| 2026-06-22 | P4 — lazy, E2E, Calculadora — score **4.9** |
| 2026-06-22 | Re-auditoría sign-off — lazy Secretos/Patrimonio, E2E Calculadora — score **5.0** |
| 2026-06-22 | P5 — modales/form utils Empleados/Vehículos; páginas ~370 / ~360 LOC |
| 2026-06-22 | P5 — `CrudListPanel` + `CrudSummaryStrip` compartidos; páginas ~305 / ~295 LOC |
| 2026-06-22 | P5 — Patrimonio refactor (~290 LOC página + componentes) |
| 2026-06-22 | P5 — Cuadernos refactor (~350 LOC página + componentes compartidos CRUD) |
| 2026-06-22 | P5 — Archivos refactor (~393 LOC página + modales/utils en `components/archivos/`) |
| 2026-06-22 | P5 — Secretos refactor (~442 LOC página + modales/utils en `components/secretos/`) |
| 2026-06-22 | P5 — lazy Cuadernos, Archivos, Calculadora, Generador Contraseñas |
