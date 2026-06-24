# Space Audit — Cuadernos

**Última auditoría:** 2026-06-23  
**Ruta:** `/registros/cuadernos` (+ `/registros/cuadernos/:noteId`)  
**Archivos:** `Cuadernos.tsx`, `Cuadernos.css`, `CuadernoWorkspace.tsx`, `CuadernoSidebar.tsx`, `cuadernoEditor.css`  
**Score Space:** **4.75 / 5**

---

## Resumen ejecutivo

Editor estilo Notion con **sidebar jerárquico**, **bloques ricos**, autosave y búsqueda. Ya no es un CRUD listado simple.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `Nuevo cuaderno` en sidebar |
| **Jerarquía** | ✅ Árbol colapsable, drag reorder + nest |
| **Edición** | ✅ 11 tipos de bloque, `/` comandos, links internos |
| **Persistencia** | ✅ Autosave + guardado al navegar |
| **Mobile** | ✅ Lista / editor fullscreen por ruta |
| **Hallazgos abiertos** | 0 |

---

## Mobile (≤768px)

- Sin cuaderno en URL → **lista fullscreen** (jerarquía + búsqueda)
- Con `:noteId` → **editor fullscreen** + botón **Cuadernos** para volver
- Drag-reorder desactivado en touch; desktop sin cambios

---

## Fortalezas

- Shell sidebar + workspace con URL por cuaderno
- Autosave debounced, `beforeunload`, blocker SPA
- Slash command palette (`CUADERNO_BLOCK_COMMANDS`)
- Búsqueda en sidebar (título + contenido)
- Subpáginas visibles en workspace
- Unit tests (`npm run test:unit`) para árbol, documento, rich text

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-23 | Mobile list/editor fullscreen — **4.75/5** |
| 2026-06-23 | Editor Notion-style — slash menu, nest drag, búsqueda — **4.5/5** |
| 2026-06-22 | Migración patrón Space CRUD listado — **4.0/5** (obsoleto) |
