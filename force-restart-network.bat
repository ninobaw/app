@echo off
echo ========================================
echo    REDEMARRAGE FORCE MODE RESEAU
echo ========================================
echo.

set TARGET_IP=10.20.14.130

echo ETAPE 1: Arret de tous les processus...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
taskkill /f /im vite.cmd 2>nul
timeout /t 3 /nobreak >nul
echo [OK] Processus arretes

echo.
echo ETAPE 2: Suppression de tous les caches...

REM Supprimer cache Vite
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo [OK] Cache Vite supprime
)

if exist ".vite" (
    rmdir /s /q ".vite"
    echo [OK] Cache .vite supprime
)

REM Supprimer cache npm
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo [OK] Cache npm supprime
)

REM Supprimer dist
if exist "dist" (
    rmdir /s /q "dist"
    echo [OK] Dossier dist supprime
)

echo.
echo ETAPE 3: Verification/Correction configuration .env...

REM Forcer la configuration correcte
echo Mise a jour du fichier .env...
powershell -Command "& {
    $content = Get-Content '.env' -Raw -ErrorAction SilentlyContinue;
    if (-not $content) { $content = '' };
    $content = $content -replace 'VITE_API_BASE_URL=.*', 'VITE_API_BASE_URL=http://%TARGET_IP%:5000';
    if ($content -notmatch 'VITE_API_BASE_URL=') {
        $content += \"`nVITE_API_BASE_URL=http://%TARGET_IP%:5000\";
    };
    $content = $content -replace 'FRONTEND_BASE_URL=.*', 'FRONTEND_BASE_URL=http://%TARGET_IP%:8080';
    if ($content -notmatch 'FRONTEND_BASE_URL=') {
        $content += \"`nFRONTEND_BASE_URL=http://%TARGET_IP%:8080\";
    };
    Set-Content '.env' -Value $content;
    Write-Host '[OK] Configuration .env mise a jour';
}"

echo.
echo Configuration actuelle:
findstr "VITE_API_BASE_URL" .env 2>nul || echo VITE_API_BASE_URL non trouve
findstr "FRONTEND_BASE_URL" .env 2>nul || echo FRONTEND_BASE_URL non trouve

echo.
echo ETAPE 4: Demarrage du backend...
start "SGDO Backend" cmd /k "cd /d backend && echo Demarrage backend sur %TARGET_IP%:5000... && npm start"

echo Attente du demarrage backend...
timeout /t 5 /nobreak >nul

echo.
echo ETAPE 5: Test de l'API backend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%TARGET_IP%:5000/' -TimeoutSec 10 -ErrorAction Stop; Write-Host '[OK] Backend accessible:' $response.Content -ForegroundColor Green } catch { Write-Host '[ATTENTION] Backend pas encore pret:' $_.Exception.Message -ForegroundColor Yellow }"

echo.
echo ETAPE 6: Demarrage du frontend avec variables forcees...

REM Definir explicitement les variables d'environnement
set VITE_API_BASE_URL=http://%TARGET_IP%:5000
set FRONTEND_BASE_URL=http://%TARGET_IP%:8080

echo Variables d'environnement definies:
echo VITE_API_BASE_URL=%VITE_API_BASE_URL%
echo FRONTEND_BASE_URL=%FRONTEND_BASE_URL%

echo.
echo Demarrage du serveur frontend...
start "SGDO Frontend" cmd /k "set VITE_API_BASE_URL=http://%TARGET_IP%:5000 && echo Frontend demarre sur %TARGET_IP%:8080... && npm run dev"

echo.
echo ========================================
echo    REDEMARRAGE TERMINE
echo ========================================
echo.
echo URLs d'acces:
echo - Application: http://%TARGET_IP%:8080
echo - API Backend: http://%TARGET_IP%:5000
echo - Documentation: http://%TARGET_IP%:5000/api-docs
echo.
echo INSTRUCTIONS POUR LE CLIENT:
echo 1. Ouvrir un navigateur web
echo 2. Aller a: http://%TARGET_IP%:8080
echo 3. Ouvrir les outils developpeur (F12)
echo 4. Onglet Console - verifier les logs API Config
echo 5. Onglet Network - cocher "Disable cache"
echo 6. Actualiser avec Ctrl+F5
echo.
echo Si le probleme persiste:
echo - Tester en navigation privee (Ctrl+Shift+N)
echo - Vider completement le cache navigateur
echo - Tester avec un autre navigateur
echo.
pause
