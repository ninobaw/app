@echo off
echo ========================================
echo    INITIALISATION DES TAGS PAR DEFAUT
echo ========================================
echo.

cd /d "%~dp0"

echo Verification du repertoire backend...
if not exist "backend" (
    echo ERREUR: Repertoire backend non trouve
    pause
    exit /b 1
)

cd backend

echo Verification du fichier de script...
if not exist "src\scripts\init-default-tags.js" (
    echo ERREUR: Script d'initialisation non trouve
    pause
    exit /b 1
)

echo.
echo Execution du script d'initialisation des tags...
echo.

node src\scripts\init-default-tags.js

echo.
echo ========================================
echo Script termine. Appuyez sur une touche pour fermer...
pause > nul
