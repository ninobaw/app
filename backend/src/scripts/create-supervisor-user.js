const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script pour créer un utilisateur superviseur de bureau d'ordre
 */
async function createSupervisorUser() {
  try {
    console.log('🔧 CRÉATION D\'UN UTILISATEUR SUPERVISEUR');
    console.log('=' .repeat(50));
    
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion à MongoDB établie');

    // Données du superviseur
    const supervisorData = {
      _id: 'supervisor-' + Date.now(),
      email: 'superviseur.bureau@aeroport.tn',
      firstName: 'Superviseur',
      lastName: 'Bureau d\'Ordre',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISEUR_BUREAU_ORDRE',
      airport: 'GENERALE', // Peut superviser tous les aéroports
      phone: '+216 70 123 456',
      department: 'Bureau d\'Ordre',
      position: 'Superviseur',
      isActive: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      // Préférences de notification spécialisées
      notificationPreferences: {
        correspondanceAssignment: true,
        deadlineWarnings: true,
        urgentCorrespondances: true,
        weeklyReports: true,
        delegationRequests: true
      }
    };

    // Vérifier si l'utilisateur existe déjà
    const existingSupervisor = await User.findOne({ email: supervisorData.email });
    if (existingSupervisor) {
      console.log('⚠️  Un superviseur avec cet email existe déjà');
      console.log(`   Email: ${existingSupervisor.email}`);
      console.log(`   Nom: ${existingSupervisor.firstName} ${existingSupervisor.lastName}`);
      console.log(`   Rôle: ${existingSupervisor.role}`);
      console.log(`   Actif: ${existingSupervisor.isActive ? 'Oui' : 'Non'}`);
      
      // Demander si on veut mettre à jour
      console.log('\n🔄 Mise à jour du superviseur existant...');
      await User.findByIdAndUpdate(existingSupervisor._id, {
        role: 'SUPERVISEUR_BUREAU_ORDRE',
        airport: 'GENERALE',
        department: 'Bureau d\'Ordre',
        position: 'Superviseur',
        isActive: true,
        notificationPreferences: supervisorData.notificationPreferences
      });
      console.log('✅ Superviseur mis à jour avec succès');
    } else {
      // Créer le nouveau superviseur
      const newSupervisor = new User(supervisorData);
      await newSupervisor.save();
      console.log('✅ Nouveau superviseur créé avec succès');
    }

    // Afficher les informations de connexion
    console.log('\n📋 INFORMATIONS DE CONNEXION:');
    console.log('-' .repeat(30));
    console.log(`Email: ${supervisorData.email}`);
    console.log(`Mot de passe: supervisor123`);
    console.log(`Rôle: ${supervisorData.role}`);
    console.log(`Aéroport: ${supervisorData.airport}`);

    // Vérifier les capacités du superviseur
    const supervisor = await User.findOne({ email: supervisorData.email });
    if (supervisor) {
      console.log('\n🔍 VÉRIFICATION DES CAPACITÉS:');
      console.log('-' .repeat(35));
      console.log(`  • isBureauOrdreAgent(): ${supervisor.isBureauOrdreAgent()}`);
      console.log(`  • isSuperviseurBureauOrdre(): ${supervisor.isSuperviseurBureauOrdre()}`);
      console.log(`  • canSuperviseAirport('ENFIDHA'): ${supervisor.canSuperviseAirport('ENFIDHA')}`);
      console.log(`  • canSuperviseAirport('MONASTIR'): ${supervisor.canSuperviseAirport('MONASTIR')}`);
      console.log(`  • isDirector(): ${supervisor.isDirector()}`);
    }

    // Statistiques des rôles
    console.log('\n📊 STATISTIQUES DES RÔLES:');
    console.log('-' .repeat(30));
    
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    roleStats.forEach(stat => {
      console.log(`  • ${stat._id}: ${stat.count} utilisateur(s)`);
    });

    console.log('\n🎉 SUCCÈS!');
    console.log('Le superviseur peut maintenant:');
    console.log('  • Se connecter à l\'application');
    console.log('  • Accéder au dashboard superviseur');
    console.log('  • Gérer les échéances de correspondances');
    console.log('  • Envoyer des rappels manuels');
    console.log('  • Générer des rapports personnalisés');
    console.log('  • Superviser tous les aéroports');

  } catch (error) {
    console.error('❌ Erreur lors de la création du superviseur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

console.log('🚀 Démarrage de la création du superviseur...\n');
createSupervisorUser();
