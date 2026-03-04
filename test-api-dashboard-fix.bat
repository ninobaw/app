@echo off
echo ========================================
echo    TEST CORRECTION API DASHBOARD
echo ========================================
echo.
echo Ce script teste la correction specifique
echo de l'erreur 401 sur l'API dashboard superviseur.
echo.
echo CORRECTION APPLIQUEE:
echo - req.user.id --^> req.user._id dans supervisorRoutes.js
echo - Compatibilite avec le middleware d'authentification
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test de la correction API dashboard...
node src/scripts/test-dashboard-superviseur-fix.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
