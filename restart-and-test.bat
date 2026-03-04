@echo off
echo ========================================
echo    SGDO - Restart Backend and Test
echo ========================================
echo.

echo Arret du serveur backend existant...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Demarrage du nouveau serveur backend...
start "SGDO Backend" cmd /k "cd /d backend && npm start"

echo Attente du demarrage du serveur...
timeout /t 8 /nobreak >nul

echo Test de connexion...
node test-auth.js

echo.
echo Test du workflow complet...
node test-simple-workflow.js

echo.
echo Test termine. Appuyez sur une touche pour continuer...
pause
