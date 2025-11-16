#!/bin/bash

# Script para construir y desplegar el proyecto a S3
# Requiere AWS CLI configurado con credenciales

set -e

# Cargar variables de entorno del archivo .env si existe
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BUCKET_NAME="pockets.avellaconsulting.com"
REGION="${VITE_AWS_REGION:-us-east-1}"
DIST_DIR="dist"

# Configurar AWS CLI con las credenciales del .env si están disponibles
if [ -n "$VITE_AWS_ACCESS_KEY_ID" ] && [ -n "$VITE_AWS_SECRET_ACCESS_KEY" ]; then
    export AWS_ACCESS_KEY_ID="$VITE_AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$VITE_AWS_SECRET_ACCESS_KEY"
    export AWS_DEFAULT_REGION="$REGION"
fi

echo "🚀 Iniciando despliegue a S3..."
echo "   Bucket: $BUCKET_NAME"
echo "   Región: $REGION"
echo ""

# Verificar si AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar si el bucket existe
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "❌ Error: El bucket $BUCKET_NAME no existe."
    echo "   Por favor ejecuta primero: ./scripts/create-s3-bucket.sh"
    exit 1
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado."
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado."
    exit 1
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Construir el proyecto
echo "🔨 Construyendo el proyecto..."
npm run build

# Verificar que el directorio dist existe
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: El directorio $DIST_DIR no existe después del build."
    exit 1
fi

# Sincronizar archivos con S3 (solo archivos modificados)
echo "📤 Subiendo archivos a S3..."

# Subir assets estáticos con cache largo
aws s3 sync "$DIST_DIR" "s3://$BUCKET_NAME" \
    --region "$REGION" \
    --delete \
    --exact-timestamps \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "*.map"

# Subir archivos HTML con cache-control diferente (sin cache para HTML)
# Esto es importante para React Router (SPA) - todas las rutas deben servir index.html
echo "📄 Subiendo archivos HTML..."

# Subir index.html principal
aws s3 cp "$DIST_DIR/index.html" "s3://$BUCKET_NAME/index.html" \
    --region "$REGION" \
    --content-type "text/html" \
    --cache-control "public, max-age=0, must-revalidate"

# Buscar otros archivos HTML y subirlos también
find "$DIST_DIR" -name "*.html" -type f | while read -r html_file; do
    rel_path="${html_file#$DIST_DIR/}"
    if [ "$rel_path" != "index.html" ]; then
        aws s3 cp "$html_file" "s3://$BUCKET_NAME/$rel_path" \
            --region "$REGION" \
            --content-type "text/html" \
            --cache-control "public, max-age=0, must-revalidate"
    fi
done

# Subir source maps con no-cache
echo "🗺️  Subiendo source maps..."
find "$DIST_DIR" -name "*.map" -type f | while read -r map_file; do
    rel_path="${map_file#$DIST_DIR/}"
    aws s3 cp "$map_file" "s3://$BUCKET_NAME/$rel_path" \
        --region "$REGION" \
        --content-type "application/json" \
        --cache-control "public, max-age=0, must-revalidate"
done

# Invalidar CloudFront cache si existe una distribución (opcional)
echo ""
echo "🔄 Verificando distribución de CloudFront..."

# Intentar encontrar distribución de CloudFront asociada al bucket
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items[?contains(@, '$BUCKET_NAME')]].Id" \
    --output text 2>/dev/null || echo "")

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "   Distribución encontrada: $DISTRIBUTION_ID"
    echo "   Creando invalidación de cache..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query "Invalidation.Id" \
        --output text)
    
    echo "   ✅ Invalidación creada: $INVALIDATION_ID"
    echo "   ⏳ La invalidación puede tardar algunos minutos en completarse"
else
    echo "   ℹ️  No se encontró distribución de CloudFront asociada"
    echo "   ⚠️  Si usas CloudFront, configura la invalidación manualmente"
fi

echo ""
echo "✅ ¡Despliegue completado exitosamente!"
echo ""
echo "🌐 Tu aplicación debería estar disponible en:"
echo "   http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "   O en tu dominio personalizado (si está configurado):"
echo "   https://pockets.avellaconsulting.com"
echo ""

