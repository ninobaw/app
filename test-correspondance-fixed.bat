@echo off
echo ========================================
echo TEST CORRESPONDANCE APRES CORRECTIONS
echo ========================================

echo.
echo ✅ CORRECTIONS APPLIQUEES :
echo - Port API corrigé : 5000 → 3001
echo - parentCorrespondanceId : "" → undefined
echo - Gestion d'erreur upload améliorée
echo - Messages de feedback ajoutés

echo.
echo 1. Verification de la nouvelle configuration API...
curl -s "http://localhost:3001/api/correspondances/test-simple-no-auth"

echo.
echo.
echo 2. TESTS A EFFECTUER :
echo ========================================
echo A. Redémarrer le frontend (Ctrl+C puis npm run dev)
echo B. Se connecter à l'interface
echo C. Ouvrir le dialogue de création de correspondance
echo D. Vérifier que les utilisateurs apparaissent dans la liste
echo E. Créer une correspondance SANS fichier d'abord
echo F. Puis créer une correspondance AVEC fichier

echo.
echo 3. VERIFICATION DANS LA CONSOLE :
echo ========================================
echo - F12 → Console
echo - Chercher : "CreateCorrespondanceDialog - users count:"
echo - Doit afficher le nombre d'utilisateurs (ex: 9)
echo - Chercher : "API_BASE_URL (universal): http://localhost:3001"

echo.
echo 4. SI LES UTILISATEURS N'APPARAISSENT TOUJOURS PAS :
echo ========================================
echo - Vérifier les logs de la console
echo - Vérifier que le backend est démarré sur port 3001
echo - Vérifier l'authentification (token valide)
echo - Redémarrer complètement frontend et backend

echo.
echo ========================================
echo COMMANDES DE REDEMARRAGE :
echo ========================================
echo Frontend : Ctrl+C puis npm run dev
echo Backend : cd backend && npm start
echo ========================================

pause
