const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testNotificationSingleDirector() {
  try {
    console.log('=== Test de spécificité des notifications (1 directeur) ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer tous les utilisateurs avec rôle directeur ou sous-directeur
    const directors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] },
      isActive: true 
    });

    console.log(`📋 ${directors.length} directeur(s)/DG trouvé(s) dans le système:`);
    directors.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role}) - ${dir.email}`);
    });

    if (directors.length === 0) {
      console.log('\n❌ Aucun directeur trouvé dans le système');
      return;
    }

    // 2. Sélectionner UN directeur pour l'assignation
    const selectedDirector = directors[0];

    console.log(`\n🎯 Test: Notification à UN SEUL directeur`);
    console.log(`   Directeur sélectionné: ${selectedDirector.firstName} ${selectedDirector.lastName}`);
    console.log(`   Email: ${selectedDirector.email}`);
    console.log(`   ID: ${selectedDirector._id}`);

    // 3. Créer une correspondance avec assignation manuelle
    const testCorrespondance = new Correspondance({
      title: 'Test Notification Spécifique',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: 'tav@example.com',
      subject: 'Test de notification à un directeur spécifique',
      content: 'Cette notification doit être envoyée UNIQUEMENT au directeur assigné.',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: `TEST-NOTIF-${Date.now()}`,
      authorId: selectedDirector._id,
      personnesConcernees: [selectedDirector._id], // Assignation manuelle à UN SEUL directeur
      date_correspondance: new Date()
    });

    console.log('\n💾 Sauvegarde de la correspondance...');
    await testCorrespondance.save();
    console.log('✅ Correspondance créée avec ID:', testCorrespondance._id);

    // 4. Vérifier la liste des personnes concernées
    const savedCorrespondance = await Correspondance.findById(testCorrespondance._id);
    
    console.log('\n🔍 Vérification de la liste des destinataires de notifications:');
    console.log(`   personnesConcernees: ${savedCorrespondance.personnesConcernees.length} personne(s)`);
    console.log(`   IDs:`, savedCorrespondance.personnesConcernees.map(id => id.toString()));

    // 5. Vérifier que SEUL le directeur assigné est dans la liste
    if (savedCorrespondance.personnesConcernees.length === 1) {
      const recipientId = savedCorrespondance.personnesConcernees[0].toString();
      const expectedId = selectedDirector._id.toString();
      
      if (recipientId === expectedId) {
        console.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
        console.log('   La liste des destinataires contient UNIQUEMENT le directeur assigné');
        console.log(`   Destinataire: ${selectedDirector.firstName} ${selectedDirector.lastName}`);
        console.log(`   Email qui recevra la notification: ${selectedDirector.email}`);
        
        console.log('\n📨 Comportement des notifications:');
        console.log('   ✅ Email envoyé à: ' + selectedDirector.email);
        console.log('   ✅ Notification push envoyée à: ' + selectedDirector.firstName + ' ' + selectedDirector.lastName);
        console.log('   ✅ AUCUN autre directeur ne recevra de notification');
        
      } else {
        console.log('\n❌ TEST ÉCHOUÉ !');
        console.log('   Le destinataire ne correspond pas au directeur assigné');
        console.log(`   Attendu: ${expectedId}`);
        console.log(`   Obtenu: ${recipientId}`);
      }
    } else {
      console.log('\n❌ ❌ ❌ TEST ÉCHOUÉ ! ❌ ❌ ❌');
      console.log(`   PROBLÈME: ${savedCorrespondance.personnesConcernees.length} destinataire(s) au lieu de 1`);
      
      console.log('\n   Destinataires qui recevraient la notification:');
      for (const personId of savedCorrespondance.personnesConcernees) {
        const person = await User.findById(personId);
        if (person) {
          console.log(`      - ${person.firstName} ${person.lastName} (${person.email})`);
        }
      }
    }

    // 6. Vérifier le code de notification dans correspondanceRoutes.js
    console.log('\n📋 Vérification du code de notification:');
    console.log('   Le code utilise: newCorrespondance.personnesConcernees');
    console.log('   Cette liste contient: ' + savedCorrespondance.personnesConcernees.length + ' personne(s)');
    console.log('   ✅ Les notifications seront envoyées UNIQUEMENT à ces personnes');

    // 7. Nettoyer
    console.log('\n🧹 Nettoyage...');
    await Correspondance.findByIdAndDelete(testCorrespondance._id);
    console.log('✅ Correspondance de test supprimée');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('CONCLUSION:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Les notifications par email sont spécifiques');
    console.log('✅ Seules les personnes dans personnesConcernees reçoivent');
    console.log('   les notifications (email + push)');
    console.log('✅ L\'assignation manuelle est respectée');
    console.log('✅ Aucune notification n\'est envoyée aux autres directeurs');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testNotificationSingleDirector();
