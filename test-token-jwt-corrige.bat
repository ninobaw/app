@echo off
echo ========================================
echo    TEST TOKEN JWT CORRIGE
echo ========================================
echo.
echo PROBLEME IDENTIFIE:
echo - Erreur 401 "Token invalide" au lieu de 403
echo - JWT_SECRET different entre script et serveur
echo - Format de token incompatible
echo.
echo CORRECTION APPLIQUEE:
echo - JWT_SECRET corrige: aerodoc_super_secret_key_2025...
echo - Ajout du champ loginTime dans le token
echo - Duree etendue a 8h comme l'authentification normale
echo.
echo TEST DU TOKEN CORRIGE...
echo.
pause

cd /d "%~dp0"
cd backend

echo Execution du test avec token corrige...
node src/scripts/test-directeur-permissions.js

echo.
echo ========================================
echo RESULTATS ATTENDUS:
echo - Plus d'erreur 401 "Token invalide"
echo - Acces aux correspondances: 200 OK
echo - Correspondances recuperees avec succes
echo.
echo Si ca fonctionne:
echo - Le probleme etait bien le JWT_SECRET
echo - Tester maintenant via l'interface frontend
echo - Executer l'assignation de correspondances
echo ========================================
echo.
pause
