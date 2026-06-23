# UX Baseline — Hallazgos transversales

**Fecha:** 2026-06-22  
**Alcance:** Toda la app (`src/pages/`, `src/components/`, `src/contexts/`, `src/styles/`)  
**Score baseline:** **3.3 / 5**

---

## Métricas rápidas

| Señal | Conteo | Estado |
|-------|--------|--------|
| Páginas con `useNotification` | ~31 | ✅ Bueno |
| Páginas con `alert()` | 0 | ✅ Resuelto |
| Páginas con `"Frontend says:"` | 0 | ✅ Resuelto |
| Páginas con menú debug expuesto | 0 | ✅ Gateado |
| Páginas con `window.confirm` | 0 | ✅ Reemplazado por `useConfirm()` |
| Uso de `role="dialog"` / `aria-modal` | 28+ | ✅ vía `ModalOverlay` |
| Skeletons | 3 páginas | ✅ Cuentas, Transacciones, Finanzas |

---

## 1. Loading states

### Patrones encontrados

| Patrón | Ejemplo | Calidad |
|--------|---------|---------|
| Spinner + texto | `Finanzas.tsx`, `Cuentas.tsx`, `Deudas.tsx` | Aceptable |
| Texto plano en contenedor empty | `Notificaciones.tsx`, `Procesos.tsx`, `Archivos.tsx` | Débil |
| Loading dentro de empty-state | `Actividades.tsx` ("Cargando…" en `actividades-empty-state`) | Confuso |
| Submit disabled + label | `Login.tsx`, `CriptoTransacciones.tsx` | Bueno |

### Recomendación

- Estandarizar: `ListSkeleton` con `aria-busy` en contenedor de lista (Cuentas, Transacciones, Finanzas ✅)
- Extender skeletons a otras listas pesadas (Notificaciones, Deudas, etc.)

---

## 2. Empty states

### Con CTA primario ✅

`CDTs.tsx`, `Fechas.tsx`, `Cuadernos.tsx`, `CriptoWallet.tsx`, `Notificaciones.tsx` (filtro-aware)

### Sin CTA — usuario en callejón sin salida ⚠️

| Página | Problema |
|--------|----------|
| `Cuentas.tsx` | Solo mensaje; crear cuenta solo vía menú ⋮ |
| `Archivos.tsx` | Copy sin botón "Subir archivo" |
| `MeDeben.tsx` | Sin invitación a registrar deuda |
| `Proyectos.tsx` | Sin botón "Nuevo proyecto" en empty |

### Plantilla sugerida

```
[ícono]
Título claro
Subtítulo con contexto (1 línea)
[Botón primario: acción]
```

---

## 3. Error states

### Silenciosos (solo consola) — P0

| Ubicación | Comportamiento |
|-----------|----------------|
| `Finanzas.tsx` ~262 | Fallo en 9 APIs → stats en $0 sin aviso |
| `Home.tsx` ~92 | ~~Badge notificaciones falla → 0 silencioso~~ ✅ error en aria-label + punto gris |
| `CDTs.tsx` | `setError` no renderizado en UI |

### Visibles ✅

`Cuentas.tsx` (inline rojo), `Notificaciones.tsx` (toast + inline), mayoría de CRUD con `showError`

### Debug en UI — P0

Prefijo `"Frontend says:"` en:
- `Deudas.tsx`, `MeDeben.tsx`, `Proyectos.tsx`
- `TarjetasDebito.tsx`, `TarjetasCredito.tsx`, `Subscripciones.tsx`

---

## 4. Feedback: toast vs alert vs confirm

```
                    ┌─────────────┐
  Éxito/error ─────►│ showNotification │  (~31 páginas)
                    └─────────────┘
                           │
  Validación rápida ───────┼──────► showNotification (warning/error)
                           │
  Delete/bulk ─────────────┴──────► useConfirm()  (28 páginas) ✅
```

### `alert()` — ✅ migrado a toast (2026-06-22)

### `window.confirm` — ✅ reemplazado por `ConfirmContext` (2026-06-22)

