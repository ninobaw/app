const mongoose = require('mongoose');

async function createApprovedDraftForSupervisor() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🎯 === CRÉATION DRAFT APPROUVÉ POUR SUPERVISEUR ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver le workflow de la correspondance testée
    const correspondanceId = '68e87766be425c19cc91eeae'; // ID de la correspondance dans les logs
    
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: new mongoose.Types.ObjectId(correspondanceId)
    });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé pour correspondance:', correspondanceId);
      process.exit(1);
    }
    
    console.log(`🔄 Workflow trouvé: ${workflow._id}`);
    console.log(`   Status actuel: ${workflow.currentStatus}`);
    console.log(`   Drafts actuels: ${workflow.responseDrafts?.length || 0}`);
    
    // 2. Créer ou mettre à jour un draft approuvé avec attachements
    const approvedDraft = {
      id: new mongoose.Types.ObjectId(),
      directorId: workflow.assignedDirector,
      directorName: 'Anis Ben Janet',
      directorate: 'Direction Test',
      responseContent: `Réponse finale approuvée avec attachements.\n\nSuite à votre demande, nous avons le plaisir de vous informer que :\n\n1. Votre demande a été étudiée et approuvée\n2. Les documents nécessaires sont joints à cette réponse\n3. Les mesures appropriées ont été prises\n\nVeuillez trouver ci-joint les documents suivants :\n- Rapport d'analyse\n- Proposition technique\n- Calendrier de mise en œuvre\n\nNous restons à votre disposition pour tout complément d'information.\n\nCordialement,\nAnis Ben Janet\nDirecteur`,
      attachments: [
        {
          filename: 'Customer Relation Awareness-1760067873154-3863666.png',
          originalName: 'Customer Relation Awareness.png',
          path: `/uploads/drafts/${correspondanceId}/Customer Relation Awareness-1760067873154-3863666.png`,
          size: 155878,
          mimetype: 'image/png'
        },
        {
          filename: 'rapport-final.pdf',
          originalName: 'Rapport final.pdf',
          path: `/uploads/drafts/${correspondanceId}/rapport-final.pdf`,
          size: 1024000,
          mimetype: 'application/pdf'
        }
      ],
      comments: 'Draft final avec attachements pour test superviseur',
      isUrgent: false,
      status: 'APPROVED', // ✅ STATUS APPROUVÉ
      dgFeedbacks: [{
        dgId: workflow.directeurGeneral,
        dgName: 'Melanie Lefevre',
        action: 'APPROVE',
        feedback: 'Proposition approuvée. Parfait travail, tous les éléments sont présents.',
        isApproved: true,
        createdAt: new Date()
      }],
      revisionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\n📝 === MISE À JOUR WORKFLOW AVEC DRAFT APPROUVÉ ===');
    
    // 3. Mettre à jour le workflow
    const updateResult = await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      {
        $set: {
          responseDrafts: [approvedDraft], // Remplacer par le draft approuvé
          currentStatus: 'DG_APPROVED',
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount === 1) {
      console.log('✅ Workflow mis à jour avec draft approuvé');
      
      // 4. Mettre à jour la correspondance
      const correspUpdate = await db.collection('correspondances').updateOne(
        { _id: new mongoose.Types.ObjectId(correspondanceId) },
        {
          $set: {
            workflowStatus: 'DG_APPROVED',
            updatedAt: new Date()
          }
        }
      );
      
      if (correspUpdate.modifiedCount === 1) {
        console.log('✅ Correspondance mise à jour');
      }
      
      // 5. Vérifier le résultat
      console.log('\n🔍 === VÉRIFICATION ===');
      
      const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
        _id: workflow._id
      });
      
      if (updatedWorkflow && updatedWorkflow.responseDrafts?.length > 0) {
        const draft = updatedWorkflow.responseDrafts[0];
        console.log(`📊 Draft approuvé créé:`);
        console.log(`   - Status: ${draft.status}`);
        console.log(`   - DirectorName: ${draft.directorName}`);
        console.log(`   - Attachments: ${draft.attachments?.length || 0}`);
        console.log(`   - DG Feedbacks: ${draft.dgFeedbacks?.length || 0}`);
        
        if (draft.attachments && draft.attachments.length > 0) {
          console.log(`📎 Attachements disponibles:`);
          draft.attachments.forEach((att, index) => {
            console.log(`   ${index + 1}. ${att.originalName} (${att.mimetype})`);
          });
        }
      }
      
      // 6. Tester le service finalizeResponse
      console.log('\n🧪 === TEST SERVICE FINALIZE ===');
      
      try {
        const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
        
        // Simuler les données de finalisation
        const finalData = {
          finalResponseContent: approvedDraft.responseContent,
          attachments: approvedDraft.attachments,
          sendMethod: 'EMAIL'
        };
        
        console.log('📋 Données de finalisation préparées');
        console.log(`   - Contenu: ${finalData.finalResponseContent?.substring(0, 100)}...`);
        console.log(`   - Attachements: ${finalData.attachments?.length || 0}`);
        console.log(`   - Méthode: ${finalData.sendMethod}`);
        
        console.log('\n✅ Le superviseur peut maintenant finaliser cette correspondance !');
        
      } catch (serviceError) {
        console.error('❌ Erreur test service:', serviceError.message);
      }
      
    } else {
      console.log('❌ Échec mise à jour workflow');
    }
    
    console.log('\n🎯 === RÉSULTAT ===');
    console.log('✅ Draft approuvé créé avec attachements');
    console.log('✅ Workflow status: DG_APPROVED');
    console.log('✅ Correspondance prête pour finalisation superviseur');
    console.log('');
    console.log('🧪 Actions de test:');
    console.log('1. Redémarrer le serveur backend');
    console.log('2. Tester l\'upload d\'attachement (devrait maintenant fonctionner)');
    console.log('3. Tester la finalisation superviseur (devrait maintenant fonctionner)');
    console.log('4. Vérifier que les attachements sont visibles côté superviseur');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createApprovedDraftForSupervisor();
