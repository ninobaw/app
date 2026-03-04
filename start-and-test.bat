@echo off
echo ========================================
echo DEMARRAGE ET TEST COMPLET
echo ========================================

echo.
echo 1. Verification si le serveur backend est demarré...
curl -s http://localhost:3001/api/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Serveur backend déjà démarré
) else (
    echo ❌ Serveur backend arrêté
    echo.
    echo Pour démarrer le serveur backend :
    echo cd backend
    echo npm start
    echo.
    echo Puis relancez ce script
    pause
    exit /b 1
)

echo.
echo 2. Test de l'API correspondances...
curl -s "http://localhost:3001/api/correspondances/test-simple-no-auth"

echo.
echo.
echo 3. Test de création de correspondance SANS fichier...
echo Ouvrez l'interface et testez :
echo - Créer une correspondance
echo - NE PAS ajouter de fichier
echo - Remplir seulement le contenu textuel
echo - Sauvegarder

echo.
echo 4. Si ça marche sans fichier, testez AVEC fichier...

echo.
echo ========================================
echo ETAPES DE DEBUG :
echo ========================================
echo 1. Démarrer le backend : cd backend && npm start
echo 2. Vérifier les logs du serveur
echo 3. Tester sans fichier d'abord
echo 4. Puis tester avec fichier
echo 5. Vérifier les DevTools (F12) pour les erreurs
echo ========================================

pause
