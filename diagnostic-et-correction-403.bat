@echo off
echo ========================================
echo    DIAGNOSTIC ET CORRECTION 403 FORBIDDEN
echo ========================================
echo.
echo PROBLEME IDENTIFIE:
echo - Erreur 403 Forbidden persiste pour anisbenjannet@tav.aero
echo - Le directeur ne peut pas acceder aux correspondances
echo - Les modifications du backend ne semblent pas actives
echo.
echo DIAGNOSTIC COMPLET:
echo 1. Test des permissions directeur via API
echo 2. Verification de l'etat du serveur backend
echo 3. Test de l'assignation de correspondances
echo 4. Redemarrage avec corrections actives
echo.
pause

cd /d "%~dp0"

echo.
echo ========================================
echo ETAPE 1: TEST DES PERMISSIONS DIRECTEUR
echo ========================================
echo.
cd backend
node src/scripts/test-directeur-permissions.js
echo.
pause

echo.
echo ========================================
echo ETAPE 2: ASSIGNATION DE CORRESPONDANCES
echo ========================================
echo.
node src/scripts/assign-correspondance-to-director.js
echo.
pause

echo.
echo ========================================
echo ETAPE 3: REDEMARRAGE SERVEUR BACKEND
echo ========================================
echo.
echo Arret du serveur existant...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo Demarrage avec corrections actives...
echo.
echo CORRECTIONS INCLUSES:
echo - Filtrage $or pour directeurs (assignedTo OU null)
echo - Champs assignedTo ajoutes au modele Correspondance
echo - Routes ResponseDraft montees
echo - Permissions etendues pour DIRECTEUR
echo.

start "Backend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo ETAPE 4: TEST FINAL
echo ========================================
echo.
echo 1. Ouvrir navigateur: http://localhost:8080
echo 2. Se connecter avec anisbenjannet@tav.aero
echo 3. Aller sur page Correspondances
echo 4. Verifier absence d'erreur 403 dans console
echo 5. Verifier affichage des correspondances
echo.
echo Si ca fonctionne:
echo - Tester creation d'un draft de reponse
echo - Verifier workflow d'approbation DG
echo - Valider le systeme complet
echo.
echo Si erreur 403 persiste:
echo - Verifier les logs du serveur backend
echo - Controler que les modifications sont bien appliquees
echo - Redemarrer completement (frontend + backend)
echo ========================================
echo.
pause
