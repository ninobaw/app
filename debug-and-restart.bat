@echo off
title DEBUG AND RESTART - User Creation
color 0E

echo.
echo ==========================================
echo   🔍 DEBUG AND RESTART - USER CREATION
echo ==========================================
echo.

echo ✅ LOGS DE DEBUG AJOUTES dans userRoutes.js
echo    - Logs détaillés à chaque étape
echo    - Validation explicite
echo    - Messages d'erreur complets
echo.

echo 🧪 TEST DE L'API ROUTE...
cd /d "%~dp0\backend"
node src/scripts/test-api-route.js

echo.
echo 🛑 REDEMARRAGE DU BACKEND AVEC LOGS DEBUG...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo.
echo 🚀 DEMARRAGE BACKEND (SURVEILLEZ LES LOGS!)...
start "Backend-Debug" cmd /k "echo 🔍 BACKEND DEBUG MODE && echo ⚠️ SURVEILLEZ CETTE CONSOLE POUR LES LOGS && echo API: http://10.20.14.148:5000 && npm run dev"

echo ⏳ Attente backend (8 secondes)...
timeout /t 8 >nul

echo.
echo ✅ BACKEND REDÉMARRE AVEC DEBUG !
echo.
echo 🔍 INSTRUCTIONS DE DEBUG:
echo.
echo 1. 👀 SURVEILLEZ LA CONSOLE DU BACKEND
echo    - Tous les logs commencent par [DEBUG]
echo    - Vous verrez chaque étape de la création
echo.
echo 2. 🧪 TESTEZ LA CREATION D'UTILISATEUR
echo    - Utilisez des données simples
echo    - Role: AGENT (pas de directorate)
echo.
echo 3. 📋 DONNEES DE TEST RECOMMANDEES:
echo    Email: debug@tav.aero
echo    Nom: Debug
echo    Prenom: Test
echo    Role: AGENT
echo    Airport: ENFIDHA
echo    Department: Debug Test
echo    Password: password123
echo.
echo 4. 🔍 ANALYSEZ LES LOGS:
echo    - Où s'arrête exactement le processus ?
echo    - Quel est le dernier log [DEBUG] affiché ?
echo    - Y a-t-il une erreur de validation ?
echo.
echo 5. 📊 LOGS ATTENDUS (dans l'ordre):
echo    ✅ [DEBUG] POST /api/users - Début de la requête
echo    ✅ [DEBUG] req.body: {...}
echo    ✅ [DEBUG] Champs extraits: {...}
echo    ✅ [DEBUG] Vérification utilisateur existant...
echo    ✅ [DEBUG] Hachage du mot de passe...
echo    ✅ [DEBUG] Création de l'objet userData...
echo    ✅ [DEBUG] userData final: {...}
echo    ✅ [DEBUG] Création de l'instance User...
echo    ✅ [DEBUG] Validation du modèle...
echo    ✅ [DEBUG] Sauvegarde en base de données...
echo    ✅ [DEBUG] Utilisateur sauvegardé avec succès
echo    ✅ [DEBUG] Formatage de la réponse...
echo    ✅ [DEBUG] Réponse formatée, envoi au client
echo.
echo ⚠️ Si le processus s'arrête avant la fin, nous saurons exactement où !
echo.
pause
