const mongoose = require('mongoose');

async function testCreateDraftRoute() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🧪 === TEST ROUTE CREATE-DRAFT ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver une correspondance et un directeur
    const correspondance = await db.collection('correspondances').findOne({
      workflowStatus: 'ASSIGNED_TO_DIRECTOR'
    });
    
    if (!correspondance) {
      console.log('❌ Aucune correspondance ASSIGNED_TO_DIRECTOR trouvée');
      process.exit(1);
    }
    
    const director = await db.collection('users').findOne({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    if (!director) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    console.log(`📧 Correspondance: ${correspondance.title || correspondance.subject}`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName} (${director.role})`);
    
    // 2. Tester le service directement
    console.log('\n🔧 === TEST SERVICE DIRECT ===');
    
    try {
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      const draftData = {
        responseContent: `Test automatique de création de draft via service.\n\nCeci est une proposition de réponse créée automatiquement pour tester le système.\n\nContenu de la réponse proposée.\n\nCordialement,\n${director.firstName} ${director.lastName}`,
        comments: 'Draft créé automatiquement pour tester le système',
        attachments: [],
        isUrgent: false
      };
      
      console.log('📝 Appel CorrespondanceWorkflowService.createResponseDraft...');
      
      const result = await CorrespondanceWorkflowService.createResponseDraft(
        correspondance._id,
        director._id,
        draftData
      );
      
      console.log('✅ Service createResponseDraft réussi !');
      console.log('📊 Résultat:', result);
      
      // 3. Vérifier le résultat dans la base
      console.log('\n🔍 === VÉRIFICATION BASE DE DONNÉES ===');
      
      const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: correspondance._id
      });
      
      if (updatedWorkflow) {
        console.log(`✅ Workflow trouvé:`);
        console.log(`   - Status: ${updatedWorkflow.currentStatus}`);
        console.log(`   - Drafts: ${updatedWorkflow.responseDrafts?.length || 0}`);
        
        if (updatedWorkflow.responseDrafts && updatedWorkflow.responseDrafts.length > 0) {
          const draft = updatedWorkflow.responseDrafts[updatedWorkflow.responseDrafts.length - 1];
          console.log(`📝 Draft créé:`);
          console.log(`   - Status: ${draft.status}`);
          console.log(`   - DirectorName: ${draft.directorName}`);
          console.log(`   - Content: "${draft.responseContent?.substring(0, 50)}..."`);
        }
      } else {
        console.log('❌ Workflow non trouvé après création');
      }
      
      const updatedCorrespondance = await db.collection('correspondances').findOne({
        _id: correspondance._id
      });
      
      if (updatedCorrespondance) {
        console.log(`✅ Correspondance mise à jour:`);
        console.log(`   - WorkflowStatus: ${updatedCorrespondance.workflowStatus}`);
      }
      
      // 4. Tester le service DG
      console.log('\n🧪 === TEST SERVICE DG APRÈS CRÉATION ===');
      
      try {
        const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
        const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
        
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
        
        console.log(`📊 Service DG: ${dgTasks.length} correspondances`);
        
        const correspWithNewDraft = dgTasks.find(c => 
          c._id.toString() === correspondance._id.toString()
        );
        
        if (correspWithNewDraft && correspWithNewDraft.responseDrafts?.length > 0) {
          console.log('✅ Draft détecté par le service DG !');
          console.log(`   - Drafts: ${correspWithNewDraft.responseDrafts.length}`);
          console.log(`   - WorkflowStatus: ${correspWithNewDraft.workflowStatus}`);
        } else {
          console.log('❌ Draft non détecté par le service DG');
        }
        
      } catch (dgError) {
        console.error('❌ Erreur service DG:', dgError.message);
      }
      
      console.log('\n🎯 === RÉSULTAT ===');
      console.log('✅ Le service createResponseDraft fonctionne !');
      console.log('🔧 Le problème est probablement dans:');
      console.log('1. L\'authentification côté frontend');
      console.log('2. Les middlewares auth/requireDirector');
      console.log('3. L\'appel API depuis l\'interface');
      
    } catch (serviceError) {
      console.error('❌ Erreur service createResponseDraft:', serviceError);
      console.log('\n🔧 === DIAGNOSTIC ERREUR ===');
      
      if (serviceError.message.includes('Utilisateur non autorisé')) {
        console.log('❌ Problème: Méthode isDirector() échoue');
        console.log('🔧 Vérifier le rôle du directeur');
      } else if (serviceError.message.includes('Correspondance non trouvée')) {
        console.log('❌ Problème: Correspondance non trouvée');
        console.log('🔧 Vérifier l\'ID de correspondance');
      } else {
        console.log('❌ Autre erreur:', serviceError.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testCreateDraftRoute();
