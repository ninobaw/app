@echo off
title Basculer vers Configuration Locale - RAPIDE
color 0A

echo.
echo ========================================
echo   Basculer vers Configuration Locale
echo ========================================
echo.

echo 🔄 Application de la configuration locale...

REM Sauvegarder le .env actuel
if exist ".env" (
    copy ".env" ".env.backup" >nul
    echo ✅ Sauvegarde de .env vers .env.backup
)

REM Créer la nouvelle configuration locale
echo # Configuration pour accès LOCAL uniquement > ".env"
echo VITE_API_BASE_URL=http://localhost:5000 >> ".env"
echo FRONTEND_BASE_URL=http://localhost:5000 >> ".env"
echo # Database >> ".env"
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> ".env"
echo. >> ".env"
echo # JWT >> ".env"
echo JWT_SECRET=your_jwt_secret_here >> ".env"
echo. >> ".env"
echo # Configuration frontend >> ".env"
echo VITE_APP_TITLE=SGDO - Gestion Documentaire >> ".env"
echo VITE_APP_VERSION=1.0.0 >> ".env"
echo. >> ".env"
echo # Collabora Online Configuration >> ".env"
echo COLLABORA_SERVER_URL=https://collabora-online-demo.collaboraoffice.com >> ".env"
echo COLLABORA_WOPI_SECRET=demo-secret-key-2024 >> ".env"
echo COLLABORA_STORAGE_PATH=./storage/documents >> ".env"
echo COLLABORA_MAX_FILE_SIZE=10485760 >> ".env"
echo COLLABORA_ALLOWED_EXTENSIONS=doc,docx,xls,xlsx,ppt,pptx,odt,ods,odp,rtf,txt,html,htm,csv,pdf >> ".env"
echo COLLABORA_CALLBACK_URL=/api/collabora/callback >> ".env"
echo WOPI_SECRET=demo-secret-key-2024 >> ".env"
echo. >> ".env"
echo # Microsoft Office 365 Configuration >> ".env"
echo MICROSOFT_CLIENT_ID=your_azure_app_client_id >> ".env"
echo MICROSOFT_CLIENT_SECRET=your_azure_app_client_secret >> ".env"
echo MICROSOFT_TENANT_ID=your_azure_tenant_id >> ".env"
echo MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback >> ".env"
echo. >> ".env"
echo # Email Configuration >> ".env"
echo EMAIL_HOST=smtp.gmail.com >> ".env"
echo EMAIL_PORT=587 >> ".env"
echo EMAIL_USER=abdallahbenkhalifa255@gmail.com >> ".env"
echo EMAIL_PASS=bvjzpmjuptvndfnn >> ".env"
echo. >> ".env"
echo # OnlyOffice Configuration >> ".env"
echo ONLYOFFICE_DOC_SERVER_URL=https://documentserver.onlyoffice.com >> ".env"
echo ONLYOFFICE_JWT_SECRET= >> ".env"
echo. >> ".env"
echo # File Upload >> ".env"
echo MAX_FILE_SIZE=50MB >> ".env"
echo UPLOAD_PATH=./uploads >> ".env"

echo ✅ Configuration locale appliquée !

echo.
echo 📊 Nouvelle configuration:
echo    - Frontend: http://localhost:8080
echo    - Backend API: http://localhost:5000
echo    - Base de données: MongoDB local
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
echo ✅ Serveurs redémarrés en mode local !

:end
echo.
echo 📋 Mode local activé:
echo - Accès uniquement depuis cette machine
echo - URL: http://localhost:8080
echo - API: http://localhost:5000
echo.
echo ✨ Configuration locale terminée !
pause
