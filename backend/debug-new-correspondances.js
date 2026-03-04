const mongoose = require('mongoose');

async function debugNewCorrespondances() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 === DIAGNOSTIC NOUVELLES CORRESPONDANCES ===\n');
    
    // 1. Vérifier les correspondances récentes
    const recentCorrespondances = await db.collection('correspondances').find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`📧 Correspondances récentes: ${recentCorrespondances.length}`);
    
    recentCorrespondances.forEach((corresp, index) => {
      console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
      console.log(`      - ID: ${corresp._id}`);
      console.log(`      - Status: ${corresp.status}`);
      console.log(`      - WorkflowStatus: ${corresp.workflowStatus || 'undefined'}`);
      console.log(`      - AssignedTo: ${corresp.assignedTo || 'undefined'}`);
      console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0}`);
      console.log(`      - CreatedAt: ${corresp.createdAt}`);
    });
    
    // 2. Vérifier les workflows correspondants
    console.log('\n🔄 === VÉRIFICATION WORKFLOWS ===');
    
    const allWorkflows = await db.collection('correspondenceworkflows').find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Workflows totaux: ${allWorkflows.length}`);
    
    if (allWorkflows.length > 0) {
      allWorkflows.forEach((workflow, index) => {
        console.log(`\n   ${index + 1}. Workflow ${workflow._id}`);
        console.log(`      - CorrespondanceId: ${workflow.correspondanceId}`);
        console.log(`      - Status: ${workflow.currentStatus}`);
        console.log(`      - AssignedDirector: ${workflow.assignedDirector}`);
        console.log(`      - DirecteurGeneral: ${workflow.directeurGeneral}`);
        console.log(`      - Drafts: ${workflow.responseDrafts?.length || 0}`);
        console.log(`      - CreatedAt: ${workflow.createdAt}`);
        
        // Vérifier si la correspondance liée existe
        const linkedCorresp = recentCorrespondances.find(c => 
          c._id.toString() === workflow.correspondanceId.toString()
        );
        
        if (linkedCorresp) {
          console.log(`      - ✅ Correspondance liée trouvée: ${linkedCorresp.title || linkedCorresp.subject}`);
        } else {
          console.log(`      - ❌ Correspondance liée non trouvée`);
        }
      });
    } else {
      console.log('❌ Aucun workflow trouvé');
    }
    
    // 3. Identifier les correspondances sans workflow
    console.log('\n🔍 === CORRESPONDANCES SANS WORKFLOW ===');
    
    const correspondancesWithoutWorkflow = [];
    
    for (const corresp of recentCorrespondances) {
      const hasWorkflow = allWorkflows.some(w => 
        w.correspondanceId.toString() === corresp._id.toString()
      );
      
      if (!hasWorkflow) {
        correspondancesWithoutWorkflow.push(corresp);
      }
    }
    
    console.log(`Correspondances sans workflow: ${correspondancesWithoutWorkflow.length}`);
    
    correspondancesWithoutWorkflow.forEach((corresp, index) => {
      console.log(`\n   ${index + 1}. ${corresp.title || corresp.subject}`);
      console.log(`      - ID: ${corresp._id}`);
      console.log(`      - Status: ${corresp.status}`);
      console.log(`      - AssignedTo: ${corresp.assignedTo || 'undefined'}`);
      console.log(`      - PersonnesConcernees: ${corresp.personnesConcernees?.length || 0}`);
    });
    
    // 4. Créer des workflows manquants
    if (correspondancesWithoutWorkflow.length > 0) {
      console.log('\n🔧 === CRÉATION WORKFLOWS MANQUANTS ===');
      
      // Trouver le DG
      const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
      if (!dg) {
        console.log('❌ DG non trouvé');
        process.exit(1);
      }
      
      console.log(`👑 DG trouvé: ${dg.firstName} ${dg.lastName}`);
      
      // Trouver des directeurs
      const directors = await db.collection('users').find({
        role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
      }).toArray();
      
      console.log(`👥 Directeurs disponibles: ${directors.length}`);
      
      for (const corresp of correspondancesWithoutWorkflow) {
        console.log(`\n🔧 Création workflow pour: ${corresp.title || corresp.subject}`);
        
        // Déterminer le directeur assigné
        let assignedDirector = null;
        
        if (corresp.assignedTo) {
          // Vérifier si assignedTo est un directeur
          assignedDirector = directors.find(d => 
            d._id.toString() === corresp.assignedTo.toString()
          );
        }
        
        if (!assignedDirector && corresp.personnesConcernees && corresp.personnesConcernees.length > 0) {
          // Chercher dans personnesConcernees
          for (const personId of corresp.personnesConcernees) {
            const person = directors.find(d => 
              d._id.toString() === personId.toString()
            );
            if (person) {
              assignedDirector = person;
              break;
            }
          }
        }
        
        if (!assignedDirector) {
          // Assigner le premier directeur disponible
          assignedDirector = directors[0];
        }
        
        console.log(`   👤 Directeur assigné: ${assignedDirector.firstName} ${assignedDirector.lastName}`);
        
        // Créer le workflow
        const newWorkflow = {
          _id: new mongoose.Types.ObjectId(),
          correspondanceId: corresp._id,
          currentStatus: 'ASSIGNED_TO_DIRECTOR',
          assignedDirector: assignedDirector._id,
          directeurGeneral: dg._id,
          responseDrafts: [],
          chatMessages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const insertResult = await db.collection('correspondenceworkflows').insertOne(newWorkflow);
        
        if (insertResult.acknowledged) {
          console.log(`   ✅ Workflow créé: ${newWorkflow._id}`);
          
          // Mettre à jour le statut de la correspondance
          const updateResult = await db.collection('correspondances').updateOne(
            { _id: corresp._id },
            {
              $set: {
                workflowStatus: 'ASSIGNED_TO_DIRECTOR',
                assignedTo: assignedDirector._id,
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount === 1) {
            console.log(`   ✅ Correspondance mise à jour`);
          }
        } else {
          console.log(`   ❌ Échec création workflow`);
        }
      }
    }
    
    // 5. Tester le service DG après corrections
    console.log('\n🧪 === TEST SERVICE DG APRÈS CORRECTIONS ===');
    
    try {
      const DirectorGeneralWorkflowService = require('./src/services/directorGeneralWorkflowService');
      
      const dgTasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(dg._id);
      
      console.log(`📊 Service DG après corrections: ${dgTasks.length} correspondances`);
      
      dgTasks.forEach((task, index) => {
        console.log(`\n   ${index + 1}. ${task.title || task.subject}`);
        console.log(`      - Status: ${task.status}`);
        console.log(`      - WorkflowStatus: ${task.workflowStatus}`);
        console.log(`      - Drafts: ${task.responseDrafts?.length || 0}`);
        
        if (task.workflowInfo) {
          console.log(`      - Workflow Status: ${task.workflowInfo.currentStatus}`);
          console.log(`      - Assigned Director: ${task.workflowInfo.assignedDirector}`);
        }
      });
      
    } catch (serviceError) {
      console.error('❌ Erreur service DG:', serviceError.message);
    }
    
    console.log('\n🎯 === RECOMMANDATIONS ===');
    console.log('1. Redémarrer le serveur backend');
    console.log('2. Tester l\'interface DG');
    console.log('3. Vérifier que les correspondances ont le bon statut');
    console.log('4. Créer des drafts via l\'interface directeur');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugNewCorrespondances();
