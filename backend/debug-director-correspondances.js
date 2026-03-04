const mongoose = require('mongoose');

async function debugDirectorCorrespondances() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC CORRESPONDANCES DIRECTEUR ===\n');
    
    // 1. Lister tous les directeurs
    const directors = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    console.log(`👥 Directeurs trouvés: ${directors.length}`);
    directors.forEach((dir, index) => {
      console.log(`   ${index + 1}. ${dir.firstName} ${dir.lastName} (${dir.role})`);
      console.log(`      ID: ${dir._id} (type: ${typeof dir._id})`);
      console.log(`      Email: ${dir.email}`);
    });
    
    if (directors.length === 0) {
      console.log('❌ Aucun directeur trouvé !');
      process.exit(1);
    }
    
    // 2. Prendre le premier directeur pour le test
    const testDirector = directors[0];
    console.log(`\n🎯 Test avec: ${testDirector.firstName} ${testDirector.lastName}`);
    console.log(`   ID: ${testDirector._id}`);
    
    // 3. Chercher toutes les correspondances
    const allCorrespondances = await db.collection('correspondances').find({}).toArray();
    console.log(`\n📋 Total correspondances: ${allCorrespondances.length}`);
    
    // 4. Analyser les assignations
    const assignedCorrespondances = allCorrespondances.filter(c => c.assignedTo);
    console.log(`📌 Correspondances avec assignedTo: ${assignedCorrespondances.length}`);
    
    if (assignedCorrespondances.length > 0) {
      console.log('\n📝 Détails des assignations:');
      assignedCorrespondances.forEach((corr, index) => {
        console.log(`   ${index + 1}. "${corr.objet || corr.subject}"`);
        console.log(`      AssignedTo: ${corr.assignedTo} (type: ${typeof corr.assignedTo})`);
        console.log(`      WorkflowStatus: ${corr.workflowStatus}`);
        console.log(`      Status: ${corr.status}`);
        
        // Vérifier si c'est assigné à notre directeur de test
        const isAssignedToTestDirector = corr.assignedTo && 
          corr.assignedTo.toString() === testDirector._id.toString();
        console.log(`      Assigné au directeur test: ${isAssignedToTestDirector ? '✅' : '❌'}`);
        console.log('');
      });
    }
    
    // 5. Simuler la requête API pour le directeur
    console.log('\n🔍 === SIMULATION REQUÊTE API DIRECTEUR ===');
    
    const directorFilter = {
      $or: [
        { assignedTo: testDirector._id },
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    };
    
    const directorCorrespondances = await db.collection('correspondances').find(directorFilter).toArray();
    console.log(`📋 Correspondances trouvées avec le filtre directeur: ${directorCorrespondances.length}`);
    
    // Séparer par catégorie
    const directlyAssigned = directorCorrespondances.filter(c => 
      c.assignedTo && c.assignedTo.toString() === testDirector._id.toString()
    );
    const unassigned = directorCorrespondances.filter(c => 
      !c.assignedTo || c.assignedTo === null
    );
    
    console.log(`   - Directement assignées: ${directlyAssigned.length}`);
    console.log(`   - Non assignées: ${unassigned.length}`);
    
    if (directlyAssigned.length > 0) {
      console.log('\n✅ Correspondances directement assignées:');
      directlyAssigned.forEach((corr, index) => {
        console.log(`   ${index + 1}. "${corr.objet || corr.subject}"`);
        console.log(`      Status: ${corr.status} | Workflow: ${corr.workflowStatus}`);
        console.log(`      Drafts: ${corr.responseDrafts?.length || 0}`);
      });
    } else {
      console.log('\n❌ Aucune correspondance directement assignée au directeur');
    }
    
    // 6. Vérifier les workflows
    console.log('\n🔍 === VÉRIFICATION WORKFLOWS ===');
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`📋 Workflows trouvés: ${workflows.length}`);
    
    const directorWorkflows = workflows.filter(w => 
      w.assignedTo && w.assignedTo.toString() === testDirector._id.toString()
    );
    console.log(`📌 Workflows assignés au directeur: ${directorWorkflows.length}`);
    
    if (directorWorkflows.length > 0) {
      directorWorkflows.forEach((workflow, index) => {
        console.log(`   ${index + 1}. Correspondance: ${workflow.correspondanceId}`);
        console.log(`      Status: ${workflow.currentStatus}`);
        console.log(`      AssignedTo: ${workflow.assignedTo}`);
      });
    }
    
    // 7. Recommandations
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (directlyAssigned.length === 0) {
      console.log('❌ Problème: Aucune correspondance assignée au directeur');
      console.log('🔧 Solutions possibles:');
      console.log('   1. Vérifier que assignedTo est bien un ObjectId MongoDB');
      console.log('   2. Vérifier que le workflow assigne correctement');
      console.log('   3. Exécuter le script create-draft-for-new-correspondance.js');
    } else {
      console.log('✅ Des correspondances sont assignées au directeur');
      console.log('🔧 Si elles n\'apparaissent pas dans l\'interface:');
      console.log('   1. Vérifier les filtres côté frontend');
      console.log('   2. Vérifier l\'authentification du directeur');
      console.log('   3. Vérifier les permissions d\'accès');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDirectorCorrespondances();
