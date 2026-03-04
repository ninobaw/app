const mongoose = require('mongoose');

async function fixNewCorrespondanceForDG() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION NOUVELLE CORRESPONDANCE POUR DG ===\n');
    
    // 1. Récupérer la correspondance problématique
    const correspondanceId = '68e8469115eeac63a2fefc8e';
    const workflowId = '68e8469115eeac63a2fefc97';
    
    const correspondance = await db.collection('correspondances').findOne({
      _id: new mongoose.Types.ObjectId(correspondanceId)
    });
    
    const workflow = await db.collection('correspondenceworkflows').findOne({
      _id: new mongoose.Types.ObjectId(workflowId)
    });
    
    if (!correspondance || !workflow) {
      console.log('❌ Correspondance ou workflow non trouvé');
      process.exit(1);
    }
    
    console.log(`📄 Correspondance: "${correspondance.objet || correspondance.subject}"`);
    console.log(`🔄 Workflow: ${workflow._id}`);
    console.log(`   - Status actuel: ${workflow.currentStatus}`);
    console.log(`   - Messages: ${workflow.chatMessages?.length || 0}`);
    
    // 2. Récupérer les directeurs impliqués
    const directeurId = 'd45acede-21a1-4bd2-b1d1-4216f78f8887'; // Anis Ben Janet
    const sousDirecteurId = '571d5ac7-1bed-4a7e-8653-4682be01bafd'; // Ben Khalifa Adnen
    const dgId = '0fcffdc9-fd0d-4d23-a579-d4548cbb9117'; // melanie Lefevre
    
    const directeur = await db.collection('users').findOne({ _id: directeurId });
    const sousDirecteur = await db.collection('users').findOne({ _id: sousDirecteurId });
    const dg = await db.collection('users').findOne({ _id: dgId });
    
    console.log(`\n👥 Participants:`);
    console.log(`   - Directeur: ${directeur?.firstName} ${directeur?.lastName} (${directeur?.role})`);
    console.log(`   - Sous-Directeur: ${sousDirecteur?.firstName} ${sousDirecteur?.lastName} (${sousDirecteur?.role})`);
    console.log(`   - DG: ${dg?.firstName} ${dg?.lastName} (${dg?.role})`);
    
    // 3. Créer des drafts de réponse pour les deux directeurs
    const drafts = [];
    
    // Draft du directeur
    if (directeur) {
      const directeurDraft = {
        directorId: directeurId,
        directorName: `${directeur.firstName} ${directeur.lastName}`,
        directorate: directeur.directorate || 'Direction',
        responseContent: `Proposition de réponse du DIRECTEUR pour "${correspondance.objet || correspondance.subject}".\n\nSuite à l'analyse de cette correspondance, je propose la réponse suivante :\n\n[Contenu de la réponse du directeur]\n\nCordialement,\n${directeur.firstName} ${directeur.lastName}\n${directeur.role}`,
        attachments: [],
        comments: `Draft créé automatiquement par ${directeur.firstName} ${directeur.lastName} (${directeur.role})`,
        isUrgent: false,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        dgFeedbacks: []
      };
      drafts.push(directeurDraft);
    }
    
    // Draft du sous-directeur
    if (sousDirecteur) {
      const sousDirecteurDraft = {
        directorId: sousDirecteurId,
        directorName: `${sousDirecteur.firstName} ${sousDirecteur.lastName}`,
        directorate: sousDirecteur.directorate || 'Sous-Direction',
        responseContent: `Proposition de réponse du SOUS-DIRECTEUR pour "${correspondance.objet || correspondance.subject}".\n\nSuite à l'analyse de cette correspondance, je propose la réponse suivante :\n\n[Contenu de la réponse du sous-directeur]\n\nCordialement,\n${sousDirecteur.firstName} ${sousDirecteur.lastName}\n${sousDirecteur.role}`,
        attachments: [],
        comments: `Draft créé automatiquement par ${sousDirecteur.firstName} ${sousDirecteur.lastName} (${sousDirecteur.role})`,
        isUrgent: false,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
        dgFeedbacks: []
      };
      drafts.push(sousDirecteurDraft);
    }
    
    console.log(`\n📝 Création de ${drafts.length} drafts...`);
    
    // 4. Ajouter les drafts à la correspondance
    await db.collection('correspondances').updateOne(
      { _id: correspondance._id },
      { 
        $set: { 
          responseDrafts: drafts,
          workflowStatus: 'DIRECTOR_DRAFT',
          assignedTo: directeurId, // Assigner au directeur principal
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Drafts ajoutés à la correspondance');
    
    // 5. Corriger les messages du chat - router vers le DG
    const updatedMessages = workflow.chatMessages.map(msg => {
      if (msg.to === 'auto') {
        // Router vers le DG
        return {
          ...msg,
          to: dgId
        };
      }
      return msg;
    });
    
    // 6. Mettre à jour le workflow
    await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      { 
        $set: { 
          currentStatus: 'DIRECTOR_DRAFT',
          chatMessages: updatedMessages,
          assignedDirector: directeurId, // Assigner au directeur principal
          directeurGeneral: dgId,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Workflow mis à jour vers DIRECTOR_DRAFT');
    console.log('✅ Messages routés vers le DG');
    
    // 7. Vérification finale
    const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
      _id: workflow._id
    });
    
    const updatedCorrespondance = await db.collection('correspondances').findOne({
      _id: correspondance._id
    });
    
    console.log('\n🔍 Vérification finale:');
    console.log(`   - Status workflow: ${updatedWorkflow.currentStatus}`);
    console.log(`   - Status correspondance: ${updatedCorrespondance.workflowStatus}`);
    console.log(`   - Drafts: ${updatedCorrespondance.responseDrafts?.length || 0}`);
    console.log(`   - Messages: ${updatedWorkflow.chatMessages?.length || 0}`);
    
    // Messages pour le DG
    const messagesForDG = updatedWorkflow.chatMessages.filter(msg => 
      msg.to?.toString() === dgId
    );
    console.log(`   - Messages pour DG: ${messagesForDG.length}`);
    
    // 8. Test de visibilité DG
    console.log('\n🧪 Test visibilité DG après correction:');
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dgId,
      currentStatus: { $in: ['DIRECTOR_DRAFT', 'DG_REVIEW'] }
    }).toArray();
    
    console.log(`📋 Workflows visibles pour DG: ${dgWorkflows.length}`);
    
    dgWorkflows.forEach(wf => {
      console.log(`   - ${wf._id}: ${wf.currentStatus} (Messages: ${wf.chatMessages?.length || 0})`);
    });
    
    console.log('\n🎉 === CORRECTION TERMINÉE ===');
    console.log('✅ Le DG devrait maintenant voir:');
    console.log('   1. La correspondance dans sa liste');
    console.log('   2. Les 2 drafts de réponse (directeur + sous-directeur)');
    console.log('   3. Les messages du chat');
    console.log('   4. Le bouton d\'approbation');
    
    console.log('\n📋 Instructions pour tester:');
    console.log('1. Connectez-vous comme DG (melanie@tav.aero)');
    console.log('2. Allez dans la section correspondances');
    console.log('3. Ouvrez le chat de la correspondance "aaaaa"');
    console.log('4. Vous devriez voir les messages et pouvoir approuver');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixNewCorrespondanceForDG();
