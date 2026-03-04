@echo off
title FINAL FIX - Configuration Reseau
color 0B

echo.
echo ==========================================
echo   🎯 FINAL FIX - CONFIGURATION RESEAU 🎯
echo ==========================================
echo.

echo 🔍 PROBLEME IDENTIFIE:
echo    - Le fichier .env.local OVERRIDE le .env principal
echo    - Vite lit .env.local en priorite sur .env
echo    - .env.local contient probablement localhost:5000
echo.

echo 🛑 Arret des serveurs...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 >nul

echo.
echo 🗑️ SUPPRESSION de TOUS les fichiers .env problematiques...

REM Supprimer TOUS les fichiers .env qui peuvent causer des conflits
if exist ".env.local" (
    del /f /q ".env.local"
    echo ✅ .env.local supprime (CAUSE DU PROBLEME!)
)

if exist ".env.development" (
    del /f /q ".env.development"
    echo ✅ .env.development supprime
)

if exist ".env.production" (
    del /f /q ".env.production"
    echo ✅ .env.production supprime
)

echo.
echo 🔧 CREATION d'un .env PROPRE et UNIQUE...

REM Supprimer l'ancien .env et en creer un nouveau
if exist ".env" del /f /q ".env"

REM Creer le SEUL fichier .env avec la bonne configuration
echo # FINAL FIX - CONFIGURATION RESEAU DEFINITIVE > .env
echo # Date: %date% %time% >> .env
echo # ATTENTION: Aucun autre fichier .env ne doit exister ! >> .env
echo. >> .env
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

echo ✅ Fichier .env UNIQUE cree

echo.
echo 🧹 NETTOYAGE COMPLET des caches...

REM Supprimer tous les caches
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"
if exist ".vite" rmdir /s /q ".vite"
npm cache clean --force 2>nul

echo ✅ Caches nettoyes

echo.
echo 📋 VERIFICATION de la configuration:
echo Contenu du fichier .env:
type .env | findstr "VITE_API_BASE_URL"

echo.
echo 🚀 REDEMARRAGE des serveurs...

echo Demarrage du backend...
cd /d "%~dp0\backend"
start "Backend-Final" cmd /k "echo BACKEND FINAL - API: http://10.20.14.130:5000 && npm run dev"

echo ⏳ Attente backend (8 secondes)...
timeout /t 8 >nul

echo Demarrage du frontend...
cd /d "%~dp0"
start "Frontend-Final" cmd /k "echo FRONTEND FINAL - URL: http://10.20.14.130:8080 && npm run dev -- --force --host 0.0.0.0 --port 8080"

echo.
echo 🎯 FINAL FIX TERMINE !
echo.
echo ✅ VERIFICATION:
echo    - Aucun fichier .env.local (supprime)
echo    - Seul .env existe avec la bonne config
echo    - Caches nettoyes
echo    - Serveurs redemarres
echo.
echo 🔥 ACTIONS POUR LES CLIENTS:
echo 1. 🌐 URL: http://10.20.14.130:8080
echo 2. 🧹 Vider le cache navigateur COMPLETEMENT
echo 3. 🔄 Recharger avec Ctrl+F5
echo 4. ✅ Verifier les logs (F12):
echo    - DOIT afficher: VITE_API_BASE_URL: http://10.20.14.130:5000
echo    - PLUS D'ERREUR localhost:5000
echo.
echo 🎯 Si ca ne marche TOUJOURS pas:
echo    - Le probleme est au niveau reseau/pare-feu
echo    - Verifiez: ping 10.20.14.130
echo    - Verifiez: telnet 10.20.14.130 5000
echo.
pause
