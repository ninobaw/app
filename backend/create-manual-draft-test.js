const mongoose = require('mongoose');

async function createManualDraftTest() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔧 === CRÉATION MANUELLE DRAFT DE TEST ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Prendre le premier workflow
    const workflow = await db.collection('correspondenceworkflows').findOne({
      currentStatus: 'ASSIGNED_TO_DIRECTOR'
    });
    
    if (!workflow) {
      console.log('❌ Aucun workflow ASSIGNED_TO_DIRECTOR trouvé');
      process.exit(1);
    }
    
    console.log(`🔄 Workflow sélectionné: ${workflow._id}`);
    console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
    console.log(`   AssignedDirector: ${workflow.assignedDirector}`);
    
    // 2. Trouver le directeur
    const director = await db.collection('users').findOne({
      _id: workflow.assignedDirector
    });
    
    if (!director) {
      console.log('❌ Directeur non trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName}`);
    
    // 3. Créer un draft de test
    const testDraft = {
      id: new mongoose.Types.ObjectId(),
      directorId: workflow.assignedDirector,
      directorName: `${director.firstName} ${director.lastName}`,
      directorate: director.directorate || 'Direction',
      responseContent: `Proposition de réponse créée manuellement pour test de l'interface DG.\n\nObjet: Test validation système\n\nProposition:\n\n1. Accusé de réception de la demande\n2. Analyse des éléments fournis\n3. Proposition de solution adaptée\n4. Délais de mise en œuvre\n\nCette proposition nécessite l'approbation du Directeur Général.\n\nCordialement,\n${director.firstName} ${director.lastName}\n${director.directorate || 'Direction'}`,
      comments: 'Draft créé manuellement pour tester l\'interface DG - Badge, mise en évidence et boutons d\'approbation',
      status: 'PENDING_DG_REVIEW',
      createdAt: new Date(),
      updatedAt: new Date(),
      dgFeedbacks: [],
      revisionHistory: []
    };
    
    console.log('\n📝 === AJOUT DRAFT AU WORKFLOW ===');
    
    // 4. Ajouter le draft et changer le statut
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
      console.log('✅ Draft ajouté au workflow !');
      
      // 5. Synchroniser la correspondance
      const correspUpdate = await db.collection('correspondances').updateOne(
        { _id: workflow.correspondanceId },
        {
          $set: {
            workflowStatus: 'DIRECTOR_DRAFT',
            updatedAt: new Date()
          }
        }
      );
      
      if (correspUpdate.modifiedCount === 1) {
        console.log('✅ Correspondance synchronisée !');
      }
      
      // 6. Vérifier le résultat
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
      
      // 7. Tester le service DG
      console.log('\n🧪 === TEST SERVICE DG AVEC DRAFT ===');
      
      try {
        const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
        const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
        
        const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
        
        console.log(`📊 Service DG: ${dgTasks.length} correspondances`);
        
        const correspWithDraft = dgTasks.find(c => 
          c._id.toString() === workflow.correspondanceId.toString()
        );
        
        if (correspWithDraft) {
          console.log(`✅ Correspondance avec draft trouvée !`);
          console.log(`   - WorkflowStatus: ${correspWithDraft.workflowStatus}`);
          console.log(`   - Drafts: ${correspWithDraft.responseDrafts?.length || 0}`);
          
          if (correspWithDraft.responseDrafts && correspWithDraft.responseDrafts.length > 0) {
            const draft = correspWithDraft.responseDrafts[0];
            console.log(`   - Draft status: ${draft.status}`);
            console.log(`   - Draft director: ${draft.directorName}`);
          }
        }
        
      } catch (serviceError) {
        console.error('❌ Erreur service DG:', serviceError.message);
      }
      
      // 8. Tester le compteur
      console.log('\n📊 === TEST COMPTEUR DASHBOARD ===');
      
      try {
        const DirectorGeneralService = require('./src/services/directorGeneralService');
        const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
        
        const pendingCount = await DirectorGeneralService.getPendingDraftsCount(dg._id);
        
        console.log(`📊 Compteur après création: ${pendingCount}`);
        
        if (pendingCount > 0) {
          console.log('✅ SUCCÈS ! Le compteur détecte le draft');
        } else {
          console.log('❌ Le compteur ne détecte pas le draft');
        }
        
      } catch (counterError) {
        console.error('❌ Erreur compteur:', counterError.message);
      }
      
      console.log('\n🎯 === RÉSULTAT ATTENDU INTERFACE DG ===');
      console.log('✅ Compteur dashboard: 1 (au lieu de 0)');
      console.log('✅ Badge: "1 proposition(s) 🔔"');
      console.log('✅ Mise en évidence: Bordure ambre + fond ambre');
      console.log('✅ Boutons d\'approbation: Visibles dans le chat');
      console.log('✅ Status: DIRECTOR_DRAFT');
      
      console.log('\n🎯 === ACTIONS IMMÉDIATES ===');
      console.log('1. Redémarrer le serveur backend');
      console.log('2. Se connecter en tant que DG');
      console.log('3. Vérifier le dashboard - compteur doit afficher 1');
      console.log('4. Aller dans "Révision Propositions"');
      console.log('5. Vérifier la mise en évidence et les badges');
      console.log('6. Ouvrir la correspondance et tester les boutons');
      
    } else {
      console.log('❌ Échec ajout draft');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createManualDraftTest();
