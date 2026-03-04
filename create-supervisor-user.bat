@echo off
echo ========================================
echo    CREATION UTILISATEUR SUPERVISEUR
echo ========================================
echo.
echo Ce script va creer un utilisateur
echo superviseur de bureau d'ordre avec:
echo.
echo - Role: SUPERVISEUR_BUREAU_ORDRE
echo - Email: superviseur.bureau@aeroport.tn
echo - Mot de passe: supervisor123
echo - Aeroport: GENERALE (tous)
echo - Permissions completes supervision
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Creation du superviseur...
node src/scripts/create-supervisor-user.js

echo.
echo ========================================
echo Creation terminee. Appuyez sur une touche...
pause > nul
