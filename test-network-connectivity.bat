@echo off
echo ========================================
echo    Test de Connectivite Reseau SGDO
echo ========================================
echo.

set SERVER_IP=10.20.14.130
set BACKEND_PORT=5000
set FRONTEND_PORT=8080

echo Configuration testee:
echo - IP Serveur: %SERVER_IP%
echo - Port Backend: %BACKEND_PORT%
echo - Port Frontend: %FRONTEND_PORT%
echo.

echo Test 1: Ping du serveur...
ping -n 4 %SERVER_IP% >nul
if %errorlevel%==0 (
    echo [OK] Serveur %SERVER_IP% accessible
) else (
    echo [ERREUR] Serveur %SERVER_IP% non accessible
    echo Verifiez la connexion reseau
)

echo.
echo Test 2: Test des ports...

REM Test port backend
echo Test du port backend %BACKEND_PORT%...
netstat -an | findstr ":%BACKEND_PORT%" >nul
if %errorlevel%==0 (
    echo [OK] Port %BACKEND_PORT% en ecoute
) else (
    echo [INFO] Port %BACKEND_PORT% non detecte localement
    echo Verifiez que le backend est demarre
)

REM Test port frontend
echo Test du port frontend %FRONTEND_PORT%...
netstat -an | findstr ":%FRONTEND_PORT%" >nul
if %errorlevel%==0 (
    echo [OK] Port %FRONTEND_PORT% en ecoute
) else (
    echo [INFO] Port %FRONTEND_PORT% non detecte localement
    echo Verifiez que le frontend est demarre
)

echo.
echo Test 3: Configuration pare-feu Windows...
netsh advfirewall firewall show rule name="SGDO Backend" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Regle pare-feu Backend existe
) else (
    echo [INFO] Regle pare-feu Backend non trouvee
    echo Creation de la regle...
    netsh advfirewall firewall add rule name="SGDO Backend" dir=in action=allow protocol=TCP localport=%BACKEND_PORT%
    if %errorlevel%==0 (
        echo [OK] Regle pare-feu Backend creee
    ) else (
        echo [ERREUR] Impossible de creer la regle pare-feu Backend
        echo Executez ce script en tant qu'administrateur
    )
)

netsh advfirewall firewall show rule name="SGDO Frontend" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Regle pare-feu Frontend existe
) else (
    echo [INFO] Regle pare-feu Frontend non trouvee
    echo Creation de la regle...
    netsh advfirewall firewall add rule name="SGDO Frontend" dir=in action=allow protocol=TCP localport=%FRONTEND_PORT%
    if %errorlevel%==0 (
        echo [OK] Regle pare-feu Frontend creee
    ) else (
        echo [ERREUR] Impossible de creer la regle pare-feu Frontend
        echo Executez ce script en tant qu'administrateur
    )
)

echo.
echo Test 4: Test HTTP (si serveurs demarres)...

REM Test avec curl si disponible
where curl >nul 2>&1
if %errorlevel%==0 (
    echo Test de l'API Backend...
    curl -s -o nul -w "Status: %%{http_code}" http://%SERVER_IP%:%BACKEND_PORT%/ 2>nul
    echo.
    
    echo Test du Frontend...
    curl -s -o nul -w "Status: %%{http_code}" http://%SERVER_IP%:%FRONTEND_PORT%/ 2>nul
    echo.
) else (
    echo [INFO] curl non disponible, tests HTTP ignores
)

echo.
echo ========================================
echo    Resume du Test
echo ========================================
echo.
echo URLs a tester dans un navigateur:
echo - Frontend: http://%SERVER_IP%:%FRONTEND_PORT%
echo - API Backend: http://%SERVER_IP%:%BACKEND_PORT%
echo.
echo Si les tests echouent:
echo 1. Verifiez que les serveurs sont demarres
echo 2. Executez ce script en tant qu'administrateur
echo 3. Verifiez la configuration reseau
echo 4. Testez depuis un autre poste du reseau
echo.
echo Appuyez sur une touche pour continuer...
pause >nul
