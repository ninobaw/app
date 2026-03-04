@echo off
echo ========================================
echo DEBUG REINITIALISATION MOT DE PASSE
echo ========================================

echo.
echo 1. Verification de l'API users...
curl -s "http://10.20.14.148:5000/api/users" -H "Content-Type: application/json"

echo.
echo.
echo 2. PROBLEME IDENTIFIE :
echo ========================================
echo L'erreur 500 vient du serveur backend.
echo Les logs detailles sont dans le code mais ne s'affichent pas.

echo.
echo 3. SOLUTIONS A TESTER :
echo ========================================
echo A. Verifier les logs du serveur backend dans le terminal
echo B. Verifier que l'utilisateur connecte est bien SUPER_ADMIN
echo C. Verifier que le newPassword est bien envoye
echo D. Verifier que l'ID utilisateur est valide

echo.
echo 4. COMMANDES DE DEBUG :
echo ========================================
echo - Ouvrir le terminal du serveur backend
echo - Chercher les logs [RESET PASSWORD]
echo - Verifier les erreurs dans la console serveur

echo.
echo 5. TEST MANUEL POSSIBLE :
echo ========================================
echo curl -X POST "http://10.20.14.148:5000/api/users/USER_ID/reset-password" ^
echo      -H "Content-Type: application/json" ^
echo      -H "Authorization: Bearer YOUR_TOKEN" ^
echo      -d "{\"newPassword\": \"newpass123\"}"

echo.
echo 6. POINTS A VERIFIER :
echo ========================================
echo - Le serveur backend est bien demarre
echo - L'utilisateur connecte a le role SUPER_ADMIN
echo - L'ID utilisateur existe dans la base
echo - Le token JWT est valide
echo - La base de donnees MongoDB est accessible

echo.
echo ========================================
echo REGARDEZ LES LOGS DU SERVEUR BACKEND !
echo ========================================

pause
