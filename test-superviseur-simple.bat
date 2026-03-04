@echo off
echo ========================================
echo    TEST SIMPLE SUPERVISEUR - CORRECTED
echo ========================================
echo.
echo Test rapide des corrections appliquees:
echo 1. Acces aux correspondances (CORRIGE)
echo 2. Donnees reelles dashboard (CORRIGE)
echo 3. Erreur populate author (CORRIGE)
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test simple des corrections superviseur...
node src/scripts/test-superviseur-simple.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
