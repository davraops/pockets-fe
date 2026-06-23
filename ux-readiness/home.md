# UX Readiness — Home

**Última auditoría:** 2026-06-22 (revisión + polish P4/P5)  
**Ruta:** `/`  
**Archivos:** `src/pages/Home.tsx`, `ui-patterns.css` (`hub-*`, `app-icon`)  
**Integraciones:** `ProtectedRoute`, `api.getNotifications()`, `useConfirm()` (logout), `sectionColors`  
**Score global:** **4.8 / 5**

---

## Resumen ejecutivo

Home es el **hub raíz** de Pockets: launcher estilo iOS con 7 secciones. Shell inmersivo sin StatusBar/Footer (como Login). Footer con tema y logout siempre visible al pie de la card.

| Veredicto | Detalle |
|-----------|---------|
| **Ship** | ✅ Sí — ninguna dimensión &lt; 3 |
| **Polish** | ✅ Sí — promedio ≥ 4 |
| **Rol** | Punto de entrada; no sustituye hubs de detalle |

---

## Mapa del flujo

```
Login exitoso (o token válido)
       │
       ▼
Home (/)
  ├── Tap en sección → navigate(path)
  ├── Badge notificaciones ← poll GET /notifications cada 30s
  └── Salir → useConfirm() → api.logout() → /login
       │
       ▼
Hub de sección (ej. /finanzas, /registros)
  └── Back "Volver al inicio" → /
```

**Shell:** Sin StatusBar ni Footer en `/` (inmersivo). `document.title` = **"Pockets"** (vía `useEffect` en Home).

---

## Tabla por dimensión

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Loading** | 4 | Launcher estático; badge en `loading` sin mostrar "0" falso |
| **Empty state** | N/A | Siempre hay apps fijas |
| **Error state** | 4 | Fallo de badge → punto gris + `aria-label` "conteo no disponible" |
| **Formularios** | N/A | No aplica |
| **Navegación** | 5 | 7 rutas + Ajustes; teclado nativo en botones |
| **Notificaciones** | 4 | Badge con conteo; poll 30s; error visible en a11y |
| **Accesibilidad** | 5 | `<nav>` + `aria-label`; iconos decorativos ocultos; `focus-visible` |
| **Tema** | 5 | ThemeToggle en card footer; iconos en dark/light |
| **Responsive** | 5 | Flex wrap; footer compacto mobile; scroll en grid |
| **Copy** | 5 | `<h1>` con Pockets + Aplicaciones; nombres alineados con hubs |
| **Modales** | N/A | Logout usa `ConfirmContext` |
| **Confirmación destructiva** | 5 | Salir requiere confirmación in-app |

**Promedio:** **4.5 / 5**

---

## Recorrido revisado (manual)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Cargar `/` autenticado | 7 apps + footer visible |
| 2 | Tap Finanzas | Navega a `/finanzas` |
| 3 | Back desde hub | Vuelve a `/` |
| 4 | Badge con no leídas | Número rojo en Notificaciones |
| 5 | API notificaciones falla | Punto gris; SR oye "conteo no disponible" |
| 6 | Salir → Cancelar | Permanece en Home |
| 7 | Salir → Confirmar | Logout + `/login` |
| 8 | Teclado Tab + Enter | Abre sección / logout con confirm |
| 9 | Tema dark/light | ThemeToggle en footer de card |
| 10 | 480px / iPhone SE | Footer tema+Salir visible; grid scrollea |

---

## Fortalezas

### 1. Shell inmersivo

Mismo patrón que Login: viewport completo, sin chrome global en `/`.

### 2. Footer siempre accesible

`hub-card` en flex: header + scroll + footer fijo. En mobile, tema y Salir en una fila.

### 3. Teclado y foco

Botones nativos con Enter/Space; `focus-visible` en `.app-icon`.

### 4. Logout con confirmación

`useConfirm()` evita cierre de sesión accidental.

### 5. Colores centralizados

`sectionColor` + `--app-color` en CSS (sin inline duplicado).

---

## Hallazgos resueltos

| # | Issue | Fix |
|---|-------|-----|
| 1 | Badge falla → 0 silencioso | `badgeStatus` loading/ready/error |
| 2 | `role="grid"` incorrecto | `<nav aria-label="...">` |
| 3 | Sin marca en pantalla | `<h1>` Pockets — Aplicaciones |
| 4 | Footer bajo scroll en mobile | `hub-card-scroll` + footer fijo |
| 5 | Sin paridad Login | Animación entrada + `prefers-contrast` |
| 6 | Color inline duplicado | `--app-color` en `.app-icon-bg` |

---

## Plan de pruebas (regresión Home)

```
[ ] Cada icono navega a la ruta correcta
[ ] Badge muestra N cuando hay no leídas
[ ] 480px: footer tema+Salir visible sin scroll hasta footer
[ ] Salir → cancelar → permanece en Home
[ ] Salir → confirmar → /login
[ ] Tab recorre grid → tema → Salir con focus visible
[ ] VoiceOver: h1 "Pockets Aplicaciones"
```

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | P4/P5: footer fijo, paridad Login, --app-color |
| 2026-06-22 | Shell inmersivo; badge, confirm logout, saludo |
| 2026-06-22 | Auditoría inicial — score 3.6/5 |
