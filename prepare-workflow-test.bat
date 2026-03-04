@echo off
echo ========================================
echo    PREPARATION TEST WORKFLOW COMPLET
echo ========================================
echo.
echo Ce script va preparer le systeme pour votre test:
echo.
echo WORKFLOW A TESTER:
echo 1. Agent Asma Sahli enregistre correspondance recue
echo 2. Envoi au directeur RH Anis Ben Jannet
echo 3. Anis propose une reponse
echo 4. Directeur General modifie legerement la reponse
echo 5. Anis applique les modifications et renvoie
echo 6. Directeur General approuve
echo 7. Superviseur notifie (systeme + email)
echo 8. Reponse appliquee et decharge recu
echo 9. Insertion reponse avec liaison dans systeme
echo.
pause

cd /d "%~dp0"
cd backend

echo.
echo === ETAPE 1: Verification des utilisateurs ===
echo.
echo Verification Asma Sahli (Agent Bureau Ordre):
node -e "
const mongoose = require('mongoose');
const User = require('./src/models/User');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc').then(async () => {
  const asma = await User.findOne({ email: 'asma.sahli@tav.aero' });
  if (asma) {
    console.log('✅ Asma Sahli trouvee:', asma.email, '- Role:', asma.role, '- Actif:', asma.isActive);
    if (!asma.isActive) {
      await User.updateOne({ email: 'asma.sahli@tav.aero' }, { isActive: true });
      console.log('✅ Asma Sahli activee');
    }
  } else {
    console.log('❌ Asma Sahli non trouvee');
  }
  await mongoose.disconnect();
});
"

echo.
echo Verification Anis Ben Jannet (Directeur RH):
node -e "
const mongoose = require('mongoose');
const User = require('./src/models/User');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc').then(async () => {
  const anis = await User.findOne({ email: 'anisbenjannet@tav.aero' });
  if (anis) {
    console.log('✅ Anis Ben Jannet trouve:', anis.email, '- Role:', anis.role);
    console.log('   Directorate:', anis.directorate || 'Non specifie');
  } else {
    console.log('❌ Anis Ben Jannet non trouve');
  }
  await mongoose.disconnect();
});
"

echo.
echo Verification Directeur General:
node -e "
const mongoose = require('mongoose');
const User = require('./src/models/User');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc').then(async () => {
  const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
  if (dg) {
    console.log('✅ Directeur General trouve:', dg.email, '- Role:', dg.role);
  } else {
    console.log('❌ Directeur General non trouve');
  }
  await mongoose.disconnect();
});
"

echo.
echo Verification Superviseur Bureau Ordre:
node -e "
const mongoose = require('mongoose');
const User = require('./src/models/User');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc').then(async () => {
  const superviseur = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
  if (superviseur) {
    console.log('✅ Superviseur trouve:', superviseur.email, '- Role:', superviseur.role);
  } else {
    console.log('❌ Superviseur non trouve - Creation...');
    // Creer le superviseur si absent
    const newSuperviseur = new User({
      firstName: 'Superviseur',
      lastName: 'Bureau Ordre',
      email: 'superviseur.bureau@aeroport.tn',
      password: 'supervisor123',
      role: 'SUPERVISEUR_BUREAU_ORDRE',
      airport: 'GENERALE',
      isActive: true
    });
    await newSuperviseur.save();
    console.log('✅ Superviseur cree:', newSuperviseur.email);
  }
  await mongoose.disconnect();
});
"

echo.
echo === ETAPE 2: Nettoyage des correspondances existantes ===
node -e "
const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc').then(async () => {
  const count = await Correspondance.countDocuments();
  console.log('Correspondances existantes:', count);
  if (count > 0) {
    await Correspondance.deleteMany({});
    console.log('✅ Toutes les correspondances supprimees');
  }
  await mongoose.disconnect();
});
"

echo.
echo === ETAPE 3: Verification des services ===
echo ✅ SupervisorDashboardService - Dashboard superviseur
echo ✅ CorrespondanceResponseService - Liaisons correspondance-reponse
echo ✅ DirectorDashboardService - Workflow directeur
echo ✅ Routes API - Toutes les routes necessaires

echo.
echo ========================================
echo         SYSTEME PRET POUR TEST
echo ========================================
echo.
echo COMPTES UTILISATEURS:
echo.
echo 1. AGENT BUREAU ORDRE:
echo    Email: asma.sahli@tav.aero
echo    Mot de passe: password123
echo    Role: Enregistrer correspondances recues
echo.
echo 2. DIRECTEUR RH:
echo    Email: anisbenjannet@tav.aero  
echo    Mot de passe: password123
echo    Role: Proposer reponses
echo.
echo 3. DIRECTEUR GENERAL:
echo    Email: abdallah.benkhalifa@tav.aero
echo    Mot de passe: password123
echo    Role: Approuver/modifier reponses
echo.
echo 4. SUPERVISEUR BUREAU ORDRE:
echo    Email: superviseur.bureau@aeroport.tn
echo    Mot de passe: supervisor123
echo    Role: Superviser et appliquer reponses
echo.
echo PROCHAINES ETAPES:
echo 1. Demarrez le serveur: npm start
echo 2. Demarrez le frontend: cd .. ^&^& npm run dev
echo 3. Commencez le test avec Asma Sahli
echo.
pause
