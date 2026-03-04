const mongoose = require('mongoose');

async function fixWorkflowDGVisibility() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION WORKFLOW DG VISIBILITÉ ===\n');
    
    // 1. Trouver le DG
    const dg = await db.collection('users').findOne({
      role: 'DIRECTEUR_GENERAL'
    });
    
    if (!dg) {
      console.log('❌ Aucun Directeur Général trouvé !');
      process.exit(1);
    }
    
    console.log(`👑 DG trouvé: ${dg.firstName} ${dg.lastName}`);
    console.log(`   ID: ${dg._id}`);
    console.log(`   Email: ${dg.email}`);
    
    // 2. Trouver toutes les correspondances assignées à des directeurs
    const correspondancesWithDirectors = await db.collection('correspondances').find({
      assignedTo: { $exists: true, $ne: null },
      workflowStatus: { $in: ['ASSIGNED_TO_DIRECTOR', 'DIRECTOR_DRAFT', 'PENDING'] }
    }).toArray();
    
    console.log(`\n📋 Correspondances assignées à des directeurs: ${correspondancesWithDirectors.length}`);
    
    if (correspondancesWithDirectors.length === 0) {
      console.log('⚠️ Aucune correspondance assignée trouvée');
      process.exit(0);
    }
    
    let workflowsCreated = 0;
    let workflowsUpdated = 0;
    let correspondancesUpdated = 0;
    
    // 3. Pour chaque correspondance, créer/mettre à jour le workflow
    for (const corresp of correspondancesWithDirectors) {
      try {
        console.log(`\n📝 Traitement: "${corresp.objet || corresp.subject}"`);
        console.log(`   AssignedTo: ${corresp.assignedTo}`);
        console.log(`   WorkflowStatus: ${corresp.workflowStatus}`);
        
        // Vérifier si un workflow existe déjà
        let existingWorkflow = await db.collection('correspondenceworkflows').findOne({
          correspondanceId: corresp._id
        });
        
        if (existingWorkflow) {
          console.log(`   📋 Workflow existant trouvé: ${existingWorkflow._id}`);
          
          // Mettre à jour le workflow pour inclure le DG
          await db.collection('correspondenceworkflows').updateOne(
            { _id: existingWorkflow._id },
            { 
              $set: { 
                directeurGeneral: dg._id,
                currentStatus: 'DIRECTOR_DRAFT', // Status qui permet au DG de voir
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`   ✅ Workflow mis à jour avec DG`);
          workflowsUpdated++;
        } else {
          // Créer un nouveau workflow complet
          const newWorkflow = {
            correspondanceId: corresp._id,
            assignedDirector: corresp.assignedTo,
            directeurGeneral: dg._id, // IMPORTANT: Inclure le DG
            currentStatus: 'DIRECTOR_DRAFT',
            createdAt: new Date(),
            updatedAt: new Date(),
            actions: [],
            chatMessages: [],
            responseDrafts: corresp.responseDrafts || []
          };
          
          await db.collection('correspondenceworkflows').insertOne(newWorkflow);
          console.log(`   ✅ Nouveau workflow créé avec DG`);
          workflowsCreated++;
        }
        
        // Mettre à jour le statut de la correspondance pour que le DG la voit
        await db.collection('correspondances').updateOne(
          { _id: corresp._id },
          { 
            $set: { 
              workflowStatus: 'DIRECTOR_DRAFT',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Correspondance mise à jour`);
        correspondancesUpdated++;
        
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }
    
    console.log(`\n📊 === RÉSUMÉ ===`);
    console.log(`✅ Workflows créés: ${workflowsCreated}`);
    console.log(`✅ Workflows mis à jour: ${workflowsUpdated}`);
    console.log(`✅ Correspondances mises à jour: ${correspondancesUpdated}`);
    
    // 4. Vérification finale - Tester la visibilité DG
    console.log(`\n🔍 === VÉRIFICATION DG ===`);
    
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id
    }).toArray();
    
    console.log(`📋 Workflows avec DG assigné: ${dgWorkflows.length}`);
    
    if (dgWorkflows.length > 0) {
      console.log(`\n✅ Workflows visibles par le DG:`);
      dgWorkflows.forEach((workflow, index) => {
        console.log(`   ${index + 1}. Correspondance: ${workflow.correspondanceId}`);
        console.log(`      Status: ${workflow.currentStatus}`);
        console.log(`      Directeur: ${workflow.assignedDirector}`);
      });
    }
    
    // 5. Test de la requête DG (simuler le service)
    console.log(`\n🧪 === TEST REQUÊTE DG ===`);
    
    const dgPendingWorkflows = await db.collection('correspondenceworkflows').find({
      directeurGeneral: dg._id,
      currentStatus: { $in: ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION', 'DG_REVIEW'] }
    }).toArray();
    
    console.log(`📋 Workflows en attente pour le DG: ${dgPendingWorkflows.length}`);
    
    if (dgPendingWorkflows.length > 0) {
      console.log(`\n✅ Le DG devrait voir ces correspondances:`);
      
      for (const workflow of dgPendingWorkflows) {
        const corresp = await db.collection('correspondances').findOne({
          _id: workflow.correspondanceId
        });
        
        if (corresp) {
          console.log(`   - "${corresp.objet || corresp.subject}"`);
          console.log(`     Status: ${workflow.currentStatus}`);
          console.log(`     Drafts: ${corresp.responseDrafts?.length || 0}`);
        }
      }
    }
    
    console.log(`\n🎯 === INSTRUCTIONS DE TEST ===`);
    console.log(`1. Connectez-vous comme DG avec:`);
    console.log(`   Email: ${dg.email}`);
    console.log(`   Nom: ${dg.firstName} ${dg.lastName}`);
    console.log(`2. Allez dans la section correspondances ou dashboard`);
    console.log(`3. Vous devriez voir ${dgPendingWorkflows.length} correspondance(s) en attente`);
    console.log(`4. Le DG peut maintenant initier des demandes de révision`);
    
    console.log(`\n💡 === WORKFLOW COMPLET ===`);
    console.log(`1. Correspondance créée → assignée au DIRECTEUR`);
    console.log(`2. Workflow créé → inclut DIRECTEUR + DG`);
    console.log(`3. Status: DIRECTOR_DRAFT → visible par les deux`);
    console.log(`4. Directeur peut créer un draft`);
    console.log(`5. DG peut voir et demander des révisions`);
    console.log(`6. Workflow continue selon les interactions`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixWorkflowDGVisibility();
