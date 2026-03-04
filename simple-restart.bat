@echo off
title Simple Restart - SGDO TAV TUNISIE
color 0A

echo.
echo ==========================================
echo   SIMPLE RESTART - SGDO TAV TUNISIE
echo ==========================================
echo.

echo ARRET DE TOUS LES SERVEURS...
taskkill /f /im node.exe 2>nul
timeout /t 5 >nul

echo.
echo DEMARRAGE DU BACKEND...
cd /d "%~dp0\backend"
start "Backend-Simple" cmd /k "echo BACKEND SGDO TAV TUNISIE && echo API: http://10.20.14.130:5000 && echo LOGS: Surveillez cette console && npm run dev"

echo Attente backend (10 secondes)...
timeout /t 10 >nul

echo.
echo DEMARRAGE DU FRONTEND...
cd /d "%~dp0"
start "Frontend-Simple" cmd /k "echo FRONTEND SGDO TAV TUNISIE && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --host 0.0.0.0 --port 8080"

echo.
echo SERVEURS DEMARRES !
echo.
echo URLS:
echo - Frontend: http://sgdo.tavtunisie.app:8080
echo - Backend API: http://10.20.14.130:5000
echo.
echo POUR TESTER LA CREATION D'UTILISATEUR:
echo 1. Allez sur le frontend
echo 2. Connectez-vous avec: abdallah.benkhalifa@tav.aero
echo 3. Mot de passe: Essayez: admin123 ou password123
echo 4. Creez un utilisateur simple avec role AGENT
echo.
echo SURVEILLEZ LA CONSOLE DU BACKEND POUR LES LOGS [DEBUG]
echo.
pause
