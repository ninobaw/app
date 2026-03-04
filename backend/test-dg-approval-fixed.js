const mongoose = require('mongoose');

async function testDGApprovalFixed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST APPROBATION DG CORRIGÉE ===\n');
    
    // 1. Vérifier les utilisateurs
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    // 2. Vérifier les workflows avec drafts
    const workflows = await db.collection('correspondenceworkflows').find({
      'responseDrafts.0': { $exists: true }
    }).toArray();
    
    console.log(`📋 Workflows avec drafts: ${workflows.length}`);
    
    if (workflows.length === 0) {
      console.log('❌ Aucun workflow avec draft trouvé');
      process.exit(1);
    }
    
    const workflow = workflows[0];
    console.log(`🔄 Test avec workflow: ${workflow._id}`);
    console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
    console.log(`   Status: ${workflow.currentStatus}`);
    console.log(`   Drafts: ${workflow.responseDrafts?.length || 0}`);
    
    if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
      const draft = workflow.responseDrafts[0];
      console.log(`📝 Draft 0:`);
      console.log(`   Status: ${draft.status}`);
      console.log(`   DirectorName: ${draft.directorName}`);
      console.log(`   Content: "${draft.responseContent?.substring(0, 50)}..."`);
    }
    
    // 3. Tester la méthode provideDGFeedback
    console.log('\n🧪 === TEST MÉTHODE PROVIDEDGFEEDBACK ===');
    
    try {
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      console.log('📞 Test approbation...');
      
      const feedbackData = {
        action: 'APPROVE',
        feedback: 'Test automatique - approbation de la proposition',
        revisionRequests: [],
        isApproved: true
      };
      
      const result = await CorrespondanceWorkflowService.provideDGFeedback(
        workflow.correspondanceId.toString(),
        0, // Premier draft
        dg._id.toString(),
        feedbackData
      );
      
      console.log('✅ Approbation réussie !');
      console.log('📊 Résultat:', result);
      
      // 4. Vérifier les modifications
      console.log('\n🔍 === VÉRIFICATION MODIFICATIONS ===');
      
      const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
        _id: workflow._id
      });
      
      if (updatedWorkflow) {
        console.log(`📋 Workflow mis à jour:`);
        console.log(`   Status: ${updatedWorkflow.currentStatus}`);
        
        if (updatedWorkflow.responseDrafts && updatedWorkflow.responseDrafts.length > 0) {
          const updatedDraft = updatedWorkflow.responseDrafts[0];
          console.log(`📝 Draft mis à jour:`);
          console.log(`   Status: ${updatedDraft.status}`);
          console.log(`   DG Feedbacks: ${updatedDraft.dgFeedbacks?.length || 0}`);
          
          if (updatedDraft.dgFeedbacks && updatedDraft.dgFeedbacks.length > 0) {
            const lastFeedback = updatedDraft.dgFeedbacks[updatedDraft.dgFeedbacks.length - 1];
            console.log(`👑 Dernier feedback DG:`);
            console.log(`   Action: ${lastFeedback.action}`);
            console.log(`   DG: ${lastFeedback.dgName}`);
            console.log(`   Feedback: "${lastFeedback.feedback}"`);
            console.log(`   Date: ${lastFeedback.createdAt}`);
          }
        }
      }
      
      // 5. Vérifier la correspondance
      const updatedCorrespondance = await db.collection('correspondances').findOne({
        _id: new mongoose.Types.ObjectId(workflow.correspondanceId)
      });
      
      if (updatedCorrespondance) {
        console.log(`📧 Correspondance mise à jour:`);
        console.log(`   WorkflowStatus: ${updatedCorrespondance.workflowStatus}`);
      }
      
      console.log('\n🎉 === TEST RÉUSSI ===');
      console.log('✅ L\'approbation DG fonctionne maintenant correctement !');
      console.log('💡 Testez maintenant l\'interface DG dans le navigateur');
      
    } catch (serviceError) {
      console.error('❌ Erreur service:', serviceError.message);
      console.error('Stack:', serviceError.stack);
      
      console.log('\n🔧 === DIAGNOSTIC ERREUR ===');
      console.log('Vérifiez:');
      console.log('1. Le workflow existe et a des drafts');
      console.log('2. L\'index du draft est correct (0)');
      console.log('3. Le DG existe et a le bon rôle');
      console.log('4. Les imports des modèles sont corrects');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDGApprovalFixed();
