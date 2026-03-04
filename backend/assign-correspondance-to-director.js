const mongoose = require('mongoose');

async function assignCorrespondanceToDirector() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📋 === ASSIGNATION CORRESPONDANCE À DIRECTEUR ===\n');
    
    // 1. Lister les directeurs disponibles
    const directors = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    console.log(`👥 Directeurs disponibles: ${directors.length}`);
    directors.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role})`);
      console.log(`      ID: ${dir._id}`);
      console.log(`      Email: ${dir.email}`);
    });
    
    if (directors.length === 0) {
      console.log('❌ Aucun directeur trouvé !');
      process.exit(1);
    }
    
    // 2. Prendre le premier directeur
    const selectedDirector = directors[0];
    console.log(`\n🎯 Directeur sélectionné: ${selectedDirector.firstName} ${selectedDirector.lastName}`);
    
    // 3. Trouver une correspondance récente non assignée ou mal assignée
    const correspondances = await db.collection('correspondances').find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`\n📋 Correspondances récentes: ${correspondances.length}`);
    
    let targetCorrespondance = null;
    
    // Chercher une correspondance non assignée ou avec assignation incorrecte
    for (const corr of correspondances) {
      console.log(`\n📝 "${corr.objet || corr.subject}"`);
      console.log(`   AssignedTo: ${corr.assignedTo || 'NON ASSIGNÉE'}`);
      console.log(`   Status: ${corr.status} | Workflow: ${corr.workflowStatus}`);
      
      if (!corr.assignedTo || corr.assignedTo === null) {
        targetCorrespondance = corr;
        console.log(`   ✅ Sélectionnée pour assignation`);
        break;
      }
    }
    
    // Si aucune correspondance non assignée, prendre la plus récente
    if (!targetCorrespondance && correspondances.length > 0) {
      targetCorrespondance = correspondances[0];
      console.log(`\n📝 Aucune correspondance non assignée, utilisation de la plus récente:`);
      console.log(`   "${targetCorrespondance.objet || targetCorrespondance.subject}"`);
    }
    
    if (!targetCorrespondance) {
      console.log('❌ Aucune correspondance trouvée !');
      process.exit(1);
    }
    
    // 4. Assigner la correspondance au directeur
    console.log(`\n🔧 === ASSIGNATION ===`);
    
    // Gérer les UUIDs et ObjectIds
    let directorId = selectedDirector._id;
    console.log(`🔍 DirectorId: ${directorId} (type: ${typeof directorId})`);
    
    // Si c'est un UUID (36 caractères avec tirets), le garder tel quel
    // Si c'est un ObjectId MongoDB (24 caractères hex), le convertir
    if (typeof directorId === 'string' && directorId.length === 36 && directorId.includes('-')) {
      // C'est un UUID, le garder tel quel
      console.log(`📝 Utilisation UUID: ${directorId}`);
    } else if (mongoose.Types.ObjectId.isValid(directorId)) {
      // C'est un ObjectId valide
      directorId = new mongoose.Types.ObjectId(directorId);
      console.log(`📝 Conversion en ObjectId: ${directorId}`);
    } else {
      console.log(`❌ Format d'ID non reconnu: ${directorId}`);
      process.exit(1);
    }
    
    await db.collection('correspondances').updateOne(
      { _id: targetCorrespondance._id },
      { 
        $set: { 
          assignedTo: directorId,
          workflowStatus: 'ASSIGNED_TO_DIRECTOR',
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Correspondance assignée à ${selectedDirector.firstName} ${selectedDirector.lastName}`);
    
    // 5. Créer ou mettre à jour le workflow
    const existingWorkflow = await db.collection('correspondenceworkflows').findOne({
      correspondanceId: targetCorrespondance._id
    });
    
    if (existingWorkflow) {
      await db.collection('correspondenceworkflows').updateOne(
        { _id: existingWorkflow._id },
        { 
          $set: { 
            assignedTo: directorId,
            currentStatus: 'ASSIGNED_TO_DIRECTOR',
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ Workflow existant mis à jour`);
    } else {
      // Créer un nouveau workflow
      await db.collection('correspondenceworkflows').insertOne({
        correspondanceId: targetCorrespondance._id,
        assignedTo: directorId,
        currentStatus: 'ASSIGNED_TO_DIRECTOR',
        createdAt: new Date(),
        updatedAt: new Date(),
        actions: []
      });
      console.log(`✅ Nouveau workflow créé`);
    }
    
    // 6. Créer un draft de test pour que le directeur ait quelque chose à voir
    const responseDraft = {
      directorId: directorId,
      directorName: `${selectedDirector.firstName} ${selectedDirector.lastName}`,
      directorate: selectedDirector.directorate || 'Direction Test',
      responseContent: `Ceci est une proposition de réponse de test pour "${targetCorrespondance.objet || targetCorrespondance.subject}".\n\nCette réponse a été générée automatiquement pour tester l'affichage chez le directeur.`,
      attachments: [],
      comments: 'Draft créé automatiquement pour test directeur',
      isUrgent: false,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('correspondances').updateOne(
      { _id: targetCorrespondance._id },
      { 
        $push: { responseDrafts: responseDraft },
        $set: { 
          workflowStatus: 'DIRECTOR_DRAFT',
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Draft de test créé`);
    
    // 7. Vérification finale
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    
    const directorCorrespondances = await db.collection('correspondances').find({
      $or: [
        { assignedTo: directorId },
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).toArray();
    
    const directlyAssigned = directorCorrespondances.filter(c => 
      c.assignedTo && c.assignedTo.toString() === directorId.toString()
    );
    
    console.log(`📋 Correspondances trouvées pour le directeur: ${directorCorrespondances.length}`);
    console.log(`📌 Directement assignées: ${directlyAssigned.length}`);
    
    if (directlyAssigned.length > 0) {
      console.log(`\n✅ Correspondances assignées:`);
      directlyAssigned.forEach((corr, index) => {
        console.log(`   ${index + 1}. "${corr.objet || corr.subject}"`);
        console.log(`      Status: ${corr.status} | Workflow: ${corr.workflowStatus}`);
        console.log(`      Drafts: ${corr.responseDrafts?.length || 0}`);
      });
    }
    
    console.log(`\n🎯 === INSTRUCTIONS DE TEST ===`);
    console.log(`1. Connectez-vous avec les identifiants du directeur:`);
    console.log(`   Email: ${selectedDirector.email}`);
    console.log(`   Nom: ${selectedDirector.firstName} ${selectedDirector.lastName}`);
    console.log(`2. Allez dans la section correspondances`);
    console.log(`3. Vous devriez voir au moins 1 correspondance assignée`);
    console.log(`4. La correspondance "${targetCorrespondance.objet || targetCorrespondance.subject}" devrait être visible`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

assignCorrespondanceToDirector();
