const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

async function testDirectorTasks() {
  try {
    console.log('🔍 Test des tâches directeur - Diagnostic complet');
    console.log('=' .repeat(60));

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // 1. Vérifier TOUS les utilisateurs d'abord
    console.log('\n👥 1. TOUS LES UTILISATEURS:');
    const allUsers = await User.find({}).select('firstName lastName email role directorate isActive');
    console.log(`   Total utilisateurs: ${allUsers.length}`);
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Rôle: ${user.role}`);
      console.log(`      Directorate: ${user.directorate || 'Non spécifié'}`);
      console.log(`      Actif: ${user.isActive ? 'Oui' : 'Non'}`);
      console.log('');
    });

    // 2. Vérifier les directeurs spécifiquement
    console.log('\n📋 2. DIRECTEURS EXISTANTS:');
    const directors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] } 
    }).select('firstName lastName email role directorate isActive');
    
    console.log(`   Requête directeurs: role in ['DIRECTEUR', 'SOUS_DIRECTEUR']`);
    console.log(`   Directeurs trouvés: ${directors.length}`);
    
    if (directors.length === 0) {
      console.log('❌ Aucun directeur trouvé avec les rôles DIRECTEUR ou SOUS_DIRECTEUR');
      console.log('💡 Vérifiez les rôles exacts dans la base de données ci-dessus');
      
      // Chercher des variations possibles
      const possibleDirectors = await User.find({
        $or: [
          { role: /directeur/i },
          { role: /director/i },
          { role: /chef/i }
        ]
      }).select('firstName lastName email role directorate isActive');
      
      if (possibleDirectors.length > 0) {
        console.log('\n🔍 UTILISATEURS AVEC RÔLES SIMILAIRES:');
        possibleDirectors.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} - Rôle: "${user.role}"`);
        });
      }
      
      return;
    }

    directors.forEach((director, index) => {
      console.log(`   ${index + 1}. ${director.firstName} ${director.lastName}`);
      console.log(`      Email: ${director.email}`);
      console.log(`      Rôle: ${director.role}`);
      console.log(`      Directorate: ${director.directorate || 'Non spécifié'}`);
      console.log(`      Actif: ${director.isActive ? 'Oui' : 'Non'}`);
      console.log('');
    });

    // 3. Vérifier les correspondances assignées
    console.log('\n📬 3. CORRESPONDANCES ASSIGNÉES AUX DIRECTEURS:');
    const directorIds = directors.map(d => d._id);
    
    const assignedCorrespondances = await Correspondance.find({
      'personnesConcernees': { $in: directorIds }
    }).populate('personnesConcernees', 'firstName lastName email role directorate');

    console.log(`   Total correspondances assignées: ${assignedCorrespondances.length}`);

    if (assignedCorrespondances.length === 0) {
      console.log('❌ Aucune correspondance assignée aux directeurs');
      console.log('   💡 Suggestion: Vérifiez que les correspondances ont le champ "personnesConcernees" rempli');
    } else {
      assignedCorrespondances.forEach((corr, index) => {
        console.log(`   ${index + 1}. ${corr.subject}`);
        console.log(`      ID: ${corr._id}`);
        console.log(`      Statut: ${corr.status}`);
        console.log(`      Workflow: ${corr.workflowStatus || 'Non défini'}`);
        console.log(`      Personnes concernées: ${corr.personnesConcernees.length}`);
        corr.personnesConcernees.forEach(person => {
          console.log(`        - ${person.firstName} ${person.lastName} (${person.role})`);
        });
        console.log('');
      });
    }

    // 4. Simuler l'appel API pour un directeur spécifique
    console.log('\n🎯 4. SIMULATION APPEL API POUR CHAQUE DIRECTEUR:');
    
    for (const director of directors) {
      console.log(`\n   Directeur: ${director.firstName} ${director.lastName}`);
      
      // Simuler la logique de l'API /my-tasks
      const tasks = await Correspondance.find({
        'personnesConcernees': director._id,
        status: { $ne: 'ARCHIVED' }
      }).populate('personnesConcernees', 'firstName lastName email role directorate')
        .sort({ createdAt: -1 });

      console.log(`   Tâches trouvées: ${tasks.length}`);
      
      if (tasks.length > 0) {
        tasks.forEach((task, index) => {
          console.log(`     ${index + 1}. ${task.subject}`);
          console.log(`        Statut: ${task.status}`);
          console.log(`        Workflow: ${task.workflowStatus || 'PENDING'}`);
          console.log(`        Créée: ${task.createdAt.toLocaleDateString('fr-FR')}`);
        });
      } else {
        console.log('     ❌ Aucune tâche pour ce directeur');
      }
    }

    // 5. Vérifier les propositions de réponse existantes
    console.log('\n📝 5. PROPOSITIONS DE RÉPONSE EXISTANTES:');
    const correspondancesWithDrafts = await Correspondance.find({
      'responseDrafts.0': { $exists: true }
    }).select('subject responseDrafts');

    console.log(`   Correspondances avec propositions: ${correspondancesWithDrafts.length}`);
    
    correspondancesWithDrafts.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.subject}`);
      console.log(`      Propositions: ${corr.responseDrafts.length}`);
      corr.responseDrafts.forEach((draft, draftIndex) => {
        console.log(`        ${draftIndex + 1}. Par: ${draft.directorName}`);
        console.log(`           Statut: ${draft.status}`);
        console.log(`           Créée: ${new Date(draft.createdAt).toLocaleDateString('fr-FR')}`);
      });
    });

    // 6. Recommandations
    console.log('\n💡 6. RECOMMANDATIONS POUR VOIR LE DIALOGUE:');
    console.log('   1. Connectez-vous avec un compte directeur actif');
    console.log('   2. Assurez-vous que des correspondances sont assignées au directeur');
    console.log('   3. Vérifiez que le champ "personnesConcernees" contient l\'ID du directeur');
    console.log('   4. Cliquez sur "Voir détails" dans la section "Mes Propositions de Réponse"');
    console.log('   5. Le dialogue conversationnel devrait s\'ouvrir');

    console.log('\n✅ Diagnostic terminé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testDirectorTasks();
