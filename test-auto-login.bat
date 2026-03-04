@echo off
echo ========================================
echo Test de la fonctionnalite de connexion automatique
echo ========================================
echo.

cd /d "%~dp0"

echo Execution du test...
node backend\src\scripts\test-auto-login-email.js

echo.
echo ========================================
echo Test termine
echo ========================================
pause
