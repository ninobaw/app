@echo off
echo ========================================
echo    VERIFICATION SETUP SUPERVISEUR
echo ========================================
echo.
echo Ce script va verifier:
echo 1. Existence d'un utilisateur superviseur
echo 2. Configuration des routes superviseur
echo 3. Donnees de test pour le dashboard
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Verification de l'utilisateur superviseur...
node src/scripts/check-supervisor-user.js

echo.
echo ========================================
echo Verification terminee. Appuyez sur une touche...
pause > nul
