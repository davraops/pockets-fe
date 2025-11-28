# Backend API - Procesos Judiciales (Proxy Endpoints)

## ⚠️ Problema Actual

El frontend está intentando hacer llamadas directas a la API externa de la Rama Judicial de Colombia (`https://consultaprocesos.ramajudicial.gov.co:448/api/v2`), lo cual causa:

1. **Errores CORS**: La API externa no permite solicitudes desde el navegador
2. **Errores 403 (Forbidden)**: La API externa bloquea solicitudes que no vienen de un servidor

## ✅ Solución

El backend debe implementar endpoints **proxy** que actúen como intermediarios entre el frontend y la API externa. El backend hace las llamadas a la API externa desde el servidor (sin problemas de CORS/403) y retorna los datos al frontend.

---

## 📋 Especificación de Endpoints

### Servicio Recomendado

**pockets-lifestyle** - Estos endpoints deben agregarse al servicio `pockets-lifestyle` ya que están relacionados con la funcionalidad de "Justicia" que es parte del estilo de vida del usuario.

**URL Base:** `API_LIFESTYLE` (https://kstxcg0o0g.execute-api.us-east-1.amazonaws.com/dev)

---

### 1. GET /judicial-processes

Consultar procesos judiciales por nombre completo.

**URL:** `GET ${API_LIFESTYLE}/judicial-processes`

**Query Parameters:**
- `nombre` (requerido) - Nombre completo de la persona a consultar (string, URL-encoded)
- `tipoPersona` (opcional) - Tipo de persona: `'nat'` (natural) o `'jur'` (jurídica). Default: `'nat'`
- `SoloActivos` (opcional) - Si solo se deben mostrar procesos activos. Default: `false` (string: `'true'` o `'false'`)
- `pagina` (opcional) - Número de página para paginación. Default: `1` (integer)

**Headers:**
```
Authorization: Bearer <token>  // ⚠️ REQUERIDO
Content-Type: application/json
```

**Ejemplo de Request:**
```javascript
const response = await fetch(
  `${API_LIFESTYLE}/judicial-processes?nombre=Rafael%20Augusto%20Avella%20Pena&tipoPersona=nat&SoloActivos=false&pagina=1`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Implementación Backend (Pseudocódigo):**
```javascript
// Lambda function handler
exports.handler = async (event) => {
  const { nombre, tipoPersona = 'nat', SoloActivos = 'false', pagina = '1' } = event.queryStringParameters || {};
  
  if (!nombre) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'El parámetro "nombre" es requerido' })
    };
  }
  
  // Construir URL de la API externa
  const nombreEncoded = encodeURIComponent(nombre);
  const externalUrl = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NombreRazonSocial?nombre=${nombreEncoded}&tipoPersona=${tipoPersona}&SoloActivos=${SoloActivos}&codificacionDespacho=&pagina=${pagina}`;
  
  try {
    // Hacer llamada a la API externa desde el servidor
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Error al consultar procesos judiciales',
          details: { message: `HTTP ${response.status}` }
        })
      };
    }
    
    const data = await response.json();
    
    // Retornar la respuesta tal cual (o procesarla si es necesario)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // O configurar CORS apropiadamente
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error de conexión con la API externa',
        details: { message: error.message }
      })
    };
  }
};
```

**Response (200):**
```json
{
  "procesos": [
    {
      "idProceso": 216809590,
      "idConexion": 12345,
      "llaveProceso": "11001-00331-2023-00001-01",
      "fechaProceso": "2023-01-15T00:00:00",
      "fechaUltimaActuacion": "2024-01-20T00:00:00",
      "despacho": "JUZGADO 001 CIVIL MUNICIPAL DE BOGOTÁ",
      "departamento": "CUNDINAMARCA",
      "sujetosProcesales": "DEMANDANTE: JUAN PÉREZ | DEMANDADO: RAFAEL AUGUSTO AVELLA PENA",
      "esPrivado": false,
      "cantFilas": 10
    }
  ],
  "paginacion": {
    "pagina": 1,
    "totalPaginas": 1,
    "totalRegistros": 1
  }
}
```

**Response (400):**
```json
{
  "error": "El parámetro 'nombre' es requerido",
  "details": {}
}
```

**Response (500):**
```json
{
  "error": "Error de conexión con la API externa",
  "details": {
    "message": "Error message here"
  }
}
```

---

### 2. GET /judicial-processes/{idProceso}/actuaciones

Obtener las actuaciones (acciones/procedimientos) de un proceso judicial específico.

**URL:** `GET ${API_LIFESTYLE}/judicial-processes/{idProceso}/actuaciones`

**Path Parameters:**
- `idProceso` (requerido) - ID del proceso judicial (integer)

**Query Parameters:**
- `pagina` (opcional) - Número de página para paginación. Default: `1` (integer)

**Headers:**
```
Authorization: Bearer <token>  // ⚠️ REQUERIDO
Content-Type: application/json
```

