@echo off
echo 🔍 Test de diagnostic pour la réinitialisation de mot de passe
echo ============================================================
echo.

cd /d "%~dp0\.."
echo Répertoire de travail: %CD%
echo.

echo Chargement des variables d'environnement...
if exist ".env" (
    echo ✅ Fichier .env trouvé
) else (
    echo ❌ Fichier .env non trouvé
    pause
    exit /b 1
)

echo.
echo Exécution du test de diagnostic...
echo.
node scripts/test-forgot-password.js

echo.
echo Test terminé. Appuyez sur une touche pour fermer...
pause
