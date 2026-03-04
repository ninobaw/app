@echo off
echo ========================================
echo    VERIFICATION BASE DE DONNEES
echo ========================================
echo.
echo Ce script va verifier l'etat de votre
echo base de donnees:
echo.
echo - Nombre de correspondances
echo - Nombre de tags
echo - Nombre d'utilisateurs
echo - Collections disponibles
echo.
echo Cela nous aidera a comprendre pourquoi
echo l'assignation n'a trouve aucune
echo correspondance.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Verification en cours...
node src/scripts/check-database-status.js

echo.
echo ========================================
echo Verification terminee. Appuyez sur une touche...
pause > nul
