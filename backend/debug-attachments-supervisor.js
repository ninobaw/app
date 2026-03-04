const mongoose = require('mongoose');

async function debugAttachmentsSupervisor() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔍 === DIAGNOSTIC ATTACHEMENTS SUPERVISEUR ===\n');
    
    const db = mongoose.connection.db;
    
    // 1. Trouver un workflow avec draft approuvé
    console.log('📋 === RECHERCHE WORKFLOWS AVEC DRAFTS APPROUVÉS ===');
    
    const workflows = await db.collection('correspondenceworkflows').find({
      'responseDrafts.status': 'APPROVED'
    }).toArray();
    
    console.log(`Workflows avec drafts approuvés: ${workflows.length}`);
    
    if (workflows.length === 0) {
      console.log('❌ Aucun workflow avec draft approuvé trouvé');
      console.log('🔧 Créons un draft approuvé pour tester...');
      
      // Trouver un workflow avec draft PENDING_DG_REVIEW
      const workflowWithDraft = await db.collection('correspondenceworkflows').findOne({
        'responseDrafts.status': 'PENDING_DG_REVIEW'
      });
      
      if (workflowWithDraft) {
        console.log(`📝 Workflow trouvé: ${workflowWithDraft._id}`);
        
        // Ajouter des attachements au draft et l'approuver
        const draftWithAttachments = {
          ...workflowWithDraft.responseDrafts[0],
          status: 'APPROVED',
          attachments: [
            {
              filename: 'test-document.pdf',
              originalName: 'Document de test.pdf',
              path: '/uploads/test-document.pdf',
              size: 1024000,
              mimetype: 'application/pdf'
            },
            {
              filename: 'rapport-analyse.docx',
              originalName: 'Rapport d\'analyse.docx',
              path: '/uploads/rapport-analyse.docx',
              size: 512000,
              mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
          ],
          dgFeedbacks: [{
            dgId: workflowWithDraft.directeurGeneral,
            dgName: 'Melanie Lefevre',
            action: 'APPROVE',
            feedback: 'Proposition approuvée avec attachements de test',
            isApproved: true,
            createdAt: new Date()
          }]
        };
        
        // Mettre à jour le workflow
        await db.collection('correspondenceworkflows').updateOne(
          { _id: workflowWithDraft._id },
          {
            $set: {
              'responseDrafts.0': draftWithAttachments,
              currentStatus: 'DG_APPROVED',
              updatedAt: new Date()
            }
          }
        );
        
        // Mettre à jour la correspondance
        await db.collection('correspondances').updateOne(
          { _id: workflowWithDraft.correspondanceId },
          {
            $set: {
              workflowStatus: 'DG_APPROVED',
              updatedAt: new Date()
            }
          }
        );
        
        console.log('✅ Draft approuvé avec attachements créé pour test');
        
        // Relancer la recherche
        const updatedWorkflows = await db.collection('correspondenceworkflows').find({
          'responseDrafts.status': 'APPROVED'
        }).toArray();
        
        workflows.push(...updatedWorkflows);
      }
    }
    
    // 2. Analyser les workflows avec drafts approuvés
    console.log('\n📊 === ANALYSE DRAFTS APPROUVÉS ===');
    
    for (const workflow of workflows) {
      console.log(`\n🔄 Workflow: ${workflow._id}`);
      console.log(`   Status: ${workflow.currentStatus}`);
      console.log(`   Drafts: ${workflow.responseDrafts?.length || 0}`);
      
      const approvedDrafts = workflow.responseDrafts?.filter(draft => draft.status === 'APPROVED') || [];
      
      console.log(`   Drafts approuvés: ${approvedDrafts.length}`);
      
      approvedDrafts.forEach((draft, index) => {
        console.log(`\n   📝 Draft approuvé ${index + 1}:`);
        console.log(`      DirectorName: ${draft.directorName}`);
        console.log(`      Status: ${draft.status}`);
        console.log(`      Attachments: ${draft.attachments?.length || 0}`);
        
        if (draft.attachments && draft.attachments.length > 0) {
          draft.attachments.forEach((att, attIndex) => {
            console.log(`        ${attIndex + 1}. ${att.originalName} (${att.mimetype})`);
          });
        } else {
          console.log('        ❌ Aucun attachement dans le draft approuvé');
        }
        
        console.log(`      DG Feedbacks: ${draft.dgFeedbacks?.length || 0}`);
      });
      
      // Vérifier la correspondance liée
      const correspondance = await db.collection('correspondances').findOne({
        _id: workflow.correspondanceId
      });
      
      if (correspondance) {
        console.log(`\n   📧 Correspondance liée:`);
        console.log(`      Subject: ${correspondance.subject || correspondance.title}`);
        console.log(`      WorkflowStatus: ${correspondance.workflowStatus}`);
        console.log(`      Attachments: ${correspondance.attachments?.length || 0}`);
      }
    }
    
    // 3. Vérifier comment les attachements sont transmis au superviseur
    console.log('\n🧪 === TEST TRANSMISSION ATTACHEMENTS SUPERVISEUR ===');
    
    if (workflows.length > 0) {
      const workflow = workflows[0];
      const approvedDraft = workflow.responseDrafts?.find(draft => draft.status === 'APPROVED');
      
      if (approvedDraft && approvedDraft.attachments?.length > 0) {
        console.log('✅ Draft approuvé avec attachements trouvé');
        console.log(`   Attachements dans draft: ${approvedDraft.attachments.length}`);
        
        // Simuler ce que voit le superviseur
        console.log('\n📊 === SIMULATION VUE SUPERVISEUR ===');
        console.log('Le superviseur devrait voir:');
        console.log(`1. Contenu de la réponse: "${approvedDraft.responseContent?.substring(0, 100)}..."`);
        console.log(`2. Attachements (${approvedDraft.attachments.length}):`);
        
        approvedDraft.attachments.forEach((att, index) => {
          console.log(`   ${index + 1}. ${att.originalName}`);
          console.log(`      - Chemin: ${att.path}`);
          console.log(`      - Taille: ${att.size} bytes`);
          console.log(`      - Type: ${att.mimetype}`);
        });
        
      } else {
        console.log('❌ Aucun draft approuvé avec attachements trouvé');
      }
    }
    
    // 4. Recommandations
    console.log('\n💡 === DIAGNOSTIC ET RECOMMANDATIONS ===');
    
    console.log('🔧 Problèmes potentiels:');
    console.log('1. Les attachements du draft ne sont pas transmis au superviseur');
    console.log('2. L\'interface superviseur ne récupère pas les attachements du draft approuvé');
    console.log('3. Les attachements sont dans le draft mais pas dans la réponse finale');
    
    console.log('\n🎯 Solutions à implémenter:');
    console.log('1. Modifier le service d\'approbation DG pour transmettre les attachements');
    console.log('2. Vérifier que l\'interface superviseur récupère les attachements du draft approuvé');
    console.log('3. S\'assurer que les attachements sont copiés dans la réponse finale');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugAttachmentsSupervisor();
