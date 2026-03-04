@echo off
echo ========================================
echo    TEST OPTIMISATIONS DE PERFORMANCE
echo ========================================
echo.
echo Ce script va tester:
echo 1. Routes utilisateurs optimisees
echo 2. Performance dashboard superviseur
echo 3. Comparaison avant/apres optimisations
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test des optimisations de performance...
node src/scripts/test-performance-optimizations.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
