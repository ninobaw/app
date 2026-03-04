@echo off
echo ===========================================
echo    TEST DES PERMISSIONS - CORRESPONDANCES
echo ===========================================
echo.

cd /d "%~dp0backend"

echo Test des permissions pour creation correspondances...
echo.

node src/scripts/test-permissions.js

echo.
echo ===========================================
echo Test termine. Appuyez sur une touche pour fermer.
pause >nul
