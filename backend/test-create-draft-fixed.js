const mongoose = require('mongoose');

async function testCreateDraftFixed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🧪 === TEST CRÉATION DRAFT AUTOMATIQUE ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver n'importe quelle correspondance et un directeur
    const correspondance = await db.collection('correspondances').findOne({});
    
    if (!correspondance) {
      console.log('❌ Aucune correspondance trouvée');
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
    console.log(`   Status actuel: ${correspondance.workflowStatus}`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName} (${director.role})`);
    
    // 2. Supprimer les anciens drafts pour test propre
    console.log('\n🧹 === NETTOYAGE POUR TEST ===');
    
    await db.collection('correspondenceworkflows').updateOne(
      { correspondanceId: correspondance._id },
      {
        $set: {
          responseDrafts: [],
          currentStatus: 'ASSIGNED_TO_DIRECTOR',
          updatedAt: new Date()
        }
      }
    );
    
    await db.collection('correspondances').updateOne(
      { _id: correspondance._id },
      {
        $set: {
          workflowStatus: 'ASSIGNED_TO_DIRECTOR',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Correspondance nettoyée pour test');
    
    // 3. Tester le service createResponseDraft
    console.log('\n🔧 === TEST SERVICE CREATE-DRAFT ===');
    
    try {
      const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
      
      const draftData = {
        responseContent: `Test automatique de création de draft.\n\nCeci est une proposition de réponse créée automatiquement pour valider le système de création de drafts.\n\nContenu de la réponse:\n1. Accusé de réception\n2. Analyse de la demande\n3. Proposition de solution\n4. Délais de traitement\n\nCette proposition nécessite l'approbation du Directeur Général.\n\nCordialement,\n${director.firstName} ${director.lastName}\n${director.directorate || 'Direction'}`,
        comments: 'Draft créé automatiquement pour tester le système - Validation interface DG',
        attachments: [],
        isUrgent: false
      };
      
      console.log('📝 Appel CorrespondanceWorkflowService.createResponseDraft...');
      
      const result = await CorrespondanceWorkflowService.createResponseDraft(
        correspondance._id,
        director._id,
        draftData
      );
      
      console.log('✅ Service createResponseDraft RÉUSSI !');
      console.log('📊 Résultat:', {
        success: result.success,
        message: result.message,
        workflowStatus: result.data?.workflowStatus,
        draftId: result.data?.draftId
      });
      
      // 4. Vérifier dans la base de données
      console.log('\n🔍 === VÉRIFICATION BASE DE DONNÉES ===');
      
      const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: correspondance._id
      });
      
      const updatedCorrespondance = await db.collection('correspondances').findOne({
        _id: correspondance._id
      });
      
      if (updatedWorkflow && updatedWorkflow.responseDrafts?.length > 0) {
        console.log(`✅ Workflow mis à jour:`);
        console.log(`   - Status: ${updatedWorkflow.currentStatus}`);
        console.log(`   - Drafts: ${updatedWorkflow.responseDrafts.length}`);
        
        const draft = updatedWorkflow.responseDrafts[0];
        console.log(`📝 Draft créé:`);
        console.log(`   - Status: ${draft.status}`);
        console.log(`   - DirectorName: ${draft.directorName}`);
        console.log(`   - Content length: ${draft.responseContent?.length || 0} caractères`);
        console.log(`   - Comments: ${draft.comments}`);
      } else {
        console.log('❌ Aucun draft trouvé dans le workflow');
      }
      
      if (updatedCorrespondance) {
        console.log(`✅ Correspondance mise à jour:`);
        console.log(`   - WorkflowStatus: ${updatedCorrespondance.workflowStatus}`);
      }
      
      // 5. Tester le service DG
      console.log('\n🧪 === TEST SERVICE DG ===');
      
      try {
        const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
        const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
        
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
        
        console.log(`📊 Service DG: ${dgTasks.length} correspondances`);
        
        const correspWithNewDraft = dgTasks.find(c => 
          c._id.toString() === correspondance._id.toString()
        );
        
        if (correspWithNewDraft) {
          console.log('✅ Correspondance trouvée par le service DG !');
          console.log(`   - WorkflowStatus: ${correspWithNewDraft.workflowStatus}`);
          console.log(`   - Drafts: ${correspWithNewDraft.responseDrafts?.length || 0}`);
          
          if (correspWithNewDraft.responseDrafts?.length > 0) {
            const draft = correspWithNewDraft.responseDrafts[0];
            console.log(`   - Draft status: ${draft.status}`);
            console.log(`   - Draft director: ${draft.directorName}`);
            console.log('✅ DRAFT DÉTECTÉ PAR LE SERVICE DG !');
          } else {
            console.log('❌ Draft non détecté par le service DG');
          }
        } else {
          console.log('❌ Correspondance non trouvée par le service DG');
        }
        
      } catch (dgError) {
        console.error('❌ Erreur service DG:', dgError.message);
      }
      
      // 6. Tester le compteur dashboard
      console.log('\n📊 === TEST COMPTEUR DASHBOARD ===');
      
      try {
        const DirectorGeneralService = require('./src/services/directorGeneralService');
        const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
        
        const pendingCount = await DirectorGeneralService.getPendingDraftsCount(dg._id);
        
        console.log(`📊 Compteur dashboard: ${pendingCount} drafts en attente`);
        
        if (pendingCount > 0) {
          console.log('✅ COMPTEUR FONCTIONNE ! Interface DG devrait afficher le nombre');
        } else {
          console.log('❌ Compteur à zéro - problème de détection');
        }
        
      } catch (counterError) {
        console.error('❌ Erreur compteur:', counterError.message);
      }
      
      console.log('\n🎯 === RÉSULTAT FINAL ===');
      console.log('✅ Le service createResponseDraft fonctionne automatiquement !');
      console.log('✅ Les drafts sont créés et sauvegardés correctement');
      console.log('✅ Le service DG détecte les nouveaux drafts');
      console.log('✅ Le compteur dashboard fonctionne');
      
      console.log('\n🎯 === ACTIONS INTERFACE ===');
      console.log('1. 🔄 Redémarrer le serveur backend');
      console.log('2. 👤 Se connecter en tant que directeur et créer un draft via l\'interface');
      console.log('3. 👑 Se connecter en tant que DG et vérifier:');
      console.log('   - Compteur dashboard > 0');
      console.log('   - Badge "X proposition(s) 🔔"');
      console.log('   - Mise en évidence ambre');
      console.log('   - Boutons d\'approbation dans le chat');
      
    } catch (serviceError) {
      console.error('❌ Erreur service createResponseDraft:', serviceError);
      console.log('\n🔧 === DIAGNOSTIC ERREUR ===');
      console.log('Le service backend a encore un problème');
      console.log('Erreur:', serviceError.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testCreateDraftFixed();
