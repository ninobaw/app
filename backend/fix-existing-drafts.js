const mongoose = require('mongoose');

async function fixExistingDrafts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔧 === CORRECTION DRAFTS EXISTANTS ===\n');
    
    // 1. Chercher les correspondances avec des drafts dans le mauvais modèle
    const correspondancesWithDrafts = await db.collection('correspondances').find({
      responseDrafts: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`📋 Correspondances avec drafts dans le mauvais modèle: ${correspondancesWithDrafts.length}`);
    
    if (correspondancesWithDrafts.length === 0) {
      console.log('✅ Aucun draft à migrer');
      process.exit(0);
    }
    
    // 2. Trouver le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    if (!dg) {
      console.log('❌ Aucun DG trouvé');
      process.exit(1);
    }
    
    console.log(`👑 DG trouvé: ${dg.firstName} ${dg.lastName}`);
    
    let migratedCount = 0;
    
    // 3. Migrer chaque correspondance
    for (const correspondance of correspondancesWithDrafts) {
      console.log(`\n🔄 Migration: "${correspondance.title || correspondance.subject}"`);
      console.log(`   ID: ${correspondance._id}`);
      console.log(`   Drafts à migrer: ${correspondance.responseDrafts.length}`);
      
      // Vérifier si un workflow existe déjà
      let workflow = await db.collection('correspondenceworkflows').findOne({
        correspondanceId: correspondance._id
      });
      
      if (workflow) {
        console.log(`   ⚠️ Workflow existe déjà: ${workflow._id}`);
        
        // Fusionner les drafts
        const existingDrafts = workflow.responseDrafts || [];
        const newDrafts = correspondance.responseDrafts.map(draft => ({
          ...draft,
          id: draft.id || new mongoose.Types.ObjectId().toString(),
          status: draft.status === 'DRAFT' ? 'PENDING_DG_REVIEW' : draft.status
        }));
        
        // Éviter les doublons
        const mergedDrafts = [...existingDrafts];
        newDrafts.forEach(newDraft => {
          const exists = existingDrafts.find(existing => 
            existing.directorId === newDraft.directorId
          );
          if (!exists) {
            mergedDrafts.push(newDraft);
          }
        });
        
        await db.collection('correspondenceworkflows').updateOne(
          { _id: workflow._id },
          { 
            $set: { 
              responseDrafts: mergedDrafts,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Drafts fusionnés dans workflow existant`);
        
      } else {
        console.log(`   📝 Création nouveau workflow`);
        
        // Créer un nouveau workflow
        const newWorkflow = {
          correspondanceId: correspondance._id,
          assignedDirector: correspondance.responseDrafts[0]?.directorId || null,
          directeurGeneral: dg._id,
          currentStatus: 'DIRECTOR_DRAFT',
          responseDrafts: correspondance.responseDrafts.map(draft => ({
            ...draft,
            id: draft.id || new mongoose.Types.ObjectId().toString(),
            status: draft.status === 'DRAFT' ? 'PENDING_DG_REVIEW' : draft.status
          })),
          chatMessages: [],
          createdAt: correspondance.responseDrafts[0]?.createdAt || new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('correspondenceworkflows').insertOne(newWorkflow);
        console.log(`   ✅ Nouveau workflow créé: ${newWorkflow._id}`);
      }
      
      // Supprimer les drafts de la correspondance
      await db.collection('correspondances').updateOne(
        { _id: correspondance._id },
        { 
          $unset: { responseDrafts: "" },
          $set: { updatedAt: new Date() }
        }
      );
      
      console.log(`   🗑️ Drafts supprimés de la correspondance`);
      migratedCount++;
    }
    
    // 4. Vérification finale
    console.log(`\n🔍 === VÉRIFICATION FINALE ===`);
    
    const totalWorkflows = await db.collection('correspondenceworkflows').countDocuments();
    const workflowsWithDrafts = await db.collection('correspondenceworkflows').countDocuments({
      'responseDrafts.0': { $exists: true }
    });
    const pendingDrafts = await db.collection('correspondenceworkflows').countDocuments({
      'responseDrafts.status': 'PENDING_DG_REVIEW'
    });
    
    // Test visibilité DG
    const dgWorkflows = await db.collection('correspondenceworkflows').find({
      $or: [
        { directeurGeneral: dg._id },
        { directeurGeneral: dg._id.toString() },
        { 'responseDrafts.status': 'PENDING_DG_REVIEW' }
      ]
    }).toArray();
    
    console.log(`📊 Statistiques finales:`);
    console.log(`   - Correspondances migrées: ${migratedCount}`);
    console.log(`   - Total workflows: ${totalWorkflows}`);
    console.log(`   - Workflows avec drafts: ${workflowsWithDrafts}`);
    console.log(`   - Drafts en attente DG: ${pendingDrafts}`);
    console.log(`   - Workflows visibles DG: ${dgWorkflows.length}`);
    
    // Vérifier qu'il n'y a plus de drafts dans les correspondances
    const remainingDrafts = await db.collection('correspondances').countDocuments({
      responseDrafts: { $exists: true, $ne: [] }
    });
    
    console.log(`\n🎉 === MIGRATION TERMINÉE ===`);
    console.log(`✅ Drafts migrés: ${migratedCount}`);
    console.log(`✅ Drafts restants dans correspondances: ${remainingDrafts}`);
    console.log(`✅ Workflows visibles pour DG: ${dgWorkflows.length}`);
    
    if (remainingDrafts === 0 && dgWorkflows.length > 0) {
      console.log(`🎉 SUCCÈS COMPLET: Migration réussie !`);
    } else {
      console.log(`⚠️ Vérification nécessaire`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixExistingDrafts();
