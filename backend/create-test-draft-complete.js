const mongoose = require('mongoose');

async function createTestDraftComplete() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === CRÉATION DRAFT DE TEST COMPLET ===\n');
    
    // 1. Trouver un workflow sans draft
    const workflow = await db.collection('correspondenceworkflows').findOne({
      currentStatus: 'ASSIGNED_TO_DIRECTOR',
      $or: [
        { responseDrafts: { $exists: false } },
        { responseDrafts: { $size: 0 } }
      ]
    });
    
    if (!workflow) {
      console.log('❌ Aucun workflow disponible pour créer un draft');
      process.exit(1);
    }
    
    console.log(`🔄 Workflow sélectionné: ${workflow._id}`);
    console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
    console.log(`   AssignedDirector: ${workflow.assignedDirector}`);
    console.log(`   DirecteurGeneral: ${workflow.directeurGeneral}`);
    
    // 2. Trouver le directeur assigné
    const director = await db.collection('users').findOne({
      _id: workflow.assignedDirector
    });
    
    if (!director) {
      console.log('❌ Directeur assigné non trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName}`);
    
    // 3. Trouver la correspondance liée
    const correspondance = await db.collection('correspondances').findOne({
      _id: new mongoose.Types.ObjectId(workflow.correspondanceId)
    });
    
    if (!correspondance) {
      console.log('❌ Correspondance liée non trouvée');
      process.exit(1);
    }
    
    console.log(`📧 Correspondance: ${correspondance.title || correspondance.subject}`);
    
    // 4. Créer un draft de test
    const testDraft = {
      id: new mongoose.Types.ObjectId(),
      directorId: workflow.assignedDirector,
      directorName: `${director.firstName} ${director.lastName}`,
      directorate: director.directorate || 'Direction Générale',
      responseContent: `Proposition de réponse créée automatiquement pour test.\n\nObjet: ${correspondance.title || correspondance.subject}\n\nProposition de réponse par ${director.firstName} ${director.lastName}:\n\nSuite à l'analyse de cette correspondance, nous proposons la réponse suivante :\n\n1. Accusé de réception de la demande\n2. Analyse des éléments fournis\n3. Proposition de solution\n4. Délais de mise en œuvre\n\nCette proposition nécessite l'approbation du Directeur Général avant envoi.\n\nCordialement,\n${director.firstName} ${director.lastName}\n${director.directorate || 'Direction'}`,
      comments: 'Draft créé automatiquement pour tester le système d\'approbation DG',
      status: 'PENDING_DG_REVIEW',
      createdAt: new Date(),
      updatedAt: new Date(),
      dgFeedbacks: [],
      revisionHistory: []
    };
    
    console.log('\n📝 === AJOUT DU DRAFT AU WORKFLOW ===');
    
    // 5. Ajouter le draft au workflow
    const updateResult = await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      {
        $push: { responseDrafts: testDraft },
        $set: { 
          currentStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log('✅ Draft ajouté au workflow avec succès !');
      
      // 6. Mettre à jour le statut de la correspondance
      const correspUpdateResult = await db.collection('correspondances').updateOne(
        { _id: new mongoose.Types.ObjectId(workflow.correspondanceId) },
        {
          $set: {
            workflowStatus: 'DIRECTOR_DRAFT',
            updatedAt: new Date()
          }
        }
      );
      
      if (correspUpdateResult.modifiedCount === 1) {
        console.log('✅ Statut correspondance mis à jour !');
      }
      
      // 7. Vérifier le résultat
      console.log('\n🔍 === VÉRIFICATION ===');
      
      const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
        _id: workflow._id
      });
      
      console.log(`📊 Workflow mis à jour:`);
      console.log(`   - Status: ${updatedWorkflow.currentStatus}`);
      console.log(`   - Drafts: ${updatedWorkflow.responseDrafts?.length || 0}`);
      
      if (updatedWorkflow.responseDrafts && updatedWorkflow.responseDrafts.length > 0) {
        const draft = updatedWorkflow.responseDrafts[0];
        console.log(`📝 Draft créé:`);
        console.log(`   - Status: ${draft.status}`);
        console.log(`   - DirectorName: ${draft.directorName}`);
        console.log(`   - Content length: ${draft.responseContent?.length || 0} caractères`);
      }
      
      // 8. Tester le service DG
      console.log('\n🧪 === TEST SERVICE DG AVEC DRAFT ===');
      
      try {
        const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
        
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(workflow.directeurGeneral);
        
        console.log(`📊 Service DG avec draft: ${dgTasks.length} correspondances`);
        
        const correspWithDraft = dgTasks.find(c => c._id.toString() === workflow.correspondanceId.toString());
        
        if (correspWithDraft) {
          console.log(`✅ Correspondance trouvée avec draft !`);
          console.log(`   - Drafts: ${correspWithDraft.responseDrafts?.length || 0}`);
          console.log(`   - WorkflowStatus: ${correspWithDraft.workflowStatus}`);
          
          if (correspWithDraft.responseDrafts && correspWithDraft.responseDrafts.length > 0) {
            const draft = correspWithDraft.responseDrafts[0];
            console.log(`   - Draft status: ${draft.status}`);
            console.log(`   - Draft director: ${draft.directorName}`);
          }
        } else {
          console.log('❌ Correspondance avec draft non trouvée dans le service DG');
        }
        
      } catch (serviceError) {
        console.error('❌ Erreur service DG:', serviceError.message);
      }
      
      // 9. Tester le compteur dashboard
      console.log('\n📊 === TEST COMPTEUR DASHBOARD ===');
      
      try {
        const DirectorGeneralService = require('./src/services/directorGeneralService');
        
        const pendingCount = await DirectorGeneralService.getPendingDraftsCount(workflow.directeurGeneral);
        
        console.log(`📊 Compteur après création draft: ${pendingCount}`);
        
        if (pendingCount > 0) {
          console.log('✅ Compteur fonctionne ! Le draft est détecté.');
        } else {
          console.log('❌ Compteur ne détecte pas le draft');
        }
        
      } catch (counterError) {
        console.error('❌ Erreur compteur:', counterError.message);
      }
      
      console.log('\n🎉 === DRAFT DE TEST CRÉÉ AVEC SUCCÈS ===');
      console.log('🎯 Actions suivantes:');
      console.log('1. Redémarrer le serveur backend');
      console.log('2. Tester l\'interface DG - le compteur devrait afficher 1');
      console.log('3. Vérifier la section "Propositions de Réponse à Réviser"');
      console.log('4. Tester l\'approbation du draft');
      
    } else {
      console.log('❌ Échec de l\'ajout du draft au workflow');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createTestDraftComplete();
