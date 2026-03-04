@echo off
echo ========================================
echo CORRECTION PROBLEME ROLE UTILISATEUR
echo ========================================

echo.
echo ✅ PROBLEME IDENTIFIE :
echo Changement de role utilisateur puis tentative de reinitialisation
echo → Probleme de cache/session

echo.
echo 🔧 SOLUTIONS A TESTER :
echo ========================================

echo.
echo 1. DECONNEXION/RECONNEXION :
echo - Se deconnecter completement de l'application
echo - Vider le cache navigateur (Ctrl+Shift+Del)
echo - Se reconnecter avec le compte SUPER_ADMIN

echo.
echo 2. VIDER LE CACHE NAVIGATEUR :
echo - F12 → Application → Storage
echo - Clear storage (tout supprimer)
echo - Ou Ctrl+Shift+Del → Tout supprimer

echo.
echo 3. VERIFIER LE TOKEN JWT :
echo - F12 → Application → Local Storage
echo - Verifier que 'token' existe
echo - Verifier que 'user' contient le bon role

echo.
echo 4. REDEMARRER LE SERVEUR BACKEND :
echo - Ctrl+C dans le terminal backend
echo - npm start (redemarrer)

echo.
echo 5. VERIFIER EN BASE DE DONNEES :
echo - Ouvrir MongoDB Compass
echo - Collection 'users'
echo - Verifier que le role est bien mis a jour

echo.
echo ========================================
echo PROCEDURE RECOMMANDEE :
echo ========================================
echo 1. Deconnexion complete
echo 2. Vider cache navigateur
echo 3. Redemarrer serveur backend
echo 4. Reconnexion
echo 5. Tenter la reinitialisation

echo.
echo ⚠️  IMPORTANT :
echo Apres changement de role, toujours se deconnecter/reconnecter
echo pour que les nouvelles permissions prennent effet !

pause
