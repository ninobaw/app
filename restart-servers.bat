@echo off
title Restart Servers - Network Mode
color 0A

echo.
echo ========================================
echo   REDEMARRAGE SERVEURS - MODE RESEAU
echo ========================================
echo.

echo 📋 Configuration actuelle:
findstr "VITE_API_BASE_URL" .env
findstr "FRONTEND_BASE_URL" .env

echo.
echo 🚀 Demarrage du backend...
cd /d "%~dp0\backend"
start "Backend-Network" cmd /c "echo BACKEND - API: http://10.20.14.130:5000 && npm run dev && pause"

echo ⏳ Attente 8 secondes...
timeout /t 8 >nul

echo.
echo 🚀 Demarrage du frontend...
cd /d "%~dp0"
start "Frontend-Network" cmd /c "echo FRONTEND - URL: http://10.20.14.130:8080 && npm run dev -- --force --host 0.0.0.0 --port 8080 && pause"

echo.
echo ✅ Serveurs demarres !
echo.
echo 🌐 URLs:
echo    - Frontend: http://10.20.14.130:8080
echo    - Backend API: http://10.20.14.130:5000
echo.
echo 🔥 Pour les clients:
echo 1. Allez sur: http://10.20.14.130:8080
echo 2. Videz le cache navigateur (Ctrl+Shift+Delete)
echo 3. Rechargez avec Ctrl+F5
echo.
pause
