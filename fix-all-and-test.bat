@echo off
title FIX ALL AND TEST - SGDO TAV TUNISIE
color 0B

echo.
echo ==========================================
echo   FIX ALL AND TEST - SGDO TAV TUNISIE
echo ==========================================
echo.

echo ETAPE 1: VERIFICATION DES UTILISATEURS ADMIN
cd /d "%~dp0\backend"
node src/scripts/check-admin-user.js

echo.
echo ETAPE 2: ARRET DE TOUS LES SERVEURS
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo.
echo ETAPE 3: DEMARRAGE DU BACKEND AVEC DEBUG
start "Backend-Debug" cmd /k "echo BACKEND SGDO TAV TUNISIE && echo API: http://10.20.14.130:5000 && echo LOGS DEBUG ACTIFS && npm run dev"

echo Attente backend (8 secondes)...
timeout /t 8 >nul

echo.
echo ETAPE 4: DEMARRAGE DU FRONTEND
cd /d "%~dp0"
start "Frontend-SGDO" cmd /k "echo FRONTEND SGDO TAV TUNISIE && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --host 0.0.0.0 --port 8080"

echo.
echo ==========================================
echo   SERVEURS DEMARRES - PRETS POUR TEST
echo ==========================================
echo.
echo CONNEXION:
echo - URL: http://sgdo.tavtunisie.app:8080
echo - Email: abdallah.benkhalifa@tav.aero
echo - Mot de passe: admin123
echo.
echo TEST CREATION UTILISATEUR:
echo 1. Connectez-vous avec les identifiants ci-dessus
echo 2. Allez dans Gestion des utilisateurs
echo 3. Cliquez sur "Nouveau utilisateur"
echo 4. Remplissez avec ces donnees:
echo    - Email: test@tav.aero
echo    - Prenom: Test
echo    - Nom: User
echo    - Role: AGENT
echo    - Airport: ENFIDHA
echo    - Department: Test
echo    - Mot de passe: password123
echo 5. Cliquez sur "Creer"
echo.
echo SURVEILLANCE:
echo - Regardez la console du BACKEND pour les logs [DEBUG]
echo - Vous devriez voir chaque etape de la creation
echo - Si erreur 500, le dernier log [DEBUG] indiquera ou ca echoue
echo.
echo RESULTATS ATTENDUS:
echo - Status 201 (Created) dans les logs backend
echo - Toast de succes dans le frontend
echo - Utilisateur apparait dans la liste
echo.
pause
