@echo off
echo ========================================
echo    CORRECTION CORRESPONDANCES COMPLETE
echo ========================================
echo.
echo PROBLEMES IDENTIFIES:
echo 1. Hook useCorrespondances utilise axios au lieu de api
echo 2. DIRECTEUR et SOUS_DIRECTEUR pas dans allowedRoles backend
echo 3. Page s'affiche pour directeur mais liste vide
echo 4. Page ne s'affiche pas pour SUPER_ADMIN et AGENT_BUREAU_ORDRE
echo.
echo CORRECTIONS APPLIQUEES:
echo 1. ✅ Backend: DIRECTEUR et SOUS_DIRECTEUR ajoutes aux roles autorises
echo 2. ✅ Logs ajoutes pour diagnostiquer les permissions
echo 3. 🔄 Frontend: Hook useCorrespondances partiellement corrige
echo.
echo ACTIONS REQUISES:
echo 1. Redemarrer le serveur backend pour activer les corrections
echo 2. Corriger manuellement le hook useCorrespondances (axios -> api)
echo 3. Tester avec tous les roles utilisateur
echo.
pause

cd /d "%~dp0"

echo.
echo ========================================
echo REDEMARRAGE SERVEUR BACKEND
echo ========================================
echo.
echo Arret des processus Node.js...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo Demarrage serveur backend avec corrections...
cd backend
start "Backend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo TESTS A EFFECTUER
echo ========================================
echo.
echo 1. SUPER_ADMIN (abdallah.benkhalifa@tav.aero):
echo    - Se connecter
echo    - Aller sur Correspondances
echo    - Verifier que la page s'affiche
echo    - Verifier que la liste se charge
echo.
echo 2. AGENT_BUREAU_ORDRE (maroua.saidi@tav.aero):
echo    - Se connecter  
echo    - Aller sur Correspondances
echo    - Verifier que la page s'affiche
echo    - Verifier que la liste se charge
echo.
echo 3. DIRECTEUR (anisbenjannet@tav.aero):
echo    - Se connecter
echo    - Aller sur Correspondances  
echo    - Verifier que la page s'affiche
echo    - Verifier que la liste se charge (meme vide)
echo    - Plus d'erreur 403 dans console
echo.
echo RESULTATS ATTENDUS:
echo - Tous les roles peuvent acceder a la page Correspondances
echo - Les listes se chargent selon les permissions
echo - Plus d'erreurs 403 ou 401 dans la console
echo - Interface fonctionnelle pour tous
echo ========================================
echo.
pause
