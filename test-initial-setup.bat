@echo off
echo ========================================
echo    TEST CONFIGURATION INITIALE SGDO
echo ========================================
echo.

cd /d "%~dp0"

echo Verification de la configuration initiale...
echo.

node backend/src/scripts/test-initial-setup.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
