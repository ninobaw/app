@echo off
echo ========================================
echo    TEST DASHBOARD SUPERVISEUR COMPLET
echo ========================================
echo.
echo Ce script va:
echo 1. Creer des correspondances de test
echo 2. Creer un utilisateur superviseur
echo 3. Tester les APIs du dashboard
echo 4. Afficher les instructions de test
echo.
pause

cd /d "%~dp0"

echo.
echo === ETAPE 1: Creation correspondances de test ===
cd backend
node src/scripts/create-supervisor-test-correspondances.js

echo.
echo === ETAPE 2: Creation utilisateur superviseur ===
node src/scripts/create-supervisor-user.js

echo.
echo === ETAPE 3: Test des APIs ===
node src/scripts/test-workflow-api.js

echo.
echo ========================================
echo           TESTS TERMINES
echo ========================================
echo.
echo PROCHAINES ETAPES:
echo.
echo 1. Demarrez le serveur backend:
echo    cd backend ^&^& npm start
echo.
echo 2. Demarrez le frontend:
echo    cd .. ^&^& npm run dev
echo.
echo 3. Connectez-vous avec:
echo    Email: superviseur.bureau@aeroport.tn
echo    Mot de passe: supervisor123
echo.
echo 4. Testez les fonctionnalites:
echo    - Dashboard superviseur avec donnees reelles
echo    - Alertes d'echeances
echo    - Correspondances validees pour reponse
echo    - Preparation de reponses
echo.
echo 5. Testez les liaisons correspondance-reponse:
echo    - Creez une reponse a une correspondance
echo    - Verifiez la liaison bidirectionnelle
echo    - Consultez la chaine complete
echo.
pause
