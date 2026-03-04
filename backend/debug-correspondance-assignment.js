const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const User = require('./src/models/User');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function debugCorrespondanceAssignment() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    console.log('\n🔍 DIAGNOSTIC - Correspondance Asma → Anis Ben Janet');
    console.log('=======================================================');

    // 1. Rechercher Asma
    console.log('\n👤 Recherche d\'Asma...');
    const asmaUsers = await User.find({
      $or: [
        { firstName: { $regex: /asma/i } },
        { lastName: { $regex: /asma/i } },
        { email: { $regex: /asma/i } }
      ]
    });
    
    console.log(`📊 Utilisateurs trouvés avec "Asma": ${asmaUsers.length}`);
    asmaUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user._id})`);
      console.log(`      - Email: ${user.email}`);
      console.log(`      - Rôle: ${user.role}`);
    });

    // 2. Rechercher Anis Ben Janet
    console.log('\n👤 Recherche d\'Anis Ben Janet...');
    const anisUsers = await User.find({
      $or: [
        { firstName: { $regex: /anis/i } },
        { lastName: { $regex: /janet/i } },
        { firstName: { $regex: /anis/i }, lastName: { $regex: /ben/i } }
      ]
    });
    
    console.log(`📊 Utilisateurs trouvés avec "Anis" ou "Janet": ${anisUsers.length}`);
    anisUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user._id})`);
      console.log(`      - Email: ${user.email}`);
      console.log(`      - Rôle: ${user.role}`);
    });

    if (asmaUsers.length === 0 || anisUsers.length === 0) {
      console.log('\n❌ PROBLÈME: Utilisateurs non trouvés');
      if (asmaUsers.length === 0) console.log('   - Asma non trouvée');
      if (anisUsers.length === 0) console.log('   - Anis Ben Janet non trouvé');
      return;
    }

    const asma = asmaUsers[0];
    const anis = anisUsers[0];

    console.log(`\n✅ Utilisateurs identifiés:`);
    console.log(`   - Asma: ${asma.firstName} ${asma.lastName} (${asma._id})`);
    console.log(`   - Anis: ${anis.firstName} ${anis.lastName} (${anis._id})`);

    // 3. Rechercher les correspondances créées par Asma
    console.log('\n📋 Correspondances créées par Asma...');
    const correspondancesAsma = await Correspondance.find({ authorId: asma._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`📊 Correspondances créées par Asma: ${correspondancesAsma.length}`);
    correspondancesAsma.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.subject || corr.title} (${corr._id})`);
      console.log(`      - Créée: ${corr.createdAt}`);
      console.log(`      - Status: ${corr.status}`);
      console.log(`      - Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
      if (corr.personnesConcernees) {
        console.log(`      - IDs concernés: ${corr.personnesConcernees.join(', ')}`);
      }
    });

    // 4. Vérifier si Anis est dans les personnes concernées
    console.log('\n🎯 Correspondances où Anis est concerné...');
    const correspondancesAnis = await Correspondance.find({
      authorId: asma._id,
      personnesConcernees: { $in: [anis._id] }
    }).sort({ createdAt: -1 });

    console.log(`📊 Correspondances Asma → Anis: ${correspondancesAnis.length}`);
    correspondancesAnis.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.subject || corr.title} (${corr._id})`);
      console.log(`      - Créée: ${corr.createdAt}`);
      console.log(`      - Status: ${corr.status}`);
      console.log(`      - Priority: ${corr.priority}`);
    });

    // 5. Vérifier les workflows associés
    console.log('\n🔄 Workflows pour ces correspondances...');
    for (const corr of correspondancesAnis) {
      const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId: corr._id });
      if (workflow) {
        console.log(`   ✅ Workflow existe pour ${corr._id}:`);
        console.log(`      - Workflow ID: ${workflow._id}`);
        console.log(`      - Status: ${workflow.currentStatus}`);
        console.log(`      - Directeur assigné: ${workflow.assignedDirector}`);
        console.log(`      - DG: ${workflow.directeurGeneral}`);
      } else {
        console.log(`   ❌ Aucun workflow pour ${corr._id}`);
      }
    }

    // 6. Vérifier ce qu'Anis devrait voir
    console.log('\n👀 Ce qu\'Anis devrait voir...');
    
    // Correspondances où Anis est dans personnesConcernees
    const anisCorrespondances = await Correspondance.find({
      personnesConcernees: { $in: [anis._id] }
    }).sort({ createdAt: -1 });

    console.log(`📊 Total correspondances pour Anis: ${anisCorrespondances.length}`);
    
    // Workflows où Anis est assigné
    const anisWorkflows = await CorrespondenceWorkflow.find({
      assignedDirector: anis._id
    });

    console.log(`📊 Workflows assignés à Anis: ${anisWorkflows.length}`);

    // 7. Diagnostic des problèmes potentiels
    console.log('\n🔍 DIAGNOSTIC DES PROBLÈMES:');
    
    if (correspondancesAnis.length === 0) {
      console.log('❌ PROBLÈME 1: Anis n\'est pas dans personnesConcernees');
      console.log('   → Vérifier l\'assignation lors de la création');
    }

    if (correspondancesAnis.length > 0 && anisWorkflows.length === 0) {
      console.log('❌ PROBLÈME 2: Correspondances existent mais pas de workflows');
      console.log('   → Les workflows ne sont pas créés automatiquement');
    }

    // Vérifier le rôle d'Anis
    if (anis.role !== 'DIRECTEUR' && anis.role !== 'SOUS_DIRECTEUR') {
      console.log('❌ PROBLÈME 3: Rôle incorrect pour Anis');
      console.log(`   → Rôle actuel: ${anis.role}`);
      console.log('   → Devrait être: DIRECTEUR ou SOUS_DIRECTEUR');
    }

    // 8. Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    
    if (correspondancesAnis.length === 0) {
      console.log('1. Vérifier le processus d\'assignation des correspondances');
      console.log('2. S\'assurer qu\'Anis est bien ajouté dans personnesConcernees');
    }
    
    if (anisWorkflows.length === 0 && correspondancesAnis.length > 0) {
      console.log('3. Créer les workflows manquants pour les correspondances d\'Anis');
      console.log('4. Vérifier le service de création automatique de workflows');
    }

    console.log('5. Vérifier les hooks/routes de récupération des correspondances côté frontend');
    console.log('6. Vérifier les filtres dans le dashboard d\'Anis');

    console.log('\n✅ DIAGNOSTIC TERMINÉ');

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

debugCorrespondanceAssignment();
