@echo off
echo ========================================
echo    TEST D'ANALYSE INTELLIGENTE
echo ========================================
echo.
echo Ce script va tester l'analyse intelligente
echo des tags SANS MODIFIER les donnees.
echo.
echo Il va:
echo - Analyser des exemples de correspondances
echo - Montrer les scores calcules pour chaque tag
echo - Afficher les tags qui seraient assignes
echo - Donner des statistiques previsionnelles
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Execution du test d'analyse intelligente...
node src/scripts/test-smart-analysis.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
