@echo off
echo ========================================
echo DIAGNOSTIC CORRESPONDANCES DIRECTEUR ADJOINT
echo ========================================
echo.

cd /d "%~dp0backend"

echo Chargement des variables d'environnement...
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        set "%%a=%%b"
    )
    echo Variables d'environnement chargees depuis .env
) else (
    echo Fichier .env non trouve, utilisation des valeurs par defaut
    set "MONGODB_URI=mongodb://localhost:27017/aero-doc-flow"
)

echo.
echo Execution du diagnostic...
echo.

node src/scripts/debug-director-correspondances.js

echo.
echo ========================================
echo DIAGNOSTIC TERMINE
echo ========================================
pause
