const mongoose = require('mongoose');

async function fixDirectorAssignments() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION DES ASSIGNATIONS DIRECTEUR ===\n');
    
    // 1. Trouver toutes les correspondances avec assignedTo
    const correspondances = await db.collection('correspondances').find({
      assignedTo: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`📋 Correspondances avec assignedTo: ${correspondances.length}`);
    
    let corrected = 0;
    let errors = 0;
    
    for (const corr of correspondances) {
      try {
        const currentAssignedTo = corr.assignedTo;
        console.log(`\n📝 Correspondance: "${corr.objet || corr.subject}"`);
        console.log(`   AssignedTo actuel: ${currentAssignedTo} (type: ${typeof currentAssignedTo})`);
        
        // Vérifier si c'est déjà un ObjectId
        if (mongoose.Types.ObjectId.isValid(currentAssignedTo)) {
          let needsUpdate = false;
          let newAssignedTo = currentAssignedTo;
          
          // Si c'est une string, la convertir en ObjectId
          if (typeof currentAssignedTo === 'string') {
            newAssignedTo = new mongoose.Types.ObjectId(currentAssignedTo);
            needsUpdate = true;
            console.log(`   🔄 Conversion string → ObjectId`);
          }
          
          // Vérifier que l'utilisateur existe
          const user = await db.collection('users').findOne({ _id: newAssignedTo });
          if (!user) {
            console.log(`   ❌ Utilisateur assigné non trouvé, suppression de l'assignation`);
            await db.collection('correspondances').updateOne(
              { _id: corr._id },
              { $unset: { assignedTo: "" } }
            );
            errors++;
            continue;
          }
          
          console.log(`   👤 Assigné à: ${user.firstName} ${user.lastName} (${user.role})`);
          
          // Mettre à jour si nécessaire
          if (needsUpdate) {
            await db.collection('correspondances').updateOne(
              { _id: corr._id },
              { $set: { assignedTo: newAssignedTo } }
            );
            console.log(`   ✅ Assignation corrigée`);
            corrected++;
          } else {
            console.log(`   ✅ Assignation déjà correcte`);
          }
        } else {
          console.log(`   ❌ AssignedTo invalide, suppression`);
          await db.collection('correspondances').updateOne(
            { _id: corr._id },
            { $unset: { assignedTo: "" } }
          );
          errors++;
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 === RÉSUMÉ ===`);
    console.log(`✅ Assignations corrigées: ${corrected}`);
    console.log(`❌ Erreurs/suppressions: ${errors}`);
    console.log(`📋 Total traité: ${correspondances.length}`);
    
    // 2. Vérification finale - tester avec un directeur
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    
    const directors = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    if (directors.length > 0) {
      const testDirector = directors[0];
      console.log(`\n🎯 Test avec: ${testDirector.firstName} ${testDirector.lastName}`);
      
      // Simuler la requête API
      const directorCorrespondances = await db.collection('correspondances').find({
        $or: [
          { assignedTo: testDirector._id },
          { assignedTo: { $exists: false } },
          { assignedTo: null }
        ]
      }).toArray();
      
      const directlyAssigned = directorCorrespondances.filter(c => 
        c.assignedTo && c.assignedTo.toString() === testDirector._id.toString()
      );
      
      console.log(`📋 Correspondances trouvées: ${directorCorrespondances.length}`);
      console.log(`📌 Directement assignées: ${directlyAssigned.length}`);
      
      if (directlyAssigned.length > 0) {
        console.log(`\n✅ Correspondances assignées au directeur:`);
        directlyAssigned.forEach((corr, index) => {
          console.log(`   ${index + 1}. "${corr.objet || corr.subject}"`);
          console.log(`      Status: ${corr.status} | Workflow: ${corr.workflowStatus}`);
          console.log(`      Drafts: ${corr.responseDrafts?.length || 0}`);
        });
      } else {
        console.log(`\n❌ Aucune correspondance assignée au directeur`);
        console.log(`💡 Exécutez create-draft-for-new-correspondance.js pour créer un test`);
      }
    }
    
    // 3. Corriger aussi les workflows si nécessaire
    console.log(`\n🔧 === CORRECTION DES WORKFLOWS ===`);
    
    const workflows = await db.collection('correspondenceworkflows').find({
      assignedTo: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`📋 Workflows avec assignedTo: ${workflows.length}`);
    
    let workflowsCorrected = 0;
    for (const workflow of workflows) {
      try {
        const currentAssignedTo = workflow.assignedTo;
        
        if (typeof currentAssignedTo === 'string' && mongoose.Types.ObjectId.isValid(currentAssignedTo)) {
          const newAssignedTo = new mongoose.Types.ObjectId(currentAssignedTo);
          
          await db.collection('correspondenceworkflows').updateOne(
            { _id: workflow._id },
            { $set: { assignedTo: newAssignedTo } }
          );
          
          workflowsCorrected++;
        }
      } catch (error) {
        console.log(`❌ Erreur workflow: ${error.message}`);
      }
    }
    
    console.log(`✅ Workflows corrigés: ${workflowsCorrected}`);
    
    console.log(`\n🎯 === INSTRUCTIONS ===`);
    console.log(`1. Les assignations ont été corrigées`);
    console.log(`2. Testez maintenant la connexion en tant que directeur`);
    console.log(`3. Les correspondances assignées devraient maintenant apparaître`);
    console.log(`4. Si aucune correspondance n'est assignée, exécutez create-draft-for-new-correspondance.js`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixDirectorAssignments();
