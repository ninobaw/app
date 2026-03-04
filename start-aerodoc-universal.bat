@echo off
echo ========================================
echo    SGDO - Demarrage Universel
echo ========================================
echo.

echo Configuration automatique pour tous les reseaux...

REM Detecter l'adresse IP locale
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found_ip
    )
)

:found_ip
echo IP locale detectee: %LOCAL_IP%

REM Demarrer le backend
echo.
echo Demarrage du backend...
start "SGDO Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM Attendre 3 secondes
timeout /t 3 /nobreak >nul

REM Demarrer le frontend
echo.
echo Demarrage du frontend...
start "SGDO Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo   SGDO demarre avec succes!
echo ========================================
echo.
echo Acces local:      http://localhost:8080
echo Acces reseau:     http://%LOCAL_IP%:8080
echo Backend API:      http://localhost:5000
echo.
echo Les serveurs demarrent dans des fenetres separees.
echo Fermez ces fenetres pour arreter les serveurs.
echo.
pause
