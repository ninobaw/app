const mongoose = require('mongoose');

async function debugNewCorrespondanceDG() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC NOUVELLE CORRESPONDANCE DG ===\n');
    
    // 1. Trouver la correspondance la plus récente
    const correspondances = await db.collection('correspondances').find({}).sort({ createdAt: -1 }).toArray();
    
    if (correspondances.length === 0) {
      console.log('❌ Aucune correspondance trouvée');
      process.exit(1);
    }
    
    const latestCorrespondance = correspondances[0];
    console.log(`📄 Correspondance la plus récente: "${latestCorrespondance.objet || latestCorrespondance.subject}"`);
    console.log(`   - ID: ${latestCorrespondance._id}`);
    console.log(`   - Status: ${latestCorrespondance.workflowStatus}`);
    console.log(`   - Assignée à: ${latestCorrespondance.assignedTo}`);
    console.log(`   - Créée le: ${latestCorrespondance.createdAt}`);
    console.log(`   - Drafts: ${latestCorrespondance.responseDrafts?.length || 0}`);
    
    // 2. Vérifier le workflow associé
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: latestCorrespondance._id
    });
    
    if (!workflow) {
      console.log('\n❌ PROBLÈME: Aucun workflow trouvé pour cette correspondance');
      console.log('🔧 Solution: Créer un workflow pour cette correspondance');
      process.exit(1);
    }
    
    console.log(`\n🔄 Workflow trouvé: ${workflow._id}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
    console.log(`   - DG: ${workflow.directeurGeneral}`);
    console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
    
    // 3. Vérifier le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('\n❌ PROBLÈME: Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`\n👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    
    // 4. Vérifier si le DG est bien assigné au workflow
    const dgInWorkflow = workflow.directeurGeneral?.toString() === dg._id.toString();
    console.log(`   - DG assigné au workflow: ${dgInWorkflow ? '✅' : '❌'}`);
    
    if (!dgInWorkflow) {
      console.log('\n❌ PROBLÈME: Le DG n\'est pas assigné à ce workflow');
      console.log('🔧 Solution: Assigner le DG au workflow');
    }
    
    // 5. Vérifier les directeurs assignés
    const assignedDirectorId = workflow.assignedDirector;
    console.log(`\n👤 Directeur assigné ID: ${assignedDirectorId}`);
    
    let assignedDirector = null;
    if (assignedDirectorId) {
      // Essayer de trouver le directeur
      if (mongoose.Types.ObjectId.isValid(assignedDirectorId)) {
        assignedDirector = await db.collection('users').findOne({ 
          _id: new mongoose.Types.ObjectId(assignedDirectorId) 
        });
      } else {
        assignedDirector = await db.collection('users').findOne({ _id: assignedDirectorId });
      }
    }
    
    if (assignedDirector) {
      console.log(`   - Nom: ${assignedDirector.firstName} ${assignedDirector.lastName}`);
      console.log(`   - Rôle: ${assignedDirector.role}`);
      console.log(`   - Email: ${assignedDirector.email}`);
    } else {
      console.log('   - ❌ Directeur assigné non trouvé');
    }
    
    // 6. Analyser les messages du chat
    if (workflow.chatMessages && workflow.chatMessages.length > 0) {
      console.log(`\n💬 Messages dans le chat: ${workflow.chatMessages.length}`);
      
      workflow.chatMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. De: ${msg.from} → Vers: ${msg.to}`);
        console.log(`      Message: "${msg.message?.substring(0, 50) || 'Vide'}..."`);
        console.log(`      Date: ${msg.timestamp}`);
        
        // Vérifier si c'est pour le DG
        const isForDG = msg.to?.toString() === dg._id.toString();
        const isFromDG = msg.from?.toString() === dg._id.toString();
        console.log(`      Pour DG: ${isForDG ? '✅' : '❌'} | Du DG: ${isFromDG ? '✅' : '❌'}`);
      });
    } else {
      console.log('\n💬 Aucun message dans le chat');
    }
    
    // 7. Vérifier les drafts de réponse
    if (latestCorrespondance.responseDrafts && latestCorrespondance.responseDrafts.length > 0) {
      console.log(`\n📝 Drafts de réponse: ${latestCorrespondance.responseDrafts.length}`);
      
      latestCorrespondance.responseDrafts.forEach((draft, index) => {
        console.log(`   Draft ${index + 1}:`);
        console.log(`      - Directeur: ${draft.directorName || 'Non spécifié'}`);
        console.log(`      - Status: ${draft.status}`);
        console.log(`      - Contenu: "${draft.responseContent?.substring(0, 50) || 'Vide'}..."`);
        console.log(`      - Feedbacks DG: ${draft.dgFeedbacks?.length || 0}`);
        console.log(`      - Créé le: ${draft.createdAt}`);
      });
    } else {
      console.log('\n📝 Aucun draft de réponse');
    }
    
    // 8. Diagnostic des problèmes possibles
    console.log('\n🔍 === DIAGNOSTIC DES PROBLÈMES ===\n');
    
    const problems = [];
    const solutions = [];
    
    if (!dgInWorkflow) {
      problems.push('DG non assigné au workflow');
      solutions.push('Assigner le DG au workflow');
    }
    
    if (workflow.currentStatus !== 'DIRECTOR_DRAFT' && workflow.currentStatus !== 'DG_REVIEW') {
      problems.push(`Status workflow incorrect: ${workflow.currentStatus}`);
      solutions.push('Mettre le status à DIRECTOR_DRAFT ou DG_REVIEW');
    }
    
    if (!latestCorrespondance.responseDrafts || latestCorrespondance.responseDrafts.length === 0) {
      problems.push('Aucun draft de réponse créé');
      solutions.push('Créer un draft de réponse pour que le DG puisse le voir');
    }
    
    const messagesForDG = workflow.chatMessages?.filter(msg => 
      msg.to?.toString() === dg._id.toString()
    ) || [];
    
    if (messagesForDG.length === 0) {
      problems.push('Aucun message destiné au DG');
      solutions.push('Vérifier le routing des messages dans le chat');
    }
    
    if (problems.length > 0) {
      console.log('❌ Problèmes identifiés:');
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
      
      console.log('\n🔧 Solutions proposées:');
      solutions.forEach((solution, index) => {
        console.log(`   ${index + 1}. ${solution}`);
      });
    } else {
      console.log('✅ Aucun problème évident détecté');
    }
    
    // 9. Test de visibilité pour le DG
    console.log('\n🧪 === TEST VISIBILITÉ DG ===\n');
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id,
      currentStatus: { $in: ['DIRECTOR_DRAFT', 'DG_REVIEW'] }
    }).toArray();
    
    console.log(`📋 Workflows visibles pour le DG: ${dgWorkflows.length}`);
    
    dgWorkflows.forEach(wf => {
      console.log(`   - ${wf._id}: ${wf.currentStatus} (Messages: ${wf.chatMessages?.length || 0})`);
    });
    
    if (dgWorkflows.length === 0) {
      console.log('❌ Le DG ne voit aucun workflow en attente');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugNewCorrespondanceDG();
