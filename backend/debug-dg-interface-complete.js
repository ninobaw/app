const mongoose = require('mongoose');

async function debugDGInterfaceComplete() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC COMPLET INTERFACE DG ===\n');
    
    // 1. Vérifier les utilisateurs DG
    const dgUsers = await db.collection('users').find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DG'] }
    }).toArray();
    
    console.log(`👑 Directeurs Généraux: ${dgUsers.length}`);
    if (dgUsers.length === 0) {
      console.log('❌ PROBLÈME: Aucun DG trouvé !');
      process.exit(1);
    }
    
    const dg = dgUsers[0];
    console.log(`   DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`   ID: ${dg._id}`);
    console.log(`   Email: ${dg.email}`);
    console.log(`   Role: ${dg.role}`);
    console.log(`   Active: ${dg.isActive !== false ? 'Oui' : 'Non'}`);
    
    // 2. Vérifier tous les workflows
    const allWorkflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`\n📋 Total workflows dans la base: ${allWorkflows.length}`);
    
    if (allWorkflows.length === 0) {
      console.log('❌ PROBLÈME: Aucun workflow trouvé !');
      console.log('💡 Créez d\'abord un draft via l\'interface directeur');
      
      // Créer un workflow de test
      console.log('\n🔧 Création workflow de test...');
      
      const correspondances = await db.collection('correspondances').find({}).limit(1).toArray();
      if (correspondances.length > 0) {
        const testWorkflow = {
          correspondanceId: correspondances[0]._id,
          assignedDirector: new mongoose.Types.ObjectId(),
          directeurGeneral: dg._id,
          currentStatus: 'DIRECTOR_DRAFT',
          responseDrafts: [{
            id: new mongoose.Types.ObjectId().toString(),
            directorId: new mongoose.Types.ObjectId(),
            directorName: 'Test Director',
            directorate: 'TEST',
            responseContent: 'Ceci est un draft de test pour vérifier la visibilité DG',
            attachments: [],
            comments: 'Test automatique',
            isUrgent: false,
            status: 'PENDING_DG_REVIEW',
            createdAt: new Date(),
            updatedAt: new Date()
          }],
          chatMessages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('correspondenceworkflows').insertOne(testWorkflow);
        console.log('✅ Workflow de test créé');
        
        // Recharger les workflows
        const updatedWorkflows = await db.collection('correspondenceworkflows').find({}).toArray();
        console.log(`📋 Workflows après création test: ${updatedWorkflows.length}`);
      }
    }
    
    // 3. Analyser chaque workflow
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    
    console.log(`\n🔍 === ANALYSE DÉTAILLÉE WORKFLOWS ===`);
    
    let workflowsForDG = 0;
    let draftsForDG = 0;
    
    for (const workflow of workflows) {
      console.log(`\n📋 Workflow: ${workflow._id}`);
      console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
      console.log(`   CurrentStatus: ${workflow.currentStatus}`);
      console.log(`   DirecteurGeneral: ${workflow.directeurGeneral}`);
      console.log(`   AssignedDirector: ${workflow.assignedDirector}`);
      
      // Vérifier si assigné au DG
      const isAssignedToDG = workflow.directeurGeneral && 
        (workflow.directeurGeneral.toString() === dg._id.toString());
      
      console.log(`   ✅ Assigné au DG: ${isAssignedToDG ? 'OUI' : 'NON'}`);
      
      if (isAssignedToDG) {
        workflowsForDG++;
      }
      
      // Analyser les drafts
      const drafts = workflow.responseDrafts || [];
      console.log(`   Drafts: ${drafts.length}`);
      
      drafts.forEach((draft, index) => {
        console.log(`\n   📝 Draft ${index + 1}:`);
        console.log(`      ID: ${draft.id}`);
        console.log(`      Status: ${draft.status}`);
        console.log(`      DirectorId: ${draft.directorId}`);
        console.log(`      DirectorName: ${draft.directorName}`);
        console.log(`      Content: "${draft.responseContent?.substring(0, 50)}..."`);
        console.log(`      CreatedAt: ${draft.createdAt}`);
        
        if (draft.status === 'PENDING_DG_REVIEW') {
          draftsForDG++;
          console.log(`      ✅ EN ATTENTE DG`);
        } else {
          console.log(`      ❌ Status: ${draft.status} (pas en attente DG)`);
        }
      });
    }
    
    console.log(`\n📊 Résumé:`);
    console.log(`   - Workflows assignés au DG: ${workflowsForDG}`);
    console.log(`   - Drafts en attente DG: ${draftsForDG}`);
    
    // 4. Tester la requête DG (simulation de l'API)
    console.log(`\n👑 === TEST REQUÊTE API DG ===`);
    
    // Simuler la requête exacte du service DG
    const dgQuery = {
      $or: [
        { directeurGeneral: dg._id },
        { directeurGeneral: dg._id.toString() },
        { 'responseDrafts.status': 'PENDING_DG_REVIEW' }
      ]
    };
    
    console.log('🔍 Requête DG:', JSON.stringify(dgQuery, null, 2));
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find(dgQuery).toArray();
    
    console.log(`📊 Résultat requête DG: ${dgWorkflows.length} workflows`);
    
    if (dgWorkflows.length === 0) {
      console.log('❌ PROBLÈME CRITIQUE: Aucun workflow retourné par la requête DG !');
      
      // Tests de requêtes alternatives
      console.log('\n🔧 Tests requêtes alternatives...');
      
      const test1 = await db.collection('correspondenceworkflows').find({
        directeurGeneral: dg._id
      }).toArray();
      console.log(`Test 1 (ObjectId): ${test1.length} résultats`);
      
      const test2 = await db.collection('correspondenceworkflows').find({
        directeurGeneral: dg._id.toString()
      }).toArray();
      console.log(`Test 2 (String): ${test2.length} résultats`);
      
      const test3 = await db.collection('correspondenceworkflows').find({
        'responseDrafts.status': 'PENDING_DG_REVIEW'
      }).toArray();
      console.log(`Test 3 (Status): ${test3.length} résultats`);
      
    } else {
      console.log('✅ Workflows trouvés pour le DG !');
      
      dgWorkflows.forEach((workflow, index) => {
        const pendingDrafts = workflow.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW') || [];
        console.log(`   ${index + 1}. Workflow ${workflow._id}`);
        console.log(`      - Drafts en attente: ${pendingDrafts.length}`);
        console.log(`      - Status: ${workflow.currentStatus}`);
        console.log(`      - DG ID: ${workflow.directeurGeneral}`);
      });
    }
    
    // 5. Vérifier la route API backend
    console.log(`\n🌐 === VÉRIFICATION ROUTE API ===`);
    
    try {
      // Simuler l'appel API
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      
      console.log('📞 Test service DG...');
      const serviceResult = await DirectorGeneralWorkflowService.getPendingCorrespondences(dg._id.toString());
      
      console.log(`📊 Service DG résultat: ${serviceResult.length} correspondances`);
      
      if (serviceResult.length === 0) {
        console.log('❌ PROBLÈME: Service DG ne retourne rien !');
      } else {
        console.log('✅ Service DG fonctionne !');
        serviceResult.forEach((corresp, index) => {
          console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
          console.log(`      - Drafts: ${corresp.responseDrafts?.length || 0}`);
        });
      }
      
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    // 6. Recommandations
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    if (workflowsForDG === 0) {
      console.log('🔧 PROBLÈME: Aucun workflow assigné au DG');
      console.log('   → Vérifier que directeurGeneral est bien défini lors de la création');
      console.log('   → Exécuter le script de correction des workflows');
    }
    
    if (draftsForDG === 0) {
      console.log('🔧 PROBLÈME: Aucun draft en status PENDING_DG_REVIEW');
      console.log('   → Vérifier que le status est bien défini lors de la création');
      console.log('   → Créer un nouveau draft via l\'interface directeur');
    }
    
    if (dgWorkflows.length === 0) {
      console.log('🔧 PROBLÈME: Requête DG ne retourne rien');
      console.log('   → Vérifier la logique de requête dans directorGeneralWorkflowService');
      console.log('   → Vérifier les types de données (ObjectId vs String)');
    }
    
    console.log(`\n🎯 === ACTIONS IMMÉDIATES ===`);
    console.log('1. Créer un nouveau draft via l\'interface directeur');
    console.log('2. Vérifier les logs backend lors de la création');
    console.log('3. Vérifier l\'interface frontend DG (console browser)');
    console.log('4. Tester la route API DG directement');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGInterfaceComplete();
