const mongoose = require('mongoose');

async function debugDGDraftVisibility() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC VISIBILITÉ DRAFTS DG ===\n');
    
    // 1. Vérifier les utilisateurs DG
    const dgUsers = await db.collection('users').find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DG'] }
    }).toArray();
    
    console.log(`👑 Directeurs Généraux trouvés: ${dgUsers.length}`);
    dgUsers.forEach((dg, index) => {
      console.log(`   ${index + 1}. ${dg.firstName} ${dg.lastName} (${dg.email})`);
      console.log(`      - ID: ${dg._id}`);
      console.log(`      - Role: ${dg.role}`);
    });
    
    if (dgUsers.length === 0) {
      console.log('❌ Aucun Directeur Général trouvé !');
      console.log('💡 Créez d\'abord un utilisateur avec le rôle DIRECTEUR_GENERAL');
      process.exit(1);
    }
    
    // 2. Vérifier les workflows avec drafts
    const workflows = await db.collection('correspondenceworkflows').find({
      'responseDrafts.0': { $exists: true }
    }).toArray();
    
    console.log(`\n📋 Workflows avec drafts: ${workflows.length}`);
    
    if (workflows.length === 0) {
      console.log('❌ Aucun workflow avec draft trouvé');
      console.log('💡 Créez d\'abord un draft via l\'interface directeur');
      process.exit(1);
    }
    
    // 3. Analyser chaque workflow
    for (const workflow of workflows) {
      console.log(`\n🔄 Workflow: ${workflow._id}`);
      console.log(`   CorrespondanceId: ${workflow.correspondanceId}`);
      console.log(`   CurrentStatus: ${workflow.currentStatus}`);
      console.log(`   DirecteurGeneral: ${workflow.directeurGeneral || 'NON DÉFINI'}`);
      console.log(`   AssignedDirector: ${workflow.assignedDirector || 'NON DÉFINI'}`);
      
      // Analyser les drafts
      const drafts = workflow.responseDrafts || [];
      console.log(`   Drafts: ${drafts.length}`);
      
      drafts.forEach((draft, index) => {
        console.log(`\n   📝 Draft ${index + 1}:`);
        console.log(`      - ID: ${draft.id}`);
        console.log(`      - Status: ${draft.status}`);
        console.log(`      - CreatedBy: ${draft.createdBy}`);
        console.log(`      - CreatedAt: ${draft.createdAt}`);
        console.log(`      - Content: "${draft.responseContent?.substring(0, 50)}..."`);
        
        // Vérifier les feedbacks DG
        if (draft.dgFeedbacks && draft.dgFeedbacks.length > 0) {
          console.log(`      - DG Feedbacks: ${draft.dgFeedbacks.length}`);
          draft.dgFeedbacks.forEach((feedback, fbIndex) => {
            console.log(`        ${fbIndex + 1}. Action: ${feedback.action}, By: ${feedback.userId}`);
          });
        } else {
          console.log(`      - DG Feedbacks: AUCUN`);
        }
      });
      
      // Vérifier si le DG est assigné au workflow
      const dgId = dgUsers[0]._id.toString();
      if (workflow.directeurGeneral === dgId) {
        console.log(`   ✅ DG correctement assigné au workflow`);
      } else {
        console.log(`   ❌ DG NON assigné au workflow`);
        console.log(`      - Attendu: ${dgId}`);
        console.log(`      - Trouvé: ${workflow.directeurGeneral}`);
      }
    }
    
    // 4. Vérifier les correspondances liées
    console.log(`\n📨 === CORRESPONDANCES LIÉES ===`);
    
    for (const workflow of workflows) {
      const correspondance = await db.collection('correspondances').findOne({
        _id: new mongoose.Types.ObjectId(workflow.correspondanceId)
      });
      
      if (correspondance) {
        console.log(`\n📧 Correspondance: ${correspondance.title || correspondance.subject}`);
        console.log(`   ID: ${correspondance._id}`);
        console.log(`   AssignedTo: ${correspondance.assignedTo || 'NON DÉFINI'}`);
        console.log(`   Status: ${correspondance.status}`);
        console.log(`   WorkflowStatus: ${correspondance.workflowStatus}`);
        
        // Vérifier si assignée au DG
        const dgId = dgUsers[0]._id.toString();
        if (correspondance.assignedTo === dgId) {
          console.log(`   ✅ Correspondance assignée au DG`);
        } else {
          console.log(`   ❌ Correspondance NON assignée au DG`);
          console.log(`      - AssignedTo: ${correspondance.assignedTo}`);
          console.log(`      - DG ID: ${dgId}`);
        }
      }
    }
    
    // 5. Tester la requête DG
    console.log(`\n🔍 === TEST REQUÊTE DG ===`);
    
    const dgId = dgUsers[0]._id;
    
    // Simuler la requête que fait le frontend pour le DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { directeurGeneral: dgId },
        { directeurGeneral: dgId.toString() },
        { 'responseDrafts.status': 'PENDING_DG_REVIEW' }
      ]
    }).toArray();
    
    console.log(`📊 Workflows visibles pour DG (${dgUsers[0].firstName}): ${dgWorkflows.length}`);
    
    if (dgWorkflows.length === 0) {
      console.log('❌ Aucun workflow visible pour le DG');
      console.log('🔧 PROBLÈMES POSSIBLES:');
      console.log('   1. DG non assigné aux workflows');
      console.log('   2. Drafts pas en status PENDING_DG_REVIEW');
      console.log('   3. Requête frontend incorrecte');
    } else {
      dgWorkflows.forEach((workflow, index) => {
        console.log(`   ${index + 1}. Workflow ${workflow._id}`);
        console.log(`      - Status: ${workflow.currentStatus}`);
        console.log(`      - Drafts pending: ${workflow.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW').length || 0}`);
      });
    }
    
    // 6. Recommandations de correction
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    const pendingDrafts = workflows.reduce((total, w) => {
      return total + (w.responseDrafts?.filter(d => d.status === 'PENDING_DG_REVIEW').length || 0);
    }, 0);
    
    console.log(`📊 Statistiques:`);
    console.log(`   - Workflows totaux: ${workflows.length}`);
    console.log(`   - Drafts en attente DG: ${pendingDrafts}`);
    console.log(`   - Workflows visibles DG: ${dgWorkflows.length}`);
    
    if (dgWorkflows.length < workflows.length) {
      console.log(`\n🔧 CORRECTIONS NÉCESSAIRES:`);
      console.log(`1. Assigner le DG aux workflows manquants`);
      console.log(`2. Vérifier le status des drafts`);
      console.log(`3. Corriger la requête frontend`);
    } else {
      console.log(`\n✅ SYSTÈME OPÉRATIONNEL`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGDraftVisibility();
