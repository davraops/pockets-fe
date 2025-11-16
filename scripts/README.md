# Scripts de Despliegue

Scripts para crear y desplegar el proyecto a AWS S3.

## Prerequisitos

1. **AWS CLI instalado y configurado**
   ```bash
   # Instalar AWS CLI (si no está instalado)
   # Ubuntu/Debian:
   sudo apt-get install awscli
   
   # macOS:
   brew install awscli
   ```

2. **Credenciales de AWS configuradas**
   - Las credenciales deben estar en el archivo `.env` o configuradas en AWS CLI
   - Variables requeridas:
     - `VITE_AWS_ACCESS_KEY_ID`
     - `VITE_AWS_SECRET_ACCESS_KEY`
     - `VITE_AWS_REGION` (default: us-east-1)

3. **Configurar AWS CLI** (si no usas .env):
   ```bash
   aws configure
   ```

## Scripts Disponibles

### 1. Crear Bucket S3

Crea el bucket S3 con la configuración necesaria para hosting estático.

```bash
npm run create-bucket
# o directamente:
./scripts/create-s3-bucket.sh
```

**Qué hace:**
- Crea el bucket `pockets.avellaconsulting.com` en la región especificada
- Configura hosting estático con `index.html` como documento de índice
- Configura el bucket como **privado** (bloquea acceso público)
- Configura CORS para permitir requests desde el dominio
- Habilita encriptación y versionado
- **Nota:** El bucket es privado porque se accederá a través de CloudFront

### 2. Desplegar a S3

Construye el proyecto y lo despliega al bucket S3.

```bash
npm run deploy
# o directamente:
./scripts/deploy.sh
```

**Qué hace:**
- Instala dependencias si es necesario
- Construye el proyecto (`npm run build`)
- Sincroniza archivos con S3 (solo archivos modificados)
- Configura cache-control apropiado para diferentes tipos de archivos
- Intenta invalidar cache de CloudFront si existe una distribución

### 3. Configurar CloudFront

Configura CloudFront para servir el bucket S3 privado con dominio personalizado.

```bash
npm run setup-cloudfront
# o directamente:
./scripts/setup-cloudfront.sh
```

**Qué hace:**
- Crea un Origin Access Control (OAC) para CloudFront
- Configura la política del bucket para permitir acceso desde CloudFront
- Crea una distribución de CloudFront
- Configura manejo de errores para React Router (SPA)
- Configura certificado SSL si existe en ACM

### 4. Setup y Despliegue Completo

Ejecuta los scripts en secuencia.

```bash
npm run setup-and-deploy
```

## Configuración de Dominio Personalizado

El bucket es **privado** y se accede a través de CloudFront. Para configurar el dominio:

1. **Ejecutar setup de CloudFront:**
   ```bash
   npm run setup-cloudfront
   ```

2. **Configurar DNS en Route 53:**
   - Crear un registro A (Alias) apuntando a la distribución de CloudFront
   - O crear un registro CNAME apuntando al dominio de CloudFront

3. **Certificado SSL:**
   - El script buscará automáticamente un certificado en ACM para el dominio
   - Si no existe, puedes crearlo en AWS Certificate Manager (ACM)
   - Asegúrate de que el certificado esté en la región `us-east-1`

## Estructura del Bucket

```
pockets.avellaconsulting.com/
├── index.html          (sin cache)
├── assets/
│   ├── *.js            (cache largo)
│   ├── *.css           (cache largo)
│   └── *.png/jpg/etc   (cache largo)
└── ...
```

## Troubleshooting

### Error: "NoSuchBucket"
- Ejecuta primero `npm run create-bucket`

### Error: "Access Denied"
- Verifica que las credenciales de AWS sean correctas
- Verifica que el usuario tenga permisos para S3

### Error: "AWS CLI no está instalado"
- Instala AWS CLI según tu sistema operativo

### Los cambios no se reflejan
- Espera unos minutos (propagación de S3)
- Si usas CloudFront, espera a que se complete la invalidación
- Limpia el cache del navegador

## Notas Importantes

- 🔒 El bucket está configurado como **privado** (no acceso público)
- 🌐 El acceso se realiza a través de CloudFront usando OAC
- ⚠️ Los archivos HTML no tienen cache para permitir actualizaciones inmediatas
- ⚠️ Los assets estáticos tienen cache largo para mejor rendimiento
- ⚠️ CloudFront tarda 15-20 minutos en desplegarse completamente
- ⚠️ Asegúrate de configurar DNS después de crear la distribución de CloudFront

