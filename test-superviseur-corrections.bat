@echo off
echo ========================================
echo    TEST CORRECTIONS SUPERVISEUR
echo ========================================
echo.
echo Ce script teste les corrections pour:
echo 1. Acces aux correspondances pour superviseur
echo 2. Affichage des donnees reelles dans dashboard
echo.
echo CORRECTIONS APPLIQUEES:
echo - Middleware authorizeBureauOrdre ajoute aux routes
echo - Filtre de date ameliore dans SupervisorDashboardService
echo - Fallback vers toutes les correspondances si periode vide
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo 1. Debug des correspondances d'Asma...
node src/scripts/debug-correspondances-asma.js

echo.
echo 2. Test des corrections superviseur...
node src/scripts/test-superviseur-corrections.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
