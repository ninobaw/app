const mongoose = require('mongoose');

async function fixNewCorrespondanceAssignment() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION ASSIGNATION NOUVELLE CORRESPONDANCE ===\n');
    
    // 1. Trouver la nouvelle correspondance
    const correspondances = await db.collection('correspondances').find({}).sort({ createdAt: -1 }).toArray();
    const newCorrespondance = correspondances[0];
    
    console.log(`📋 Correspondance: "${newCorrespondance.objet || newCorrespondance.subject}"`);
    console.log(`   - ID: ${newCorrespondance._id}`);
    console.log(`   - Status: ${newCorrespondance.workflowStatus}`);
    console.log(`   - Assignée à: ${newCorrespondance.assignedTo || 'NON ASSIGNÉE'}`);
    
    // 2. Trouver le directeur (Anis)
    const director = await db.collection('users').findOne({ 
      email: 'anisbenjannet@tav.aero' 
    });
    
    if (!director) {
      console.log('❌ Directeur Anis non trouvé');
      process.exit(1);
    }
    
    console.log(`\n👤 Directeur trouvé: ${director.firstName} ${director.lastName}`);
    console.log(`   - ID: ${director._id}`);
    console.log(`   - Role: ${director.role}`);
    
    // 3. Assigner le directeur à la correspondance
    await db.collection('correspondances').updateOne(
      { _id: newCorrespondance._id },
      { 
        $set: { 
          assignedTo: director._id.toString(),
          updatedAt: new Date()
        },
        $addToSet: {
          personnesConcernees: director._id.toString()
        }
      }
    );
    
    console.log('\n✅ Directeur assigné à la correspondance');
    
    // 4. Mettre à jour le workflow
    const workflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: newCorrespondance._id
    });
    
    if (workflow) {
      await db.collection('correspondenceworkflows').updateOne(
        { _id: workflow._id },
        { 
          $set: { 
            assignedDirector: director._id.toString(),
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Workflow mis à jour avec le directeur assigné');
    }
    
    // 5. Créer un draft de test
    const responseDraft = {
      directorId: director._id.toString(),
      directorName: `${director.firstName} ${director.lastName}`,
      directorate: director.directorate || 'Direction Test',
      responseContent: `Proposition de réponse pour "${newCorrespondance.objet || newCorrespondance.subject}".\n\nCette correspondance nécessite une réponse appropriée selon les procédures en vigueur.`,
      attachments: [],
      comments: 'Proposition initiale du directeur',
      isUrgent: false,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 6. Ajouter le draft et changer le statut
    await db.collection('correspondances').updateOne(
      { _id: newCorrespondance._id },
      { 
        $push: { responseDrafts: responseDraft },
        $set: { 
          workflowStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ Draft créé et statut mis à jour');
    
    // 7. Mettre à jour le statut du workflow
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
      
      console.log('✅ Statut workflow mis à jour vers DIRECTOR_DRAFT');
    }
    
    console.log('\n🎯 Maintenant testez:');
    console.log('1. Connectez-vous comme DG (melanie@tav.aero)');
    console.log('2. Dashboard devrait afficher 1 "en attente"');
    console.log('3. Vous devriez pouvoir accéder au chat de la nouvelle correspondance');
    console.log('4. Vous devriez voir la proposition du directeur et pouvoir l\'approuver/réviser');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixNewCorrespondanceAssignment();
