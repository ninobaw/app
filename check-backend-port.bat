@echo off
echo ========================================
echo VERIFICATION DU PORT BACKEND
echo ========================================

echo.
echo 1. Test du port 5000...
curl -s "http://10.20.14.148:5000/api/users" -H "Content-Type: application/json"
if %errorlevel% == 0 (
    echo ✅ Port 5000 fonctionne
) else (
    echo ❌ Port 5000 ne répond pas
)

echo.
echo 2. Test du port 3001...
curl -s "http://localhost:3001/api/users" -H "Content-Type: application/json"
if %errorlevel% == 0 (
    echo ✅ Port 3001 fonctionne aussi
) else (
    echo ❌ Port 3001 ne répond pas
)

echo.
echo 3. Configuration actuelle :
echo VITE_API_BASE_URL=http://10.20.14.148:5000
echo.

echo ========================================
echo PROBLEMES IDENTIFIES ET CORRIGES :
echo ========================================
echo ✅ Port 5000 maintenu (fonctionne déjà)
echo ✅ parentCorrespondanceId: "" → undefined (erreur MongoDB)
echo ✅ Gestion d'erreur upload améliorée
echo.
echo Le problème principal était l'erreur de validation MongoDB,
echo pas le port. Maintenant ça devrait fonctionner !

echo.
echo TESTS A EFFECTUER :
echo - Réinitialisation mot de passe (devrait marcher)
echo - Création correspondance (erreur MongoDB corrigée)
echo - Upload fichier (gestion d'erreur améliorée)

pause
