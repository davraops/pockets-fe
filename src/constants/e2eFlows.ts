export type E2eSuiteKind = 'smoke' | 'regression' | 'mobile'

export type E2eBackendService =
  | 'none'
  | 'core'
  | 'financial'
  | 'core+financial'
  | 'lifestyle'
  | 'lifestyle+s3'
  | 'mocked'

export interface E2eFlowStep {
  label: string
  detail?: string
}

export interface E2eFlow {
  id: string
  name: string
  specFile: string
  routes: string[]
  backend: E2eBackendService
  auth: boolean
  tag?: string
  steps: E2eFlowStep[]
  asserts: string[]
  notes?: string[]
}

export interface E2eSuiteGroup {
  kind: E2eSuiteKind
  label: string
  command: string
  description: string
  flows: E2eFlow[]
}

export const E2E_METRICS = [
  { label: 'Specs smoke', value: '10' },
  { label: 'Specs regression', value: '6' },
  { label: 'Specs mobile', value: '1' },
  { label: 'Flujos documentados', value: '65' },
  { label: 'Worker Playwright', value: '1' },
] as const

export const E2E_COMMANDS = [
  { label: 'Smoke (rápido)', command: 'npm run test:e2e:smoke' },
  { label: 'Regression (CRUD)', command: 'npm run test:e2e:regression' },
  { label: 'Todo excepto @nightly', command: 'npm run test:e2e' },
  { label: 'Presigned S3 (@nightly)', command: 'E2E_PRESIGNED_UPLOAD=true npm run test:e2e:nightly' },
  { label: 'Mobile viewport (390px)', command: 'npm run test:e2e:mobile' },
  { label: 'UI interactiva', command: 'npm run test:e2e:ui' },
] as const

export const E2E_PREREQUISITES = [
  'Backend: npm run offline:all en pockets (core :7000, financial :7001, lifestyle :7002)',
  'Usuario de prueba: e2e / 123qweZ! (scripts/create-test-user.js en pockets)',
  'Variables E2E_USERNAME y E2E_PASSWORD (defaults locales en e2e/fixtures/auth.ts)',
  'Archivos: bucket S3 con CORS para localhost:3000',
  'Presigned upload: E2E_PRESIGNED_UPLOAD=true + credenciales AWS en backend',
] as const

export const E2E_CI_JOBS = [
  { job: 'PR smoke', specs: 'e2e/smoke/ (sin presigned)', when: 'Cada PR' },
  { job: 'Mobile viewport', specs: 'e2e/mobile/', when: 'PR o pre-release' },
  { job: 'Regression', specs: 'e2e/regression/', when: 'Nightly o pre-release' },
  {
    job: 'Nightly S3',
    specs: 'archivos @nightly',
    when: 'Staging 1×/día — E2E_PRESIGNED_UPLOAD=true + bucket CORS',
  },
] as const

