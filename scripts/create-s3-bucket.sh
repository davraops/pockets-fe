#!/bin/bash

# Script para crear el bucket S3 para hosting estático de pockets.avellaconsulting.com
# Requiere AWS CLI configurado con credenciales

set -e

# Cargar variables de entorno del archivo .env si existe
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BUCKET_NAME="pockets.avellaconsulting.com"
REGION="${VITE_AWS_REGION:-us-east-1}"

# Configurar AWS CLI con las credenciales del .env si están disponibles
if [ -n "$VITE_AWS_ACCESS_KEY_ID" ] && [ -n "$VITE_AWS_SECRET_ACCESS_KEY" ]; then
    export AWS_ACCESS_KEY_ID="$VITE_AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$VITE_AWS_SECRET_ACCESS_KEY"
    export AWS_DEFAULT_REGION="$REGION"
fi

echo "🚀 Creando bucket S3: $BUCKET_NAME en región $REGION"

# Verificar si AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI no está instalado. Por favor instálalo primero."
    exit 1
fi

# Verificar si el bucket ya existe
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "📦 El bucket no existe. Creándolo..."
    
    # Crear el bucket
    if [ "$REGION" = "us-east-1" ]; then
        # us-east-1 no requiere LocationConstraint
        aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
    else
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
    fi
    
    echo "✅ Bucket creado exitosamente"
else
    echo "ℹ️  El bucket ya existe"
fi

# Configurar hosting estático
echo "⚙️  Configurando hosting estático..."

# Crear archivo de configuración temporal para hosting
cat > /tmp/website-config.json << EOF
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "index.html"
    }
}
EOF

aws s3api put-bucket-website \
    --bucket "$BUCKET_NAME" \
    --website-configuration file:///tmp/website-config.json

rm /tmp/website-config.json

echo "✅ Hosting estático configurado"

# Configurar bloqueo de acceso público (bucket privado)
echo "🔒 Configurando bucket como privado..."

cat > /tmp/public-access-block.json << EOF
{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
}
EOF

aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration file:///tmp/public-access-block.json

rm /tmp/public-access-block.json

echo "✅ Bucket configurado como privado"
echo "   ℹ️  El acceso público está bloqueado. CloudFront accederá usando OAI/OAC."

# Configurar CORS para permitir requests desde el dominio
echo "🌐 Configurando CORS..."

cat > /tmp/cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": [
                "https://pockets.avellaconsulting.com",
                "https://www.pockets.avellaconsulting.com",
                "http://localhost:3000",
                "http://localhost:5173"
            ],
            "ExposeHeaders": [],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///tmp/cors-config.json

rm /tmp/cors-config.json

echo "✅ CORS configurado"

# Configurar encriptación
echo "🔐 Configurando encriptación..."

aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

echo "✅ Encriptación configurada"

# Configurar versionado (opcional, pero recomendado)
echo "📝 Habilitando versionado..."

aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

echo "✅ Versionado habilitado"

echo ""
echo "🎉 ¡Bucket S3 configurado exitosamente!"
echo ""
echo "📋 Resumen:"
echo "   Bucket: $BUCKET_NAME"
echo "   Región: $REGION"
echo "   Hosting estático: Habilitado"
echo "   Acceso público: Bloqueado (bucket privado)"
echo ""
echo "📝 Próximos pasos para CloudFront:"
echo "   1. Crear una distribución de CloudFront"
echo "   2. Configurar el origen como: $BUCKET_NAME.s3.$REGION.amazonaws.com"
echo "   3. Crear un Origin Access Control (OAC) o Origin Access Identity (OAI)"
echo "   4. Configurar la política del bucket para permitir acceso desde CloudFront"
echo "   5. Configurar el dominio personalizado y certificado SSL"
echo ""
echo "💡 Puedes usar el script scripts/setup-cloudfront.sh para automatizar esto"
echo ""

