const mongoose = require('mongoose');

async function testFinalizationComplete() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🧪 === TEST FINALISATION COMPLÈTE ===\n');
    
    // 1. Vérifier les correspondances avec finalResponse
    const correspondancesWithResponse = await db.collection('correspondances').find({
      finalResponse: { $exists: true }
    }).toArray();
    
    console.log(`📋 Correspondances avec finalResponse: ${correspondancesWithResponse.length}`);
    
    if (correspondancesWithResponse.length === 0) {
      console.log('❌ Aucune correspondance finalisée trouvée');
      console.log('💡 Finalisez d\'abord une correspondance via l\'interface superviseur');
      process.exit(1);
    }
    
    // 2. Pour chaque correspondance finalisée, vérifier la liaison
    for (const correspondance of correspondancesWithResponse) {
      console.log(`\n🔍 Test correspondance: "${correspondance.title || correspondance.subject}"`);
      console.log(`   ID: ${correspondance._id}`);
      console.log(`   Type: ${correspondance.type}`);
      console.log(`   Status: ${correspondance.status}`);
      console.log(`   WorkflowStatus: ${correspondance.workflowStatus}`);
      
      // Vérifier finalResponse
      const finalResponse = correspondance.finalResponse;
      if (finalResponse) {
        console.log(`   ✅ FinalResponse présente:`);
        console.log(`      - ID: ${finalResponse.id}`);
        console.log(`      - Status: ${finalResponse.status}`);
        console.log(`      - SentAt: ${finalResponse.sentAt}`);
        console.log(`      - DeliveryMethod: ${finalResponse.deliveryMethod}`);
        console.log(`      - RecipientEmail: ${finalResponse.recipientEmail}`);
      }
      
      // Vérifier outgoingCorrespondanceId
      if (correspondance.outgoingCorrespondanceId) {
        console.log(`   ✅ OutgoingCorrespondanceId: ${correspondance.outgoingCorrespondanceId}`);
        
        // Chercher la correspondance sortante
        const outgoingCorrespondance = await db.collection('correspondances').findOne({
          _id: new mongoose.Types.ObjectId(correspondance.outgoingCorrespondanceId)
        });
        
        if (outgoingCorrespondance) {
          console.log(`   ✅ Correspondance sortante trouvée:`);
          console.log(`      - Titre: ${outgoingCorrespondance.title}`);
          console.log(`      - Type: ${outgoingCorrespondance.type}`);
          console.log(`      - Subject: ${outgoingCorrespondance.subject}`);
          console.log(`      - Code: ${outgoingCorrespondance.code}`);
          console.log(`      - Priority: ${outgoingCorrespondance.priority}`);
          console.log(`      - ParentId: ${outgoingCorrespondance.parentCorrespondanceId}`);
          console.log(`      - ResponseToId: ${outgoingCorrespondance.responseToCorrespondanceId}`);
          console.log(`      - Tags: ${outgoingCorrespondance.tags?.join(', ') || 'Aucun'}`);
          
          // Vérifier la liaison bidirectionnelle
          if (outgoingCorrespondance.parentCorrespondanceId === correspondance._id.toString()) {
            console.log(`   ✅ Liaison bidirectionnelle correcte`);
          } else {
            console.log(`   ❌ Liaison bidirectionnelle incorrecte`);
          }
          
          // Vérifier les champs obligatoires
          const requiredFields = ['title', 'type', 'subject', 'content', 'priority'];
          const missingFields = requiredFields.filter(field => !outgoingCorrespondance[field]);
          
          if (missingFields.length === 0) {
            console.log(`   ✅ Tous les champs obligatoires présents`);
          } else {
            console.log(`   ❌ Champs manquants: ${missingFields.join(', ')}`);
          }
          
        } else {
          console.log(`   ❌ Correspondance sortante non trouvée`);
        }
      } else {
        console.log(`   ❌ OutgoingCorrespondanceId manquant`);
      }
      
      // Vérifier l'enregistrement Response
      const responseRecord = await db.collection('responses').findOne({
        correspondanceId: correspondance._id.toString()
      });
      
      if (responseRecord) {
        console.log(`   ✅ Enregistrement Response trouvé:`);
        console.log(`      - ID: ${responseRecord._id}`);
        console.log(`      - Status: ${responseRecord.status}`);
        console.log(`      - DeliveryStatus: ${responseRecord.deliveryStatus}`);
        console.log(`      - SupervisorId: ${responseRecord.supervisorId}`);
      } else {
        console.log(`   ❌ Enregistrement Response manquant`);
      }
    }
    
    // 3. Statistiques finales
    console.log(`\n📊 === STATISTIQUES FINALES ===`);
    
    const totalCorrespondances = await db.collection('correspondances').countDocuments();
    const incomingCount = await db.collection('correspondances').countDocuments({ type: 'INCOMING' });
    const outgoingCount = await db.collection('correspondances').countDocuments({ type: 'OUTGOING' });
    const withFinalResponse = await db.collection('correspondances').countDocuments({ finalResponse: { $exists: true } });
    const withOutgoingLink = await db.collection('correspondances').countDocuments({ outgoingCorrespondanceId: { $exists: true } });
    const responseRecords = await db.collection('responses').countDocuments();
    
    console.log(`Total correspondances: ${totalCorrespondances}`);
    console.log(`- INCOMING: ${incomingCount}`);
    console.log(`- OUTGOING: ${outgoingCount}`);
    console.log(`- Avec finalResponse: ${withFinalResponse}`);
    console.log(`- Avec liaison sortante: ${withOutgoingLink}`);
    console.log(`- Enregistrements Response: ${responseRecords}`);
    
    // 4. Test de liaison dans les deux sens
    console.log(`\n🔗 === TEST LIAISONS BIDIRECTIONNELLES ===`);
    
    const outgoingCorrespondances = await db.collection('correspondances').find({
      type: 'OUTGOING',
      parentCorrespondanceId: { $exists: true }
    }).toArray();
    
    console.log(`Correspondances sortantes avec parent: ${outgoingCorrespondances.length}`);
    
    for (const outgoing of outgoingCorrespondances) {
      const parent = await db.collection('correspondances').findOne({
        _id: new mongoose.Types.ObjectId(outgoing.parentCorrespondanceId)
      });
      
      if (parent && parent.outgoingCorrespondanceId === outgoing._id.toString()) {
        console.log(`✅ Liaison bidirectionnelle OK: ${outgoing.title} ↔ ${parent.title || parent.subject}`);
      } else {
        console.log(`❌ Liaison bidirectionnelle KO: ${outgoing.title}`);
      }
    }
    
    console.log(`\n🎉 === TEST TERMINÉ ===`);
    console.log(`✅ Système de finalisation et liaison: ${withOutgoingLink === withFinalResponse ? 'OPÉRATIONNEL' : 'PROBLÈME DÉTECTÉ'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testFinalizationComplete();