Diálogo in-app con `ModalOverlay`, variantes `danger`/`default`, focus trap y Escape. Excepción rica: modal custom en `TarjetasDebito.tsx` ~1385 para suscripciones vinculadas.

---

## 5. Formularios y validación

### Referencia: `Login.tsx`

- `validateForm()` antes de submit
- Errores con `role="alert"`, `aria-invalid`, `aria-describedby`
- Limpieza de errores al escribir
- Submit `disabled` + `aria-busy` + spinner inline

### Gaps en modales CRUD

Muchos modales muestran `.error-message` sin `role="alert"` ni `aria-invalid` en inputs (`Deudas.tsx`, varios de Finanzas).

### Acción P1

Extraer patrón de `Login.tsx` a checklist para nuevos formularios; no requiere componente nuevo de inmediato.

---

## 6. Navegación

### Lo que funciona

- Hubs con toolbar back + `aria-label="Volver a …"`
- `StatusBar.tsx` actualiza `document.title`
- Chevrones y secciones agrupadas estilo iOS Settings

### Gaps

| Issue | Detalle |
|-------|---------|
| StatusBar sin título | ✅ Resuelto vía `routeTitle.ts` |
| Naming drift | ✅ Back buttons usan `hubLabels.ts` (Utilidades/Lifestyle); rutas internas `/registros`, `/tiempo` sin cambio |
| Sin breadcrumbs | Solo un nivel de back (aceptable para mobile-first) |
| Logout sin confirm | ✅ Resuelto vía `useConfirm()` en Home |

---

## 7. Accesibilidad

### Fortalezas

- `aria-label` en toolbars y filas de hub
- `Home.tsx`: teclado Enter/Space en launcher
- Toasts: `aria-live="polite"`, `role="alert"`
- `Login.css`: `prefers-reduced-motion`, `prefers-contrast`

### Gaps críticos

| Gap | Impacto |
|-----|---------|
| Modales sin `role="dialog"` | Screen readers no anuncian diálogo |
| Sin focus trap en modales | Tab escapa al contenido detrás |
| Sin Escape para cerrar | Solo click en overlay o × |
| Botones × sin `aria-label` | Común en `Deudas.tsx`, `Cuentas.tsx` |
| `role="grid"` en Home launcher | ~~Semántica cuestionable~~ ✅ reemplazado por `<nav>` |

---

## 8. Tema y responsive

### Tema

- `ThemeContext` + `data-theme` en `<html>` — sólido
- Variables en `index.css` usadas en `shared.css` y páginas
- Riesgo menor: colores inline en íconos de hub (`style={{ backgroundColor: '#…' }}`)

### Responsive

- Breakpoints 768px / 480px en `AppPage.css`, `App.css` y mayoría de páginas
- `StatusBar` oculta título en móvil; `Footer` duplica hora/tema
- Login: mejor soporte de accesibilidad media que el resto de la app

---

## 9. Modales debug en producción — P0

**24 páginas** exponen menú ⋮ con opciones debug:

- Crear datos de demo
- Eliminar todos los registros
- Algunas gated por `api.isTestUser()`, **muchas no**

Ejemplos: `Contratos.tsx`, `Actividades.tsx`, `Cuentas.tsx`, `Transacciones.tsx`, `CDTs.tsx`

**Riesgo:** usuario accidentalmente borra datos reales.

**Fix sugerido:** `import.meta.env.DEV` o flag explícito; nunca mostrar "delete all" fuera de dev.

---

## 10. Scores por sección (resumen)

| Sección | Score UX | Gap principal |
|---------|:--------:|---------------|
| Login | **5** | Ver [login.md](./login.md) — referencia de formularios |
| Home | **4.8** | P3 completados — saludo, badge refresh, hover pointer-only |
| Notificaciones | **3.8** | Loading solo texto |
| Utilidades | **3.4** | Debug modals gateados; Archivos con CTA ✅ |
| Trabajo | **3.5** | Debug delete-all |
| Lifestyle | **3.3** | Rutinas empty — pendiente |
| Finanzas | **3.2** | Hub errors ✅; pendiente detalle por página |
| Justicia | **3.0** | Sección delgada; modales sin a11y |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Auditoría baseline inicial |
