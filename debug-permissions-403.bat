@echo off
echo ========================================
echo DIAGNOSTIC ERREUR 403 - PERMISSIONS AEROPORT
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
echo Execution du diagnostic des permissions...
echo.

node src/scripts/debug-user-permissions.js

echo.
echo ========================================
echo DIAGNOSTIC TERMINE
echo ========================================
echo.
echo SOLUTIONS POSSIBLES:
echo 1. Verifier le role de l'utilisateur connecte
echo 2. Si agent bureau d'ordre ENFIDHA doit creer pour MONASTIR:
echo    - Changer son aeroport a "GENERALE" 
echo    - Ou lui donner un role directeur
echo 3. Redemarrer le serveur backend apres modifications
echo.
pause
