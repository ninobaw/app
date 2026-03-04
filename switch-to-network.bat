@echo off
title Basculer vers Configuration Réseau
color 0A

echo.
echo ========================================
echo   Basculer vers Configuration Réseau
echo ========================================
echo.

echo 🔍 Vérification des fichiers de configuration...

if not exist ".env.network" (
    echo ❌ Fichier .env.network non trouvé !
    echo    Exécutez d'abord: node backend\src\scripts\get-network-info.js
    pause
    exit /b 1
)

echo ✅ Fichier .env.network trouvé

echo.
echo 📋 Configuration réseau actuelle:
type .env.network

echo.
echo 🔄 Application de la configuration réseau...

REM Sauvegarder le .env actuel
if exist ".env" (
    copy ".env" ".env.backup" >nul
    echo ✅ Sauvegarde de .env vers .env.backup
)

REM Copier la configuration réseau vers .env
copy ".env.network" ".env.temp" >nul

REM Ajouter les autres configurations nécessaires
echo. >> ".env.temp"
echo # Database >> ".env.temp"
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> ".env.temp"
echo. >> ".env.temp"
echo # JWT >> ".env.temp"
echo JWT_SECRET=your_jwt_secret_here >> ".env.temp"
echo. >> ".env.temp"
echo # Configuration frontend >> ".env.temp"
echo VITE_APP_TITLE=SGDO - Gestion Documentaire >> ".env.temp"
echo VITE_APP_VERSION=1.0.0 >> ".env.temp"
echo. >> ".env.temp"
echo # Collabora Online Configuration >> ".env.temp"
echo COLLABORA_SERVER_URL=https://collabora-online-demo.collaboraoffice.com >> ".env.temp"
echo COLLABORA_WOPI_SECRET=demo-secret-key-2024 >> ".env.temp"
echo COLLABORA_STORAGE_PATH=./storage/documents >> ".env.temp"
echo COLLABORA_MAX_FILE_SIZE=10485760 >> ".env.temp"
echo COLLABORA_ALLOWED_EXTENSIONS=doc,docx,xls,xlsx,ppt,pptx,odt,ods,odp,rtf,txt,html,htm,csv,pdf >> ".env.temp"
echo COLLABORA_CALLBACK_URL=/api/collabora/callback >> ".env.temp"
echo WOPI_SECRET=demo-secret-key-2024 >> ".env.temp"
echo. >> ".env.temp"
echo # Microsoft Office 365 Configuration >> ".env.temp"
echo MICROSOFT_CLIENT_ID=your_azure_app_client_id >> ".env.temp"
echo MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret >> ".env.temp"
echo MICROSOFT_TENANT_ID=your_azure_tenant_id >> ".env.temp"
echo MICROSOFT_REDIRECT_URI=http://10.20.14.130:5173/auth/microsoft/callback >> ".env.temp"
echo. >> ".env.temp"
echo # Email Configuration >> ".env.temp"
echo EMAIL_HOST=smtp.gmail.com >> ".env.temp"
echo EMAIL_PORT=587 >> ".env.temp"
echo EMAIL_USER=abdallahbenkhalifa255@gmail.com >> ".env.temp"
echo EMAIL_PASS=bvjzpmjuptvndfnn >> ".env.temp"
echo. >> ".env.temp"
echo # File Upload >> ".env.temp"
echo MAX_FILE_SIZE=50MB >> ".env.temp"
echo UPLOAD_PATH=./uploads >> ".env.temp"

REM Remplacer le .env par la nouvelle configuration
move ".env.temp" ".env" >nul

echo ✅ Configuration réseau appliquée !

echo.
echo 📊 Nouvelle configuration:
echo    - Frontend: http://10.20.14.130:8080
echo    - Backend API: http://10.20.14.130:5000
echo.

echo 🔄 Redémarrage des serveurs nécessaire...
echo.
echo Voulez-vous redémarrer les serveurs maintenant ? (o/n)
set /p restart="Redémarrer ? "

if /i "%restart%"=="o" goto restart_servers
if /i "%restart%"=="oui" goto restart_servers
goto end

:restart_servers
echo.
echo 🔄 Arrêt des serveurs existants...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo 🚀 Démarrage du backend...
start "Backend AeroDoc" cmd /k "cd /d %~dp0\backend && npm run dev"
timeout /t 5 >nul

echo 🚀 Démarrage du frontend...
start "Frontend AeroDoc" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Serveurs redémarrés en mode réseau !

:end
echo.
echo 📋 Instructions pour les clients:
echo 1. Donnez cette URL aux clients: http://10.20.14.130:8080
echo 2. Assurez-vous que le pare-feu autorise les ports 5000 et 8080
echo 3. Testez depuis un autre PC: ping 10.20.14.130
echo.
echo ✨ Configuration réseau terminée !
pause
