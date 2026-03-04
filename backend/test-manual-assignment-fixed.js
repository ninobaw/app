const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testManualAssignment() {
  try {
    console.log('=== Test d\'assignation manuelle de correspondance ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer des directeurs pour l'assignation manuelle
    const directors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] },
      isActive: true 
    }).limit(2);

    if (directors.length === 0) {
      console.log('❌ Aucun directeur trouvé dans le système');
      return;
    }

    console.log('📋 Directeurs disponibles:');
    directors.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role}) - ID: ${dir._id}`);
    });

    // 2. Créer une correspondance avec assignation manuelle à UN SEUL directeur
    const specificDirector = directors[0];
    console.log(`\n🎯 Test: Assignation manuelle à UN SEUL directeur:`);
    console.log(`   Directeur choisi: ${specificDirector.firstName} ${specificDirector.lastName}`);

    const testCorrespondance = new Correspondance({
      title: 'Test Assignation Manuelle Spécifique',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: 'tav@example.com',
      subject: 'Test d\'assignation à un directeur spécifique',
      content: 'Cette correspondance doit être assignée UNIQUEMENT au directeur spécifié manuellement.',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: `TEST-ASSIGN-${Date.now()}`,
      authorId: specificDirector._id,
      personnesConcernees: [specificDirector._id], // Assignation manuelle à UN SEUL directeur
      date_correspondance: new Date()
    });

    console.log('\n💾 Sauvegarde de la correspondance...');
    await testCorrespondance.save();
    console.log('✅ Correspondance créée avec ID:', testCorrespondance._id);

    // 3. Vérifier l'assignation après sauvegarde
    const savedCorrespondance = await Correspondance.findById(testCorrespondance._id);
    
    console.log('\n📊 Résultat de l\'assignation:');
    console.log(`   Nombre de personnes concernées: ${savedCorrespondance.personnesConcernees.length}`);
    console.log(`   Personnes concernées:`, savedCorrespondance.personnesConcernees);

    // 4. Vérifier que SEUL le directeur spécifié est assigné
    if (savedCorrespondance.personnesConcernees.length === 1) {
      const assignedId = savedCorrespondance.personnesConcernees[0].toString();
      const expectedId = specificDirector._id.toString();
      
      if (assignedId === expectedId) {
        console.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
        console.log('   La correspondance est assignée UNIQUEMENT au directeur spécifié');
        console.log(`   Directeur assigné: ${specificDirector.firstName} ${specificDirector.lastName}`);
      } else {
        console.log('\n❌ TEST ÉCHOUÉ !');
        console.log('   Le directeur assigné ne correspond pas au directeur spécifié');
        console.log(`   Attendu: ${expectedId}`);
        console.log(`   Obtenu: ${assignedId}`);
      }
    } else {
      console.log('\n❌ ❌ ❌ TEST ÉCHOUÉ ! ❌ ❌ ❌');
      console.log(`   PROBLÈME: ${savedCorrespondance.personnesConcernees.length} personne(s) assignée(s) au lieu de 1`);
      console.log('   La correspondance a été assignée à TOUS les directeurs au lieu du directeur spécifique');
      
      // Afficher tous les directeurs assignés
      console.log('\n   Directeurs assignés:');
      for (const personId of savedCorrespondance.personnesConcernees) {
        const person = await User.findById(personId);
        if (person) {
          console.log(`      - ${person.firstName} ${person.lastName} (${person.role})`);
        }
      }
    }

    // 5. Nettoyer - supprimer la correspondance de test
    console.log('\n🧹 Nettoyage...');
    await Correspondance.findByIdAndDelete(testCorrespondance._id);
    console.log('✅ Correspondance de test supprimée');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testManualAssignment();
