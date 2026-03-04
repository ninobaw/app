@echo off
title FINAL USER CREATION FIX - SGDO TAV TUNISIE
color 0A

echo.
echo ==========================================
echo   ✅ FINAL USER CREATION FIX - SGDO TAV
echo ==========================================
echo.

echo 🔧 CORRECTIONS FINALES APPLIQUEES:
echo.
echo 📋 1. User.js - Validation directorate corrigee:
echo    ✅ DIRECTEUR, DIRECTEUR_GENERAL, SOUS_DIRECTEUR
echo.
echo 📋 2. useUsers.ts - Types mis a jour:
echo    ✅ directorate, managedDepartments, delegationLevel
echo    ✅ Tous les roles ajoutes
echo.
echo 📋 3. userRoutes.js - Route POST corrigee:
echo    ✅ Destructuration des nouveaux champs
echo    ✅ Ajout conditionnel des champs directeur
echo.

echo 🧪 TEST RAPIDE DE CREATION...
cd /d "%~dp0\backend"
node src/scripts/debug-user-creation.js

echo.
echo 🛑 REDEMARRAGE COMPLET DES SERVEURS...
taskkill /f /im node.exe 2>nul
timeout /t 5 >nul

echo.
echo 🚀 DEMARRAGE BACKEND...
start "Backend-Final-Fix" cmd /k "echo ✅ BACKEND - USER CREATION FIXED && echo API: http://10.20.14.130:5000 && echo Logs: Surveillez cette console && npm run dev"

echo ⏳ Attente backend (10 secondes)...
timeout /t 10 >nul

echo.
echo 🚀 DEMARRAGE FRONTEND...
cd /d "%~dp0"
start "Frontend-Final-Fix" cmd /k "echo ✅ FRONTEND - USER CREATION FIXED && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --force --host 0.0.0.0 --port 8080"

echo.
echo ✅ CORRECTIONS FINALES TERMINEES !
echo.
echo 🧪 TESTEZ MAINTENANT LA CREATION D'UTILISATEUR:
echo.
echo 📋 TEST 1 - Utilisateur AGENT (simple):
echo    - Email: test.agent@tav.aero
echo    - Nom: Test Agent
echo    - Role: AGENT
echo    - Airport: ENFIDHA
echo    - Department: Test
echo    - Password: password123
echo    ✅ Devrait fonctionner sans directorate
echo.
echo 📋 TEST 2 - Directeur RH:
echo    - Email: test.directeur@tav.aero
echo    - Nom: Test Directeur
echo    - Role: DIRECTEUR
echo    - Airport: ENFIDHA
echo    - Department: Ressources Humaines
echo    - Directorate: RH
echo    - Password: password123
echo    ✅ Devrait fonctionner avec directorate
echo.
echo 🔍 SURVEILLANCE:
echo 1. Regardez les logs du backend dans sa console
echo 2. Verifiez la console navigateur (F12)
echo 3. Si erreur 500, regardez les details dans les logs backend
echo.
echo 📊 RESULTATS ATTENDUS:
echo    ✅ Status 201 (Created)
echo    ✅ Toast de succes
echo    ✅ Utilisateur cree dans la liste
echo    ❌ Plus d'erreur 500
echo.
pause
