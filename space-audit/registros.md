# Space Audit — Utilidades (Registros hub)

**Última auditoría:** 2026-06-22  
**Ruta:** `/registros`  
**Archivos:** `Registros.tsx`, `Registros.css`  
**Score Space:** **3.8 / 5**

---

## Resumen ejecutivo

Hub de utilidades con 8 entradas en 3 secciones (`crud-hub-list`). Tras el polish: **sin subtitle** bajo el título; filas hub consistentes con Finanzas.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | N/A (hub de navegación) |
| **Hallazgos abiertos** | 0 en hub |

---

## Mapa de layout

```
[← Inicio]
Utilidades (h1)
┌── crud-hub-list ───────────────────────────┐
│ Cuadernos                                  │
│ Herramientas (Calculadora, Archivos, …)    │
│ Secretos (Generador, Secretos)             │
└────────────────────────────────────────────┘
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.8 | Sin subtitle; 8 filas en 3 grupos |
| **Jerarquía visual** | 3.9 | Section headers + filas hub |
| **Botones y acciones** | 4.0 | Solo back en toolbar |
| **Densidad / escaneo** | 3.8 | Filas 56px; subtítulos en cada fila |
| **Consistencia de layout** | 3.8 | Mismo patrón que Finanzas hub |
| **Legibilidad tipográfica** | 3.7 | Títulos sentence case |

**Promedio:** **3.8 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P2 subtitle bajo h1 | Eliminado `registros-page-subtitle` |

---

## Pantallas hijas

Todas las CRUD del hub migradas al patrón strip + CTA visible (2026-06-22). Herramientas (Calculadora, Generador) documentadas por separado.

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Subtitle eliminado — **3.8/5** |
| 2026-06-22 | Estimación inicial — 3.0/5 |
