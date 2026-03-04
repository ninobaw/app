const mongoose = require('mongoose');

async function testCreateDraftNow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST CRÉATION DRAFT IMMÉDIAT ===\n');
    
    // 1. Trouver le workflow existant
    const workflow = await db.collection('correspondenceworkflows').findOne({});
    if (!workflow) {
      console.log('❌ Aucun workflow trouvé');
      process.exit(1);
    }
    
    console.log(`📋 Workflow trouvé: ${workflow._id}`);
    console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
    console.log(`   Status: ${workflow.currentStatus}`);
    console.log(`   DG: ${workflow.directeurGeneral}`);
    console.log(`   Drafts actuels: ${workflow.responseDrafts?.length || 0}`);
    
    // 2. Trouver un directeur
    const directeur = await db.collection('users').findOne({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    if (!directeur) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Directeur: ${directeur.firstName} ${directeur.lastName}`);
    
    // 3. Créer un draft directement dans le workflow
    const newDraft = {
      id: new mongoose.Types.ObjectId().toString(),
      directorId: directeur._id,
      directorName: `${directeur.firstName} ${directeur.lastName}`,
      directorate: directeur.directorate || 'GENERAL',
      responseContent: 'Ceci est une proposition de réponse de test créée pour vérifier la visibilité DG. Le contenu est suffisamment long pour être représentatif d\'une vraie réponse.',
      attachments: [],
      comments: 'Test automatique - création draft pour visibilité DG',
      isUrgent: false,
      status: 'PENDING_DG_REVIEW', // ✅ STATUS CRITIQUE
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\n📝 Ajout du draft au workflow...');
    
    // Ajouter le draft au workflow
    const updatedWorkflow = await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      { 
        $push: { responseDrafts: newDraft },
        $set: { 
          currentStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Draft ajouté au workflow');
    console.log(`📊 Résultat update: ${updatedWorkflow.modifiedCount} document modifié`);
    
    // 4. Vérifier le workflow mis à jour
    const verifyWorkflow = await db.collection('correspondenceworkflows').findOne({
      _id: workflow._id
    });
    
    console.log('\n🔍 Vérification workflow mis à jour:');
    console.log(`   Status: ${verifyWorkflow.currentStatus}`);
    console.log(`   Drafts: ${verifyWorkflow.responseDrafts?.length || 0}`);
    
    if (verifyWorkflow.responseDrafts && verifyWorkflow.responseDrafts.length > 0) {
      const draft = verifyWorkflow.responseDrafts[0];
      console.log(`   Draft status: ${draft.status}`);
      console.log(`   Draft directeur: ${draft.directorName}`);
      console.log(`   Draft contenu: "${draft.responseContent?.substring(0, 50)}..."`);
    }
    
    // 5. Tester immédiatement la requête DG
    console.log('\n👑 === TEST IMMÉDIAT REQUÊTE DG ===');
    
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { directeurGeneral: dg._id },
        { directeurGeneral: dg._id.toString() },
        { 'responseDrafts.status': 'PENDING_DG_REVIEW' }
      ]
    }).toArray();
    
    console.log(`📊 Workflows visibles pour DG: ${dgWorkflows.length}`);
    
    if (dgWorkflows.length > 0) {
      console.log('✅ SUCCESS: Le draft est maintenant visible pour le DG !');
      
      dgWorkflows.forEach((wf, index) => {
        const pendingDrafts = wf.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW') || [];
        console.log(`   ${index + 1}. Workflow ${wf._id}`);
        console.log(`      - Status: ${wf.currentStatus}`);
        console.log(`      - Drafts en attente: ${pendingDrafts.length}`);
        
        pendingDrafts.forEach((draft, dIndex) => {
          console.log(`      - Draft ${dIndex + 1}: ${draft.directorName} - "${draft.responseContent?.substring(0, 30)}..."`);
        });
      });
    } else {
      console.log('❌ ÉCHEC: Le draft n\'est toujours pas visible');
    }
    
    // 6. Tester le service DG
    console.log('\n🌐 === TEST SERVICE DG ===');
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      
      const serviceResult = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id.toString());
      
      console.log(`📊 Service DG résultat: ${serviceResult.length} correspondances`);
      
      if (serviceResult.length > 0) {
        console.log('✅ SUCCESS: Service DG fonctionne !');
        serviceResult.forEach((corresp, index) => {
          console.log(`   ${index + 1}. ${corresp.title || corresp.subject}`);
          console.log(`      - Drafts: ${corresp.responseDrafts?.length || 0}`);
          console.log(`      - Workflow status: ${corresp.workflowStatus}`);
        });
      } else {
        console.log('❌ Service DG ne retourne toujours rien');
      }
      
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    console.log('\n🎉 === TEST TERMINÉ ===');
    console.log('✅ Draft créé et testé');
    console.log('💡 Maintenant, testez l\'interface DG dans le navigateur');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testCreateDraftNow();
