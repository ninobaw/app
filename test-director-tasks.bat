@echo off
echo ===========================================
echo    TEST DES TACHES DIRECTEUR - DIAGNOSTIC
echo ===========================================
echo.

cd /d "%~dp0backend"

echo Execution du diagnostic des taches directeur...
echo.

node src/scripts/test-director-tasks.js

echo.
echo ===========================================
echo Diagnostic termine. Appuyez sur une touche pour fermer.
pause >nul
