@echo off
echo ===========================================
echo    CREATION DE DIRECTEURS DE TEST
echo ===========================================
echo.

cd /d "%~dp0backend"

echo Creation des directeurs et correspondances de test...
echo.

node src/scripts/create-test-directors.js

echo.
echo ===========================================
echo Creation terminee. Appuyez sur une touche pour fermer.
pause >nul
