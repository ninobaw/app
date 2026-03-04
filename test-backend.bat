@echo off
echo ========================================
echo    TEST DE CONNECTIVITE BACKEND
echo ========================================
echo.

cd /d "%~dp0"

echo Verification de Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Node.js non trouve
    pause
    exit /b 1
)

echo Execution du test de connectivite...
echo.

node test-backend.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche pour fermer...
pause > nul
