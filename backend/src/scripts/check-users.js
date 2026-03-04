const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function checkUsers() {
  try {
    console.log('🔍 Vérification des utilisateurs dans la base de données');
    console.log('====================================================');

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Récupérer tous les utilisateurs
    const users = await User.find({}).select('email role isActive firstName lastName');
    
    console.log(`\n📋 ${users.length} utilisateurs trouvés :`);
    console.log('----------------------------------------');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Actif: ${user.isActive ? 'Oui' : 'Non'}`);
      console.log(`   Nom: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log('   ---');
    });

    // Chercher spécifiquement les SUPER_ADMIN et ADMINISTRATOR
    const admins = users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMINISTRATOR');
    console.log(`\n👑 ${admins.length} administrateurs trouvés :`);
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });

    // Suggestions pour les tests
    console.log('\n💡 Suggestions pour les tests :');
    if (admins.length > 0) {
      console.log(`   Utilisez: ${admins[0].email}`);
      console.log('   Mot de passe probable: password123');
    } else {
      console.log('   Aucun administrateur trouvé !');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
checkUsers();
