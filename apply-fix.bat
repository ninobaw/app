@echo off
echo ========================================
echo    CORRECTION AUTOMATIQUE TAGDIALOG
echo ========================================
echo.

echo 🔧 Application de la correction TagDialogProvider...
echo.

cd /d "%~dp0"

echo Execution du script de correction...
node apply-fix.js

echo.
echo ========================================
echo ✅ CORRECTION TERMINEE
echo.
echo 📋 PROCHAINES ETAPES:
echo 1. Redemarrer le frontend: npm run dev
echo 2. Aller dans Parametres ^> Tags  
echo 3. Plus d'erreur TagDialogProvider !
echo.
echo ========================================
echo Appuyez sur une touche pour fermer...
pause > nul
