@echo off
echo ========================================
echo    REMPLACEMENT PAR VOS TAGS SPECIFIQUES
echo ========================================
echo.
echo ATTENTION: Cette operation va:
echo.
echo 1. SUPPRIMER tous les tags predéfinis actuels
echo    (urgent, important, confidentiel, etc.)
echo.
echo 2. CREER vos 6 tags spécifiques:
echo    - Police (rouge)
echo    - AOCA (bleu)
echo    - Douane (vert)
echo    - Concessionaire1 (vert clair)
echo    - Syndicat (violet)
echo    - Commute consultatif (orange)
echo.
echo 3. NETTOYER toutes les correspondances
echo    (retirer les anciens tags)
echo.
echo Cette operation est IRREVERSIBLE !
echo Assurez-vous d'avoir fait une sauvegarde.
echo.
set /p confirm="Etes-vous ABSOLUMENT sur ? (oui/non): "
if /i "%confirm%" NEQ "oui" (
    echo Operation annulee.
    pause
    exit /b 0
)

echo.
echo Derniere chance d'annuler...
set /p finalConfirm="Tapez OUI en majuscules pour confirmer: "
if "%finalConfirm%" NEQ "OUI" (
    echo Operation annulee.
    pause
    exit /b 0
)

cd /d "%~dp0"
cd backend

echo.
echo Remplacement en cours...
node src/scripts/replace-with-custom-tags.js

echo.
echo ========================================
echo Remplacement termine. Appuyez sur une touche...
pause > nul
