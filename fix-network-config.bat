@echo off
echo ========================================
echo    Correction Configuration Reseau
echo ========================================
echo.

set TARGET_IP=10.20.14.130

echo Configuration cible:
echo - IP Serveur: %TARGET_IP%
echo - API Backend: http://%TARGET_IP%:5000
echo - Frontend: http://%TARGET_IP%:8080
echo.

echo Verification du fichier .env...

REM Sauvegarder l'ancien .env
copy .env .env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% >nul 2>&1

echo Correction des URLs dans .env...

REM Utiliser PowerShell pour remplacer les URLs
powershell -Command "& {
    $content = Get-Content '.env' -Raw;
    $content = $content -replace 'VITE_API_BASE_URL=http://localhost:5000', 'VITE_API_BASE_URL=http://%TARGET_IP%:5000';
    $content = $content -replace 'FRONTEND_BASE_URL=http://localhost:8080', 'FRONTEND_BASE_URL=http://%TARGET_IP%:8080';
    $content = $content -replace 'VITE_API_BASE_URL=http://127\.0\.0\.1:5000', 'VITE_API_BASE_URL=http://%TARGET_IP%:5000';
    $content = $content -replace 'FRONTEND_BASE_URL=http://127\.0\.0\.1:8080', 'FRONTEND_BASE_URL=http://%TARGET_IP%:8080';
    Set-Content '.env' -Value $content;
    Write-Host '[OK] Configuration mise a jour';
}"

echo.
echo Verification de la nouvelle configuration:
findstr "VITE_API_BASE_URL" .env
findstr "FRONTEND_BASE_URL" .env

echo.
echo Suppression du cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo [OK] Cache Vite supprime
)

if exist ".vite" (
    rmdir /s /q ".vite"
    echo [OK] Cache .vite supprime
)

echo.
echo ========================================
echo    Configuration corrigee !
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Redemarrer le serveur frontend: npm run dev
echo 2. Redemarrer le serveur backend: cd backend && npm start
echo 3. Tester l'acces: http://%TARGET_IP%:8080
echo.
echo Variables corrigees:
echo - VITE_API_BASE_URL=http://%TARGET_IP%:5000
echo - FRONTEND_BASE_URL=http://%TARGET_IP%:8080
echo.
pause
