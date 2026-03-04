@echo off
echo ========================================
echo    TEST API SUPERVISEUR DASHBOARD
echo ========================================
echo.
echo Ce script va tester:
echo 1. Creation/verification utilisateur superviseur
echo 2. Generation token JWT
echo 3. Test API /api/supervisor/dashboard
echo 4. Test autres endpoints superviseur
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test de l'API superviseur...
node src/scripts/test-supervisor-api.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
