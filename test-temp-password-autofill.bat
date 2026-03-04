@echo off
echo ========================================
echo Test du pre-remplissage mot de passe temporaire
echo ========================================
echo.

cd /d "%~dp0"

echo Execution du test...
node backend\src\scripts\test-temp-password-autofill.js

echo.
echo ========================================
echo Test termine
echo ========================================
pause
