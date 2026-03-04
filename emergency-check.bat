@echo off
title EMERGENCY CHECK - User Creation Still Failing
color 0C

echo.
echo ==========================================
echo   🚨 EMERGENCY CHECK - STILL FAILING
echo ==========================================
echo.

echo ❌ L'erreur 400 persiste encore !
echo.
echo 🔍 ACTIONS IMMEDIATES:
echo.
echo 1. REGARDEZ LA CONSOLE DU BACKEND
echo    - Y a-t-il des logs [DEBUG] ?
echo    - Que contient req.body exactement ?
echo    - Quel est le message d'erreur de validation ?
echo.
echo 2. REDEMARRAGE FORCE FRONTEND
echo    - Le frontend n'a peut-etre pas pris les modifications
echo.

echo 🛑 ARRET FORCE DE TOUS LES SERVEURS...
taskkill /f /im node.exe 2>nul
timeout /t 5 >nul

echo.
echo 🚀 REDEMARRAGE BACKEND AVEC LOGS MAXIMUM...
cd /d "%~dp0\backend"
start "Backend-Emergency" cmd /k "echo 🚨 BACKEND EMERGENCY - LOGS MAXIMUM && echo API: http://10.20.14.130:5000 && echo SURVEILLEZ CETTE CONSOLE && npm run dev"

echo Attente backend (10 secondes)...
timeout /t 10 >nul

echo.
echo 🚀 REDEMARRAGE FRONTEND FORCE...
cd /d "%~dp0"
start "Frontend-Emergency" cmd /k "echo 🚨 FRONTEND EMERGENCY - MODIFICATIONS APPLIQUEES && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --force --host 0.0.0.0 --port 8080"

echo.
echo ==========================================
echo   🚨 ACTIONS URGENTES
echo ==========================================
echo.
echo 1. 👀 SURVEILLEZ LA CONSOLE DU BACKEND
echo    Lors de la prochaine tentative, vous devriez voir:
echo    🔍 [DEBUG] POST /api/users - Début de la requête
echo    🔍 [DEBUG] req.body: {...}
echo    🔍 [DEBUG] Champs extraits: {...}
echo.
echo 2. 📋 COPIEZ-MOI LES LOGS EXACTS
echo    - Le contenu complet de req.body
echo    - Le message d'erreur de validation exact
echo    - Tous les logs [DEBUG] affiches
echo.
echo 3. 🧪 TESTEZ AVEC DONNEES SIMPLES:
echo    Email: emergency@tav.aero
echo    Nom: Emergency
echo    Prenom: Test
echo    Role: AGENT
echo    Airport: ENFIDHA
echo    Department: Emergency
echo    Password: password123
echo.
echo 4. ⚠️ SI PAS DE LOGS [DEBUG]:
echo    - Le backend n'a pas redémarre correctement
echo    - Ou la route POST n'est pas appelée
echo.
echo 5. 🔍 VERIFIEZ AUSSI:
echo    - Le frontend envoie-t-il bien les bonnes données ?
echo    - Y a-t-il encore directorate: "" dans req.body ?
echo.
pause
