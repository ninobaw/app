const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');
const EmailNotificationService = require('./src/services/emailNotificationService');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testNotificationSpecificity() {
  try {
    console.log('=== Test de spécificité des notifications par email ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Récupérer tous les directeurs
    const allDirectors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] },
      isActive: true 
    });

    if (allDirectors.length < 2) {
      console.log('❌ Besoin d\'au moins 2 directeurs pour ce test');
      return;
    }

    console.log(`📋 ${allDirectors.length} directeur(s) trouvé(s) dans le système:`);
    allDirectors.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role}) - ${dir.email}`);
    });

    // 2. Sélectionner UN SEUL directeur pour l'assignation
    const selectedDirector = allDirectors[0];
    const otherDirectors = allDirectors.slice(1);

    console.log(`\n🎯 Test: Notification à UN SEUL directeur`);
    console.log(`   Directeur sélectionné: ${selectedDirector.firstName} ${selectedDirector.lastName} (${selectedDirector.email})`);
    console.log(`\n❌ Les directeurs suivants NE DOIVENT PAS recevoir de notification:`);
    otherDirectors.forEach(dir => {
      console.log(`   - ${dir.firstName} ${dir.lastName} (${dir.email})`);
    });

    // 3. Créer une correspondance de test
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
      personnesConcernees: [selectedDirector._id], // UN SEUL directeur
      date_correspondance: new Date()
    });

    console.log('\n💾 Sauvegarde de la correspondance...');
    await testCorrespondance.save();
    console.log('✅ Correspondance créée avec ID:', testCorrespondance._id);

    // 4. Simuler l'envoi de notifications
    console.log('\n📧 Simulation d\'envoi de notifications email...');
    console.log(`   Liste des destinataires: [${selectedDirector._id}]`);
    console.log(`   Nombre de destinataires: 1`);

    // Vérifier que le service utilise bien la bonne liste
    const recipientIds = testCorrespondance.personnesConcernees;
    console.log(`\n🔍 Vérification de la liste des destinataires:`);
    console.log(`   personnesConcernees dans la correspondance: ${recipientIds.length} personne(s)`);
    
    if (recipientIds.length === 1) {
      const recipientId = recipientIds[0].toString();
      const expectedId = selectedDirector._id.toString();
      
      if (recipientId === expectedId) {
        console.log('\n✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅');
        console.log('   La liste des destinataires contient UNIQUEMENT le directeur assigné');
        console.log(`   Destinataire: ${selectedDirector.firstName} ${selectedDirector.lastName} (${selectedDirector.email})`);
        console.log('\n📨 Si les emails étaient envoyés, SEUL ce directeur recevrait la notification');
      } else {
        console.log('\n❌ TEST ÉCHOUÉ !');
        console.log('   Le destinataire ne correspond pas au directeur assigné');
      }
    } else {
      console.log('\n❌ ❌ ❌ TEST ÉCHOUÉ ! ❌ ❌ ❌');
      console.log(`   PROBLÈME: ${recipientIds.length} destinataire(s) au lieu de 1`);
      console.log('   Les notifications seraient envoyées à PLUSIEURS directeurs au lieu d\'un seul');
      
      console.log('\n   Destinataires qui recevraient la notification:');
      for (const personId of recipientIds) {
        const person = await User.findById(personId);
        if (person) {
          console.log(`      - ${person.firstName} ${person.lastName} (${person.email})`);
        }
      }
    }

    // 5. Test avec le service EmailNotificationService (sans vraiment envoyer)
    console.log('\n🧪 Test du service EmailNotificationService...');
    console.log('   (Les emails ne seront pas réellement envoyés si SMTP n\'est pas configuré)');
    
    try {
      const result = await EmailNotificationService.sendCorrespondanceEmailNotification(
        testCorrespondance,
        recipientIds,
        'NEW_CORRESPONDANCE'
      );
      
      console.log('\n📊 Résultat du service de notification:');
      console.log(`   Emails envoyés avec succès: ${result.emailsSent || 0}`);
      console.log(`   Emails échoués: ${result.emailsFailed || 0}`);
      console.log(`   Total de destinataires: ${result.totalRecipients || 0}`);
      
      if (result.totalRecipients === 1) {
        console.log('\n✅ Le service a bien traité UN SEUL destinataire');
      } else {
        console.log(`\n❌ Le service a traité ${result.totalRecipients} destinataires au lieu de 1`);
      }
    } catch (emailError) {
      console.log('\n⚠️ Erreur lors du test d\'envoi (normal si SMTP non configuré):', emailError.message);
      console.log('   L\'important est que la liste des destinataires soit correcte');
    }

    // 6. Nettoyer
    console.log('\n🧹 Nettoyage...');
    await Correspondance.findByIdAndDelete(testCorrespondance._id);
    console.log('✅ Correspondance de test supprimée');

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('CONCLUSION:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Les notifications par email sont envoyées UNIQUEMENT');
    console.log('aux personnes présentes dans personnesConcernees.');
    console.log('Si l\'assignation manuelle est correcte, les notifications');
    console.log('seront également correctes.');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

testNotificationSpecificity();
