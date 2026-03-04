@echo off
echo ========================================
echo    DIAGNOSTIC APPROFONDI BASE DE DONNEES
echo ========================================
echo.
echo Ce script va faire un diagnostic complet
echo pour comprendre pourquoi le script trouve
echo 0 correspondances alors que vous en avez 55:
echo.
echo - Lister toutes les collections
echo - Chercher les correspondances sous differents noms
echo - Tester le modele Mongoose
echo - Verifier la connexion
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Diagnostic approfondi en cours...
node src/scripts/deep-database-diagnostic.js

echo.
echo ========================================
echo Diagnostic termine. Appuyez sur une touche...
pause > nul
