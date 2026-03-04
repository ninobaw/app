@echo off
title EMERGENCY DEBUG - User Creation 500 Error
color 0C

echo.
echo ==========================================
echo   🚨 EMERGENCY DEBUG - USER CREATION 500
echo ==========================================
echo.

echo 🔍 L'erreur 500 persiste ! Diagnostic d'urgence...
echo.

echo 📋 ETAPE 1: Verification de la structure des fichiers...
cd /d "%~dp0\backend"

echo.
echo 🔍 Contenu de userRoutes.js (lignes critiques):
findstr /n "POST.*users" src/routes/userRoutes.js
findstr /n "directorate" src/routes/userRoutes.js
findstr /n "managedDepartments" src/routes/userRoutes.js

echo.
echo 🔍 Verification du modele User.js:
findstr /n "directorate.*required" src/models/User.js

echo.
echo 📋 ETAPE 2: Test de creation directe en base...
echo Execution du script de diagnostic...
node src/scripts/debug-user-creation.js

echo.
echo 📋 ETAPE 3: Test de la route API directement...
echo Creation d'un test API simple...

echo const mongoose = require('mongoose'); > test-api.js
echo const User = require('./src/models/User'); >> test-api.js
echo const bcrypt = require('bcryptjs'); >> test-api.js
echo const { v4: uuidv4 } = require('uuid'); >> test-api.js
echo. >> test-api.js
echo async function testAPI() { >> test-api.js
echo   try { >> test-api.js
echo     await mongoose.connect('mongodb://localhost:27017/aerodoc'); >> test-api.js
echo     console.log('✅ MongoDB connecte'); >> test-api.js
echo. >> test-api.js
echo     // Test utilisateur simple >> test-api.js
echo     const userData = { >> test-api.js
echo       _id: uuidv4(), >> test-api.js
echo       email: 'test.emergency@tav.aero', >> test-api.js
echo       firstName: 'Emergency', >> test-api.js
echo       lastName: 'Test', >> test-api.js
echo       password: await bcrypt.hash('password123', 10), >> test-api.js
echo       role: 'AGENT', >> test-api.js
echo       airport: 'ENFIDHA', >> test-api.js
echo       phone: '12345678', >> test-api.js
echo       department: 'Test', >> test-api.js
echo       isActive: true, >> test-api.js
echo       mustChangePassword: true, >> test-api.js
echo       emailNotifications: true, >> test-api.js
echo       smsNotifications: false, >> test-api.js
echo       pushNotifications: true >> test-api.js
echo     }; >> test-api.js
echo. >> test-api.js
echo     await User.deleteOne({ email: userData.email }); >> test-api.js
echo     const user = new User(userData); >> test-api.js
echo     await user.save(); >> test-api.js
echo     console.log('✅ Utilisateur AGENT cree avec succes'); >> test-api.js
echo     await User.deleteOne({ email: userData.email }); >> test-api.js
echo. >> test-api.js
echo   } catch (error) { >> test-api.js
echo     console.error('❌ Erreur:', error.message); >> test-api.js
echo     console.error('Stack:', error.stack); >> test-api.js
echo   } finally { >> test-api.js
echo     await mongoose.disconnect(); >> test-api.js
echo   } >> test-api.js
echo } >> test-api.js
echo testAPI(); >> test-api.js

echo.
echo 🧪 Execution du test API d'urgence...
node test-api.js

echo.
echo 📋 ETAPE 4: Verification des logs backend...
echo.
echo ⚠️ ACTIONS IMMEDIATES:
echo.
echo 1. 👀 REGARDEZ LA CONSOLE DU BACKEND
echo    - Y a-t-il des erreurs visibles ?
echo    - Quel est le message d'erreur exact ?
echo.
echo 2. 🔍 VERIFIEZ LE PAYLOAD ENVOYE
echo    - F12 ^> Network ^> POST /api/users
echo    - Regardez le Request Payload
echo    - Tous les champs sont-ils presents ?
echo.
echo 3. 🧪 TESTEZ AVEC UN UTILISATEUR SIMPLE
echo    - Role: AGENT (pas de directorate requis)
echo    - Champs minimum seulement
echo.
echo 4. 📋 DONNEES DE TEST SIMPLES:
echo    Email: test@tav.aero
echo    Nom: Test
echo    Prenom: User
echo    Role: AGENT
echo    Airport: ENFIDHA
echo    Department: Test
echo    Password: password123
echo.

del test-api.js 2>nul

pause