**Ejemplo de Request:**
```javascript
const idProceso = 216809590;
const response = await fetch(
  `${API_LIFESTYLE}/judicial-processes/${idProceso}/actuaciones?pagina=1`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Implementación Backend (Pseudocódigo):**
```javascript
// Lambda function handler
exports.handler = async (event) => {
  const { idProceso } = event.pathParameters || {};
  const { pagina = '1' } = event.queryStringParameters || {};
  
  if (!idProceso || isNaN(Number(idProceso))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'El parámetro "idProceso" es requerido y debe ser un número válido' })
    };
  }
  
  // Construir URL de la API externa
  const externalUrl = `https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/${idProceso}?pagina=${pagina}`;
  
  try {
    // Hacer llamada a la API externa desde el servidor
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Error al consultar actuaciones del proceso',
          details: { message: `HTTP ${response.status}` }
        })
      };
    }
    
    const data = await response.json();
    
    // Retornar la respuesta tal cual (o procesarla si es necesario)
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // O configurar CORS apropiadamente
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error de conexión con la API externa',
        details: { message: error.message }
      })
    };
  }
};
```

**Response (200):**
```json
{
  "actuaciones": [
    {
      "idRegActuacion": 123456,
      "llaveProceso": "11001-00331-2023-00001-01",
      "consActuacion": 1,
      "fechaActuacion": "2023-01-20T00:00:00",
      "actuacion": "ADMISIÓN DE LA DEMANDA",
      "anotacion": "Se admite la demanda presentada por el demandante.",
      "fechaInicial": null,
      "fechaFinal": null,
      "fechaRegistro": "2023-01-20T10:30:00",
      "codRegla": "001",
      "conDocumentos": true,
      "cant": 1
    },
    {
      "idRegActuacion": 123457,
      "llaveProceso": "11001-00331-2023-00001-01",
      "consActuacion": 2,
      "fechaActuacion": "2023-02-15T00:00:00",
      "actuacion": "AUTO RECHAZA DEMANDA",
      "anotacion": "Se rechaza la demanda por falta de requisitos.",
      "fechaInicial": null,
      "fechaFinal": null,
      "fechaRegistro": "2023-02-15T14:20:00",
      "codRegla": "002",
      "conDocumentos": false,
      "cant": 1
    }
  ],
  "paginacion": {
    "pagina": 1,
    "totalPaginas": 1,
    "totalRegistros": 2
  }
}
```

**Response (400):**
```json
{
  "error": "El parámetro 'idProceso' es requerido y debe ser un número válido",
  "details": {}
}
```

**Response (404):**
```json
{
  "error": "Proceso no encontrado",
  "details": {}
}
```

**Response (500):**
```json
{
  "error": "Error de conexión con la API externa",
  "details": {
    "message": "Error message here"
  }
}
```

---

## 🔧 Configuración del Servidor

### CORS

Asegúrate de que los endpoints tengan configurado CORS correctamente para permitir solicitudes desde:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:8080`
- `http://localhost:5173`
- `http://localhost:5174`
- `https://pockets.avellaconsulting.com`
- `https://www.pockets.avellaconsulting.com`

### Autenticación

Ambos endpoints requieren autenticación JWT. El token debe ser válido y no expirado.

### Rate Limiting

Considera implementar rate limiting para evitar abusos, ya que estas llamadas se hacen a una API externa.

### Caching (Opcional)

Puedes considerar implementar caching de las respuestas para reducir llamadas a la API externa:
- Cachear procesos por nombre durante X minutos
- Cachear actuaciones por idProceso durante X minutos

---

## 📝 Notas de Implementación

1. **Manejo de Errores**: Asegúrate de manejar correctamente los errores de la API externa y retornar mensajes claros al frontend.

2. **Validación**: Valida todos los parámetros de entrada antes de hacer la llamada a la API externa.

3. **Logging**: Considera agregar logging para debugging y monitoreo de las llamadas a la API externa.

4. **Timeout**: Configura un timeout apropiado para las llamadas a la API externa (ej: 30 segundos).

5. **Retry Logic**: Considera implementar lógica de reintento para manejar errores temporales de la API externa.

---

## ✅ Checklist de Implementación

- [ ] Crear función Lambda para `GET /judicial-processes`
- [ ] Crear función Lambda para `GET /judicial-processes/{idProceso}/actuaciones`
- [ ] Configurar rutas en API Gateway
- [ ] Configurar CORS correctamente
- [ ] Agregar autenticación JWT
- [ ] Implementar validación de parámetros
- [ ] Implementar manejo de errores
- [ ] Agregar logging
- [ ] Configurar timeout
- [ ] (Opcional) Implementar caching
- [ ] (Opcional) Implementar rate limiting
- [ ] Probar endpoints con Postman/curl
- [ ] Verificar que el frontend pueda consumir los endpoints

---

## 🔗 Referencias

- **API Externa:** https://consultaprocesos.ramajudicial.gov.co:448/api/v2
- **Documentación Frontend:** `FRONTEND_API.md`
- **Arquitectura de Servicios:** `SERVICES_ARCHITECTURE.md`

---

## 📞 Soporte

Si tienes preguntas sobre la implementación, consulta:
1. La documentación del frontend en `FRONTEND_API.md`
2. El código del frontend en `src/services/api.ts` (métodos `getJudicialProcesses` y `getProcessActuaciones`)
3. El componente de frontend en `src/pages/Procesos.tsx`

