@echo off
title Reprendre Configuration Réseau
color 0B

echo.
echo ========================================
echo   Reprendre Configuration Réseau
echo ========================================
echo.

echo 🔍 Vérification de la sauvegarde réseau...

if not exist ".env.backup" (
    echo ❌ Fichier .env.backup non trouvé !
    echo    Impossible de restaurer la configuration réseau.
    echo.
    echo 💡 Solutions alternatives:
    echo    1. Exécutez: node backend\src\scripts\get-network-info.js
    echo    2. Puis utilisez le fichier .env.network généré
    pause
    exit /b 1
)

echo ✅ Sauvegarde réseau trouvée

echo.
echo 📋 Configuration réseau à restaurer:
type .env.backup

echo.
echo 🔄 Restauration de la configuration réseau...

REM Sauvegarder la configuration locale actuelle
if exist ".env" (
    copy ".env" ".env.local.backup" >nul
    echo ✅ Configuration locale sauvegardée vers .env.local.backup
)

REM Restaurer la configuration réseau depuis la sauvegarde
copy ".env.backup" ".env" >nul

echo ✅ Configuration réseau restaurée !

echo.
echo 📊 Configuration réseau active:
echo    - Frontend: http://10.20.14.130:8080
echo    - Backend API: http://10.20.14.130:5000
echo    - Accès réseau: Activé pour tous les clients
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

echo 🚀 Démarrage du backend en mode réseau...
start "Backend AeroDoc (Réseau)" cmd /k "cd /d %~dp0\backend && npm run dev"
timeout /t 5 >nul

echo 🚀 Démarrage du frontend en mode réseau...
start "Frontend AeroDoc (Réseau)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Serveurs redémarrés en mode réseau !

:end
echo.
echo 📋 Mode réseau activé:
echo - Accès depuis cette machine: http://localhost:8080
echo - Accès depuis le réseau: http://10.20.14.130:8080
echo - API réseau: http://10.20.14.130:5000
echo.
echo 🌐 Instructions pour les clients réseau:
echo    1. Assurez-vous que le pare-feu Windows autorise les ports 5000 et 8080
echo    2. Donnez cette URL aux clients: http://10.20.14.130:8080
echo    3. Testez depuis un autre PC: ping 10.20.14.130
echo.
echo ✨ Configuration réseau restaurée !
pause
