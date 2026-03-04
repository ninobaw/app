const mongoose = require('mongoose');

async function debugWorkflowDrafts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC DRAFTS WORKFLOW ===\n');
    
    // 1. Vérifier avec MongoDB direct
    console.log('📋 === TEST MONGODB DIRECT ===');
    
    const workflows = await db.collection('correspondenceworkflows').find({
      'responseDrafts.0': { $exists: true }
    }).toArray();
    
    console.log(`Workflows avec drafts (MongoDB): ${workflows.length}`);
    
    if (workflows.length > 0) {
      const workflow = workflows[0];
      console.log(`\n🔄 Workflow ID: ${workflow._id}`);
      console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
      console.log(`   Status: ${workflow.currentStatus}`);
      console.log(`   Drafts count: ${workflow.responseDrafts?.length || 0}`);
      
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        workflow.responseDrafts.forEach((draft, index) => {
          console.log(`\n   📝 Draft ${index}:`);
          console.log(`      - ID: ${draft.id}`);
          console.log(`      - Status: ${draft.status}`);
          console.log(`      - DirectorName: ${draft.directorName}`);
          console.log(`      - Content length: ${draft.responseContent?.length || 0}`);
        });
      }
      
      // 2. Tester avec Mongoose
      console.log('\n📋 === TEST MONGOOSE MODEL ===');
      
      const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
      
      // Test 1: findOne simple
      const mongooseWorkflow1 = await CorrespondenceWorkflow.findOne({ 
        _id: workflow._id 
      });
      
      console.log(`\nTest 1 - findOne simple:`);
      console.log(`   Trouvé: ${!!mongooseWorkflow1}`);
      console.log(`   Drafts: ${mongooseWorkflow1?.responseDrafts?.length || 0}`);
      
      // Test 2: findOne avec lean
      const mongooseWorkflow2 = await CorrespondenceWorkflow.findOne({ 
        _id: workflow._id 
      }).lean();
      
      console.log(`\nTest 2 - findOne avec lean:`);
      console.log(`   Trouvé: ${!!mongooseWorkflow2}`);
      console.log(`   Drafts: ${mongooseWorkflow2?.responseDrafts?.length || 0}`);
      
      // Test 3: Par correspondanceId
      const mongooseWorkflow3 = await CorrespondenceWorkflow.findOne({ 
        correspondanceId: workflow.correspondanceId 
      });
      
      console.log(`\nTest 3 - findOne par correspondanceId:`);
      console.log(`   Trouvé: ${!!mongooseWorkflow3}`);
      console.log(`   Drafts: ${mongooseWorkflow3?.responseDrafts?.length || 0}`);
      
      if (mongooseWorkflow3 && mongooseWorkflow3.responseDrafts) {
        console.log(`\n   📝 Détails drafts Mongoose:`);
        mongooseWorkflow3.responseDrafts.forEach((draft, index) => {
          console.log(`      Draft ${index}:`);
          console.log(`         - Existe: ${!!draft}`);
          console.log(`         - Type: ${typeof draft}`);
          console.log(`         - Keys: ${Object.keys(draft || {}).join(', ')}`);
          console.log(`         - Status: ${draft?.status}`);
        });
      }
      
      // 3. Test de l'index
      console.log('\n📋 === TEST INDEX DRAFT ===');
      
      const draftIndex = 0;
      const workflowForTest = mongooseWorkflow3;
      
      console.log(`Test index ${draftIndex}:`);
      console.log(`   responseDrafts existe: ${!!workflowForTest?.responseDrafts}`);
      console.log(`   responseDrafts length: ${workflowForTest?.responseDrafts?.length || 0}`);
      console.log(`   Draft à l'index ${draftIndex}: ${!!workflowForTest?.responseDrafts?.[draftIndex]}`);
      
      if (workflowForTest?.responseDrafts?.[draftIndex]) {
        const draft = workflowForTest.responseDrafts[draftIndex];
        console.log(`   ✅ Draft trouvé:`);
        console.log(`      - Status: ${draft.status}`);
        console.log(`      - DirectorName: ${draft.directorName}`);
      } else {
        console.log(`   ❌ Draft non trouvé à l'index ${draftIndex}`);
        
        // Debug plus poussé
        if (workflowForTest?.responseDrafts) {
          console.log(`   🔍 Debug array responseDrafts:`);
          console.log(`      - Type: ${Array.isArray(workflowForTest.responseDrafts) ? 'Array' : typeof workflowForTest.responseDrafts}`);
          console.log(`      - Length: ${workflowForTest.responseDrafts.length}`);
          console.log(`      - Content:`, workflowForTest.responseDrafts);
        }
      }
      
      // 4. Test de la condition exacte du service
      console.log('\n📋 === TEST CONDITION SERVICE ===');
      
      const testWorkflow = workflowForTest;
      const testIndex = 0;
      
      console.log(`Condition: !workflow.responseDrafts || !workflow.responseDrafts[draftIndex]`);
      console.log(`   !testWorkflow.responseDrafts: ${!testWorkflow?.responseDrafts}`);
      console.log(`   !testWorkflow.responseDrafts[${testIndex}]: ${!testWorkflow?.responseDrafts?.[testIndex]}`);
      console.log(`   Condition globale: ${!testWorkflow?.responseDrafts || !testWorkflow?.responseDrafts?.[testIndex]}`);
      
      if (!testWorkflow?.responseDrafts || !testWorkflow?.responseDrafts?.[testIndex]) {
        console.log(`   ❌ ERREUR: La condition échoue - c'est le problème !`);
      } else {
        console.log(`   ✅ La condition passe - le draft devrait être trouvé`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugWorkflowDrafts();
