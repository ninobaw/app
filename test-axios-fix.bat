@echo off
echo ========================================
echo    Test Correction Axios
echo ========================================
echo.

echo PROBLEME IDENTIFIE:
echo - api.ts detecte correctement: http://10.20.14.130:5000
echo - axios.ts utilisait encore: import.meta.env.VITE_API_BASE_URL
echo - Resultat: localhost:5000 dans les requetes
echo.

echo CORRECTION APPLIQUEE:
echo - axios.ts utilise maintenant: import { API_BASE_URL } from '@/config/api'
echo - Logs ajoutes pour debug complet
echo.

echo REDEMARRAGE NECESSAIRE:
echo Le frontend doit etre redémarre pour prendre en compte les changements
echo.

echo Arret du frontend...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Suppression du cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache Vite supprime
)

echo.
echo Redemarrage du frontend...
echo ATTENTION: Surveillez les nouveaux logs:
echo - 🔧 [Axios] Configuration avec baseURL: http://10.20.14.130:5000
echo - 🔧 [Axios] Request interceptor - full URL: http://10.20.14.130:5000/api/auth/login
echo.

start "SGDO Frontend Fixed" cmd /k "echo Frontend avec correction Axios... && npm run dev"

echo.
echo ========================================
echo    Instructions pour le test
echo ========================================
echo.
echo 1. Attendre que le frontend demarre
echo 2. Aller sur: http://10.20.14.130:8080
echo 3. Ouvrir F12 (Console)
echo 4. Tenter une connexion
echo 5. Verifier les nouveaux logs Axios
echo.
echo LOGS ATTENDUS (dans l'ordre):
echo 1. 🔧 [API Config] FORCE - Utilisation IP réseau détectée
echo 2. 🔧 [Axios] Configuration avec baseURL: http://10.20.14.130:5000
echo 3. 🔧 [Axios] Request interceptor - full URL: http://10.20.14.130:5000/api/auth/login
echo 4. AuthContext: Login successful
echo.
echo Si vous voyez encore "localhost:5000" dans les logs:
echo - Vider completement le cache navigateur
echo - Tester en navigation privee
echo.
pause
