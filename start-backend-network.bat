@echo off
echo ========================================
echo    Demarrage Backend Mode Reseau
echo ========================================
echo.

set TARGET_IP=10.20.14.130
set BACKEND_PORT=5000

echo Configuration backend:
echo - IP Serveur: %TARGET_IP%
echo - Port Backend: %BACKEND_PORT%
echo - URL API: http://%TARGET_IP%:%BACKEND_PORT%
echo.

echo Verification de l'etat actuel...

REM Verifier si le port est deja utilise
netstat -an | findstr ":%BACKEND_PORT%" >nul
if %errorlevel%==0 (
    echo [INFO] Port %BACKEND_PORT% deja en cours d'utilisation
    echo Arret des processus existants...
    
    REM Tuer les processus Node.js existants
    taskkill /f /im node.exe 2>nul
    timeout /t 3 /nobreak >nul
    
    echo [OK] Processus arretes
) else (
    echo [INFO] Port %BACKEND_PORT% libre
)

echo.
echo Test de connectivite reseau...

REM Test ping de l'IP
ping -n 2 %TARGET_IP% >nul
if %errorlevel%==0 (
    echo [OK] IP %TARGET_IP% accessible
) else (
    echo [ERREUR] IP %TARGET_IP% non accessible
    echo Verifiez la configuration reseau
)

echo.
echo Verification du dossier backend...
if exist "backend" (
    echo [OK] Dossier backend trouve
    cd backend
    
    echo Verification des dependances...
    if exist "node_modules" (
        echo [OK] Dependencies installees
    ) else (
        echo [INFO] Installation des dependances...
        npm install
    )
    
    echo.
    echo Verification de la configuration backend...
    
    REM Verifier que server.js ecoute sur 0.0.0.0
    findstr "HOST = '0.0.0.0'" src\server.js >nul
    if %errorlevel%==0 (
        echo [OK] Backend configure pour ecouter sur toutes les interfaces
    ) else (
        echo [ATTENTION] Verifiez que HOST = '0.0.0.0' dans server.js
    )
    
    echo.
    echo Demarrage du serveur backend...
    echo URL d'acces: http://%TARGET_IP%:%BACKEND_PORT%
    echo Documentation: http://%TARGET_IP%:%BACKEND_PORT%/api-docs
    echo.
    echo Appuyez sur Ctrl+C pour arreter le serveur
    echo.
    
    REM Demarrer le serveur
    npm start
    
) else (
    echo [ERREUR] Dossier backend non trouve
    echo Verifiez que vous etes dans le bon repertoire
    pause
    exit /b 1
)

echo.
echo Backend arrete. Appuyez sur une touche pour fermer...
pause >nul
