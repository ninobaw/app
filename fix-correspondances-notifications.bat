@echo off
title FIX CORRESPONDANCES & NOTIFICATIONS - SGDO TAV TUNISIE
color 0B

echo.
echo ==========================================
echo   FIX CORRESPONDANCES & NOTIFICATIONS
echo ==========================================
echo.

echo ✅ CORRECTIONS APPLIQUEES:
echo.
echo 📋 1. ROUTAGE CORRESPONDANCES:
echo    - Route /correspondances/:id ajoutee
echo    - Ouverture automatique du dialog d'edition
echo.
echo 📋 2. DIALOG D'EDITION COMPLET:
echo    - Actions a entreprendre
echo    - Commentaires
echo    - Pieces jointes / attachements
echo    - Sauvegarde des modifications
echo.
echo 📋 3. LIENS EMAIL FIXES:
echo    - localhost:3000/correspondances/ID maintenant fonctionnel
echo    - Ouverture directe dans le dialog d'edition
echo.

echo 🛑 REDEMARRAGE DES SERVEURS...
taskkill /f /im node.exe 2>nul
timeout /t 3 >nul

echo.
echo 🚀 DEMARRAGE BACKEND...
cd /d "%~dp0\backend"
start "Backend-Correspondances" cmd /k "echo BACKEND SGDO TAV TUNISIE - CORRESPONDANCES && echo API: http://10.20.14.130:5000 && npm run dev"

echo Attente backend (8 secondes)...
timeout /t 8 >nul

echo.
echo 🚀 DEMARRAGE FRONTEND...
cd /d "%~dp0"
start "Frontend-Correspondances" cmd /k "echo FRONTEND - CORRESPONDANCES FIXES && echo URL: http://sgdo.tavtunisie.app:8080 && npm run dev -- --host 0.0.0.0 --port 8080"

echo.
echo ==========================================
echo   TESTS A EFFECTUER
echo ==========================================
echo.
echo 🧪 1. TEST LIEN EMAIL:
echo    - Creez une correspondance
echo    - Verifiez la reception de l'email
echo    - Cliquez sur le lien dans l'email
echo    ✅ Devrait ouvrir le dialog d'edition
echo.
echo 🧪 2. TEST DIALOG D'EDITION:
echo    - Ajoutez une action a entreprendre
echo    - Ajoutez un commentaire
echo    - Uploadez une piece jointe
echo    - Sauvegardez les modifications
echo    ✅ Tout devrait fonctionner
echo.
echo 🧪 3. TEST URL DIRECTE:
echo    - Allez sur http://sgdo.tavtunisie.app:8080/correspondances/[ID]
echo    - Remplacez [ID] par un vrai ID de correspondance
echo    ✅ Devrait ouvrir automatiquement le dialog
echo.
echo 📧 PROCHAINES ETAPES:
echo    1. Moderniser le template d'email
echo    2. Implementer les notifications push
echo    3. Notifier a chaque contribution
echo.
echo 🔍 SURVEILLANCE:
echo    - Plus d'erreur sur les liens email
echo    - Dialog d'edition fonctionnel
echo    - Actions/commentaires/attachements operationnels
echo.
pause
