@echo off
title URGENCE - Correction Réseau
color 0C

echo.
echo ==========================================
echo   🚨 CORRECTION URGENTE RÉSEAU 🚨
echo ==========================================
echo.

echo 📋 Problème détecté:
echo    - Client sur IP: 10.20.14.130
echo    - API pointe vers: localhost:5000 (INCORRECT)
echo    - Erreur: net::ERR_CONNECTION_REFUSED
echo.

echo 🛑 ARRÊT FORCÉ de tous les processus...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
taskkill /f /im vite.exe 2>nul
timeout /t 2 >nul

echo.
echo 🔧 CORRECTION IMMÉDIATE de la configuration...

REM Supprimer complètement le fichier .env existant
if exist ".env" del ".env"

REM Créer une nouvelle configuration réseau propre
echo # CONFIGURATION RÉSEAU FORCÉE > .env
echo VITE_API_BASE_URL=http://10.20.14.130:5000 >> .env
echo FRONTEND_BASE_URL=http://10.20.14.130:8080 >> .env
echo. >> .env
echo # Database >> .env
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> .env
echo. >> .env
echo # JWT >> .env
echo JWT_SECRET=sgdo_super_secret_key_2025_change_this_in_production >> .env

echo ✅ Configuration réseau FORCÉE

echo.
echo 🧹 NETTOYAGE COMPLET des caches...

REM Supprimer TOUS les caches possibles
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Cache Vite supprimé
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cache Node supprimé
)

if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dossier dist supprimé
)

if exist ".vite" (
    rmdir /s /q ".vite"
    echo ✅ Dossier .vite supprimé
)

REM Nettoyer le cache npm
npm cache clean --force 2>nul
echo ✅ Cache npm nettoyé

echo.
echo 📋 Vérification de la configuration:
findstr "VITE_API_BASE_URL" .env

echo.
echo 🚀 REDÉMARRAGE BACKEND (mode réseau)...
cd /d "%~dp0\backend"
start "BACKEND RÉSEAU - 10.20.14.130:5000" cmd /k "echo. && echo ████████████████████████████████████████ && echo █ BACKEND EN MODE RÉSEAU - PORT 5000 █ && echo █ API: http://10.20.14.130:5000        █ && echo ████████████████████████████████████████ && echo. && npm run dev"

echo ⏳ Attente backend (8 secondes)...
timeout /t 8 >nul

echo.
echo 🚀 REDÉMARRAGE FRONTEND (mode réseau)...
cd /d "%~dp0"
start "FRONTEND RÉSEAU - 10.20.14.130:8080" cmd /k "echo. && echo ████████████████████████████████████████ && echo █ FRONTEND EN MODE RÉSEAU - PORT 8080 █ && echo █ URL: http://10.20.14.130:8080       █ && echo █ API: http://10.20.14.130:5000       █ && echo ████████████████████████████████████████ && echo. && npm run dev"

echo.
echo ✅ CORRECTION APPLIQUÉE !
echo.
echo 🔥 ACTIONS IMMÉDIATES pour les clients:
echo.
echo 1. 🌐 Utilisez cette URL: http://10.20.14.130:8080
echo.
echo 2. 🧹 VIDEZ LE CACHE du navigateur:
echo    - Appuyez sur F12
echo    - Clic droit sur le bouton Actualiser
echo    - Sélectionnez "Vider le cache et actualiser"
echo    - OU: Ctrl+Shift+Delete ^> Cochez "Images et fichiers en cache"
echo.
echo 3. 🔄 RECHARGEZ avec force:
echo    - Ctrl+F5 (Windows)
echo    - Ctrl+Shift+R (Alternative)
echo.
echo 4. ✅ VÉRIFIEZ les logs (F12 ^> Console):
echo    - Doit afficher: "VITE_API_BASE_URL: http://10.20.14.130:5000"
echo    - Doit afficher: "API_BASE_URL: http://10.20.14.130:5000"
echo.
echo 🚨 Si le problème persiste:
echo 1. Fermez COMPLÈTEMENT le navigateur
echo 2. Rouvrez et allez sur: http://10.20.14.130:8080
echo 3. Vérifiez que le backend répond: http://10.20.14.130:5000/api/test
echo.
echo ⚡ CORRECTION TERMINÉE !
pause
