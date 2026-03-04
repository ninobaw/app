@echo off
title Force Network Update
color 0A

echo.
echo ==========================================
echo   Force la mise à jour réseau complète
echo ==========================================
echo.

echo 🔍 Vérification de la configuration actuelle...
findstr "VITE_API_BASE_URL" .env
echo.

echo 🛑 Arrêt forcé de tous les processus Node.js...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 >nul

echo.
echo 🧹 Nettoyage des caches et builds...

REM Supprimer les caches Vite
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Cache Vite supprimé
)

REM Supprimer le dossier dist
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dossier dist supprimé
)

REM Supprimer les caches npm
npm cache clean --force 2>nul
echo ✅ Cache npm nettoyé

echo.
echo 🔧 Vérification de la configuration réseau...

REM Vérifier si la configuration réseau est correcte
findstr "10.20.14.130" .env >nul
if errorlevel 1 (
    echo ❌ Configuration réseau non trouvée dans .env
    echo 🔄 Application de la configuration réseau...
    
    REM Appliquer la configuration réseau
    echo # Configuration pour accès RÉSEAU > .env.new
    echo VITE_API_BASE_URL=http://10.20.14.130:5000 >> .env.new
    echo FRONTEND_BASE_URL=http://10.20.14.130:8080 >> .env.new
    echo. >> .env.new
    echo # Database >> .env.new
    echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> .env.new
    echo. >> .env.new
    echo # JWT >> .env.new
    echo JWT_SECRET=your_jwt_secret_here >> .env.new
    echo. >> .env.new
    echo # Configuration frontend >> .env.new
    echo VITE_APP_TITLE=SGDO - Gestion Documentaire >> .env.new
    echo VITE_APP_VERSION=1.0.0 >> .env.new
    echo. >> .env.new
    echo # Collabora Online Configuration >> .env.new
    echo COLLABORA_SERVER_URL=https://collabora-online-demo.collaboraoffice.com >> .env.new
    echo COLLABORA_WOPI_SECRET=demo-secret-key-2024 >> .env.new
    echo COLLABORA_STORAGE_PATH=./storage/documents >> .env.new
    echo COLLABORA_MAX_FILE_SIZE=10485760 >> .env.new
    echo COLLABORA_ALLOWED_EXTENSIONS=doc,docx,xls,xlsx,ppt,pptx,odt,ods,odp,rtf,txt,html,htm,csv,pdf >> .env.new
    echo COLLABORA_CALLBACK_URL=/api/collabora/callback >> .env.new
    echo WOPI_SECRET=demo-secret-key-2024 >> .env.new
    echo. >> .env.new
    echo # Email Configuration >> .env.new
    echo EMAIL_HOST=smtp.gmail.com >> .env.new
    echo EMAIL_PORT=587 >> .env.new
    echo EMAIL_USER=abdallahbenkhalifa255@gmail.com >> .env.new
    echo EMAIL_PASS=bvjzpmjuptvndfnn >> .env.new
    echo. >> .env.new
    echo # File Upload >> .env.new
    echo MAX_FILE_SIZE=50MB >> .env.new
    echo UPLOAD_PATH=./uploads >> .env.new
    
    move .env.new .env
    echo ✅ Configuration réseau appliquée
) else (
    echo ✅ Configuration réseau déjà présente
)

echo.
echo 📋 Configuration finale:
findstr "VITE_API_BASE_URL\|FRONTEND_BASE_URL" .env

echo.
echo 🚀 Redémarrage du backend...
cd /d "%~dp0\backend"
start "Backend AeroDoc - RÉSEAU" cmd /k "echo Backend en mode RÉSEAU - API: http://10.20.14.130:5000 && npm run dev"

echo ⏳ Attente du démarrage du backend (8 secondes)...
timeout /t 8 >nul

echo.
echo 🚀 Redémarrage du frontend avec build propre...
cd /d "%~dp0"
start "Frontend AeroDoc - RÉSEAU" cmd /k "echo Frontend en mode RÉSEAU - URL: http://10.20.14.130:8080 && npm run dev"

echo.
echo ✅ Mise à jour réseau forcée terminée !
echo.
echo 📊 Configuration appliquée:
echo    - Frontend: http://10.20.14.130:8080
echo    - Backend API: http://10.20.14.130:5000
echo.
echo 🔥 Actions supplémentaires pour les clients:
echo 1. Videz le cache du navigateur (Ctrl+Shift+Delete)
echo 2. Rechargez la page avec Ctrl+F5
echo 3. Vérifiez les logs - ils doivent pointer vers 10.20.14.130:5000
echo.
echo 🌐 URL à donner aux clients: http://10.20.14.130:8080
echo.
pause
