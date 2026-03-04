@echo off
title URGENCE RESEAU - Force Complete
color 0C

echo.
echo ==========================================
echo   🚨 URGENCE RESEAU - FORCE COMPLETE 🚨
echo ==========================================
echo.

echo 📋 PROBLEME DETECTE:
echo    - Client pointe vers: localhost:5000
echo    - Doit pointer vers: 10.20.14.130:5000
echo    - Erreur: net::ERR_CONNECTION_REFUSED
echo.

echo 🛑 ARRET FORCE DE TOUS LES PROCESSUS...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
taskkill /f /im vite.exe 2>nul
wmic process where "commandline like '%%npm%%' or commandline like '%%vite%%' or commandline like '%%node%%'" delete 2>nul
timeout /t 5 >nul

echo.
echo 🧹 NETTOYAGE COMPLET ET RADICAL...

REM Supprimer TOUS les caches possibles
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Cache Vite supprime
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cache Node supprime
)

if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dossier dist supprime
)

if exist ".vite" (
    rmdir /s /q ".vite"
    echo ✅ Dossier .vite supprime
)

if exist "build" (
    rmdir /s /q "build"
    echo ✅ Dossier build supprime
)

REM Nettoyer les caches systeme
npm cache clean --force 2>nul
echo ✅ Cache npm nettoye

echo.
echo 🔧 RECREATION COMPLETE DU FICHIER .env...

REM Supprimer completement l'ancien .env
if exist ".env" del /f /q ".env"
if exist ".env.local" del /f /q ".env.local"
if exist ".env.development" del /f /q ".env.development"

REM Creer un nouveau .env PROPRE
echo # CONFIGURATION RESEAU FORCEE - %date% %time% > .env
echo VITE_API_BASE_URL=http://10.20.14.130:5000 >> .env
echo FRONTEND_BASE_URL=http://10.20.14.130:8080 >> .env
echo. >> .env
echo # Database >> .env
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> .env
echo. >> .env
echo # JWT >> .env
echo JWT_SECRET=sgdo_super_secret_key_2025_change_this_in_production >> .env

echo ✅ Nouveau fichier .env cree

echo.
echo 📋 VERIFICATION DE LA CONFIGURATION:
type .env | findstr "VITE_API_BASE_URL"

echo.
echo 🚀 REDEMARRAGE BACKEND (mode reseau)...
cd /d "%~dp0\backend"
start "BACKEND-RESEAU" cmd /k "echo ================================== && echo BACKEND EN MODE RESEAU && echo API: http://10.20.14.130:5000 && echo ================================== && npm run dev"

echo ⏳ Attente backend (10 secondes)...
timeout /t 10 >nul

echo.
echo 🚀 REDEMARRAGE FRONTEND (mode reseau - FORCE)...
cd /d "%~dp0"

REM Forcer la recreation du serveur Vite
start "FRONTEND-RESEAU" cmd /k "echo ================================== && echo FRONTEND EN MODE RESEAU && echo URL: http://10.20.14.130:8080 && echo API: http://10.20.14.130:5000 && echo ================================== && npm run dev -- --force --host 0.0.0.0 --port 8080"

echo.
echo ✅ REDEMARRAGE FORCE TERMINE !
echo.
echo 🔥 ACTIONS CRITIQUES POUR LES CLIENTS:
echo.
echo 1. 🌐 URL OBLIGATOIRE: http://10.20.14.130:8080
echo.
echo 2. 🧹 VIDER COMPLETEMENT LE CACHE:
echo    - Fermez COMPLETEMENT le navigateur
echo    - Rouvrez le navigateur
echo    - Appuyez sur F12
echo    - Clic droit sur Actualiser
echo    - "Vider le cache et actualiser"
echo.
echo 3. 🔄 RECHARGEMENT FORCE:
echo    - Ctrl+Shift+R (plusieurs fois)
echo    - Ou Ctrl+F5 (plusieurs fois)
echo.
echo 4. ✅ VERIFICATION (F12 ^> Console):
echo    - Doit afficher: "VITE_API_BASE_URL: http://10.20.14.130:5000"
echo    - Plus d'erreur "localhost:5000"
echo.
echo 🚨 SI LE PROBLEME PERSISTE:
echo 1. Fermez le navigateur COMPLETEMENT
echo 2. Attendez 30 secondes
echo 3. Rouvrez et allez sur: http://10.20.14.130:8080
echo 4. Verifiez que les serveurs repondent:
echo    - Backend: http://10.20.14.130:5000/api/test
echo    - Frontend: http://10.20.14.130:8080
echo.
echo ⚡ CORRECTION FORCE TERMINEE !
echo.
pause
