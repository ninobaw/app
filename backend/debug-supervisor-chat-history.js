const mongoose = require('mongoose');

async function debugSupervisorChatHistory() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC HISTORIQUE CHAT SUPERVISEUR ===\n');
    
    // 1. Trouver une correspondance avec status DG_APPROVED
    const correspondances = await db.collection('correspondances').find({
      workflowStatus: 'DG_APPROVED'
    }).toArray();
    
    console.log(`📄 Correspondances DG_APPROVED trouvées: ${correspondances.length}`);
    
    if (correspondances.length === 0) {
      console.log('❌ Aucune correspondance DG_APPROVED trouvée');
      console.log('💡 Créez une correspondance et faites-la approuver par le DG d\'abord');
      process.exit(1);
    }
    
    const testCorrespondance = correspondances[0];
    console.log(`\n📋 Test avec correspondance: "${testCorrespondance.title || testCorrespondance.subject}"`);
    console.log(`   - ID: ${testCorrespondance._id}`);
    console.log(`   - Status: ${testCorrespondance.workflowStatus}`);
    console.log(`   - Drafts: ${testCorrespondance.responseDrafts?.length || 0}`);
    
    // 2. Chercher le workflow correspondant
    const workflows = await db.collection('correspondenceworkflows').find({
      correspondanceId: testCorrespondance._id
    }).toArray();
    
    console.log(`\n🔄 Workflows trouvés: ${workflows.length}`);
    
    if (workflows.length === 0) {
      console.log('❌ Aucun workflow trouvé pour cette correspondance');
      console.log('💡 Le workflow n\'a pas été créé correctement');
      process.exit(1);
    }
    
    const workflow = workflows[0];
    console.log(`\n📋 Workflow: ${workflow._id}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
    console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
    console.log(`   - DG: ${workflow.directeurGeneral}`);
    
    // 3. Examiner les messages du chat
    if (workflow.chatMessages && workflow.chatMessages.length > 0) {
      console.log(`\n💬 Messages dans le workflow:`);
      workflow.chatMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.from} → ${msg.to}`);
        console.log(`      Message: "${msg.message?.substring(0, 50)}..."`);
        console.log(`      Date: ${msg.timestamp}`);
        console.log(`      FromName: ${msg.fromName || 'Non défini'}`);
        console.log(`      FromRole: ${msg.fromRole || 'Non défini'}`);
      });
    } else {
      console.log('\n💬 Aucun message dans le workflow');
    }
    
    // 4. Tester les routes API que le frontend utilise
    console.log('\n🧪 === TEST ROUTES API ===\n');
    
    // Test route 1: GET /api/workflow-chat/by-correspondance/:correspondanceId
    console.log(`1. Test route: GET /api/workflow-chat/by-correspondance/${testCorrespondance._id}`);
    
    // Simuler la logique de la route
    const workflowByCorrespondance = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: testCorrespondance._id
    });
    
    if (workflowByCorrespondance) {
      console.log(`   ✅ Workflow trouvé: ${workflowByCorrespondance._id}`);
      
      // Test route 2: GET /api/workflow-chat/:workflowId/messages
      console.log(`\n2. Test route: GET /api/workflow-chat/${workflowByCorrespondance._id}/messages`);
      
      const messages = workflowByCorrespondance.chatMessages || [];
      console.log(`   ✅ Messages trouvés: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log(`\n📋 Structure des messages:`);
        messages.forEach((msg, index) => {
          console.log(`   Message ${index + 1}:`);
          console.log(`      - from: ${msg.from}`);
          console.log(`      - to: ${msg.to}`);
          console.log(`      - message: "${msg.message}"`);
          console.log(`      - timestamp: ${msg.timestamp}`);
          console.log(`      - fromName: ${msg.fromName}`);
          console.log(`      - fromRole: ${msg.fromRole}`);
          console.log(`      - messageType: ${msg.messageType}`);
        });
      }
    } else {
      console.log(`   ❌ Aucun workflow trouvé pour correspondance ${testCorrespondance._id}`);
    }
    
    // 5. Vérifier les permissions d'accès
    console.log('\n🔐 === VÉRIFICATION PERMISSIONS ===\n');
    
    const supervisors = await db.collection('users').find({
      role: 'SUPERVISEUR_BUREAU_ORDRE'
    }).toArray();
    
    console.log(`👥 Superviseurs bureau d'ordre: ${supervisors.length}`);
    supervisors.forEach(sup => {
      console.log(`   - ${sup.firstName} ${sup.lastName} (${sup._id})`);
    });
    
    // 6. Vérifier si le superviseur a accès au workflow
    if (supervisors.length > 0 && workflowByCorrespondance) {
      const supervisor = supervisors[0];
      console.log(`\n🧪 Test accès superviseur: ${supervisor.firstName} ${supervisor.lastName}`);
      
      // Logique d'autorisation de workflowChatRoutes.js
      const hasAccess = (
        workflowByCorrespondance.currentStatus === 'DG_APPROVED' ||
        supervisor.role === 'SUPER_ADMIN' ||
        supervisor.role === 'SUPERVISEUR_BUREAU_ORDRE'
      );
      
      console.log(`   - Status workflow: ${workflowByCorrespondance.currentStatus}`);
      console.log(`   - Rôle superviseur: ${supervisor.role}`);
      console.log(`   - Accès autorisé: ${hasAccess ? '✅' : '❌'}`);
    }
    
    console.log('\n🎯 === RÉSUMÉ DIAGNOSTIC ===');
    console.log(`1. Correspondances DG_APPROVED: ${correspondances.length}`);
    console.log(`2. Workflows trouvés: ${workflows.length}`);
    console.log(`3. Messages dans workflow: ${workflow.chatMessages?.length || 0}`);
    console.log(`4. Superviseurs disponibles: ${supervisors.length}`);
    
    if (workflow.chatMessages?.length === 0) {
      console.log('\n❌ PROBLÈME: Aucun message dans le workflow');
      console.log('💡 Les messages ne sont pas sauvegardés dans le workflow');
      console.log('💡 Vérifiez que les messages sont bien ajoutés lors des échanges directeur ↔ DG');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugSupervisorChatHistory();
