@echo off
echo ========================================
echo TEST REDEMARRAGE SERVEUR BACKEND
echo ========================================
echo.

echo 1. Test des permissions localement...
node test-permissions-quick.js

echo.
echo 2. Verification du serveur backend...
echo Tentative de ping du serveur...

curl -X GET http://10.20.14.130:5000/api/auth/me -H "Authorization: Bearer %TOKEN%" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Serveur backend accessible
) else (
    echo ❌ Serveur backend non accessible ou token invalide
)

echo.
echo 3. Instructions pour tester:
echo.
echo A. Verifiez que le serveur backend affiche ces logs lors de la creation:
echo    🔐 [AuthAirport] === VERIFICATION ACCES AEROPORT ===
echo    👤 [AuthAirport] Utilisateur: Najeh Chaouch (SOUS_DIRECTEUR)
echo    🎯 [AuthAirport] Aeroport demande: MONASTIR
echo    ✅ [AuthAirport] ACCES AUTORISE - Role directeur: SOUS_DIRECTEUR
echo.
echo B. Si ces logs n'apparaissent PAS, le serveur n'a pas redémarre:
echo    - Arretez le serveur (Ctrl+C)
echo    - Redemarrez avec: npm start ou node server.js
echo.
echo C. Si les logs apparaissent mais erreur 403 persiste:
echo    - Probleme de cache navigateur
echo    - Ou token JWT expire
echo.
pause
