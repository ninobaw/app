@echo off
echo ========================================
echo    Test Connectivite Backend
echo ========================================
echo.

set TARGET_IP=10.20.14.130
set BACKEND_PORT=5000

echo Test de l'API Backend: http://%TARGET_IP%:%BACKEND_PORT%
echo.

echo Test 1: Ping du serveur...
ping -n 2 %TARGET_IP%
if %errorlevel%==0 (
    echo [OK] Serveur accessible
) else (
    echo [ERREUR] Serveur non accessible
    goto :end
)

echo.
echo Test 2: Test du port %BACKEND_PORT%...
powershell -Command "try { $result = Test-NetConnection -ComputerName %TARGET_IP% -Port %BACKEND_PORT% -WarningAction SilentlyContinue; if ($result.TcpTestSucceeded) { Write-Host '[OK] Port %BACKEND_PORT% accessible' -ForegroundColor Green } else { Write-Host '[ERREUR] Port %BACKEND_PORT% ferme' -ForegroundColor Red } } catch { Write-Host '[ERREUR] Test de port echoue' -ForegroundColor Red }"

echo.
echo Test 3: Test HTTP de l'API...
echo Tentative de connexion a http://%TARGET_IP%:%BACKEND_PORT%/

REM Test avec curl si disponible
where curl >nul 2>&1
if %errorlevel%==0 (
    echo Test avec curl...
    curl -s -m 10 http://%TARGET_IP%:%BACKEND_PORT%/ 2>nul
    if %errorlevel%==0 (
        echo.
        echo [OK] API Backend repond
    ) else (
        echo [ERREUR] API Backend ne repond pas
    )
) else (
    echo curl non disponible, test avec PowerShell...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%TARGET_IP%:%BACKEND_PORT%/' -TimeoutSec 10 -ErrorAction Stop; Write-Host '[OK] API Backend repond (Status: ' $response.StatusCode ')' -ForegroundColor Green; Write-Host 'Reponse:' $response.Content } catch { Write-Host '[ERREUR] API Backend ne repond pas:' $_.Exception.Message -ForegroundColor Red }"
)

echo.
echo Test 4: Test de l'endpoint de login...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%TARGET_IP%:%BACKEND_PORT%/api/auth/login' -Method POST -ContentType 'application/json' -Body '{\"email\":\"test\",\"password\":\"test\"}' -TimeoutSec 10 -ErrorAction Stop; Write-Host '[OK] Endpoint login accessible (Status: ' $response.StatusCode ')' -ForegroundColor Green } catch { if ($_.Exception.Response.StatusCode -eq 400) { Write-Host '[OK] Endpoint login accessible (erreur 400 attendue pour mauvais identifiants)' -ForegroundColor Green } else { Write-Host '[ERREUR] Endpoint login non accessible:' $_.Exception.Message -ForegroundColor Red } }"

echo.
echo ========================================
echo    Resume du Test
echo ========================================
echo.
echo Si tous les tests passent:
echo - Le backend est accessible depuis le reseau
echo - Le probleme vient peut-etre du frontend ou du navigateur
echo.
echo Si les tests echouent:
echo 1. Verifiez que le backend est demarre: start-backend-network.bat
echo 2. Verifiez le pare-feu Windows
echo 3. Verifiez la configuration reseau
echo.

:end
echo Appuyez sur une touche pour continuer...
pause >nul
