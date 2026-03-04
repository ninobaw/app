@echo off
echo ========================================
echo DIAGNOSTIC ASSIGNATION NAJEH CHAOUCH
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
echo Execution du diagnostic pour Najeh Chaouch...
echo.

node src/scripts/debug-najeh-assignment.js

echo.
echo ========================================
echo DIAGNOSTIC TERMINE
echo ========================================
echo.
echo SOLUTIONS POSSIBLES:
echo 1. Verifier que Najeh a un directorate defini
echo 2. Verifier que Najeh est actif
echo 3. Verifier les mots-cles d'assignation
echo 4. Assigner manuellement si necessaire
echo.
pause
