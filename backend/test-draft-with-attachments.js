const mongoose = require('mongoose');

async function testDraftWithAttachments() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🧪 === TEST DRAFT AVEC ATTACHEMENTS ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver une correspondance et un directeur
    const correspondance = await db.collection('correspondances').findOne({
      workflowStatus: { $in: ['ASSIGNED_TO_DIRECTOR', 'DIRECTOR_DRAFT'] }
    });
    
    if (!correspondance) {
      console.log('❌ Aucune correspondance trouvée');
      process.exit(1);
    }
    
    const director = await db.collection('users').findOne({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    console.log(`📧 Correspondance: ${correspondance.title || correspondance.subject}`);
    console.log(`👤 Directeur: ${director.firstName} ${director.lastName}`);
    
    // 2. Nettoyer pour test propre
    await db.collection('correspondenceworkflows').updateOne(
      { correspondanceId: correspondance._id },
      {
        $set: {
          responseDrafts: [],
          currentStatus: 'ASSIGNED_TO_DIRECTOR',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Workflow nettoyé pour test');
    
    // 3. Créer un draft AVEC attachements
    console.log('\n📎 === CRÉATION DRAFT AVEC ATTACHEMENTS ===');
    
    const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');
    
    const draftDataWithAttachments = {
      responseContent: `Proposition de réponse avec pièces jointes.\n\nVeuillez trouver ci-joint les documents suivants :\n\n1. Rapport d'analyse détaillé\n2. Proposition technique\n3. Calendrier de mise en œuvre\n\nCes documents complètent ma proposition de réponse.\n\nCordialement,\n${director.firstName} ${director.lastName}`,
      comments: 'Draft avec attachements pour tester la transmission au superviseur',
      attachments: [
        {
          filename: 'rapport-analyse-2024.pdf',
          originalName: 'Rapport d\'analyse détaillé 2024.pdf',
          path: '/uploads/documents/rapport-analyse-2024.pdf',
          size: 2048000,
          mimetype: 'application/pdf'
        },
        {
          filename: 'proposition-technique.docx',
          originalName: 'Proposition technique.docx',
          path: '/uploads/documents/proposition-technique.docx',
          size: 1024000,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        {
          filename: 'calendrier-implementation.xlsx',
          originalName: 'Calendrier d\'implémentation.xlsx',
          path: '/uploads/documents/calendrier-implementation.xlsx',
          size: 512000,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      ],
      isUrgent: false
    };
    
    console.log(`📎 Création draft avec ${draftDataWithAttachments.attachments.length} attachements:`);
    draftDataWithAttachments.attachments.forEach((att, index) => {
      console.log(`   ${index + 1}. ${att.originalName} (${att.mimetype})`);
    });
    
    const result = await CorrespondanceWorkflowService.createResponseDraft(
      correspondance._id,
      director._id,
      draftDataWithAttachments
    );
    
    console.log('✅ Draft avec attachements créé !');
    console.log('📊 Résultat:', {
      success: result.success,
      workflowStatus: result.data?.workflowStatus
    });
    
    // 4. Vérifier que les attachements sont sauvegardés
    console.log('\n🔍 === VÉRIFICATION ATTACHEMENTS SAUVEGARDÉS ===');
    
    const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: correspondance._id
    });
    
    if (updatedWorkflow && updatedWorkflow.responseDrafts?.length > 0) {
      const draft = updatedWorkflow.responseDrafts[0];
      console.log(`✅ Draft trouvé:`);
      console.log(`   Status: ${draft.status}`);
      console.log(`   Attachments: ${draft.attachments?.length || 0}`);
      
      if (draft.attachments && draft.attachments.length > 0) {
        console.log('✅ Attachements sauvegardés dans le draft:');
        draft.attachments.forEach((att, index) => {
          console.log(`   ${index + 1}. ${att.originalName}`);
          console.log(`      - Chemin: ${att.path}`);
          console.log(`      - Taille: ${att.size} bytes`);
        });
      } else {
        console.log('❌ Aucun attachement trouvé dans le draft');
      }
    }
    
    // 5. Simuler l'approbation DG avec attachements
    console.log('\n👑 === SIMULATION APPROBATION DG ===');
    
    try {
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      
      const feedbackResult = await CorrespondanceWorkflowService.provideDGFeedback(
        correspondance._id,
        0, // Premier draft
        dg._id,
        {
          action: 'APPROVE',
          feedback: 'Proposition approuvée avec tous les attachements',
          isApproved: true
        }
      );
      
      console.log('✅ Approbation DG simulée');
      
      // Vérifier le draft approuvé
      const finalWorkflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: correspondance._id
      });
      
      if (finalWorkflow && finalWorkflow.responseDrafts?.length > 0) {
        const approvedDraft = finalWorkflow.responseDrafts[0];
        console.log(`📊 Draft après approbation:`);
        console.log(`   Status: ${approvedDraft.status}`);
        console.log(`   Attachments: ${approvedDraft.attachments?.length || 0}`);
        
        if (approvedDraft.attachments && approvedDraft.attachments.length > 0) {
          console.log('✅ Attachements préservés après approbation:');
          approvedDraft.attachments.forEach((att, index) => {
            console.log(`   ${index + 1}. ${att.originalName}`);
          });
        } else {
          console.log('❌ Attachements perdus après approbation');
        }
      }
      
    } catch (approvalError) {
      console.error('❌ Erreur approbation DG:', approvalError.message);
    }
    
    // 6. Vérifier ce que voit le superviseur
    console.log('\n👨‍💼 === SIMULATION VUE SUPERVISEUR ===');
    
    const finalWorkflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: correspondance._id
    });
    
    if (finalWorkflow && finalWorkflow.responseDrafts?.length > 0) {
      const approvedDraft = finalWorkflow.responseDrafts.find(draft => draft.status === 'APPROVED');
      
      if (approvedDraft) {
        console.log('📊 Ce que devrait voir le superviseur:');
        console.log(`   Contenu: "${approvedDraft.responseContent?.substring(0, 100)}..."`);
        console.log(`   Attachements: ${approvedDraft.attachments?.length || 0}`);
        
        if (approvedDraft.attachments && approvedDraft.attachments.length > 0) {
          console.log('✅ Attachements disponibles pour le superviseur:');
          approvedDraft.attachments.forEach((att, index) => {
            console.log(`   ${index + 1}. ${att.originalName} - ${att.path}`);
          });
          
          console.log('\n🎯 Le superviseur devrait pouvoir:');
          console.log('1. Voir la liste des attachements');
          console.log('2. Télécharger chaque fichier');
          console.log('3. Inclure les attachements dans la réponse finale');
          
        } else {
          console.log('❌ Aucun attachement disponible pour le superviseur');
        }
      }
    }
    
    console.log('\n💡 === RECOMMANDATIONS ===');
    console.log('1. Vérifier que l\'interface directeur transmet bien les attachements');
    console.log('2. S\'assurer que l\'interface superviseur récupère les attachements du draft approuvé');
    console.log('3. Tester le téléchargement des attachements côté superviseur');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDraftWithAttachments();
