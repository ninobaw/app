@echo off
echo ========================================
echo    TEST NOUVEAU WORKFLOW CORRESPONDANCES
echo ========================================
echo.
echo Ce script va tester l'integration du
echo nouveau workflow de traitement des
echo correspondances avec:
echo.
echo - Verification des nouveaux roles
echo - Test des modeles mis a jour
echo - Verification des services
echo - Statistiques du workflow
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test du nouveau workflow...
node src/scripts/test-new-workflow.js

echo.
echo ========================================
echo Test termine. Appuyez sur une touche...
pause > nul
