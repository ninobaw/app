@echo off
echo ========================================
echo    CREATION WORKFLOW TEST AERODOC
echo ========================================
echo.

cd /d "%~dp0"

echo Creation du workflow de test...
echo.

node create-test-workflow.js

echo.
echo Creation terminee. Appuyez sur une touche pour fermer...
pause >nul
