# Space Audit — Secretos

**Última auditoría:** 2026-06-23 (revisión 2)  
**Ruta:** `/registros/secretos`  
**Archivos:** `Secretos.tsx`, `Secretos.css`, `SecretoListRow.tsx`, `SecretoDetailModal.tsx`, `SecretoDecryptModal.tsx`, `secretoDisplayUtils.ts`  
**Score Space:** **4.6 / 5**

---

## Resumen ejecutivo

Vault CRUD pulido: strip de 2 métricas (solo con datos), toolbar búsqueda+CTA, filas con lock/decrypt, modales sin duplicados.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ Toolbar; full-width cuando vault vacío |
| **Jerarquía lista** | ✅ Cifrado + Creado/Actualizado · fecha compacta |
| **Modal detalle** | ✅ Cabecera + metadatos + acciones etiquetadas (sin iconos duplicados) |
| **Desencriptar** | ✅ Quick decrypt en fila; volver a detalle si aplica |
| **Hallazgos abiertos** | 0 |

---

## Modales (unificados)

Todos usan `modal-panel` + clases `secretos-modal__*`:

| Modal | Kicker | Footer |
|-------|--------|--------|
| Nuevo / Editar | Vault · Nuevo / Editar | Cancelar + Guardar (`btn-danger`) |
| Detalle | Vault · Detalle | Desencriptar + Editar + Eliminar |
| Desencriptar | Vault · Cifrado | Cerrar + Desencriptar |
| Debug | Debug | Cerrar |

Inputs: `form-input-base--comfortable`. Aviso cifrado: `secretos-modal__callout`.

---

## Revisión 2 — ajustes

| Hallazgo | Fix |
|----------|-----|
| Acciones duplicadas en modal detalle (header icons + footer) | Solo botones etiquetados abajo |
| Strip `0 \| 0 \| 0` con vault vacío | Strip oculto si no hay secretos |
| Métrica “Sin cambios” poco útil | Strip reducido a 2 celdas |
| Meta de fila sin contexto Creado/Actualizado | Prefijo en línea + tooltip completo |
| Acento danger inconsistente en fila | `crud-row-accent-danger` en wrapper |
| Búsqueda sin feedback de conteo | Meta `N de M guardados` al filtrar |
| Hover solo en mitad de fila | Hover unificado fila + botón decrypt |

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.7 | Sin strip vacío; modal sin acciones duplicadas |
| **Jerarquía visual** | 4.6 | Badge + prefijo temporal en meta |
| **Botones y acciones** | 4.6 | Labels claros en detalle; decrypt 48px en fila |
| **Densidad / escaneo** | 4.5 | 2 métricas strip; meta compacta con prefijo |
| **Consistencia de layout** | 4.5 | Detalle/decrypt en `modal-panel`; form create legacy |
| **Legibilidad tipográfica** | 4.5 | Fechas tabulares; tooltip con fecha larga |

**Promedio:** **4.6 / 5**

---

## Pendiente menor

_Ninguno — modales unificados en revisión 2026-06-23._

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-23 | Modales unificados (`modal-panel` + design system) |
| 2026-06-23 | Revisión 2 — dedupe modal, strip condicional — **4.6/5** |
| 2026-06-23 | Presentación + espacio completo — **4.5/5** |
| 2026-06-22 | Patrón Space CRUD base — **4.0/5** |
