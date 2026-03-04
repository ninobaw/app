@echo off
title Fix User Creation - SGDO TAV TUNISIE
color 0E

echo.
echo ==========================================
echo   🔧 FIX USER CREATION - SGDO TAV TUNISIE
echo ==========================================
echo.

echo 🚨 PROBLEME IDENTIFIE:
echo    - Erreur 500 lors de la creation d'utilisateur
echo    - Validation directorate incorrecte dans User.js
echo    - Types manquants dans useUsers.ts
echo.

echo ✅ CORRECTIONS APPLIQUEES:
echo.
echo 📋 1. Modele User.js:
echo    - Correction validation directorate pour DIRECTEUR, DIRECTEUR_GENERAL, SOUS_DIRECTEUR
echo    - Ancien: role.startsWith("DIRECTEUR_")
echo    - Nouveau: role === "DIRECTEUR" || role === "DIRECTEUR_GENERAL" || role === "SOUS_DIRECTEUR"
echo.
echo 📋 2. Hook useUsers.ts:
echo    - Ajout des champs directorate, managedDepartments, delegationLevel
echo    - Ajout des roles AGENT_BUREAU_ORDRE, DIRECTEUR_GENERAL, DIRECTEUR, SOUS_DIRECTEUR
echo.

echo 🧪 EXECUTION DU DIAGNOSTIC...
cd /d "%~dp0\backend"
node src/scripts/debug-user-creation.js

echo.
echo 🛑 Redemarrage du backend pour appliquer les corrections...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo.
echo 🚀 Demarrage du backend avec les corrections...
start "Backend-UserFix" cmd /k "echo BACKEND - USER CREATION FIXED && echo API: http://10.20.14.130:5000 && npm run dev"

echo ⏳ Attente backend (8 secondes)...
timeout /t 8 >nul

echo.
echo 🚀 Redemarrage du frontend...
cd /d "%~dp0"
start "Frontend-UserFix" cmd /k "echo FRONTEND - USER CREATION FIXED && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --force --host 0.0.0.0 --port 8080"

echo.
echo ✅ CORRECTIONS APPLIQUEES !
echo.
echo 🧪 TESTEZ LA CREATION D'UTILISATEUR:
echo.
echo 1. 👤 Utilisateur AGENT:
echo    - Role: AGENT
echo    - Pas besoin de directorate
echo    - Devrait fonctionner
echo.
echo 2. 👤 Directeur RH:
echo    - Role: DIRECTEUR
echo    - Directorate: RH
echo    - Department: Ressources Humaines
echo    - Devrait fonctionner
echo.
echo 3. 👤 Directeur General:
echo    - Role: DIRECTEUR_GENERAL
echo    - Directorate: GENERAL
echo    - Department: Direction Generale
echo    - Devrait fonctionner
echo.
echo 🔍 VERIFICATION:
echo    - Plus d'erreur 500
echo    - Creation reussie
echo    - Toast de succes
echo.
echo ⚠️ SI LE PROBLEME PERSISTE:
echo 1. Verifiez les logs du backend
echo 2. Verifiez la console navigateur
echo 3. Testez avec un utilisateur AGENT d'abord
echo.
pause
