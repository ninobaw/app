@echo off
echo ========================================
echo    TEST WORKFLOW CORRESPONDANCES
echo ========================================
echo.
echo Ce script va tester le nouveau workflow
echo de traitement des correspondances:
echo.
echo 1. Verification des utilisateurs
echo 2. Test des endpoints API
echo 3. Creation d'une correspondance test
echo 4. Test du workflow directeur
echo 5. Test du dashboard superviseur
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo === ETAPE 1: Verification des utilisateurs ===
node src/scripts/test-new-workflow.js

echo.
echo === ETAPE 2: Test des endpoints API ===
echo Testez manuellement les endpoints suivants:
echo.
echo SUPERVISEUR:
echo - GET http://localhost:5000/api/supervisor/dashboard
echo - GET http://localhost:5000/api/supervisor/stats
echo.
echo DIRECTEUR:
echo - GET http://localhost:5000/api/director-workflow/pending-validations
echo.
echo === ETAPE 3: Demarrage du serveur ===
echo Le serveur va demarrer. Testez ensuite l'interface web.
echo.
pause

echo Demarrage du serveur backend...
npm start
