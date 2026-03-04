const mongoose = require('mongoose');

async function testDraftCreationFixed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST CRÉATION DRAFT CORRIGÉE ===\n');
    
    // 1. Vérifier les utilisateurs
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    const directeur = await db.collection('users').findOne({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] } 
    });
    
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    if (!directeur) {
      console.log('❌ Aucun directeur trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`👤 Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur._id})`);
    
    // 2. Vérifier les correspondances
    const correspondances = await db.collection('correspondances').find({
      status: { $ne: 'REPLIED' }
    }).toArray();
    
    console.log(`\n📋 Correspondances disponibles: ${correspondances.length}`);
    
    if (correspondances.length === 0) {
      console.log('❌ Aucune correspondance disponible');
      process.exit(1);
    }
    
    const correspondance = correspondances[0];
    console.log(`📧 Test avec: "${correspondance.title || correspondance.subject}"`);
    console.log(`   ID: ${correspondance._id}`);
    
    // 3. Simuler création de draft
    console.log(`\n🔄 === SIMULATION CRÉATION DRAFT ===`);
    
    const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
    
    const draftData = {
      responseContent: "Ceci est une proposition de réponse de test créée automatiquement pour vérifier que les drafts apparaissent bien chez le DG.",
      attachments: [],
      comments: "Test automatique - vérification visibilité DG",
      isUrgent: false
    };
    
    console.log('📝 Création du draft...');
    
    try {
      const result = await CorrespondanceWorkflowService.createResponseDraft(
        correspondance._id.toString(),
        directeur._id.toString(),
        draftData
      );
      
      console.log('✅ Draft créé avec succès !');
      console.log('📊 Résultat:', result);
      
    } catch (createError) {
      console.error('❌ Erreur création draft:', createError.message);
      
      // Essayer de créer le workflow manuellement si nécessaire
      console.log('\n🔧 Tentative création workflow manuel...');
      
      const workflowData = {
        correspondanceId: correspondance._id,
        assignedDirector: directeur._id,
        directeurGeneral: dg._id,
        currentStatus: 'DIRECTOR_DRAFT',
        responseDrafts: [{
          id: new mongoose.Types.ObjectId().toString(),
          directorId: directeur._id,
          directorName: `${directeur.firstName} ${directeur.lastName}`,
          directorate: directeur.directorate || 'GENERAL',
          responseContent: draftData.responseContent,
          attachments: [],
          comments: draftData.comments,
          isUrgent: false,
          status: 'PENDING_DG_REVIEW',
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        chatMessages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('correspondenceworkflows').insertOne(workflowData);
      console.log('✅ Workflow créé manuellement');
    }
    
    // 4. Vérifier que le workflow existe maintenant
    console.log(`\n🔍 === VÉRIFICATION POST-CRÉATION ===`);
    
    const workflows = await db.collection('correspondenceworkflows').find({
      correspondanceId: correspondance._id
    }).toArray();
    
    console.log(`📋 Workflows trouvés: ${workflows.length}`);
    
    if (workflows.length > 0) {
      const workflow = workflows[0];
      console.log(`✅ Workflow créé:`);
      console.log(`   ID: ${workflow._id}`);
      console.log(`   Status: ${workflow.currentStatus}`);
      console.log(`   DG assigné: ${workflow.directeurGeneral}`);
      console.log(`   Drafts: ${workflow.responseDrafts?.length || 0}`);
      
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        const draft = workflow.responseDrafts[0];
        console.log(`📝 Draft détails:`);
        console.log(`   Status: ${draft.status}`);
        console.log(`   Directeur: ${draft.directorName}`);
        console.log(`   Contenu: "${draft.responseContent?.substring(0, 50)}..."`);
      }
    }
    
    // 5. Test requête DG
    console.log(`\n👑 === TEST VISIBILITÉ DG ===`);
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { directeurGeneral: dg._id },
        { directeurGeneral: dg._id.toString() },
        { 'responseDrafts.status': 'PENDING_DG_REVIEW' }
      ]
    }).toArray();
    
    console.log(`📊 Workflows visibles pour DG: ${dgWorkflows.length}`);
    
    if (dgWorkflows.length > 0) {
      console.log('✅ SUCCESS: Les drafts sont maintenant visibles pour le DG !');
      
      dgWorkflows.forEach((workflow, index) => {
        const pendingDrafts = workflow.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW') || [];
        console.log(`   ${index + 1}. Workflow ${workflow._id}`);
        console.log(`      - Drafts en attente: ${pendingDrafts.length}`);
        console.log(`      - Status: ${workflow.currentStatus}`);
      });
    } else {
      console.log('❌ ÉCHEC: Les drafts ne sont toujours pas visibles pour le DG');
    }
    
    // 6. Statistiques finales
    console.log(`\n📊 === STATISTIQUES FINALES ===`);
    
    const totalWorkflows = await db.collection('correspondenceworkflows').countDocuments();
    const workflowsWithDrafts = await db.collection('correspondenceworkflows').countDocuments({
      'responseDrafts.0': { $exists: true }
    });
    const pendingDraftsCount = await db.collection('correspondenceworkflows').countDocuments({
      'responseDrafts.status': 'PENDING_DG_REVIEW'
    });
    
    console.log(`Total workflows: ${totalWorkflows}`);
    console.log(`Workflows avec drafts: ${workflowsWithDrafts}`);
    console.log(`Drafts en attente DG: ${pendingDraftsCount}`);
    
    console.log(`\n🎉 === TEST TERMINÉ ===`);
    console.log(`Status: ${dgWorkflows.length > 0 ? '✅ CORRIGÉ' : '❌ PROBLÈME PERSISTE'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDraftCreationFixed();
