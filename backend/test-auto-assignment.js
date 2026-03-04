const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const CorrespondanceAssignmentService = require('./src/services/correspondanceAssignmentService');

async function testAutoAssignment() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie');

    // 1. Trouver un utilisateur pour l'auteur
    const author = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    if (!author) {
      console.log('❌ Aucun agent de bureau d\'ordre trouvé');
      return;
    }

    console.log(`👤 Auteur: ${author.firstName} ${author.lastName}`);

    // 2. Trouver tous les directeurs disponibles
    const allDirectors = await User.find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] },
      isActive: true
    }).select('firstName lastName role directorate');

    console.log(`\n👥 Directeurs disponibles (${allDirectors.length}):`);
    allDirectors.forEach(dir => {
      console.log(`   - ${dir.firstName} ${dir.lastName} (${dir.role}) - ${dir.directorate}`);
    });

    // 3. Test d'assignation automatique avec mots-clés RH
    const testCorrespondance = {
      title: 'Demande de formation du personnel',
      subject: 'Formation ressources humaines pour le personnel',
      content: 'Nous avons besoin d\'organiser une formation pour le personnel de l\'aéroport concernant les ressources humaines et le recrutement.',
      type: 'INCOMING',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'formation@example.com', // REQUIS
      to_address: 'rh@enfidha.tn', // REQUIS
      personnesConcernees: [], // AUCUNE ASSIGNATION MANUELLE
      code: 'AUTO-TEST-' + Date.now(),
      authorId: author._id,
      tags: ['formation', 'rh']
    };

    console.log(`\n🧪 Test d'assignation automatique:`);
    console.log(`📝 Sujet: ${testCorrespondance.subject}`);
    console.log(`📋 Contenu: ${testCorrespondance.content}`);
    console.log(`🏷️ Tags: ${testCorrespondance.tags}`);
    console.log(`👥 personnesConcernees: [] (vide - assignation automatique)`);

    // 4. Créer la correspondance
    const newCorrespondance = new Correspondance(testCorrespondance);
    
    // Simuler la logique de la route
    const personnesConcernees = testCorrespondance.personnesConcernees;
    
    if (!personnesConcernees || personnesConcernees.length === 0) {
      console.log('🎯 Assignation automatique déclenchée...');
      await CorrespondanceAssignmentService.assignCorrespondance(newCorrespondance);
    } else {
      console.log('✋ Assignation manuelle détectée');
      newCorrespondance.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
    }

    await newCorrespondance.save();
    console.log(`✅ Correspondance créée avec ID: ${newCorrespondance._id}`);

    // 5. Vérifier le résultat
    const savedCorrespondance = await Correspondance.findById(newCorrespondance._id)
      .populate('personnesConcernees', 'firstName lastName role directorate');

    console.log(`\n📊 RÉSULTAT ASSIGNATION AUTOMATIQUE:`);
    console.log(`🆔 ID: ${savedCorrespondance._id}`);
    console.log(`📋 Nombre de personnes assignées: ${savedCorrespondance.personnesConcernees.length}`);
    console.log(`🔄 Statut workflow: ${savedCorrespondance.workflowStatus}`);
    console.log(`👥 Personnes assignées automatiquement:`);
    
    savedCorrespondance.personnesConcernees.forEach(person => {
      console.log(`   - ${person.firstName} ${person.lastName} (${person.role}) - ${person.directorate}`);
    });

    // 6. Vérification
    const rhDirectors = savedCorrespondance.personnesConcernees.filter(p => 
      p.directorate === 'RH' || p.role === 'DIRECTEUR_GENERAL'
    );

    if (rhDirectors.length > 0) {
      console.log(`\n✅ SUCCESS: Assignation automatique fonctionne !`);
      console.log(`✅ Directeurs RH/DG assignés automatiquement selon les mots-clés`);
    } else {
      console.log(`\n⚠️ INFO: Aucun directeur RH trouvé, vérifiez la configuration`);
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
testAutoAssignment();
