@echo off
echo ========================================
echo    INITIALISATION SIMPLE DES TAGS
echo ========================================
echo.
echo Ce script va creer les tags par defaut
echo SANS avoir besoin d'un SUPER_ADMIN.
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
if not exist "src\scripts\init-tags-simple.js" (
    echo ERREUR: Script d'initialisation simple non trouve
    pause
    exit /b 1
)

echo.
echo Execution du script d'initialisation simple...
echo.

node src\scripts\init-tags-simple.js

echo.
echo ========================================
echo Script termine. Appuyez sur une touche pour fermer...
pause > nul
