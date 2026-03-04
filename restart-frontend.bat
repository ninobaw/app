@echo off
title Restart Frontend
color 0A

echo.
echo ================================
echo   Redémarrage Frontend AeroDoc
echo ================================
echo.

echo 🔄 Arrêt des processus Node.js existants...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul

echo.
echo 🚀 Démarrage du frontend...
npm run dev

echo.
echo ✅ Frontend redémarré !
pause
