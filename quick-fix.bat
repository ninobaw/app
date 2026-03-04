@echo off
title Quick Network Fix
color 0A

echo.
echo ========================================
echo   CORRECTION RESEAU RAPIDE
echo ========================================
echo.

echo Arret des serveurs...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
timeout /t 3 >nul

echo.
echo Correction de la configuration...

REM Supprimer l'ancien .env
if exist ".env" del ".env"

REM Creer la nouvelle configuration
echo # CONFIGURATION RESEAU > .env
echo VITE_API_BASE_URL=http://10.20.14.130:5000 >> .env
echo FRONTEND_BASE_URL=http://10.20.14.130:8080 >> .env
echo. >> .env
echo # Database >> .env
echo MONGODB_URI=mongodb://localhost:27017/aerodoc >> .env
echo. >> .env
echo # JWT >> .env
echo JWT_SECRET=sgdo_super_secret_key_2025_change_this_in_production >> .env

echo Configuration appliquee !

echo.
echo Nettoyage des caches...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "dist" rmdir /s /q "dist"
npm cache clean --force 2>nul

echo.
echo Redemarrage du backend...
cd /d "%~dp0\backend"
start "Backend" cmd /k "npm run dev"

echo Attente 8 secondes...
timeout /t 8 >nul

echo.
echo Redemarrage du frontend...
cd /d "%~dp0"
start "Frontend" cmd /k "npm run dev"

echo.
echo TERMINE !
echo.
echo URL pour les clients: http://10.20.14.130:8080
echo.
echo IMPORTANT:
echo 1. Videz le cache du navigateur (Ctrl+Shift+Delete)
echo 2. Rechargez avec Ctrl+F5
echo 3. Utilisez l'URL: http://10.20.14.130:8080
echo.
pause
