@echo off
echo ========================================
echo    TEST CREATION DIRECTEUR GENERAL
echo ========================================
echo.
echo PROBLEME IDENTIFIE:
echo - Erreur 400 lors creation utilisateur DIRECTEUR_GENERAL
echo - Valeur "GENERALE" frontend != "GENERAL" backend
echo.
echo CORRECTION APPLIQUEE:
echo - CreateUserDialog.tsx: GENERALE --^> GENERAL
echo - EditUserDialog.tsx: GENERALE --^> GENERAL
echo - Validation directorate obligatoire maintenue
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo Test de creation directeur general...
node src/scripts/test-creation-directeur-general.js

echo.
echo ========================================
echo PROCHAINES ETAPES:
echo 1. Tester via interface frontend
echo 2. Selectionner "Direction Generale" 
echo 3. Verifier creation sans erreur 400
echo ========================================
echo.
pause
