@echo off
echo ========================================
echo    REDEMARRAGE BACKEND AVEC CORRECTIONS
echo ========================================
echo.
echo PROBLEME IDENTIFIE:
echo - Erreur 403 Forbidden persiste encore
echo - Les modifications du filtrage ne sont pas actives
echo - Le serveur backend doit etre redémarre
echo.
echo CORRECTIONS APPLIQUEES (a activer):
echo 1. Filtrage correspondances pour directeurs corrige
echo 2. Modele Correspondance avec champs assignedTo
echo 3. Routes ResponseDraft ajoutees
echo 4. Permissions directeurs etendues
echo.
echo REDEMARRAGE DU BACKEND...
echo.
pause

cd /d "%~dp0"
cd backend

echo Arret du serveur existant...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Demarrage du serveur avec les nouvelles corrections...
echo.
echo VERIFICATION DES FICHIERS MODIFIES:
echo - correspondanceRoutes.js (filtrage $or)
echo - Correspondance.js (champs assignedTo)
echo - responseDraftRoutes.js (nouvelles routes)
echo - server.js (routes montees)
echo.

npm run dev

pause
