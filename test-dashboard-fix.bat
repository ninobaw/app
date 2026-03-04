@echo off
title Test Dashboard Fix
color 0A

@echo off
echo ========================================
echo    TEST CORRECTION DASHBOARD SUPERVISEUR
echo ========================================
echo.
echo Ce script va tester la correction specifique
echo de l'API dashboard superviseur (req.user._id).
echo.
echo CORRECTION APPLIQUEE:
echo - req.user.id --^> req.user._id dans supervisorRoutes.js
echo - Compatibilite avec le middleware d'authentification
echo.
echo IMPORTANT: Le serveur backend doit etre demarre
echo sur le port 5000 avant d'executer ce test.
echo.
echo 1. Connectez-vous avec un compte SUPER_ADMIN
echo 2. Cliquez sur "Dashboard" dans le menu
echo 3. Vous devriez voir le vrai dashboard avec les statistiques
echo.
echo 🌐 Pour l'accès réseau:
echo - Utilisez setup-network.bat pour configurer l'accès réseau
echo - URL réseau: http://10.20.14.130:8080
echo.
pause
