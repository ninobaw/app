@echo off
echo ========================================
echo TEST DE CREATION DE CORRESPONDANCE
echo ========================================

echo.
echo 1. Verification des services backend...
curl -X GET "http://localhost:3001/api/correspondances/test-simple-no-auth" -H "Content-Type: application/json"

echo.
echo.
echo 2. Test de creation de correspondance (necessite authentification)...
echo Veuillez vous connecter dans l'interface et tester la creation d'une correspondance

echo.
echo 3. Verification de la base de donnees...
echo Ouvrez MongoDB Compass et verifiez la collection 'correspondances'

echo.
echo ========================================
echo POINTS A VERIFIER :
echo ========================================
echo - Le backend repond correctement (etape 1)
echo - La correspondance est creee dans l'interface
echo - La correspondance apparait dans MongoDB
echo - Les notifications sont envoyees
echo - Les personnes concernees recoivent les emails
echo ========================================

pause
