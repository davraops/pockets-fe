#!/bin/bash

# Script para configurar CloudFront y conectar el bucket S3 privado
# Requiere AWS CLI configurado con credenciales

set -e

# Cargar variables de entorno del archivo .env si existe
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

BUCKET_NAME="pockets.avellaconsulting.com"
REGION="${VITE_AWS_REGION:-us-east-1}"
DOMAIN_NAME="pockets.avellaconsulting.com"

# Configurar AWS CLI con las credenciales del .env si están disponibles
if [ -n "$VITE_AWS_ACCESS_KEY_ID" ] && [ -n "$VITE_AWS_SECRET_ACCESS_KEY" ]; then
    export AWS_ACCESS_KEY_ID="$VITE_AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$VITE_AWS_SECRET_ACCESS_KEY"
    export AWS_DEFAULT_REGION="$REGION"
fi

echo "🚀 Configurando CloudFront para bucket S3 privado..."
echo "   Bucket: $BUCKET_NAME"
echo "   Dominio: $DOMAIN_NAME"
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
    echo "   Por favor ejecuta primero: npm run create-bucket"
    exit 1
fi

# Crear Origin Access Control (OAC) - método recomendado por AWS
echo "🔐 Creando Origin Access Control (OAC)..."

OAC_NAME="pockets-oac-$(date +%s)"

OAC_OUTPUT=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{
        \"Name\": \"$OAC_NAME\",
        \"OriginAccessControlOriginType\": \"s3\",
        \"SigningBehavior\": \"always\",
        \"SigningProtocol\": \"sigv4\"
    }" \
    --query 'OriginAccessControl.{Id:Id,ETag:ETag}' \
    --output json)

OAC_ID=$(echo $OAC_OUTPUT | jq -r '.Id')
OAC_ETAG=$(echo $OAC_OUTPUT | jq -r '.ETag')

if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "null" ]; then
    echo "❌ Error al crear OAC. Verifica tus permisos."
    exit 1
fi

echo "✅ OAC creado: $OAC_ID"

# Configurar política del bucket para permitir acceso desde CloudFront
echo "🔓 Configurando política del bucket para CloudFront..."

BUCKET_ARN="arn:aws:s3:::$BUCKET_NAME"
BUCKET_DOMAIN="$BUCKET_NAME.s3.$REGION.amazonaws.com"

cat > /tmp/bucket-policy-cloudfront.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "$BUCKET_ARN/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::*:distribution/*"
                }
            }
        }
    ]
}
EOF

# Nota: Esta política será actualizada cuando se cree la distribución
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy-cloudfront.json

rm /tmp/bucket-policy-cloudfront.json

echo "✅ Política del bucket configurada"

# Crear distribución de CloudFront
echo "🌐 Creando distribución de CloudFront..."

# Obtener el certificado ACM para el dominio (si existe)
echo "   Buscando certificado SSL para $DOMAIN_NAME..."

CERT_ARN=$(aws acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME' || DomainName=='*.$DOMAIN_NAME'].CertificateArn" \
    --output text | head -n1)

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
    echo "   ⚠️  No se encontró certificado SSL. Creando distribución sin HTTPS personalizado."
    CERT_ARN=""
    ALIASES="[]"
else
    echo "   ✅ Certificado encontrado: $CERT_ARN"
    ALIASES="[\"$DOMAIN_NAME\", \"www.$DOMAIN_NAME\"]"
fi

# Crear configuración de distribución
cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "pockets-distribution-$(date +%s)",
    "Comment": "Distribution for $DOMAIN_NAME",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_DOMAIN",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "$OAC_ID"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

# Agregar aliases y certificado si existe
if [ -n "$CERT_ARN" ]; then
    cat > /tmp/cloudfront-config-with-ssl.json << EOF
{
    "CallerReference": "pockets-distribution-$(date +%s)",
    "Comment": "Distribution for $DOMAIN_NAME",
    "DefaultRootObject": "index.html",
    "Aliases": {
        "Quantity": 2,
        "Items": ["$DOMAIN_NAME", "www.$DOMAIN_NAME"]
    },
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_DOMAIN",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "$OAC_ID"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF
    CF_CONFIG_FILE="/tmp/cloudfront-config-with-ssl.json"
else
    CF_CONFIG_FILE="/tmp/cloudfront-config.json"
fi

DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config file://$CF_CONFIG_FILE \
    --query 'Distribution.{Id:Id,DomainName:DomainName,Status:Status}' \
    --output json)

DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Id')
CF_DOMAIN=$(echo $DISTRIBUTION_OUTPUT | jq -r '.DomainName')

rm /tmp/cloudfront-config.json
rm -f /tmp/cloudfront-config-with-ssl.json

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "null" ]; then
    echo "❌ Error al crear distribución de CloudFront. Verifica tus permisos."
    exit 1
fi

echo "✅ Distribución de CloudFront creada: $DISTRIBUTION_ID"
echo "   Dominio CloudFront: $CF_DOMAIN"

# Actualizar política del bucket con el ARN específico de la distribución
echo "🔄 Actualizando política del bucket con ARN de distribución..."

DISTRIBUTION_ARN="arn:aws:cloudfront::$(aws sts get-caller-identity --query Account --output text):distribution/$DISTRIBUTION_ID"

cat > /tmp/bucket-policy-final.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "$BUCKET_ARN/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "$DISTRIBUTION_ARN"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/bucket-policy-final.json

rm /tmp/bucket-policy-final.json

echo "✅ Política del bucket actualizada"

echo ""
echo "🎉 ¡CloudFront configurado exitosamente!"
echo ""
echo "📋 Resumen:"
echo "   Distribución ID: $DISTRIBUTION_ID"
echo "   Dominio CloudFront: $CF_DOMAIN"
echo "   OAC ID: $OAC_ID"
echo ""
echo "⏳ La distribución está siendo desplegada. Esto puede tardar 15-20 minutos."
echo "   Estado actual: $(echo $DISTRIBUTION_OUTPUT | jq -r '.Status')"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Esperar a que la distribución esté 'Deployed'"
echo "   2. Configurar DNS en Route 53 para apuntar a CloudFront:"
echo "      Tipo: A (Alias)"
echo "      Alias: Sí"
echo "      Alias target: $CF_DOMAIN"
echo ""
echo "💡 Para verificar el estado:"
echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""

