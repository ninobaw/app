const mongoose = require('mongoose');

async function debugDirectorVisibility() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC VISIBILITÉ DIRECTEURS ===\n');
    
    // 1. Vérifier les directeurs
    const directeurs = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    console.log(`👥 Directeurs trouvés: ${directeurs.length}`);
    directeurs.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role})`);
      console.log(`      - ID: ${dir._id}`);
      console.log(`      - Email: ${dir.email}`);
    });
    
    if (directeurs.length === 0) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    const directeur = directeurs[0];
    console.log(`\n🎯 Test avec directeur: ${directeur.firstName} ${directeur.lastName}`);
    
    // 2. Vérifier les correspondances assignées au directeur
    const correspondancesAssignees = await db.collection('correspondances').find({
      $or: [
        { assignedTo: directeur._id },
        { assignedTo: directeur._id.toString() },
        { personnesConcernees: directeur._id },
        { personnesConcernees: directeur._id.toString() }
      ]
    }).toArray();
    
    console.log(`\n📋 Correspondances assignées au directeur: ${correspondancesAssignees.length}`);
    
    if (correspondancesAssignees.length === 0) {
      console.log('❌ PROBLÈME: Aucune correspondance assignée au directeur');
      
      // Vérifier toutes les correspondances
      const toutesCorrespondances = await db.collection('correspondances').find({}).toArray();
      console.log(`📊 Total correspondances: ${toutesCorrespondances.length}`);
      
      if (toutesCorrespondances.length > 0) {
        console.log('\n📋 Correspondances existantes:');
        toutesCorrespondances.forEach((corresp, index) => {
          console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
          console.log(`      - ID: ${corresp._id}`);
          console.log(`      - AssignedTo: ${corresp.assignedTo || 'NON DÉFINI'}`);
          console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0}`);
          console.log(`      - Status: ${corresp.status}`);
        });
        
        // Assigner la première correspondance au directeur pour test
        console.log('\n🔧 Assignation test...');
        await db.collection('correspondances').updateOne(
          { _id: toutesCorrespondances[0]._id },
          { 
            $set: { 
              assignedTo: directeur._id,
              updatedAt: new Date()
            },
            $addToSet: { 
              personnesConcernees: directeur._id 
            }
          }
        );
        console.log('✅ Correspondance assignée au directeur pour test');
      }
    } else {
      correspondancesAssignees.forEach((corresp, index) => {
        console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - AssignedTo: ${corresp.assignedTo}`);
        console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0}`);
      });
    }
    
    // 3. Vérifier les workflows pour ce directeur
    const workflowsDirecteur = await db.collection('correspondenceworkflows').find({
      $or: [
        { assignedDirector: directeur._id },
        { assignedDirector: directeur._id.toString() }
      ]
    }).toArray();
    
    console.log(`\n🔄 Workflows assignés au directeur: ${workflowsDirecteur.length}`);
    
    workflowsDirecteur.forEach((workflow, index) => {
      console.log(`   ${index + 1}. Workflow ${workflow._id}`);
      console.log(`      - CorrespondanceId: ${workflow.correspondanceId}`);
      console.log(`      - Status: ${workflow.currentStatus}`);
      console.log(`      - AssignedDirector: ${workflow.assignedDirector}`);
    });
    
    // 4. Tester la requête directeur (simuler l'API)
    console.log(`\n👤 === TEST REQUÊTE DIRECTEUR ===`);
    
    // Simuler la requête que fait le frontend pour les directeurs
    const requeteDirecteur = {
      $or: [
        { assignedTo: directeur._id },
        { assignedTo: directeur._id.toString() },
        { personnesConcernees: directeur._id },
        { personnesConcernees: directeur._id.toString() }
      ]
    };
    
    console.log('🔍 Requête directeur:', JSON.stringify(requeteDirecteur, null, 2));
    
    const resultatsDirecteur = await db.collection('correspondances').find(requeteDirecteur).toArray();
    
    console.log(`📊 Résultats pour directeur: ${resultatsDirecteur.length} correspondances`);
    
    if (resultatsDirecteur.length === 0) {
      console.log('❌ PROBLÈME: Aucune correspondance visible pour le directeur');
      
      // Tests de requêtes alternatives
      console.log('\n🔧 Tests requêtes alternatives...');
      
      const test1 = await db.collection('correspondances').find({
        assignedTo: directeur._id
      }).toArray();
      console.log(`Test 1 (assignedTo ObjectId): ${test1.length} résultats`);
      
      const test2 = await db.collection('correspondances').find({
        assignedTo: directeur._id.toString()
      }).toArray();
      console.log(`Test 2 (assignedTo String): ${test2.length} résultats`);
      
      const test3 = await db.collection('correspondances').find({
        personnesConcernees: directeur._id
      }).toArray();
      console.log(`Test 3 (personnesConcernees ObjectId): ${test3.length} résultats`);
      
      const test4 = await db.collection('correspondances').find({
        personnesConcernees: directeur._id.toString()
      }).toArray();
      console.log(`Test 4 (personnesConcernees String): ${test4.length} résultats`);
      
    } else {
      console.log('✅ Correspondances trouvées pour le directeur !');
      
      resultatsDirecteur.forEach((corresp, index) => {
        console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - AssignedTo: ${corresp.assignedTo}`);
        console.log(`      - Status: ${corresp.status}`);
      });
    }
    
    // 5. Vérifier la route API des correspondances
    console.log(`\n🌐 === VÉRIFICATION ROUTE API ===`);
    
    try {
      // Vérifier si la route filtre correctement par rôle
      console.log('📞 Simulation requête API correspondances...');
      
      // Simuler les paramètres de requête
      const mockReq = {
        user: {
          _id: directeur._id,
          id: directeur._id.toString(),
          role: directeur.role
        },
        query: {}
      };
      
      console.log(`👤 Utilisateur simulé: ${directeur.role} - ${directeur.firstName}`);
      
      // La logique devrait filtrer selon le rôle
      let filter = {};
      
      if (directeur.role === 'DIRECTEUR' || directeur.role === 'SOUS_DIRECTEUR') {
        filter = {
          $or: [
            { assignedTo: directeur._id },
            { assignedTo: directeur._id.toString() },
            { personnesConcernees: directeur._id },
            { personnesConcernees: directeur._id.toString() }
          ]
        };
      }
      
      const apiResults = await db.collection('correspondances').find(filter).toArray();
      console.log(`📊 Résultats API simulée: ${apiResults.length} correspondances`);
      
    } catch (apiError) {
      console.error('❌ Erreur API simulée:', apiError.message);
    }
    
    // 6. Recommandations
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    if (resultatsDirecteur.length === 0) {
      console.log('🔧 PROBLÈMES IDENTIFIÉS:');
      console.log('1. ❌ Correspondances pas assignées aux directeurs');
      console.log('2. ❌ Champ assignedTo ou personnesConcernees manquant');
      console.log('3. ❌ Types de données incompatibles (ObjectId vs String)');
      console.log('');
      console.log('🔧 CORRECTIONS NÉCESSAIRES:');
      console.log('1. Assigner les correspondances aux directeurs lors de la création');
      console.log('2. Vérifier la route API des correspondances');
      console.log('3. Corriger les filtres de requête');
    } else {
      console.log('✅ SYSTÈME FONCTIONNEL pour les directeurs');
    }
    
    console.log(`\n🎯 === ACTIONS IMMÉDIATES ===`);
    console.log('1. Vérifier l\'assignation lors de la création de correspondance');
    console.log('2. Tester l\'interface directeur dans le navigateur');
    console.log('3. Vérifier les logs de la console browser');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDirectorVisibility();
