@echo off
echo ========================================
echo    Diagnostic Complet Probleme Reseau
echo ========================================
echo.

set TARGET_IP=10.20.14.130
set BACKEND_PORT=5000
set FRONTEND_PORT=8080

echo Configuration testee:
echo - IP: %TARGET_IP%
echo - Backend: http://%TARGET_IP%:%BACKEND_PORT%
echo - Frontend: http://%TARGET_IP%:%FRONTEND_PORT%
echo.

echo ========================================
echo 1. VERIFICATION BACKEND
echo ========================================

echo Test de l'API principale...
curl -s -w "Status: %%{http_code}\n" http://%TARGET_IP%:%BACKEND_PORT%/ 2>nul

echo.
echo Test de l'endpoint login...
curl -s -w "Status: %%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"email\":\"test\",\"password\":\"test\"}" http://%TARGET_IP%:%BACKEND_PORT%/api/auth/login 2>nul

echo.
echo Test des headers CORS...
curl -s -H "Origin: http://%TARGET_IP%:%FRONTEND_PORT%" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://%TARGET_IP%:%BACKEND_PORT%/api/auth/login -v 2>&1 | findstr -i "access-control"

echo.
echo ========================================
echo 2. VERIFICATION CONFIGURATION
echo ========================================

echo Verification .env...
findstr "VITE_API_BASE_URL" .env 2>nul || echo Variable VITE_API_BASE_URL non trouvee

echo.
echo Verification server.js...
findstr "HOST = '0.0.0.0'" backend\src\server.js >nul && echo [OK] Backend ecoute sur toutes interfaces || echo [ATTENTION] Backend peut ne pas ecouter sur toutes interfaces

echo.
echo Verification des processus...
netstat -an | findstr ":%BACKEND_PORT%" && echo [OK] Backend en ecoute || echo [ERREUR] Backend non demarre

netstat -an | findstr ":%FRONTEND_PORT%" && echo [OK] Frontend en ecoute || echo [ERREUR] Frontend non demarre

echo.
echo ========================================
echo 3. VERIFICATION PARE-FEU
echo ========================================

echo Verification des regles pare-feu...
netsh advfirewall firewall show rule name="SGDO Backend" >nul 2>&1 && echo [OK] Regle Backend existe || echo [INFO] Regle Backend manquante

netsh advfirewall firewall show rule name="SGDO Frontend" >nul 2>&1 && echo [OK] Regle Frontend existe || echo [INFO] Regle Frontend manquante

echo.
echo ========================================
echo 4. TESTS DE CONNECTIVITE
echo ========================================

echo Test ping...
ping -n 2 %TARGET_IP% >nul && echo [OK] IP accessible || echo [ERREUR] IP non accessible

echo.
echo Test ports avec PowerShell...
powershell -Command "Test-NetConnection -ComputerName %TARGET_IP% -Port %BACKEND_PORT% -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded | ForEach-Object { if ($_.TcpTestSucceeded) { Write-Host '[OK] Port %BACKEND_PORT% accessible' } else { Write-Host '[ERREUR] Port %BACKEND_PORT% ferme' } }"

powershell -Command "Test-NetConnection -ComputerName %TARGET_IP% -Port %FRONTEND_PORT% -WarningAction SilentlyContinue | Select-Object TcpTestSucceeded | ForEach-Object { if ($_.TcpTestSucceeded) { Write-Host '[OK] Port %FRONTEND_PORT% accessible' } else { Write-Host '[ERREUR] Port %FRONTEND_PORT% ferme' } }"

echo.
echo ========================================
echo 5. SOLUTIONS RECOMMANDEES
echo ========================================
echo.

echo Si le backend repond mais le frontend ne peut pas se connecter:
echo.
echo 1. PROBLEME DE CACHE NAVIGATEUR:
echo    - Ouvrir les outils developpeur (F12)
echo    - Onglet Network, cocher "Disable cache"
echo    - Actualiser avec Ctrl+F5
echo.
echo 2. PROBLEME CORS:
echo    - Verifier les logs du backend pour erreurs CORS
echo    - S'assurer que l'origine http://%TARGET_IP%:%FRONTEND_PORT% est autorisee
echo.
echo 3. PROBLEME DE CERTIFICAT/HTTPS:
echo    - Utiliser HTTP au lieu de HTTPS
echo    - Accepter les certificats non securises si necessaire
echo.
echo 4. REDEMARRAGE COMPLET:
echo    - Arreter backend et frontend (Ctrl+C)
echo    - Executer: start-backend-network.bat
echo    - Executer: restart-network-frontend.bat
echo.
echo 5. CONFIGURATION PARE-FEU:
echo    - Executer en tant qu'administrateur:
echo    - netsh advfirewall firewall add rule name="SGDO Backend" dir=in action=allow protocol=TCP localport=%BACKEND_PORT%
echo    - netsh advfirewall firewall add rule name="SGDO Frontend" dir=in action=allow protocol=TCP localport=%FRONTEND_PORT%
echo.

echo ========================================
echo    Diagnostic termine
echo ========================================
echo.
pause
