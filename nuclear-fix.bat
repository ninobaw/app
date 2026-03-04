@echo off
title NUCLEAR FIX - Configuration Reseau
color 0E

echo.
echo ==========================================
echo   ☢️ NUCLEAR FIX - CONFIGURATION RESEAU ☢️
echo ==========================================
echo.

echo 🚨 PROBLEME PERSISTANT DETECTE:
echo    - Client hostname: 10.20.14.130
echo    - VITE_API_BASE_URL: http://localhost:5000 (INCORRECT!)
echo    - Doit etre: http://10.20.14.130:5000
echo.

echo 🛑 ARRET NUCLEAIRE DE TOUS LES PROCESSUS...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
taskkill /f /im vite.exe 2>nul
wmic process where "name='node.exe'" delete 2>nul
wmic process where "name='npm.exe'" delete 2>nul
timeout /t 5 >nul

echo.
echo 💥 DESTRUCTION COMPLETE DES CACHES...

REM Supprimer TOUS les caches possibles
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Cache Vite detruit
)

if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cache Node detruit
)

if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ Dossier dist detruit
)

if exist ".vite" (
    rmdir /s /q ".vite"
    echo ✅ Dossier .vite detruit
)

if exist "build" (
    rmdir /s /q "build"
    echo ✅ Dossier build detruit
)

REM Nettoyer les caches Windows
del /f /s /q "%TEMP%\vite*" 2>nul
del /f /s /q "%APPDATA%\npm-cache\*" 2>nul
npm cache clean --force 2>nul
echo ✅ Caches systeme nettoyes

echo.
echo ☢️ RECREATION NUCLEAIRE DU FICHIER .env...

REM Destruction complete de tous les fichiers env
if exist ".env" del /f /q ".env"
if exist ".env.local" del /f /q ".env.local"
if exist ".env.development" del /f /q ".env.development"
if exist ".env.production" del /f /q ".env.production"

REM Creation d'un .env FORCE
echo # NUCLEAR FIX - CONFIGURATION RESEAU FORCEE > .env
echo # Date: %date% %time% >> .env
echo VITE_API_BASE_URL=http://10.20.14.130:5000 >> .env
echo FRONTEND_BASE_URL=http://10.20.14.130:8080 >> .env
echo. >> .env
echo # Database >> .env
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> .env
echo. >> .env
echo # JWT >> .env
echo JWT_SECRET=sgdo_super_secret_key_2025_change_this_in_production >> .env

echo ✅ Fichier .env FORCE cree

echo.
echo 📋 VERIFICATION NUCLEAIRE:
echo Configuration appliquee:
type .env | findstr "VITE_API_BASE_URL"
type .env | findstr "FRONTEND_BASE_URL"

echo.
echo 🚀 REDEMARRAGE NUCLEAIRE DU BACKEND...
cd /d "%~dp0\backend"
start "BACKEND-NUCLEAR" cmd /k "echo ☢️ BACKEND NUCLEAR MODE ☢️ && echo API: http://10.20.14.130:5000 && echo ========================== && npm run dev"

echo ⏳ Attente backend nucleaire (15 secondes)...
timeout /t 15 >nul

echo.
echo 🚀 REDEMARRAGE NUCLEAIRE DU FRONTEND...
cd /d "%~dp0"

REM Forcer Vite avec tous les parametres possibles
start "FRONTEND-NUCLEAR" cmd /k "echo ☢️ FRONTEND NUCLEAR MODE ☢️ && echo URL: http://10.20.14.130:8080 && echo API: http://10.20.14.130:5000 && echo ========================== && npm run dev -- --force --clearCache --host 0.0.0.0 --port 8080"

echo.
echo ☢️ NUCLEAR FIX TERMINE !
echo.
echo 🔥 ACTIONS NUCLEAIRES POUR LES CLIENTS:
echo.
echo 1. 🌐 URL OBLIGATOIRE: http://10.20.14.130:8080
echo.
echo 2. 💥 DESTRUCTION COMPLETE DU CACHE NAVIGATEUR:
echo    - Fermez TOUS les onglets
echo    - Fermez COMPLETEMENT le navigateur
echo    - Attendez 1 minute
echo    - Rouvrez le navigateur
echo    - Allez DIRECTEMENT sur: http://10.20.14.130:8080
echo.
echo 3. 🔄 VERIFICATION NUCLEAIRE (F12 ^> Console):
echo    - DOIT afficher: "VITE_API_BASE_URL: http://10.20.14.130:5000"
echo    - DOIT afficher: "API_BASE_URL: http://10.20.14.130:5000"
echo    - PLUS D'ERREUR "localhost:5000"
echo.
echo 4. 🧪 TEST DE CONNEXION:
echo    - Utilisateur: nourssine.fradi@tav.aero
echo    - DOIT se connecter sans erreur
echo.
echo ⚠️ SI LE PROBLEME PERSISTE ENCORE:
echo 1. Le serveur n'ecoute peut-etre pas sur 0.0.0.0
echo 2. Verifiez le pare-feu Windows
echo 3. Testez: ping 10.20.14.130
echo 4. Testez: telnet 10.20.14.130 5000
echo.
echo ☢️ NUCLEAR FIX COMPLETE !
echo.
pause
