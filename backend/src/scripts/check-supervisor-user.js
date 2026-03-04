const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function checkSupervisorUser() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un utilisateur superviseur existe
    console.log('\n📋 Vérification des utilisateurs superviseurs...');
    const supervisors = await User.find({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
    console.log(`Nombre de superviseurs trouvés: ${supervisors.length}`);
    
    if (supervisors.length === 0) {
      console.log('❌ Aucun superviseur trouvé. Création d\'un superviseur de test...');
      
      const testSupervisor = new User({
        firstName: 'Superviseur',
        lastName: 'Bureau Ordre',
        email: 'superviseur.bureau@tav.aero',
        password: 'supervisor123',
        role: 'SUPERVISEUR_BUREAU_ORDRE',
        airport: 'GENERALE',
        isActive: true
      });
      
      await testSupervisor.save();
      console.log('✅ Superviseur de test créé:', testSupervisor.email);
      console.log('📧 Email:', testSupervisor.email);
      console.log('🔑 Mot de passe: supervisor123');
      console.log('🏢 Aéroport:', testSupervisor.airport);
      console.log('👤 Rôle:', testSupervisor.role);
    } else {
      supervisors.forEach((supervisor, index) => {
        console.log(`✅ Superviseur ${index + 1}:`);
        console.log(`  - Nom: ${supervisor.firstName} ${supervisor.lastName}`);
        console.log(`  - Email: ${supervisor.email}`);
        console.log(`  - Rôle: ${supervisor.role}`);
        console.log(`  - Aéroport: ${supervisor.airport}`);
        console.log(`  - Actif: ${supervisor.isActive}`);
        console.log(`  - isSuperviseurBureauOrdre(): ${supervisor.isSuperviseurBureauOrdre()}`);
      });
    }

    // Vérifier tous les utilisateurs avec des rôles similaires
    console.log('\n📋 Tous les utilisateurs avec rôles bureau d\'ordre...');
    const bureauOrdreUsers = await User.find({ 
      role: { $in: ['AGENT_BUREAU_ORDRE', 'SUPERVISEUR_BUREAU_ORDRE'] } 
    });
    
    console.log(`Nombre total d'utilisateurs bureau d'ordre: ${bureauOrdreUsers.length}`);
    bureauOrdreUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Vérification terminée!');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la vérification
checkSupervisorUser();
