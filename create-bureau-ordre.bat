@echo off
echo ===========================================
echo    CREATION UTILISATEUR BUREAU D'ORDRE
echo ===========================================
echo.

cd /d "%~dp0backend"

echo Creation d'un utilisateur Bureau d'Ordre...
echo.

node src/scripts/create-bureau-ordre-user.js

echo.
echo ===========================================
echo Creation terminee. Appuyez sur une touche pour fermer.
pause >nul
