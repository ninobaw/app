const mongoose = require('mongoose');

async function debugDirectorDashboard() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC DASHBOARD DIRECTEUR ===\n');
    
    // 1. Vérifier les directeurs
    const directeurs = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    console.log(`👥 Directeurs trouvés: ${directeurs.length}`);
    directeurs.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role})`);
      console.log(`      - ID: ${dir._id}`);
    });
    
    if (directeurs.length === 0) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    const directeur = directeurs[0];
    console.log(`\n🎯 Test avec directeur: ${directeur.firstName} ${directeur.lastName}`);
    
    // 2. Vérifier toutes les correspondances
    const allCorrespondances = await db.collection('correspondances').find({
      parentCorrespondanceId: { $exists: false } // Exclure les réponses
    }).toArray();
    
    console.log(`\n📋 === ANALYSE CORRESPONDANCES ===`);
    console.log(`Total correspondances (sans réponses): ${allCorrespondances.length}`);
    
    allCorrespondances.forEach((corresp, index) => {
      console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
      console.log(`      - ID: ${corresp._id}`);
      console.log(`      - AssignedTo: ${corresp.assignedTo || 'undefined'}`);
      console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0} personnes`);
      console.log(`      - Status: ${corresp.status}`);
      console.log(`      - WorkflowStatus: ${corresp.workflowStatus || 'undefined'}`);
      console.log(`      - CreatedAt: ${corresp.createdAt}`);
      
      // Vérifier si cette correspondance devrait être visible pour le directeur
      let shouldBeVisible = false;
      let reasons = [];
      
      if (corresp.assignedTo === directeur._id.toString()) {
        shouldBeVisible = true;
        reasons.push('assignedTo (String)');
      }
      if (corresp.assignedTo === directeur._id) {
        shouldBeVisible = true;
        reasons.push('assignedTo (ObjectId)');
      }
      if (corresp.personnesConcernees?.includes(directeur._id.toString())) {
        shouldBeVisible = true;
        reasons.push('personnesConcernees (String)');
      }
      if (corresp.personnesConcernees?.some(p => p.toString() === directeur._id.toString())) {
        shouldBeVisible = true;
        reasons.push('personnesConcernees (ObjectId)');
      }
      if (!corresp.assignedTo) {
        shouldBeVisible = true;
        reasons.push('assignedTo undefined/null');
      }
      
      console.log(`      - ✅ Visible pour directeur: ${shouldBeVisible} (${reasons.join(', ') || 'aucune raison'})`);
    });
    
    // 3. Tester le filtre de la route API
    console.log(`\n🔍 === TEST FILTRE API DIRECTEUR ===`);
    
    const roleConditions = [
      { assignedTo: directeur._id },
      { assignedTo: directeur._id.toString() },
      { personnesConcernees: directeur._id },
      { personnesConcernees: directeur._id.toString() },
      { assignedTo: { $exists: false } },
      { assignedTo: null }
    ];
    
    const filter = {
      parentCorrespondanceId: { $exists: false },
      $or: roleConditions
    };
    
    console.log('📋 Filtre utilisé:');
    console.log(JSON.stringify(filter, null, 2));
    
    const filteredResults = await db.collection('correspondances').find(filter).toArray();
    
    console.log(`\n📊 Résultats filtrés: ${filteredResults.length} correspondances`);
    
    filteredResults.forEach((corresp, index) => {
      console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
      console.log(`      - Status: ${corresp.status}`);
      console.log(`      - WorkflowStatus: ${corresp.workflowStatus || 'undefined'}`);
    });
    
    // 4. Vérifier les workflows
    console.log(`\n🔄 === ANALYSE WORKFLOWS ===`);
    
    const workflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { assignedDirector: directeur._id },
        { assignedDirector: directeur._id.toString() }
      ]
    }).toArray();
    
    console.log(`Workflows assignés au directeur: ${workflows.length}`);
    
    workflows.forEach((workflow, index) => {
      console.log(`\n   ${index + 1}. Workflow ${workflow._id}`);
      console.log(`      - CorrespondanceId: ${workflow.correspondanceId}`);
      console.log(`      - Status: ${workflow.currentStatus}`);
      console.log(`      - AssignedDirector: ${workflow.assignedDirector}`);
      console.log(`      - Drafts: ${workflow.responseDrafts?.length || 0}`);
      
      // Trouver la correspondance liée
      const linkedCorresp = allCorrespondances.find(c => 
        c._id.toString() === workflow.correspondanceId.toString()
      );
      
      if (linkedCorresp) {
        console.log(`      - ✅ Correspondance liée: ${linkedCorresp.title || linkedCorresp.subject}`);
      } else {
        console.log(`      - ❌ Correspondance liée non trouvée`);
      }
    });
    
    // 5. Tester différents statuts de workflow
    console.log(`\n📊 === ANALYSE STATUTS WORKFLOW ===`);
    
    const statusCounts = {};
    workflows.forEach(workflow => {
      const status = workflow.currentStatus;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Répartition des statuts:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    // 6. Vérifier les correspondances qui devraient apparaître dans le dashboard
    console.log(`\n🎯 === CORRESPONDANCES POUR DASHBOARD DIRECTEUR ===`);
    
    const dashboardCorrespondances = filteredResults.filter(corresp => {
      // Logique du dashboard : correspondances en attente de traitement par le directeur
      const needsDirectorAction = [
        'PENDING',
        'ASSIGNED_TO_DIRECTOR',
        'DIRECTOR_DRAFT',
        'DG_FEEDBACK'
      ].includes(corresp.workflowStatus || corresp.status);
      
      return needsDirectorAction;
    });
    
    console.log(`Correspondances pour dashboard: ${dashboardCorrespondances.length}`);
    
    dashboardCorrespondances.forEach((corresp, index) => {
      console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
      console.log(`      - Status: ${corresp.status}`);
      console.log(`      - WorkflowStatus: ${corresp.workflowStatus || 'undefined'}`);
      console.log(`      - Nécessite action directeur: OUI`);
    });
    
    // 7. Recommandations
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    if (dashboardCorrespondances.length <= 1) {
      console.log('🔧 PROBLÈMES POTENTIELS:');
      console.log('1. ❌ Correspondances pas correctement assignées aux directeurs');
      console.log('2. ❌ WorkflowStatus pas mis à jour lors de la création');
      console.log('3. ❌ Filtre du dashboard trop restrictif');
      console.log('4. ❌ Problème de synchronisation entre Correspondance et CorrespondenceWorkflow');
      
      console.log('\n🔧 CORRECTIONS NÉCESSAIRES:');
      console.log('1. Vérifier l\'assignation lors de la création de correspondance');
      console.log('2. Mettre à jour le workflowStatus correctement');
      console.log('3. Vérifier la logique du dashboard directeur');
      console.log('4. Synchroniser les statuts entre les modèles');
    } else {
      console.log('✅ SYSTÈME FONCTIONNEL pour le dashboard directeur');
      console.log(`${dashboardCorrespondances.length} correspondances devraient apparaître`);
    }
    
    console.log(`\n🎯 === ACTIONS IMMÉDIATES ===`);
    console.log('1. Vérifier la route du dashboard directeur');
    console.log('2. Vérifier l\'assignation lors de la création');
    console.log('3. Tester l\'interface dashboard directeur');
    console.log('4. Vérifier les logs de la console browser');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDirectorDashboard();
