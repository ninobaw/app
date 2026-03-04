const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function assignCorrespondanceToDirector() {
  try {
    console.log('🎯 Script d\'assignation de correspondance à un directeur');
    console.log('================================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Trouver le directeur Anis Ben Jannet
    console.log('👤 Recherche du directeur Anis Ben Jannet...');
    const director = await User.findOne({ 
      email: 'anisbenjannet@tav.aero',
      role: 'DIRECTEUR'
    });

    if (!director) {
      console.log('❌ Directeur Anis Ben Jannet non trouvé');
      console.log('Créons-le d\'abord...');
      
      // Créer le directeur s'il n'existe pas
      const newDirector = new User({
        email: 'anisbenjannet@tav.aero',
        firstName: 'Anis',
        lastName: 'Ben Jannet',
        password: '$2b$10$hashedpassword', // Mot de passe hashé
        role: 'DIRECTEUR',
        directorate: 'RH',
        airport: 'GENERALE',
        isActive: true,
        mustChangePassword: false
      });
      
      await newDirector.save();
      console.log('✅ Directeur créé:', newDirector.email);
      var directorId = newDirector._id;
    } else {
      console.log('✅ Directeur trouvé:', director.email);
      var directorId = director._id;
    }

    // 3. Trouver des correspondances non assignées
    console.log('\n📋 Recherche de correspondances non assignées...');
    const unassignedCorrespondances = await Correspondance.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).limit(5);

    console.log(`📊 ${unassignedCorrespondances.length} correspondances non assignées trouvées`);

    if (unassignedCorrespondances.length === 0) {
      console.log('ℹ️  Aucune correspondance à assigner');
      return;
    }

    // 4. Assigner les correspondances au directeur
    console.log('\n🔄 Assignation des correspondances...');
    
    for (let i = 0; i < Math.min(3, unassignedCorrespondances.length); i++) {
      const correspondance = unassignedCorrespondances[i];
      
      await Correspondance.findByIdAndUpdate(correspondance._id, {
        assignedTo: directorId,
        assignedAt: new Date(),
        assignedBy: directorId // Auto-assignation pour le test
      });

      console.log(`✅ Correspondance assignée: ${correspondance.subject || correspondance._id}`);
    }

    // 5. Vérifier les assignations
    console.log('\n🔍 Vérification des assignations...');
    const assignedCorrespondances = await Correspondance.find({
      assignedTo: directorId
    }).populate('assignedTo', 'firstName lastName email role');

    console.log(`📊 ${assignedCorrespondances.length} correspondances assignées au directeur`);
    
    assignedCorrespondances.forEach((corresp, index) => {
      console.log(`   ${index + 1}. ${corresp.subject || corresp._id}`);
      console.log(`      Assigné à: ${corresp.assignedTo.firstName} ${corresp.assignedTo.lastName}`);
      console.log(`      Date: ${corresp.assignedAt ? corresp.assignedAt.toLocaleDateString('fr-FR') : 'N/A'}`);
    });

    console.log('\n🎉 ASSIGNATION TERMINÉE');
    console.log('========================\n');
    
    console.log('✅ RÉSULTATS:');
    console.log(`   - Directeur: ${director?.firstName || 'Anis'} ${director?.lastName || 'Ben Jannet'}`);
    console.log(`   - Email: anisbenjannet@tav.aero`);
    console.log(`   - Correspondances assignées: ${assignedCorrespondances.length}`);
    console.log(`   - Rôle: DIRECTEUR`);
    console.log(`   - Directorate: RH\n`);

    console.log('🚀 PROCHAINES ÉTAPES:');
    console.log('   1. Se connecter avec anisbenjannet@tav.aero');
    console.log('   2. Aller sur la page Correspondances');
    console.log('   3. Vérifier que les correspondances assignées s\'affichent');
    console.log('   4. Tester la création d\'un draft de réponse');
    console.log('   5. Vérifier le workflow d\'approbation par le DG\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
assignCorrespondanceToDirector();
