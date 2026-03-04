@echo off
echo ========================================
echo    TEST TAGS PERSONNALISES
echo ========================================
echo.
echo Ce script va tester l'analyse intelligente
echo avec VOS TAGS PERSONNALISES uniquement:
echo - Police
echo - AOCA  
echo - Douane
echo - Concessionaire1
echo - Syndicat
echo - Commute consultatif
echo.
echo Les tags systeme (urgent, important, etc.)
echo seront IGNORES.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test avec vos tags personnalises...
node src/scripts/test-custom-analysis.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
