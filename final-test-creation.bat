@echo off
title FINAL TEST - User Creation Fixed
color 0A

echo.
echo ==========================================
echo   FINAL TEST - USER CREATION FIXED
echo ==========================================
echo.

echo ✅ CORRECTIONS APPLIQUEES:
echo.
echo 📋 1. Backend (userRoutes.js):
echo    - Filtrage des champs directeur vides
echo    - Logs DEBUG detailles
echo.
echo 📋 2. Frontend (CreateUserDialog.tsx):
echo    - Envoi conditionnel des champs directeur
echo    - Pas de champs vides pour les AGENT
echo.

echo 🛑 REDEMARRAGE DES SERVEURS...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo.
echo 🚀 DEMARRAGE BACKEND...
cd /d "%~dp0\backend"
start "Backend-Final" cmd /k "echo BACKEND FINAL - USER CREATION FIXED && echo API: http://10.20.14.130:5000 && echo LOGS DEBUG ACTIFS && npm run dev"

echo Attente backend (8 secondes)...
timeout /t 8 >nul

echo.
echo 🚀 DEMARRAGE FRONTEND...
cd /d "%~dp0"
start "Frontend-Final" cmd /k "echo FRONTEND FINAL - USER CREATION FIXED && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --host 0.0.0.0 --port 8080"

echo.
echo ==========================================
echo   TESTS A EFFECTUER
echo ==========================================
echo.
echo 🧪 1. CREATION UTILISATEUR AGENT:
echo    - Email: test.agent@tav.aero
echo    - Nom: Test Agent
echo    - Role: AGENT
echo    - Airport: ENFIDHA
echo    - Department: Test
echo    - Password: password123
echo    ✅ Devrait fonctionner maintenant
echo.
echo 🧪 2. CREATION DIRECTEUR:
echo    - Email: test.directeur@tav.aero
echo    - Nom: Test Directeur
echo    - Role: DIRECTEUR
echo    - Airport: ENFIDHA
echo    - Department: Direction Test
echo    - Directorate: RH
echo    - Managed Departments: Test
echo    - Password: password123
echo    ✅ Devrait fonctionner
echo.
echo 🧪 3. CREATION SUPER_ADMIN:
echo    - Email: test.admin@tav.aero
echo    - Nom: Test Admin
echo    - Role: SUPER_ADMIN
echo    - Airport: ENFIDHA
echo    - Password: password123
echo    ✅ Devrait fonctionner
echo.
echo 🔍 SURVEILLANCE:
echo - Regardez les logs [DEBUG] du backend
echo - Plus d'erreur 400 "Validation error"
echo - Status 201 (Created) attendu
echo - Toast de succes dans le frontend
echo.
echo 📊 RESULTATS ATTENDUS:
echo    ✅ Tous les roles se creent sans erreur
echo    ✅ Anis Ben Jannet s'affiche correctement comme DIRECTEUR
echo    ✅ Dashboard directeur fonctionne
echo    ✅ Plus de problemes de creation
echo.
pause
