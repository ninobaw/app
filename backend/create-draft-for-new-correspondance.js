const mongoose = require('mongoose');

async function createDraftForNewCorrespondance() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📝 === CRÉATION DRAFT POUR NOUVELLE CORRESPONDANCE ===\n');
    
    // 1. Trouver la nouvelle correspondance (la plus récente)
    const correspondances = await db.collection('correspondances').find({}).sort({ createdAt: -1 }).toArray();
    
    if (correspondances.length < 2) {
      console.log('❌ Pas assez de correspondances trouvées');
      process.exit(1);
    }
    
    const newCorrespondance = correspondances[0]; // La plus récente
    console.log(`📋 Nouvelle correspondance: "${newCorrespondance.objet || newCorrespondance.subject}"`);
    console.log(`   - ID: ${newCorrespondance._id}`);
    console.log(`   - Status: ${newCorrespondance.workflowStatus}`);
    console.log(`   - Assignée à: ${newCorrespondance.assignedTo}`);
    console.log(`   - Drafts existants: ${newCorrespondance.responseDrafts?.length || 0}`);
    
    // 2. Vérifier si elle a déjà un draft
    if (newCorrespondance.responseDrafts?.length > 0) {
      console.log('\n✅ Cette correspondance a déjà des drafts:');
      newCorrespondance.responseDrafts.forEach((draft, index) => {
        console.log(`   Draft ${index + 1}: ${draft.status} (${draft.createdAt})`);
      });
      
      // Vérifier le workflow
      const workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: newCorrespondance._id
      });
      
      if (workflow) {
        console.log(`\n📋 Workflow status: ${workflow.currentStatus}`);
        
        if (workflow.currentStatus !== 'DIRECTOR_DRAFT') {
          console.log('\n🔧 Correction du statut workflow...');
          
          await db.collection('correspondenceworkflows').updateOne(
            { _id: workflow._id },
            { 
              $set: { 
                currentStatus: 'DIRECTOR_DRAFT',
                updatedAt: new Date()
              }
            }
          );
          
          await db.collection('correspondances').updateOne(
            { _id: newCorrespondance._id },
            { 
              $set: { 
                workflowStatus: 'DIRECTOR_DRAFT',
                updatedAt: new Date()
              }
            }
          );
          
          console.log('✅ Statuts corrigés vers DIRECTOR_DRAFT');
        }
      }
      
      process.exit(0);
    }
    
    // 3. Trouver le directeur assigné
    const directorId = newCorrespondance.assignedTo;
    console.log(`\n🔍 DirectorId type: ${typeof directorId}, value: ${directorId}`);
    
    // Convertir en ObjectId si nécessaire
    const directorObjectId = typeof directorId === 'string' ? new mongoose.Types.ObjectId(directorId) : directorId;
    const director = await db.collection('users').findOne({ _id: directorObjectId });
    
    if (!director) {
      console.log('❌ Directeur assigné non trouvé');
      process.exit(1);
    }
    
    console.log(`\n👤 Directeur assigné: ${director.firstName} ${director.lastName}`);
    
    // 4. Créer un draft de test
    const responseDraft = {
      directorId: directorObjectId,
      directorName: `${director.firstName} ${director.lastName}`,
      directorate: director.directorate || 'Direction Test',
      responseContent: `Ceci est une proposition de réponse de test pour "${newCorrespondance.objet || newCorrespondance.subject}".\n\nCette réponse a été générée automatiquement pour tester le workflow DG.`,
      attachments: [],
      comments: 'Draft créé automatiquement pour test DG',
      isUrgent: false,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 5. Ajouter le draft à la correspondance ET corriger assignedTo
    await db.collection('correspondances').updateOne(
      { _id: newCorrespondance._id },
      { 
        $push: { responseDrafts: responseDraft },
        $set: { 
          workflowStatus: 'DIRECTOR_DRAFT',
          assignedTo: directorObjectId, // S'assurer que c'est un ObjectId
          updatedAt: new Date()
        }
      }
    );
    
    console.log('\n✅ Draft de test créé');
    
    // 6. Mettre à jour le workflow
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: newCorrespondance._id
    });
    
    if (workflow) {
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
    }
    
    // 7. Vérification finale - simuler la requête du directeur
    console.log('\n🔍 === VÉRIFICATION FINALE ===');
    
    // Simuler la requête que fait l'API pour récupérer les correspondances du directeur
    const directorCorrespondances = await db.collection('correspondances').find({
      $or: [
        { assignedTo: directorObjectId },
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).toArray();
    
    console.log(`📋 Correspondances trouvées pour le directeur: ${directorCorrespondances.length}`);
    
    const assignedCorrespondances = directorCorrespondances.filter(c => 
      c.assignedTo && c.assignedTo.toString() === directorObjectId.toString()
    );
    
    console.log(`📌 Correspondances directement assignées: ${assignedCorrespondances.length}`);
    
    if (assignedCorrespondances.length > 0) {
      assignedCorrespondances.forEach((corr, index) => {
        console.log(`   ${index + 1}. "${corr.objet || corr.subject}" - Status: ${corr.workflowStatus}`);
        console.log(`      AssignedTo: ${corr.assignedTo} (type: ${typeof corr.assignedTo})`);
      });
    }
    
    console.log('\n🎯 Maintenant testez:');
    console.log('1. Connectez-vous comme DIRECTEUR avec:');
    console.log(`   Email: ${director.email}`);
    console.log(`   Nom: ${director.firstName} ${director.lastName}`);
    console.log('2. Allez dans la section correspondances');
    console.log('3. Vous devriez voir la correspondance assignée');
    console.log('4. Pour tester le DG, connectez-vous comme DG et vérifiez les correspondances en attente');
    console.log(`\n📋 Correspondance créée: "${newCorrespondance.objet || newCorrespondance.subject}"`);
    console.log(`📌 Assignée à: ${director.firstName} ${director.lastName} (${directorObjectId})`);
    console.log(`🔧 Status: ${newCorrespondance.workflowStatus || 'DIRECTOR_DRAFT'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createDraftForNewCorrespondance();
