@echo off
title Test Tags Correspondances - Base de Données
color 0A

echo.
echo ========================================
echo   TEST TAGS CORRESPONDANCES - BDD
echo ========================================
echo.

echo 🔍 VÉRIFICATIONS EFFECTUÉES:
echo 1. Tags disponibles dans la base
echo 2. Correspondances avec tags existantes
echo 3. Statistiques d'utilisation des tags
echo 4. Intégrité des données (tags valides)
echo 5. Test de recherche par tags
echo.

echo 🚀 Exécution du script de test...
echo.

cd /d "%~dp0"
node backend\src\scripts\test-correspondance-tags.js

echo.
echo ✨ Test terminé !
echo.
echo 📋 PROCHAINES ÉTAPES SI PROBLÈME:
echo - Si aucun tag: créer des tags dans Paramètres ^> Tags
echo - Si aucune correspondance avec tags: créer une correspondance
echo - Si tags invalides: nettoyer les données ou recréer les tags
echo.
pause
