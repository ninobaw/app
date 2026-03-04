@echo off
title Générer Configuration Locale
color 0A

echo.
echo ========================================
echo   Génération Configuration Locale
echo ========================================
echo.

echo 🔍 Génération des fichiers de configuration...
cd /d "%~dp0"
node backend\src\scripts\get-network-info.js

echo.
echo ✅ Fichiers de configuration générés !
echo.
echo 📋 Fichiers créés:
echo    - .env.local (configuration locale)
echo    - .env.network (configuration réseau)
echo.
echo 🔄 Vous pouvez maintenant exécuter switch-to-local.bat
pause
