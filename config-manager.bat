@echo off
title Gestionnaire de Configuration AeroDoc
color 0E

:menu
cls
echo.
echo ========================================
echo   Gestionnaire de Configuration AeroDoc
echo ========================================
echo.
echo 🔧 Mode de configuration actuel:
if exist ".env" (
    findstr "VITE_API_BASE_URL" .env | findstr "localhost" >nul
    if !errorlevel! == 0 (
        echo    📍 LOCAL - Accès uniquement depuis cette machine
        echo    🌐 URL: http://localhost:8080
    ) else (
        echo    🌐 RÉSEAU - Accès depuis tout le réseau
        findstr "VITE_API_BASE_URL" .env
    )
) else (
    echo    ❌ Aucune configuration trouvée
)
echo.
echo ========================================
echo   Options disponibles:
echo ========================================
echo.
echo 1. 🏠 Basculer vers mode LOCAL
echo 2. 🌐 Basculer vers mode RÉSEAU  
echo 3. 📋 Voir configuration actuelle
echo 4. 🔄 Redémarrer les serveurs
echo 5. 🧹 Nettoyer les processus Node
echo 6. ❌ Quitter
echo.
set /p choice="Choisissez une option (1-6): "

if "%choice%"=="1" goto local_mode
if "%choice%"=="2" goto network_mode
if "%choice%"=="3" goto show_config
if "%choice%"=="4" goto restart_servers
if "%choice%"=="5" goto clean_processes
if "%choice%"=="6" goto exit
goto menu

:local_mode
echo.
echo 🏠 Basculement vers mode LOCAL...
call quick-local-switch.bat
pause
goto menu

:network_mode
echo.
echo 🌐 Basculement vers mode RÉSEAU...
call resume-network-config.bat
pause
goto menu

:show_config
cls
echo.
echo 📋 Configuration actuelle (.env):
echo ========================================
if exist ".env" (
    type .env
) else (
    echo ❌ Fichier .env non trouvé
)
echo.
echo ========================================
echo.
if exist ".env.backup" (
    echo 💾 Sauvegarde réseau disponible (.env.backup):
    echo ----------------------------------------
    type .env.backup
    echo.
)
pause
goto menu

:restart_servers
echo.
echo 🔄 Redémarrage des serveurs...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo 🚀 Démarrage du backend...
start "Backend AeroDoc" cmd /k "cd /d %~dp0\backend && npm run dev"
timeout /t 5 >nul

echo 🚀 Démarrage du frontend...
start "Frontend AeroDoc" cmd /k "cd /d %~dp0 && npm run dev"

echo ✅ Serveurs redémarrés !
pause
goto menu

:clean_processes
echo.
echo 🧹 Nettoyage des processus Node.js...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
echo ✅ Processus nettoyés !
pause
goto menu

:exit
echo.
echo 👋 Au revoir !
exit /b 0
