#!/bin/bash

# Script para testar login na API de produção
API_URL="https://kantina-api-380728917745.southamerica-east1.run.app"

echo "=== Testando alguns códigos de tenant ==="
for code in "000001" "111111" "123456" "654321" "999999"; do
  echo -n "Testando $code: "
  curl -s "${API_URL}/tenants/resolve?code=${code}" | grep -q "tenantId" && echo "✅ FUNCIONA!" || echo "❌ Não encontrado"
done

echo ""
echo "=== Para testar login quando encontrar um código válido ==="
echo "curl -X POST '${API_URL}/auth/login' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-tenant: SEU_TENANT_ID' \\"
echo "  -d '{\"email\": \"admin@demo.com\", \"password\": \"admin123\"}'"