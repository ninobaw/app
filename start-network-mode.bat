@echo off
echo ========================================
echo    SGDO - Demarrage Mode Reseau
echo ========================================
echo.

echo Configuration actuelle:
echo - IP Serveur: 10.20.14.130
echo - Port Backend: 5000
echo - Port Frontend: 8080
echo.

echo URLs d'acces:
echo - Backend API: http://10.20.14.130:5000
echo - Frontend: http://10.20.14.130:8080
echo.

echo Verification de la configuration...

REM Verifier que le fichier .env contient la bonne IP
findstr "VITE_API_BASE_URL=http://10.20.14.130:5000" .env >nul
if %errorlevel%==0 (
    echo [OK] Configuration API correcte
) else (
    echo [ERREUR] Configuration API incorrecte dans .env
    echo Veuillez verifier que VITE_API_BASE_URL=http://10.20.14.130:5000
    pause
    exit /b 1
)

findstr "FRONTEND_BASE_URL=http://10.20.14.130:8080" .env >nul
if %errorlevel%==0 (
    echo [OK] Configuration Frontend correcte
) else (
    echo [ERREUR] Configuration Frontend incorrecte dans .env
    echo Veuillez verifier que FRONTEND_BASE_URL=http://10.20.14.130:8080
    pause
    exit /b 1
)

echo.
echo Demarrage des serveurs...
echo.

REM Demarrer le backend
echo Demarrage du backend sur http://10.20.14.130:5000...
start "SGDO Backend" cmd /k "cd /d backend && npm start"

REM Attendre un peu pour que le backend demarre
timeout /t 3 /nobreak >nul

REM Demarrer le frontend
echo Demarrage du frontend sur http://10.20.14.130:8080...
start "SGDO Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo    Serveurs demarres !
echo ========================================
echo.
echo Acces local:
echo - http://localhost:8080
echo - http://127.0.0.1:8080
echo.
echo Acces reseau:
echo - http://10.20.14.130:8080
echo.
echo Instructions pour les utilisateurs du reseau:
echo 1. Ouvrir un navigateur web
echo 2. Aller a l'adresse: http://10.20.14.130:8080
echo 3. Se connecter avec leurs identifiants
echo.
echo Configuration pare-feu requise:
echo - Autoriser port 5000 (Backend API)
echo - Autoriser port 8080 (Frontend Web)
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
