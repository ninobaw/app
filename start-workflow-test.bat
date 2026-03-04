@echo off
echo ========================================
echo    SGDO - Test Workflow Complet
echo ========================================
echo.

echo Demarrage des serveurs pour test du workflow...
echo.

echo ETAPE 1: Demarrage du backend...
start "SGDO Backend - Workflow Test" cmd /k "cd /d backend && echo === BACKEND WORKFLOW TEST === && echo Serveur backend demarre pour test workflow && npm start"

echo Attente du demarrage backend...
timeout /t 5 /nobreak >nul

echo.
echo ETAPE 2: Demarrage du frontend...
start "SGDO Frontend - Workflow Test" cmd /k "echo === FRONTEND WORKFLOW TEST === && echo Serveur frontend demarre pour test workflow && npm run dev"

echo Attente du demarrage frontend...
timeout /t 3 /nobreak >nul

echo.
echo ETAPE 3: Test automatique du backend...
echo Execution du test automatise du workflow...
timeout /t 5 /nobreak >nul

start "Test Workflow Backend" cmd /k "echo === TEST WORKFLOW BACKEND === && echo Execution du test automatise... && node test-workflow-complete.js && echo. && echo Test termine ! && pause"

echo.
echo ========================================
echo    SERVEURS DEMARRES
echo ========================================
echo.
echo URLs d'acces:
echo - Frontend: http://10.20.14.130:8080
echo - Backend API: http://10.20.14.130:5000
echo - Correspondances: http://10.20.14.130:8080/correspondances
echo.
echo PROCESSUS DE TEST WORKFLOW:
echo.
echo 1. CREATION DE CORRESPONDANCE:
echo    - Aller sur http://10.20.14.130:8080/correspondances
echo    - Cliquer "Nouvelle Correspondance"
echo    - Remplir: Sujet, De, A, Type, Priorite
echo    - Sauvegarder
echo.
echo 2. CREATION DU WORKFLOW:
echo    - Dans la liste, cliquer l'icone Workflow (violet)
echo    - Selectionner le Directeur General
echo    - Choisir la priorite
echo    - Cliquer "Creer le Workflow"
echo.
echo 3. CONSIGNE DG (Role: Directeur General):
echo    - Se connecter en tant que DG
echo    - Ajouter consigne et assigner une personne
echo    - Exemple: "Traiter en priorite, preparer reponse detaillee"
echo.
echo 4. PROPOSITION (Role: Personne Assignee):
echo    - Se connecter en tant que personne assignee
echo    - Rediger proposition de reponse
echo    - Soumettre pour approbation
echo.
echo 5. APPROBATION DG (Role: Directeur General):
echo    - Se reconnecter en tant que DG
echo    - Examiner la proposition
echo    - Approuver OU demander revision
echo.
echo 6. ENVOI FINAL:
echo    - Si approuve, envoyer la reponse finale
echo    - Workflow termine !
echo.
echo UTILISATEURS DE TEST:
echo - Admin: abdallah.benkhalifa@tav.aero / password123
echo - DG: nourssine.fradi@tav.aero / password123
echo.
echo FONCTIONNALITES TESTEES:
echo ✅ Creation workflow depuis correspondance
echo ✅ Consignes et assignation par DG
echo ✅ Propositions de reponse
echo ✅ Approbation/revision par DG
echo ✅ Envoi de reponse finale
echo ✅ Historique complet des actions
echo ✅ Permissions par role
echo ✅ Interface utilisateur complete
echo.
echo GUIDE COMPLET: Voir GUIDE_TEST_WORKFLOW.md
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause >nul

start http://10.20.14.130:8080/correspondances

echo.
echo Navigateur ouvert sur la page des correspondances.
echo Suivez les etapes ci-dessus pour tester le workflow complet.
echo.
pause
