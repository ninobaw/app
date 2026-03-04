@echo off
echo ========================================
echo    SGDO - Debug Workflow Test
echo ========================================
echo.

echo Verification du backend...
echo.

REM Tester si le backend est accessible
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend non accessible sur http://localhost:5000
    echo.
    echo SOLUTIONS:
    echo 1. Demarrer le backend: cd backend ^&^& npm start
    echo 2. Verifier que le port 5000 est libre
    echo 3. Verifier la configuration du serveur
    echo.
    echo Voulez-vous demarrer le backend maintenant ? (o/n)
    set /p choice=
    if /i "%choice%"=="o" (
        echo Demarrage du backend...
        start "SGDO Backend" cmd /k "cd /d backend && npm start"
        echo Attente du demarrage...
        timeout /t 10 /nobreak >nul
    ) else (
        echo Test annule.
        pause
        exit /b 1
    )
) else (
    echo ✅ Backend accessible
)

echo.
echo Test de connexion simple...
node test-auth.js

echo.
echo Si la connexion fonctionne, lancez le test complet:
echo node test-enhanced-workflow.js
echo.
pause
