@echo off
echo ========================================
echo    TEST API WORKFLOW CORRESPONDANCES
echo ========================================
echo.
echo Ce script va tester tous les endpoints
echo du nouveau workflow automatiquement:
echo.
echo - Connexion des utilisateurs test
echo - Test endpoints superviseur
echo - Test endpoints directeur  
echo - Test workflow complet
echo - Creation correspondance test
echo.
echo PREREQUIS: Serveur backend demarre
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test des API du workflow...
node src/scripts/test-workflow-api.js

echo.
echo ========================================
echo Tests API termines. Appuyez sur une touche...
pause > nul
