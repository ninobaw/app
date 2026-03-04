const mongoose = require('mongoose');

async function createDraftForExistingWorkflow() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📝 === CRÉATION DRAFT POUR WORKFLOW EXISTANT ===\n');
    
    // 1. Trouver le workflow existant
    const workflow = await db.collection('correspondenceworkflows').findOne({
      _id: new mongoose.Types.ObjectId('68e80b66948741da98edd3bf')
    });
    
    if (!workflow) {
      console.log('❌ Workflow non trouvé');
      process.exit(1);
    }
    
    console.log(`🔄 Workflow trouvé: ${workflow._id}`);
    console.log(`   - Status: ${workflow.currentStatus}`);
    console.log(`   - Correspondance: ${workflow.correspondanceId}`);
    console.log(`   - Directeur assigné: ${workflow.assignedDirector}`);
    console.log(`   - DG: ${workflow.directeurGeneral}`);
    
    // 2. Trouver la correspondance
    const correspondance = await db.collection('correspondances').findOne({
      _id: workflow.correspondanceId
    });
    
    if (!correspondance) {
      console.log('❌ Correspondance non trouvée');
      process.exit(1);
    }
    
    console.log(`\n📄 Correspondance: "${correspondance.objet || correspondance.subject}"`);
    console.log(`   - ID: ${correspondance._id}`);
    console.log(`   - Status: ${correspondance.workflowStatus}`);
    console.log(`   - Drafts existants: ${correspondance.responseDrafts?.length || 0}`);
    
    // 3. Trouver le directeur assigné
    const directorId = workflow.assignedDirector;
    console.log(`\n🔍 DirectorId brut: ${directorId} (type: ${typeof directorId})`);
    
    let director;
    
    // Essayer différentes méthodes pour trouver le directeur
    if (mongoose.Types.ObjectId.isValid(directorId)) {
      // Si c'est un ObjectId valide
      const directorObjectId = typeof directorId === 'string' ? new mongoose.Types.ObjectId(directorId) : directorId;
      director = await db.collection('users').findOne({ _id: directorObjectId });
      console.log(`   - Recherche par ObjectId: ${director ? 'Trouvé' : 'Non trouvé'}`);
    } else {
      // Si ce n'est pas un ObjectId, essayer comme string direct
      director = await db.collection('users').findOne({ _id: directorId });
      console.log(`   - Recherche par string: ${director ? 'Trouvé' : 'Non trouvé'}`);
    }
    
    // Si toujours pas trouvé, chercher par email ou nom
    if (!director) {
      console.log('   - Recherche alternative...');
      // Chercher tous les directeurs disponibles
      const allDirectors = await db.collection('users').find({
        role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
      }).toArray();
      
      console.log(`   - Directeurs disponibles: ${allDirectors.length}`);
      allDirectors.forEach(dir => {
        console.log(`     * ${dir.firstName} ${dir.lastName} (${dir._id}) - ${dir.role}`);
      });
      
      // Prendre le premier SOUS_DIRECTEUR trouvé (Ben Khalifa Adnen)
      director = allDirectors.find(dir => dir.role === 'SOUS_DIRECTEUR');
      if (!director) {
        director = allDirectors[0]; // Ou le premier directeur disponible
      }
    }
    
    if (!director) {
      console.log('❌ Directeur assigné non trouvé');
      process.exit(1);
    }
    
    console.log(`\n👤 Directeur assigné: ${director.firstName} ${director.lastName}`);
    console.log(`   - Rôle: ${director.role}`);
    console.log(`   - Email: ${director.email}`);
    
    // 4. Créer un draft de réponse
    const responseDraft = {
      directorId: director._id,
      directorName: `${director.firstName} ${director.lastName}`,
      directorate: director.directorate || 'Direction',
      responseContent: `Proposition de réponse pour "${correspondance.objet || correspondance.subject}".\n\nSuite à l'analyse de cette correspondance, nous proposons la réponse suivante :\n\n[Contenu de la réponse à personnaliser]\n\nCordialement,\n${director.firstName} ${director.lastName}\n${director.role}`,
      attachments: [],
      comments: `Draft créé automatiquement par ${director.firstName} ${director.lastName} (${director.role})`,
      isUrgent: false,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      dgFeedbacks: [] // Initialiser le tableau des feedbacks DG
    };
    
    console.log('\n📝 Draft créé:');
    console.log(`   - Directeur: ${responseDraft.directorName}`);
    console.log(`   - Contenu: ${responseDraft.responseContent.substring(0, 100)}...`);
    
    // 5. Ajouter le draft à la correspondance
    await db.collection('correspondances').updateOne(
      { _id: correspondance._id },
      { 
        $push: { responseDrafts: responseDraft },
        $set: { 
          workflowStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Draft ajouté à la correspondance');
    
    // 6. Mettre à jour le workflow
    await db.collection('correspondenceworkflows').updateOne(
      { _id: workflow._id },
      { 
        $set: { 
          currentStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Workflow mis à jour vers DIRECTOR_DRAFT');
    
    // 7. Vérification finale
    const updatedCorrespondance = await db.collection('correspondances').findOne({
      _id: correspondance._id
    });
    
    console.log('\n🔍 Vérification finale:');
    console.log(`   - Drafts dans la correspondance: ${updatedCorrespondance.responseDrafts?.length || 0}`);
    console.log(`   - Status correspondance: ${updatedCorrespondance.workflowStatus}`);
    
    const updatedWorkflow = await db.collection('correspondenceworkflows').findOne({
      _id: workflow._id
    });
    
    console.log(`   - Status workflow: ${updatedWorkflow.currentStatus}`);
    
    // 8. Test de l'approbation DG maintenant possible
    console.log('\n🎯 === MAINTENANT PRÊT POUR APPROBATION DG ===');
    console.log('1. Connectez-vous comme DG (melanie@tav.aero)');
    console.log('2. Ouvrez le chat de cette correspondance');
    console.log('3. Vous devriez voir le bouton "Approuver"');
    console.log('4. L\'approbation devrait maintenant fonctionner');
    
    console.log('\n📋 Informations pour le test:');
    console.log(`   - Correspondance ID: ${correspondance._id}`);
    console.log(`   - Workflow ID: ${workflow._id}`);
    console.log(`   - Draft Index: 0 (premier draft)`);
    console.log(`   - DG: ${director.firstName} ${director.lastName}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createDraftForExistingWorkflow();
