@echo off
echo ========================================
echo    Redemarrage Frontend Mode Reseau
echo ========================================
echo.

echo Arret des processus Vite existants...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Verification de la configuration .env...
findstr "VITE_API_BASE_URL=http://10.20.14.130:5000" .env >nul
if %errorlevel%==0 (
    echo [OK] Configuration API correcte: http://10.20.14.130:5000
) else (
    echo [ERREUR] Configuration API incorrecte
    echo Modification du fichier .env...
    
    REM Sauvegarder l'ancien .env
    copy .env .env.backup >nul
    
    REM Remplacer localhost par l'IP réseau
    powershell -Command "(Get-Content .env) -replace 'VITE_API_BASE_URL=http://localhost:5000', 'VITE_API_BASE_URL=http://10.20.14.130:5000' | Set-Content .env"
    
    echo [OK] Configuration mise a jour
)

echo.
echo Nettoyage du cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo [OK] Cache Vite supprime
)

echo.
echo Variables d'environnement:
set | findstr VITE_ 2>nul || echo Aucune variable VITE_ trouvee

echo.
echo Demarrage du serveur frontend avec configuration reseau...
echo URL d'acces: http://10.20.14.130:8080
echo.

REM Forcer le rechargement des variables d'environnement
npm run dev

echo.
echo Si le probleme persiste:
echo 1. Verifiez que le backend est demarre sur port 5000
echo 2. Testez l'URL: http://10.20.14.130:5000
echo 3. Videz le cache du navigateur (Ctrl+F5)
echo.
pause
