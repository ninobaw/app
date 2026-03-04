const mongoose = require('mongoose');

async function debugOutgoingCorrespondances() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC CORRESPONDANCES SORTANTES ===\n');
    
    // 1. Vérifier toutes les correspondances par type
    const correspondances = await db.collection('correspondances').find({}).toArray();
    
    const stats = {
      total: correspondances.length,
      incoming: correspondances.filter(c => c.type === 'INCOMING').length,
      outgoing: correspondances.filter(c => c.type === 'OUTGOING').length,
      withResponse: correspondances.filter(c => c.finalResponse).length,
      withOutgoingId: correspondances.filter(c => c.outgoingCorrespondanceId).length
    };
    
    console.log('📊 Statistiques correspondances:');
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - INCOMING: ${stats.incoming}`);
    console.log(`   - OUTGOING: ${stats.outgoing}`);
    console.log(`   - Avec finalResponse: ${stats.withResponse}`);
    console.log(`   - Avec outgoingCorrespondanceId: ${stats.withOutgoingId}`);
    
    // 2. Examiner les correspondances OUTGOING
    const outgoingCorrespondances = correspondances.filter(c => c.type === 'OUTGOING');
    
    if (outgoingCorrespondances.length > 0) {
      console.log(`\n📤 Correspondances OUTGOING trouvées: ${outgoingCorrespondances.length}`);
      
      outgoingCorrespondances.forEach((corresp, index) => {
        console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - ID: ${corresp._id}`);
        console.log(`      - Type: ${corresp.type}`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - WorkflowStatus: ${corresp.workflowStatus}`);
        console.log(`      - CreatedBy: ${corresp.createdBy}`);
        console.log(`      - AssignedTo: ${corresp.assignedTo}`);
        console.log(`      - ParentId: ${corresp.parentCorrespondanceId}`);
        console.log(`      - ResponseToId: ${corresp.responseToCorrespondanceId}`);
        console.log(`      - CreatedAt: ${corresp.createdAt}`);
        console.log(`      - DeliveryMethod: ${corresp.deliveryMethod}`);
        console.log(`      - Metadata.isResponse: ${corresp.metadata?.isResponse}`);
      });
    } else {
      console.log('\n❌ Aucune correspondance OUTGOING trouvée');
      console.log('💡 Les correspondances de réponse ne sont pas créées ou ont un problème de type');
    }
    
    // 3. Vérifier les correspondances avec finalResponse
    const correspondancesWithResponse = correspondances.filter(c => c.finalResponse);
    
    if (correspondancesWithResponse.length > 0) {
      console.log(`\n✅ Correspondances avec finalResponse: ${correspondancesWithResponse.length}`);
      
      correspondancesWithResponse.forEach((corresp, index) => {
        console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
        console.log(`      - ID: ${corresp._id}`);
        console.log(`      - OutgoingId: ${corresp.outgoingCorrespondanceId || 'Non défini'}`);
        console.log(`      - FinalResponse.id: ${corresp.finalResponse.id}`);
        console.log(`      - FinalResponse.status: ${corresp.finalResponse.status}`);
        console.log(`      - FinalResponse.sentAt: ${corresp.finalResponse.sentAt}`);
      });
    }
    
    // 4. Vérifier les enregistrements Response
    const responses = await db.collection('responses').find({}).toArray();
    console.log(`\n📋 Enregistrements Response: ${responses.length}`);
    
    if (responses.length > 0) {
      responses.forEach((response, index) => {
        console.log(`\n   ${index + 1}. Response ${response._id}`);
        console.log(`      - CorrespondanceId: ${response.correspondanceId}`);
        console.log(`      - SupervisorId: ${response.supervisorId}`);
        console.log(`      - Status: ${response.status}`);
        console.log(`      - DeliveryStatus: ${response.deliveryStatus}`);
        console.log(`      - SentAt: ${response.sentAt}`);
        console.log(`      - Content: "${response.content?.substring(0, 50)}..."`);
      });
    }
    
    // 5. Vérifier les filtres de la liste des correspondances
    console.log(`\n🔍 === ANALYSE FILTRES LISTE CORRESPONDANCES ===`);
    
    // Simuler les filtres typiques de la liste
    const visibleForUser = correspondances.filter(c => {
      // Filtres typiques qui pourraient cacher les correspondances OUTGOING
      return (
        c.type === 'INCOMING' || // Filtre sur type
        c.status !== 'REPLIED' || // Filtre sur status
        c.workflowStatus !== 'RESPONSE_SENT' // Filtre sur workflowStatus
      );
    });
    
    console.log(`📊 Correspondances visibles avec filtres typiques: ${visibleForUser.length}/${correspondances.length}`);
    
    const hiddenCorrespondances = correspondances.filter(c => !visibleForUser.includes(c));
    if (hiddenCorrespondances.length > 0) {
      console.log(`\n🔍 Correspondances potentiellement cachées: ${hiddenCorrespondances.length}`);
      hiddenCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. ${corresp.title || corresp.subject} (${corresp.type})`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - WorkflowStatus: ${corresp.workflowStatus}`);
      });
    }
    
    // 6. Recommandations
    console.log(`\n💡 === RECOMMANDATIONS ===`);
    
    if (outgoingCorrespondances.length === 0) {
      console.log('1. ❌ Aucune correspondance OUTGOING trouvée');
      console.log('   → Vérifier que la méthode createOutgoingCorrespondance fonctionne');
      console.log('   → Vérifier les logs lors de la finalisation');
    }
    
    if (outgoingCorrespondances.length > 0) {
      console.log('2. ✅ Correspondances OUTGOING créées');
      console.log('   → Vérifier les filtres de la liste des correspondances');
      console.log('   → Vérifier que le type OUTGOING est inclus dans les requêtes');
    }
    
    console.log('3. 🔧 Actions à vérifier:');
    console.log('   → Frontend: Inclure type OUTGOING dans les filtres');
    console.log('   → Backend: Vérifier la route de liste des correspondances');
    console.log('   → Interface: Ajouter un onglet "Réponses envoyées"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugOutgoingCorrespondances();
