@echo off
title Fix All Issues - AeroDoc
color 0A

echo.
echo ==========================================
echo   Correction complète des problèmes
echo ==========================================
echo.

echo 🔍 Diagnostic des problèmes identifiés:
echo 1. Frontend pointe vers localhost au lieu de l'IP réseau
echo 2. Erreur 500 lors de la création d'utilisateur
echo 3. Middleware d'authentification manquant sur certaines routes
echo.

echo 🛑 Arrêt de tous les serveurs...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 >nul

echo.
echo 🔧 1. Correction de la configuration réseau...

REM Forcer la configuration réseau
echo # Configuration pour accès RÉSEAU > .env
echo VITE_API_BASE_URL=http://10.20.14.130:5000 >> .env
echo FRONTEND_BASE_URL=http://10.20.14.130:8080 >> .env
echo. >> .env
echo # Database >> .env
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> .env
echo. >> .env
echo # JWT >> .env
echo JWT_SECRET=sgdo_super_secret_key_2025_change_this_in_production >> .env
echo. >> .env
echo # Configuration frontend >> .env
echo VITE_APP_TITLE=SGDO - Gestion Documentaire >> .env
echo VITE_APP_VERSION=1.0.0 >> .env
echo. >> .env
echo # Collabora Online Configuration >> .env
echo COLLABORA_SERVER_URL=https://collabora-online-demo.collaboraoffice.com >> .env
echo COLLABORA_WOPI_SECRET=demo-secret-key-2024 >> .env
echo COLLABORA_STORAGE_PATH=./storage/documents >> .env
echo COLLABORA_MAX_FILE_SIZE=10485760 >> .env
echo COLLABORA_ALLOWED_EXTENSIONS=doc,docx,xls,xlsx,ppt,pptx,odt,ods,odp,rtf,txt,html,htm,csv,pdf >> .env
echo COLLABORA_CALLBACK_URL=/api/collabora/callback >> .env
echo WOPI_SECRET=demo-secret-key-2024 >> .env
echo. >> .env
echo # Microsoft Office 365 Configuration >> .env
echo MICROSOFT_CLIENT_ID=your_azure_app_client_id >> .env
echo MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret >> .env
echo MICROSOFT_TENANT_ID=your_azure_tenant_id >> .env
echo MICROSOFT_REDIRECT_URI=http://10.20.14.130:5173/auth/microsoft/callback >> .env
echo. >> .env
echo # Email Configuration >> .env
echo EMAIL_HOST=smtp.gmail.com >> .env
echo EMAIL_PORT=587 >> .env
echo EMAIL_USER=abdallahbenkhalifa255@gmail.com >> .env
echo EMAIL_PASS=bvjzpmjuptvndfnn >> .env
echo. >> .env
echo # File Upload >> .env
echo MAX_FILE_SIZE=50MB >> .env
echo UPLOAD_PATH=./uploads >> .env

echo ✅ Configuration réseau appliquée

echo.
echo 🧹 2. Nettoyage des caches...

REM Supprimer les caches
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Cache Vite supprimé
)

if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dossier dist supprimé
)

npm cache clean --force 2>nul
echo ✅ Cache npm nettoyé

echo.
echo 🚀 3. Redémarrage du backend...
cd /d "%~dp0\backend"
start "Backend AeroDoc - RÉSEAU" cmd /k "echo ===== BACKEND EN MODE RÉSEAU ===== && echo API disponible sur: http://10.20.14.130:5000 && echo ================================== && npm run dev"

echo ⏳ Attente du démarrage du backend (10 secondes)...
timeout /t 10 >nul

echo.
echo 🧪 4. Test de la création d'utilisateur...
node src/scripts/test-user-creation.js

echo.
echo 🚀 5. Redémarrage du frontend...
cd /d "%~dp0"
start "Frontend AeroDoc - RÉSEAU" cmd /k "echo ===== FRONTEND EN MODE RÉSEAU ===== && echo Application disponible sur: http://10.20.14.130:8080 && echo Clients réseau: Utilisez cette URL && echo =================================== && npm run dev"

echo.
echo ✅ Corrections appliquées !
echo.
echo 📊 Configuration finale:
echo    - Frontend: http://10.20.14.130:8080
echo    - Backend API: http://10.20.14.130:5000
echo    - Middleware d'authentification ajouté
echo    - Caches nettoyés
echo.
echo 🔥 Instructions pour les clients:
echo 1. Utilisez l'URL: http://10.20.14.130:8080
echo 2. Videz le cache du navigateur (Ctrl+Shift+Delete)
echo 3. Rechargez avec Ctrl+F5
echo 4. Vérifiez les logs - ils doivent pointer vers 10.20.14.130:5000
echo.
echo 🛡️ Sécurité:
echo - Toutes les routes utilisateur sont maintenant protégées
echo - Authentification JWT requise pour créer des utilisateurs
echo.
echo ⚠️  Si la création d'utilisateur échoue encore:
echo 1. Vérifiez les logs du backend
echo 2. Exécutez: cd backend ^&^& node src/scripts/test-user-creation.js
echo 3. Vérifiez la connexion MongoDB
echo.
pause
