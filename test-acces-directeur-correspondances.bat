@echo off
echo ========================================
echo    TEST ACCES DIRECTEUR CORRESPONDANCES
echo ========================================
echo.
echo PROBLEME IDENTIFIE:
echo - Erreur 403 Forbidden pour anisbenjannet@tav.aero (DIRECTEUR)
echo - Le directeur ne peut pas acceder aux correspondances
echo.
echo CORRECTION APPLIQUEE:
echo - Modification du filtre dans correspondanceRoutes.js
echo - Les directeurs voient maintenant:
echo   * Correspondances qui leur sont assignees
echo   * Correspondances sans assignation (assignedTo null/undefined)
echo   * Permet de voir toutes les correspondances en attendant assignation
echo.
echo VERIFICATION:
echo 1. Se connecter avec anisbenjannet@tav.aero
echo 2. Aller sur la page Correspondances
echo 3. Verifier qu'il n'y a plus d'erreur 403
echo 4. Verifier que les correspondances s'affichent
echo.
echo IMPORTANT:
echo - Le serveur backend doit etre demarre
echo - L'utilisateur anisbenjannet@tav.aero doit exister avec role DIRECTEUR
echo.
pause

echo.
echo ========================================
echo PROCHAINES ETAPES:
echo.
echo 1. Ouvrir navigateur: http://localhost:8080
echo 2. Se connecter avec anisbenjannet@tav.aero
echo 3. Aller sur Correspondances dans la sidebar
echo 4. Verifier absence d'erreur 403 dans console
echo 5. Verifier affichage des correspondances
echo.
echo Si ca fonctionne:
echo - Tester creation d'une correspondance
echo - Assigner la correspondance au directeur
echo - Tester creation d'un draft de reponse
echo ========================================
echo.
pause
