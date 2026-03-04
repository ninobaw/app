#!/bin/bash
echo "🔧 Activation des notifications email pour tous les utilisateurs..."
curl -X POST http://localhost:5000/api/correspondances/admin/enable-notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
echo ""
echo "✅ Terminé !"