export const E2E_SUITE_GROUPS: E2eSuiteGroup[] = [
  {
    kind: 'smoke',
    label: 'Smoke',
    command: 'npm run test:e2e:smoke',
    description:
      'Verificación rápida de render, navegación y CRUD mínimo. Corre en ~1 min con backend local.',
    flows: [
      {
        id: 'auth-login',
        name: 'Login page renders',
        specFile: 'e2e/smoke/auth.spec.ts',
        routes: ['/login'],
        backend: 'none',
        auth: false,
        steps: [
          { label: 'Abrir /login' },
          { label: 'Verificar heading Pockets, campos #username / #password y CTA Iniciar Sesión' },
        ],
        asserts: ['Formulario de login visible sin autenticación'],
      },
      {
        id: 'auth-redirect',
        name: 'Protected route redirects to login',
        specFile: 'e2e/smoke/auth.spec.ts',
        routes: ['/finanzas'],
        backend: 'none',
        auth: false,
        steps: [
          { label: 'Abrir /finanzas sin sesión' },
          { label: 'Esperar redirect a /login' },
        ],
        asserts: ['URL termina en /login'],
      },
      {
        id: 'auth-login-success',
        name: 'Successful login lands on home',
        specFile: 'e2e/smoke/auth.spec.ts',
        routes: ['/login', '/'],
        backend: 'core',
        auth: true,
        steps: [
          { label: 'Login UI con credenciales e2e' },
          { label: 'Verificar redirect a home' },
        ],
        asserts: ['Heading Pockets · Inicio', 'Launcher Finanzas visible'],
      },
      {
        id: 'auth-deep-link',
        name: 'Deep link returns to protected route after login',
        specFile: 'e2e/smoke/auth.spec.ts',
        routes: ['/finanzas', '/login'],
        backend: 'core+financial',
        auth: true,
        steps: [
          { label: 'Abrir /finanzas sin sesión → login' },
          { label: 'Iniciar sesión' },
          { label: 'Verificar vuelta a /finanzas' },
        ],
        asserts: ['URL /finanzas', '.finanzas-dashboard visible'],
      },
      {
        id: 'auth-logout-relogin',
        name: 'Logout from home and re-login',
        specFile: 'e2e/smoke/auth.spec.ts',
        routes: ['/', '/login'],
        backend: 'core',
        auth: true,
        steps: [
          { label: 'Home → Salir. Cerrar sesión' },
          { label: 'Confirmar en useConfirm (Salir)' },
          { label: 'Re-login con credenciales e2e' },
        ],
        asserts: ['Redirect /login', 'Vuelta a Pockets · Inicio'],
      },
      {
        id: 'home-launchers',
        name: 'Section launchers are visible',
        specFile: 'e2e/smoke/home.spec.ts',
        routes: ['/'],
        backend: 'core',
        auth: true,
        steps: [{ label: 'Abrir home' }, { label: 'Verificar 6 launchers de sección' }],
        asserts: ['Finanzas, Utilidades, Lifestyle, Justicia, Trabajo, Ajustes'],
      },
      {
        id: 'home-navigation',
        name: 'Launcher navigates to Finanzas and Lifestyle hubs',
        specFile: 'e2e/smoke/home.spec.ts',
        routes: ['/', '/finanzas', '/tiempo'],
        backend: 'core+financial',
        auth: true,
        steps: [
          { label: 'Click Finanzas → verificar hub' },
          { label: 'Volver home → click Lifestyle → verificar hub' },
        ],
        asserts: ['.finanzas-dashboard', '.tiempo-dashboard'],
      },
      {
        id: 'finanzas-hub',
        name: 'Hub loads and shows financial summary',
        specFile: 'e2e/smoke/finanzas.spec.ts',
        routes: ['/finanzas'],
        backend: 'core+financial',
        auth: true,
        steps: [
          { label: 'Login UI con usuario e2e' },
          { label: 'Navegar a /finanzas' },
          { label: 'Verificar dashboard y acción rápida Transacción' },
        ],
        asserts: ['.finanzas-dashboard visible', 'Botón Transacción en acciones rápidas'],
      },
      {
        id: 'finanzas-modules',
        name: 'Core modules render after navigation',
        specFile: 'e2e/smoke/finanzas.spec.ts',
        routes: [
          '/finanzas/cuentas',
          '/finanzas/presupuestos',
          '/finanzas/deudas',
          '/finanzas/transacciones',
        ],
        backend: 'core+financial',
        auth: true,
        steps: [
          { label: 'Visitar cada ruta CRUD' },
          { label: 'Verificar CTA principal de creación en cada módulo' },
        ],
        asserts: [
          'Agregar cuenta bancaria',
          'Agregar presupuesto',
          'Agregar deuda',
          'Agregar transacción',
        ],
      },
      {
        id: 'finanzas-section-hubs',
        name: 'Credito, cripto and ahorro hubs render',
        specFile: 'e2e/smoke/finanzas-hubs.spec.ts',
        routes: ['/finanzas/credito', '/finanzas/cripto', '/finanzas/ahorro'],
        backend: 'financial',
        auth: true,
        steps: [
          { label: 'Visitar cada section hub' },
          { label: 'Verificar título h1 y botón Volver a Finanzas' },
        ],
        asserts: ['Crédito y pagos', 'Criptomonedas', 'Ahorro e inflación'],
      },
      {
        id: 'finanzas-section-leaves',
        name: 'Navigate from section hub to leaf module create CTA',
        specFile: 'e2e/smoke/finanzas-hubs.spec.ts',
        routes: [
          '/finanzas/tarjetas-credito',
          '/finanzas/cripto-wallet',
          '/finanzas/cdts',
        ],
        backend: 'financial',
        auth: true,
        steps: [
          { label: 'Desde cada hub → navegar a módulo leaf' },
          { label: 'Verificar CTA de creación' },
        ],
        asserts: ['Agregar tarjeta', 'Agregar wallet', 'Agregar CDT'],
      },
      {
        id: 'finanzas-crud-chain',
        name: 'Create cuenta, transacción and edit transacción',
        specFile: 'e2e/smoke/finanzas.spec.ts',
        routes: ['/finanzas/cuentas', '/finanzas/transacciones'],
        backend: 'core+financial',
        auth: true,
        steps: [
          { label: 'Crear cuenta bancaria (nombre, banco, número único, balance)' },
          { label: 'Crear transacción vinculada a la cuenta' },
          { label: 'Abrir detalle → Editar transacción → cambiar descripción y fecha' },
        ],
        asserts: [
          'Tarjeta Ver cuenta {nombre}',
          'Fila Ver detalles de transacción {label}',
          'Lista actualizada tras editar',
        ],
      },
      {
        id: 'finanzas-secondary-crud',
        name: 'Secondary CRUD modules render create CTA',
        specFile: 'e2e/smoke/finanzas-secondary.spec.ts',
        routes: [
          '/finanzas/proyectos',
          '/finanzas/subscripciones',
          '/finanzas/tarjetas-debito',
          '/finanzas/listas-mercado',
          '/finanzas/cripto-transacciones',
        ],
        backend: 'core+financial',
        auth: true,
        steps: [{ label: 'Visitar cada módulo secundario' }, { label: 'Verificar CTA de creación' }],
        asserts: [
          'Agregar proyecto',
          'Agregar subscripción',
          'Agregar tarjeta',
          'Agregar producto',
          'Agregar transacción',
        ],
      },
      {
        id: 'finanzas-inflacion',
        name: 'Inflacion calculator renders with results',
        specFile: 'e2e/smoke/finanzas-secondary.spec.ts',
        routes: ['/finanzas/inflacion'],
        backend: 'financial',
        auth: true,
        steps: [{ label: 'Abrir calculadora de inflación' }],
        asserts: ['#amount y #years', 'Regiones devaluación e inflación'],
        notes: ['Sin persistencia — calculadora local con datos por defecto'],
      },
      {
        id: 'finanzas-inline-forms',
        name: 'Diseñador presupuestos and crypto vendors forms render',
        specFile: 'e2e/smoke/finanzas-secondary.spec.ts',
        routes: ['/finanzas/diseñador-presupuestos', '/finanzas/crypto-vendors'],
        backend: 'financial',
        auth: true,
        steps: [
          { label: 'Abrir diseñador → sección Agregar Item' },
          { label: 'Abrir vendedores cripto → Agregar Vendedor' },
        ],
        asserts: ['Heading Diseñador de Presupuestos', 'Heading Vendedores de Cripto', '#name visible'],
      },
      {
        id: 'registros-hub',
        name: 'Hub loads and lists utilidades sections',
        specFile: 'e2e/smoke/registros.spec.ts',
        routes: ['/registros'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Navegar a /registros' },
          { label: 'Verificar launchers Cuadernos, Secretos, Calculadora' },
        ],
        asserts: ['Heading Utilidades', 'Botones Ir a … visibles'],
      },
      {
        id: 'registros-modules',
        name: 'Cuadernos and secretos modules render',
        specFile: 'e2e/smoke/registros.spec.ts',
        routes: ['/registros/cuadernos', '/registros/secretos'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Abrir cuadernos → CTA Nuevo cuaderno' },
          { label: 'Abrir secretos → CTA Agregar secreto' },
        ],
        asserts: ['CTAs de creación visibles en ambos módulos'],
      },
      {
        id: 'registros-calculadora',
        name: 'Calculadora renders and accepts input',
        specFile: 'e2e/smoke/registros.spec.ts',
        routes: ['/registros/calculadora'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Abrir calculadora' },
          { label: 'Pulsar teclas 7 y 8' },
        ],
        asserts: ['Display muestra 78'],
        notes: ['Sin persistencia — solo UI local'],
      },
      {
        id: 'registros-cuaderno-secreto',
        name: 'Create cuaderno and secreto',
        specFile: 'e2e/smoke/registros.spec.ts',
        routes: ['/registros/cuadernos', '/registros/secretos'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Crear cuaderno → Crear y abrir → escribir bloque de texto' },
          { label: 'Esperar autosave Guardado' },
          { label: 'Reload → verificar título y contenido' },
          { label: 'Crear secreto con título y valor' },
        ],
        asserts: ['Treeitem del cuaderno', 'Tarjeta Ver secreto {título}'],
      },
      {
        id: 'tiempo-metas-render',
        name: 'Metas module renders',
        specFile: 'e2e/smoke/tiempo.spec.ts',
        routes: ['/tiempo/metas'],
        backend: 'lifestyle',
        auth: true,
        steps: [{ label: 'Abrir metas' }, { label: 'Verificar CTA y buscador' }],
        asserts: ['Nueva meta', 'Buscar metas'],
      },
      {
        id: 'tiempo-valores-render',
        name: 'Valores module renders',
        specFile: 'e2e/smoke/tiempo.spec.ts',
        routes: ['/tiempo/valores'],
        backend: 'lifestyle',
        auth: true,
        steps: [{ label: 'Abrir valores' }],
        asserts: ['Nuevo valor', 'Tabs Valores y Creencias'],
      },
      {
        id: 'tiempo-meta-crud',
        name: 'Create meta with task and persist after reload',
        specFile: 'e2e/smoke/tiempo.spec.ts',
        routes: ['/tiempo/metas'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Nueva meta → título + tarea inline → Crear meta' },
          { label: 'Reload' },
        ],
        asserts: ['Heading h2 con nombre de meta tras reload'],
      },
      {
        id: 'tiempo-valores-crud',
        name: 'Create valor and creencia with kind filters',
        specFile: 'e2e/smoke/tiempo.spec.ts',
        routes: ['/tiempo/valores'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Crear valor y creencia' },
          { label: 'Filtrar por tab Valores / Creencias' },
          { label: 'Reload → tab Todas' },
        ],
        asserts: ['Articles con aria-label Valor:/Creencia:', 'Filtros por tab funcionan'],
      },
      {
        id: 'trabajo-pipeline',
        name: 'Procesos de contratación pipeline renders',
        specFile: 'e2e/smoke/trabajo.spec.ts',
        routes: ['/trabajo/procesos'],
        backend: 'lifestyle',
        auth: true,
        steps: [{ label: 'Abrir procesos de contratación' }],
        asserts: ['Resumen de procesos', 'Tabs Pipeline, Motivos de cierre, Agenda'],
      },
      {
        id: 'trabajo-proceso-crud',
        name: 'Create hiring process with minimal fields',
        specFile: 'e2e/smoke/trabajo.spec.ts',
        routes: ['/trabajo/procesos'],
        backend: 'lifestyle',
        auth: true,
        steps: [
          { label: 'Opciones → Nuevo proceso' },
          { label: 'Nombre + empresa → Crear Proceso' },
          { label: 'Reload' },
        ],
        asserts: ['Heading h3 del proceso persiste'],
      },
      {
        id: 'archivos-render',
        name: 'Archivos module renders',
        specFile: 'e2e/smoke/archivos.spec.ts',
        routes: ['/registros/archivos'],
        backend: 'lifestyle',
        auth: true,
        steps: [{ label: 'Abrir archivos' }],
        asserts: ['CTA Subir archivo visible'],
      },
      {
        id: 'archivos-multipart',
        name: 'Upload small file via multipart and persist after reload',
        specFile: 'e2e/smoke/archivos.spec.ts',
        routes: ['/registros/archivos'],
        backend: 'lifestyle+s3',
        auth: true,
        steps: [
          { label: 'Subir archivo .txt ≤ 10 MB vía form multipart' },
          { label: 'Reload' },
        ],
        asserts: ['Tarjeta Ver archivo {título}'],
        notes: ['Requiere bucket S3 y credenciales AWS en backend'],
      },
      {
        id: 'archivos-presigned',
        name: 'Upload large file via presigned S3 flow',
        specFile: 'e2e/smoke/archivos.spec.ts',
        routes: ['/registros/archivos'],
        backend: 'lifestyle+s3',
        auth: true,
        tag: '@nightly',
        steps: [
          { label: 'Subir archivo > 10 MB' },
          { label: 'Interceptar upload-url → PUT S3 → complete' },
        ],
        asserts: ['Flujo presigned completo', 'Archivo visible en lista'],
        notes: ['Solo con E2E_PRESIGNED_UPLOAD=true', 'Omitido en smoke por defecto'],
      },
      {
        id: 'justicia-render',
        name: 'Procesos judiciales page renders with mocked search results',
        specFile: 'e2e/smoke/justicia.spec.ts',
        routes: ['/justicia/procesos'],
        backend: 'mocked',
        auth: true,
        steps: [
          { label: 'setupJudicialMocks antes de login' },
          { label: 'Abrir procesos judiciales' },
        ],
        asserts: ['Proceso mock visible con llave y despacho'],
        notes: ['API Rama Judicial mockeada — sin dependencia externa'],
      },
      {
        id: 'justicia-filter',
        name: 'Filters mocked judicial processes by search query',
        specFile: 'e2e/smoke/justicia.spec.ts',
        routes: ['/justicia/procesos'],
        backend: 'mocked',
        auth: true,
        steps: [
          { label: 'Buscar query sin match → empty state' },
          { label: 'Buscar E2E → proceso vuelve a aparecer' },
        ],
        asserts: ['Ningún proceso coincide con el filtro', 'Resultado restaurado'],
      },
      {
        id: 'justicia-detail',
        name: 'Opens process detail with mocked actuaciones',
        specFile: 'e2e/smoke/justicia.spec.ts',
        routes: ['/justicia/procesos'],
        backend: 'mocked',
        auth: true,
        steps: [{ label: 'Click en proceso mock' }, { label: 'Ver detalle y actuaciones' }],
        asserts: ['Heading h2 del proceso', 'Texto Auto admite demanda'],
      },
    ],
  },
  {
    kind: 'regression',
    label: 'Regression',
    command: 'npm run test:e2e:regression',
    description:
      'CRUD más profundo, hubs, edición y cadenas entre módulos. ~15 tests, ~1–2 min con backend local.',
    flows: [
      {
        id: 'ajustes-render',
        name: 'Settings page renders profile sections',
        specFile: 'e2e/regression/ajustes.spec.ts',
        routes: ['/ajustes'],
        backend: 'core',
        auth: true,
        tag: '@regression',
        steps: [{ label: 'Abrir ajustes' }],
        asserts: ['Heading Ajustes', 'Campos nombre para mostrar y nombre legal'],
      },
      {
        id: 'ajustes-save',
        name: 'Save display name',
        specFile: 'e2e/regression/ajustes.spec.ts',
        routes: ['/ajustes'],
        backend: 'core',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Editar nombre para mostrar' },
          { label: 'Guardar nombre → reload' },
        ],
        asserts: ['Toast Nombre actualizado correctamente', 'Valor persiste en input'],
        notes: ['Sin acciones destructivas'],
      },
      {
        id: 'notificaciones-mark-read',
        name: 'Notifications page renders and marks item as read',
        specFile: 'e2e/regression/notificaciones.spec.ts',
        routes: ['/', '/notificaciones'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear notificación vía API lifestyle (fixture)' },
          { label: 'Abrir /notificaciones' },
          { label: 'Marcar como leída en fila' },
        ],
        asserts: [
          'Resumen de notificaciones visible',
          'Fila pasa de --unread a --read',
          'Botón Marcar como no leída',
        ],
      },
      {
        id: 'finanzas-presupuesto',
        name: 'Create presupuesto and edit name',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/presupuestos'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear presupuesto (nombre, periodicidad, monto)' },
          { label: 'Detalle → Editar → #edit-nombre → Guardar Cambios' },
        ],
        asserts: ['Fila actualizada con nombre editado'],
      },
      {
        id: 'finanzas-deuda',
        name: 'Create deuda and edit concepto',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/deudas'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear deuda con concepto, divisa, montos y fecha de corte' },
          { label: 'Detalle → Editar → #edit-concepto y #edit-fechaCorte' },
        ],
        asserts: ['Fila actualizada con concepto editado'],
      },
      {
        id: 'finanzas-tarjeta-credito',
        name: 'Create tarjeta de crédito and persist after reload',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/tarjetas-credito'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar tarjeta (nombre, banco, cupo, tasa)' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de tarjeta {nombre} de {banco}'],
      },
      {
        id: 'finanzas-me-deben',
        name: 'Create deudor in me deben and persist after reload',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/me-deben'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar deudor con concepto y valor' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de {deudor}'],
      },
      {
        id: 'finanzas-cdt',
        name: 'Create CDT and persist after reload',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/cdts'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar CDT con fecha retiro futura (e2eDaysAhead)' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de {nombre}'],
      },
      {
        id: 'finanzas-cripto-wallet',
        name: 'Create crypto wallet and persist after reload',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/cripto-wallet'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar wallet (nombre, crypto, address)' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de {wallet}'],
      },
      {
        id: 'finanzas-proyecto',
        name: 'Create proyecto de ahorro and persist after reload',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/proyectos'],
        backend: 'financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar proyecto (monto con step 1000, duración 6 meses, fechas)' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de {proyecto}'],
        notes: ['#montoObjetivo usa min=1 step=1000 — valor debe ser 1+n×1000'],
      },
      {
        id: 'finanzas-tarjeta-debito',
        name: 'Create tarjeta de débito and persist after reload',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/cuentas', '/finanzas/tarjetas-debito'],
        backend: 'core+financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear cuenta bancaria' },
          { label: 'Crear tarjeta débito vinculada' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de {tarjeta}'],
      },
      {
        id: 'finanzas-subscripcion',
        name: 'Create subscripción linked to debit card and persist',
        specFile: 'e2e/regression/finanzas.spec.ts',
        routes: ['/finanzas/cuentas', '/finanzas/tarjetas-debito', '/finanzas/subscripciones'],
        backend: 'core+financial',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear cuenta + tarjeta débito' },
          { label: 'Crear subscripción con tarjeta y fecha corte futura' },
          { label: 'Reload' },
        ],
        asserts: ['Fila Ver detalles de {subscripción}'],
      },
      {
        id: 'registros-empleado',
        name: 'Create empleado and open detail',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/empleados'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar empleado (nombre + identificación única)' },
          { label: 'Submit vía form.empleados-form' },
          { label: 'Abrir tarjeta → modal detalle' },
        ],
        asserts: ['Heading h2 con nombre del empleado'],
      },
      {
        id: 'registros-cuaderno-blocks',
        name: 'Cuaderno adds second text block with autosave',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/cuadernos'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear cuaderno y abrir editor' },
          { label: 'Escribir bloque 1 → Añadir bloque debajo' },
          { label: 'Escribir bloque 2 → esperar Guardado → reload' },
        ],
        asserts: ['Dos textbox Texto con contenido persistido'],
      },
      {
        id: 'registros-vehiculo',
        name: 'Create vehículo and persist after reload',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/vehiculos'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar vehículo vía form.vehiculos-form' },
          { label: 'Reload' },
        ],
        asserts: ['Tarjeta Ver vehículo persiste'],
      },
      {
        id: 'registros-patrimonio',
        name: 'Create patrimonio item and persist after reload',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/patrimonio'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [{ label: 'Agregar ítem de patrimonio' }, { label: 'Reload' }],
        asserts: ['Tarjeta Ver ítem persiste'],
      },
      {
        id: 'registros-generador',
        name: 'Password generator produces output and can copy',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/generador-contrasenas'],
        backend: 'none',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'grantPermissions clipboard' },
          { label: 'Generar contraseña → Copiar (exact)' },
        ],
        asserts: ['Toast Contraseña copiada al portapapeles'],
        notes: ['Sesión local — no persiste en servidor'],
      },
      {
        id: 'registros-secreto-decrypt',
        name: 'Decrypt secreto with user password',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/secretos'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear secreto → Desencriptar rápido' },
          { label: 'Contraseña de usuario e2e → revelar valor' },
        ],
        asserts: ['Toast desencriptado exitosamente', '#decrypted-value con valor'],
      },
      {
        id: 'registros-archivo-viewer',
        name: 'Open text archivo preview viewer from detail modal',
        specFile: 'e2e/regression/registros.spec.ts',
        routes: ['/registros/archivos'],
        backend: 'lifestyle+s3',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Subir .txt → abrir detalle → Ver' },
          { label: 'Esperar iframe de vista previa' },
        ],
        asserts: ['Documentos · Vista previa', 'iframe con título de preview'],
        notes: ['Sin delete — solo viewer'],
      },
      {
        id: 'tiempo-hub',
        name: 'Hub loads lifestyle modules',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [{ label: 'Abrir hub Lifestyle' }],
        asserts: ['.tiempo-dashboard', 'Launchers Fechas, Rutinas, Mi Diario, Mi Día'],
      },
      {
        id: 'tiempo-fechas',
        name: 'Create calendar event and persist after reload',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo/fechas'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Agregar evento → título + fecha' },
          { label: 'Marcar Todo el día (BE exige event_time si no)' },
          { label: 'Submit form.fechas-modal-form → reload' },
        ],
        asserts: ['Toast Evento creado exitosamente', 'Tarjeta Ver evento persiste'],
      },
      {
        id: 'tiempo-rutinas',
        name: 'Create daily routine and persist after reload',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo/rutinas'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [{ label: 'Agregar rutina → Crear rutina' }, { label: 'Reload' }],
        asserts: ['Tarjeta Ver rutina persiste'],
      },
      {
        id: 'tiempo-mi-dia',
        name: 'Complete today routine from Mi Día',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo/rutinas', '/tiempo/mi-dia'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear rutina diaria' },
          { label: 'Ir a Mi Día → Marcar como completada' },
        ],
        asserts: ['Botón {título} completada'],
      },
      {
        id: 'tiempo-mi-diario',
        name: 'Create diary entry and persist after reload',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo/mi-diario'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Nueva entrada con fecha de ayer (lista, no panel de hoy)' },
          { label: 'Crear entrada → reload' },
        ],
        asserts: ['Toast creada exitosamente', 'Botón Ver entrada del … persiste'],
        notes: ['Entrada de hoy usa panel Continuar leyendo, no la lista'],
      },
      {
        id: 'tiempo-rutina-delete',
        name: 'Delete routine with confirm dialog',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo/rutinas'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear rutina → abrir detalle → Eliminar' },
          { label: 'Confirmar en useConfirm (Confirmar eliminación)' },
        ],
        asserts: ['Fila Ver rutina desaparece de la lista'],
      },
      {
        id: 'tiempo-meta-delete',
        name: 'Delete meta with confirm dialog',
        specFile: 'e2e/regression/tiempo.spec.ts',
        routes: ['/tiempo/metas'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear meta → Eliminar meta en tarjeta expandida' },
          { label: 'Confirmar en useConfirm (Eliminar meta)' },
        ],
        asserts: ['Heading de la meta desaparece'],
      },
      {
        id: 'trabajo-hub',
        name: 'Hub loads trabajo modules',
        specFile: 'e2e/regression/trabajo.spec.ts',
        routes: ['/trabajo'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [{ label: 'Abrir hub Trabajo' }],
        asserts: ['.trabajo-dashboard', 'Launchers Contratos, Actividades, Procesos'],
      },
      {
        id: 'trabajo-contrato-actividad',
        name: 'Create contract then activity on kanban',
        specFile: 'e2e/regression/trabajo.spec.ts',
        routes: ['/trabajo/contratos', '/trabajo/actividades'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear contrato (nombre + cliente)' },
          { label: 'Crear actividad vinculada al cliente en kanban' },
          { label: 'Reload' },
        ],
        asserts: ['Tarjeta Abrir {actividad} en kanban'],
      },
      {
        id: 'trabajo-kanban-drag',
        name: 'Move activity card to in progress on kanban',
        specFile: 'e2e/regression/trabajo.spec.ts',
        routes: ['/trabajo/contratos', '/trabajo/actividades'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear contrato + actividad en tablero' },
          { label: 'dragTo columna En progreso' },
        ],
        asserts: ['Card en columna destino', 'Métrica "en progreso"'],
      },
      {
        id: 'trabajo-proceso-close',
        name: 'Close hiring process with closure modal',
        specFile: 'e2e/regression/trabajo.spec.ts',
        routes: ['/trabajo/procesos'],
        backend: 'lifestyle',
        auth: true,
        tag: '@regression',
        steps: [
          { label: 'Crear proceso → abrir detalle → Cerrar proceso' },
          { label: 'Confirmar cierre (motivo por defecto Otro)' },
          { label: 'Verificar en pestaña Motivos de cierre' },
        ],
        asserts: ['Toast proceso cerrado', 'Proceso fuera del pipeline abierto'],
      },
    ],
  },
  {
    kind: 'mobile',
    label: 'Mobile',
    command: 'npm run test:e2e:mobile',
    description:
      'Viewport 390×844 (≤768px breakpoint). Home, Finanzas, Transacciones, Utilidades hub y Mi Día.',
    flows: [
      {
        id: 'mobile-home-finanzas',
        name: 'Home launchers and Finanzas hub on mobile',
        specFile: 'e2e/mobile/critical.spec.ts',
        routes: ['/', '/finanzas'],
        backend: 'core+financial',
        auth: true,
        tag: '@mobile',
        steps: [
          { label: 'Abrir Home en viewport móvil' },
          { label: 'Tap launcher Finanzas' },
        ],
        asserts: ['Navegación por secciones visible', '.finanzas-dashboard'],
        notes: ['Viewport 390×844 alineado con useBreakpoint mobile (768px)'],
      },
      {
        id: 'mobile-finanzas-cuentas',
        name: 'Finanzas hub modules navigate to cuentas on mobile',
        specFile: 'e2e/mobile/critical.spec.ts',
        routes: ['/finanzas', '/finanzas/cuentas'],
        backend: 'core+financial',
        auth: true,
        tag: '@mobile',
        steps: [
          { label: 'Abrir hub Finanzas' },
          { label: 'Tap Ir a Cuentas en módulos' },
        ],
        asserts: ['Módulos de Finanzas visible', 'CTA Agregar cuenta bancaria'],
      },
      {
        id: 'mobile-transacciones-create',
        name: 'Transacciones list and create modal on mobile',
        specFile: 'e2e/mobile/critical.spec.ts',
        routes: ['/finanzas/transacciones'],
        backend: 'core+financial',
        auth: true,
        tag: '@mobile',
        steps: [
          { label: 'Abrir transacciones' },
          { label: 'Tap Agregar transacción' },
        ],
        asserts: ['Heading Nueva Transacción', 'Campo #monto visible'],
      },
      {
        id: 'mobile-utilidades-cuadernos',
        name: 'Utilidades hub navigates to cuadernos on mobile',
        specFile: 'e2e/mobile/critical.spec.ts',
        routes: ['/registros', '/registros/cuadernos'],
        backend: 'lifestyle',
        auth: true,
        tag: '@mobile',
        steps: [
          { label: 'Abrir hub Utilidades' },
          { label: 'Tap Ir a Cuadernos' },
        ],
        asserts: ['Módulos de Utilidades visible', 'CTA Nuevo cuaderno'],
      },
      {
        id: 'mobile-mi-dia-routine',
        name: 'Mi Día completes today routine on mobile',
        specFile: 'e2e/mobile/critical.spec.ts',
        routes: ['/tiempo/rutinas', '/tiempo/mi-dia'],
        backend: 'lifestyle',
        auth: true,
        tag: '@mobile',
        steps: [
          { label: 'Crear rutina diaria' },
          { label: 'Abrir Mi Día → Marcar como completada' },
        ],
        asserts: ['Region Rutinas de hoy', 'Botón {título} completada'],
      },
    ],
  },
]

export function formatE2eBackend(backend: E2eBackendService): string {
  switch (backend) {
    case 'none':
      return 'Solo frontend'
    case 'core':
      return 'Core :7000'
    case 'financial':
      return 'Financial :7001'
    case 'core+financial':
      return 'Core + Financial'
    case 'lifestyle':
      return 'Lifestyle :7002'
    case 'lifestyle+s3':
      return 'Lifestyle + S3'
    case 'mocked':
      return 'Mocked (page.route)'
    default:
      return backend
  }
}
