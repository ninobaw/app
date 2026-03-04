@echo off
echo ========================================
echo    DIAGNOSTIC TAGS PERSONNALISES
echo ========================================
echo.
echo Ce script va diagnostiquer pourquoi
echo l'assignation des tags personnalises
echo ne fonctionne pas.
echo.
echo Il va verifier:
echo - Les tags personnalises dans la base
echo - Les correspondances disponibles
echo - L'algorithme de scoring
echo - Les permissions de sauvegarde
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Diagnostic en cours...
node src/scripts/debug-custom-assignment.js

echo.
echo ========================================
echo Diagnostic termine. Appuyez sur une touche...
pause > nul
