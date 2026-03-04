@echo off
echo ========================================
echo    NETTOYAGE APPLICATION AERO-DOC-FLOW
echo ========================================
echo.

cd backend

echo Choisissez une option:
echo.
echo 1. Nettoyage COMPLET (tout supprimer)
echo 2. Nettoyage RAPIDE (correspondances seulement)
echo 3. Reinitialiser STATUTS (garder les donnees)
echo 4. Verifier l'etat de l'application
echo 5. Annuler
echo.

set /p choice="Votre choix (1-5): "

if "%choice%"=="1" goto full_clean
if "%choice%"=="2" goto quick_clean
if "%choice%"=="3" goto reset_status
if "%choice%"=="4" goto verify
if "%choice%"=="5" goto cancel
goto invalid

:full_clean
echo.
echo 🧹 Lancement du nettoyage COMPLET...
echo ⚠️  ATTENTION: Cela va supprimer TOUTES les données !
echo.
pause
node src\scripts\clean-application.js
goto end

:quick_clean
echo.
echo 🧹 Lancement du nettoyage RAPIDE...
echo 📧 Suppression des correspondances et fichiers associés
echo.
node src\scripts\quick-clean.js
goto end

:reset_status
echo.
echo 🔄 Réinitialisation des statuts...
echo 📋 Remise à zéro des workflows (données préservées)
echo.
node src\scripts\reset-status.js
goto end

:verify
echo.
echo 🔍 Vérification de l'état de l'application...
echo 📊 Analyse des données et fichiers
echo.
node src\scripts\verify-clean.js
goto end

:invalid
echo.
echo ❌ Choix invalide. Veuillez choisir 1, 2, 3, 4 ou 5.
pause
goto start

:cancel
echo.
echo ❌ Opération annulée.
goto end

:end
echo.
echo 🎯 Terminé !
pause
