@echo off
echo ========================================
echo TEST DES TAGS DANS LE DIALOGUE
echo ========================================

echo.
echo 1. Verification de l'API des tags...
curl -X GET "http://localhost:3001/api/tags" -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN_HERE"

echo.
echo.
echo 2. Creation de quelques tags de test...
echo Vous devez d'abord vous connecter et obtenir un token

echo.
echo 3. Test de creation de correspondance avec tags...
echo Ouvrez l'interface et testez :
echo - Creer une correspondance
echo - Ajouter des tags
echo - Verifier que les tags apparaissent
echo - Sauvegarder et verifier en base

echo.
echo ========================================
echo POINTS A VERIFIER :
echo ========================================
echo - La section Tags apparait dans le dialogue
echo - Les tags existants sont charges
echo - On peut ajouter/supprimer des tags
echo - Les tags sont sauvegardes avec la correspondance
echo - Les couleurs des tags s'affichent correctement
echo ========================================

pause
