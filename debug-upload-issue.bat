@echo off
echo ========================================
echo DEBUG PROBLEME UPLOAD CORRESPONDANCES
echo ========================================

echo.
echo 1. Verification de l'API d'upload...
curl -X GET "http://localhost:3001/api/uploads/test" -H "Content-Type: application/json"

echo.
echo.
echo 2. Verification du dossier uploads...
if exist "backend\uploads\correspondances" (
    echo ✅ Dossier correspondances existe
    dir "backend\uploads\correspondances" /s
) else (
    echo ❌ Dossier correspondances manquant
    echo Creation du dossier...
    mkdir "backend\uploads\correspondances"
    mkdir "backend\uploads\correspondances\ENFIDHA"
    mkdir "backend\uploads\correspondances\MONASTIR"
    mkdir "backend\uploads\correspondances\GENERALE"
)

echo.
echo 3. Verification des permissions...
echo Verifiez que le serveur Node.js a les droits d'ecriture sur le dossier uploads

echo.
echo 4. Test de creation sans fichier...
echo Essayez de creer une correspondance SANS fichier joint

echo.
echo ========================================
echo POINTS A VERIFIER :
echo ========================================
echo - Le serveur backend est demarré
echo - Le dossier uploads existe et est accessible
echo - L'API d'upload fonctionne
echo - Les correspondances se creent sans fichier
echo - Les logs du serveur pour voir les erreurs
echo ========================================

echo.
echo 5. Commandes utiles pour debug :
echo - Ouvrir les DevTools du navigateur (F12)
echo - Onglet Network pour voir les requetes
echo - Onglet Console pour voir les erreurs JS
echo - Logs du serveur backend dans le terminal

pause
