const mongoose = require('mongoose');

async function fixMissingOutgoingCorrespondance() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION CORRESPONDANCE SORTANTE MANQUANTE ===\n');
    
    // 1. Trouver les correspondances avec finalResponse mais sans outgoingCorrespondanceId
    const correspondancesWithoutOutgoing = await db.collection('correspondances').find({
      finalResponse: { $exists: true },
      outgoingCorrespondanceId: { $exists: false }
    }).toArray();
    
    console.log(`📋 Correspondances à corriger: ${correspondancesWithoutOutgoing.length}`);
    
    if (correspondancesWithoutOutgoing.length === 0) {
      console.log('✅ Aucune correspondance à corriger');
      process.exit(0);
    }
    
    // 2. Récupérer le superviseur
    const supervisor = await db.collection('users').findOne({
      role: 'SUPERVISEUR_BUREAU_ORDRE'
    });
    
    if (!supervisor) {
      console.log('❌ Aucun superviseur bureau d\'ordre trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Superviseur: ${supervisor.firstName} ${supervisor.lastName}`);
    
    // 3. Traiter chaque correspondance
    for (const correspondance of correspondancesWithoutOutgoing) {
      console.log(`\n🔄 Traitement: ${correspondance.title || correspondance.subject}`);
      console.log(`   ID: ${correspondance._id}`);
      
      const finalResponse = correspondance.finalResponse;
      
      // 4. Créer la correspondance sortante
      const outgoingCorrespondance = {
        _id: new mongoose.Types.ObjectId(),
        title: `Réponse: ${correspondance.title || correspondance.subject}`,
        type: 'OUTGOING',
        from_address: supervisor.email || 'bureau.ordre@tav.aero',
        to_address: finalResponse.recipientEmail || correspondance.from_address,
        subject: `RE: ${correspondance.subject}`,
        content: finalResponse.finalResponseContent,
        priority: correspondance.priority || 'MEDIUM',
        airport: correspondance.airport || 'ENFIDHA',
        
        // Informations de liaison
        parentCorrespondanceId: correspondance._id,
        responseToCorrespondanceId: correspondance._id,
        
        // Informations de workflow
        workflowStatus: 'RESPONSE_SENT',
        status: 'REPLIED',
        
        // Informations de livraison
        deliveryMethod: finalResponse.deliveryMethod,
        trackingNumber: finalResponse.trackingNumber,
        deliveryNotes: finalResponse.deliveryNotes,
        
        // Pièces jointes et fichiers
        file_path: finalResponse.attachments?.[0]?.path,
        file_type: finalResponse.attachments?.[0]?.type,
        attachments: finalResponse.attachments || [],
        
        // Métadonnées
        createdBy: supervisor._id,
        assignedTo: supervisor._id,
        responseDate: finalResponse.sentAt,
        createdAt: finalResponse.sentAt,
        updatedAt: new Date(),
        
        // Informations de traçabilité
        processingHistory: [{
          action: 'OUTGOING_CORRESPONDENCE_CREATED',
          userId: supervisor._id,
          userName: `${supervisor.firstName} ${supervisor.lastName}`,
          timestamp: new Date(),
          details: {
            basedOnResponse: finalResponse.id,
            originalCorrespondanceId: correspondance._id,
            deliveryMethod: finalResponse.deliveryMethod,
            attachmentsCount: finalResponse.attachments?.length || 0,
            correctionScript: true
          }
        }],
        
        // Métadonnées spécifiques
        metadata: {
          isResponse: true,
          originalCorrespondanceId: correspondance._id,
          responseId: finalResponse.id,
          workflowCompletedAt: finalResponse.sentAt,
          supervisorId: supervisor._id,
          deliveryMethod: finalResponse.deliveryMethod,
          createdByScript: true
        }
      };
      
      // 5. Insérer la correspondance sortante
      await db.collection('correspondances').insertOne(outgoingCorrespondance);
      console.log(`   ✅ Correspondance sortante créée: ${outgoingCorrespondance._id}`);
      
      // 6. Mettre à jour la correspondance originale
      await db.collection('correspondances').updateOne(
        { _id: correspondance._id },
        { 
          $set: { 
            outgoingCorrespondanceId: outgoingCorrespondance._id,
            responseCorrespondanceId: outgoingCorrespondance._id,
            updatedAt: new Date()
          }
        }
      );
      console.log(`   🔗 Correspondance originale mise à jour avec liaison`);
    }
    
    // 7. Vérification finale
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    
    const totalCorrespondances = await db.collection('correspondances').countDocuments();
    const incomingCount = await db.collection('correspondances').countDocuments({ type: 'INCOMING' });
    const outgoingCount = await db.collection('correspondances').countDocuments({ type: 'OUTGOING' });
    const withOutgoingId = await db.collection('correspondances').countDocuments({ 
      outgoingCorrespondanceId: { $exists: true } 
    });
    
    console.log(`📊 Statistiques finales:`);
    console.log(`   - Total correspondances: ${totalCorrespondances}`);
    console.log(`   - INCOMING: ${incomingCount}`);
    console.log(`   - OUTGOING: ${outgoingCount}`);
    console.log(`   - Avec outgoingCorrespondanceId: ${withOutgoingId}`);
    
    // 8. Lister les correspondances OUTGOING créées
    const newOutgoingCorrespondances = await db.collection('correspondances').find({
      type: 'OUTGOING',
      'metadata.createdByScript': true
    }).toArray();
    
    if (newOutgoingCorrespondances.length > 0) {
      console.log(`\n📤 Correspondances OUTGOING créées par le script:`);
      newOutgoingCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. ${corresp.title}`);
        console.log(`      - ID: ${corresp._id}`);
        console.log(`      - Parent: ${corresp.parentCorrespondanceId}`);
        console.log(`      - DeliveryMethod: ${corresp.deliveryMethod}`);
      });
    }
    
    console.log(`\n🎉 === CORRECTION TERMINÉE ===`);
    console.log(`✅ ${correspondancesWithoutOutgoing.length} correspondance(s) corrigée(s)`);
    console.log(`📤 ${outgoingCount} correspondance(s) sortante(s) maintenant disponible(s)`);
    console.log(`💡 Les correspondances de réponse devraient maintenant apparaître dans la liste`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixMissingOutgoingCorrespondance();
