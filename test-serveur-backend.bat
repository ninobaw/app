@echo off
echo ========================================
echo    TEST SERVEUR BACKEND - CORRECTION
echo ========================================
echo.
echo CORRECTION APPLIQUEE:
echo - Erreur mongoose.Schema.Types.ObjectId corrigee
echo - Import mongoose ajoute dans Correspondance.js
echo - Toutes les references Schema.Types.ObjectId corrigees
echo.
echo VERIFICATION:
echo 1. Le serveur backend doit demarrer sans erreur
echo 2. Les modeles Correspondance et ResponseDraft doivent se charger
echo 3. Les routes doivent etre montees correctement
echo.
echo Demarrage du serveur backend...
echo.
pause

cd /d "%~dp0"
cd backend

echo Demarrage avec nodemon...
npm run dev

pause
