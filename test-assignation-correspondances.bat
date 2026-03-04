@echo off
echo ========================================
echo    ASSIGNATION CORRESPONDANCES DIRECTEUR
echo ========================================
echo.
echo OBJECTIF:
echo - Assigner des correspondances au directeur Anis Ben Jannet
echo - Permettre de tester le workflow complet
echo - Verifier l'acces filtre aux correspondances
echo.
echo ACTIONS:
echo 1. Verifier/creer le directeur anisbenjannet@tav.aero
echo 2. Trouver des correspondances non assignees
echo 3. Assigner 3 correspondances au directeur
echo 4. Verifier les assignations
echo.
echo IMPORTANT: MongoDB doit etre demarre
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Execution du script d'assignation...
node src/scripts/assign-correspondance-to-director.js

echo.
echo ========================================
echo VERIFICATION:
echo 1. Se connecter avec anisbenjannet@tav.aero
echo 2. Aller sur Correspondances
echo 3. Verifier que les correspondances assignees s'affichent
echo 4. Plus d'erreur 403 Forbidden
echo ========================================
echo.
pause
