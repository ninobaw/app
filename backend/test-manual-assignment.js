const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');

async function testManualAssignment() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie');

    // 1. Trouver Anis Ben Janet (nom exact de la base)
    const anisUser = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    
    if (!anisUser) {
      console.log('❌ Utilisateur Anis Ben Janet non trouvé');
      return;
    }
    
    console.log(`👤 Anis trouvé: ${anisUser.firstName} ${anisUser.lastName} (${anisUser.role})`);
    console.log(`📧 Email: ${anisUser.email}`);
    console.log(`🏢 Directorate: ${anisUser.directorate}`);

    // 2. Trouver tous les directeurs et sous-directeurs
    const allDirectors = await User.find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] },
      isActive: true
    }).select('firstName lastName role directorate');

    console.log(`\n👥 Tous les directeurs disponibles (${allDirectors.length}):`);
    allDirectors.forEach(dir => {
      console.log(`   - ${dir.firstName} ${dir.lastName} (${dir.role}) - ${dir.directorate}`);
    });

    // 3. Simuler une correspondance avec assignation manuelle à Anis seulement
    const testCorrespondance = {
      title: 'Test assignation manuelle',
      subject: 'Test pour vérifier que seul Anis est assigné',
      content: 'Cette correspondance doit être assignée uniquement à Anis Ben Janet, pas aux autres directeurs.',
      type: 'INCOMING',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'test@example.com', // REQUIS
      to_address: 'aeroport@enfidha.tn', // REQUIS
      personnesConcernees: [anisUser._id.toString()], // ASSIGNATION MANUELLE
      code: 'TEST-' + Date.now(),
      authorId: anisUser._id // Pour les tests
    };

    console.log(`\n🧪 Test d'assignation manuelle:`);
    console.log(`📝 Sujet: ${testCorrespondance.subject}`);
    console.log(`👤 Assigné manuellement à: ${anisUser.firstName} ${anisUser.lastName}`);
    console.log(`📋 personnesConcernees: [${anisUser._id}]`);

    // 4. Créer la correspondance (sans passer par l'API pour tester la logique)
    const newCorrespondance = new Correspondance(testCorrespondance);
    
    // Simuler la logique de la route
    const personnesConcernees = testCorrespondance.personnesConcernees;
    
    if (!personnesConcernees || personnesConcernees.length === 0) {
      console.log('🎯 Assignation automatique serait déclenchée');
    } else {
      console.log('✋ Assignation manuelle détectée - Pas d\'assignation automatique');
      console.log(`👥 Personnes assignées manuellement: ${personnesConcernees.length}`);
      newCorrespondance.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
    }

    await newCorrespondance.save();
    console.log(`✅ Correspondance créée avec ID: ${newCorrespondance._id}`);

    // 5. Vérifier le résultat
    const savedCorrespondance = await Correspondance.findById(newCorrespondance._id)
      .populate('personnesConcernees', 'firstName lastName role directorate');

    console.log(`\n📊 RÉSULTAT FINAL:`);
    console.log(`🆔 ID: ${savedCorrespondance._id}`);
    console.log(`📋 Nombre de personnes concernées: ${savedCorrespondance.personnesConcernees.length}`);
    console.log(`👥 Personnes assignées:`);
    
    savedCorrespondance.personnesConcernees.forEach(person => {
      console.log(`   - ${person.firstName} ${person.lastName} (${person.role}) - ${person.directorate}`);
    });

    // 6. Vérification
    if (savedCorrespondance.personnesConcernees.length === 1 && 
        savedCorrespondance.personnesConcernees[0]._id.toString() === anisUser._id.toString()) {
      console.log(`\n✅ SUCCESS: Assignation manuelle respectée !`);
      console.log(`✅ Seul Anis Ben Janet est assigné comme prévu`);
    } else {
      console.log(`\n❌ ÉCHEC: Assignation manuelle non respectée !`);
      console.log(`❌ Attendu: 1 personne (Anis), Obtenu: ${savedCorrespondance.personnesConcernees.length} personnes`);
    }

    // 7. Nettoyer le test
    await Correspondance.findByIdAndDelete(newCorrespondance._id);
    console.log(`🧹 Correspondance de test supprimée`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testManualAssignment();
