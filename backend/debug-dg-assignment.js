const mongoose = require('mongoose');

// Configuration MongoDB
const MONGO_URI = 'mongodb://localhost:27017/aerodoc';

async function debugDGAssignment() {
  try {
    console.log('🔍 === DIAGNOSTIC ASSIGNATION DG ===\n');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    // 1. Vérifier les correspondances existantes
    console.log('📝 1. Correspondances existantes:');
    const correspondances = await db.collection('correspondances').find({}).toArray();
    console.log(`   Trouvées: ${correspondances.length}`);
    
    correspondances.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.numeroCorrespondance || corr._id}`);
      console.log(`      - Objet: ${corr.objet || 'N/A'}`);
      console.log(`      - Statut: ${corr.statut || 'N/A'}`);
      console.log(`      - Workflow Status: ${corr.workflowStatus || 'N/A'}`);
      console.log(`      - Assigné à: ${corr.assignedTo || 'N/A'}`);
      console.log(`      - Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
    });
    
    // 2. Vérifier les workflows correspondants
    console.log('\n🔄 2. Workflows existants:');
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`   Trouvés: ${workflows.length}`);
    
    workflows.forEach((workflow, index) => {
      console.log(`   ${index + 1}. Workflow ${workflow._id}`);
      console.log(`      - Correspondance ID: ${workflow.correspondanceId}`);
      console.log(`      - Statut: ${workflow.currentStatus}`);
      console.log(`      - Directeur assigné: ${workflow.assignedDirector || 'N/A'}`);
      console.log(`      - DG assigné: ${workflow.directeurGeneral || 'N/A'}`);
      console.log(`      - Drafts: ${workflow.responseDrafts?.length || 0}`);
      console.log(`      - Messages: ${workflow.chatMessages?.length || 0}`);
      
      if (workflow.responseDrafts?.length > 0) {
        console.log(`      - Détails des drafts:`);
        workflow.responseDrafts.forEach((draft, draftIndex) => {
          console.log(`        ${draftIndex + 1}. Status: ${draft.status}`);
          console.log(`           Directeur: ${draft.directorId}`);
          console.log(`           Contenu: ${draft.responseContent?.substring(0, 50)}...`);
        });
      }
    });
    
    // 3. Vérifier les utilisateurs DG
    console.log('\n👑 3. Utilisateurs DG:');
    const dgs = await db.collection('users').find({ role: 'DIRECTEUR_GENERAL' }).toArray();
    console.log(`   Trouvés: ${dgs.length}`);
    
    dgs.forEach((dg, index) => {
      console.log(`   ${index + 1}. ${dg.firstName} ${dg.lastName}`);
      console.log(`      - Email: ${dg.email}`);
      console.log(`      - ID: ${dg._id}`);
      console.log(`      - Actif: ${dg.isActive !== false ? 'Oui' : 'Non'}`);
    });
    
    // 4. Analyser le problème
    console.log('\n🎯 4. ANALYSE DU PROBLÈME:');
    
    if (workflows.length === 0) {
      console.log('   ❌ PROBLÈME: Aucun workflow trouvé');
      console.log('   💡 SOLUTION: Vérifier la création automatique de workflow');
    } else {
      workflows.forEach((workflow, index) => {
        console.log(`\n   Workflow ${index + 1}:`);
        
        if (!workflow.directeurGeneral) {
          console.log('   ❌ PROBLÈME: DG non assigné au workflow');
          console.log('   💡 SOLUTION: Assigner automatiquement le DG');
        } else {
          console.log('   ✅ DG assigné au workflow');
        }
        
        if (workflow.responseDrafts?.length > 0) {
          const pendingDrafts = workflow.responseDrafts.filter(d => 
            d.status === 'PENDING_DG_REVIEW' || d.status === 'SUBMITTED_TO_DG'
          );
          
          if (pendingDrafts.length > 0) {
            console.log(`   ✅ ${pendingDrafts.length} draft(s) en attente de révision DG`);
            
            if (!workflow.directeurGeneral) {
              console.log('   ❌ MAIS: DG non assigné, donc ne peut pas voir les drafts');
            }
          } else {
            console.log('   ⚠️ Aucun draft en attente de révision DG');
          }
        } else {
          console.log('   ⚠️ Aucun draft trouvé');
        }
      });
    }
    
    console.log('\n📋 RÉSUMÉ DES ACTIONS NÉCESSAIRES:');
    
    if (workflows.some(w => !w.directeurGeneral)) {
      console.log('   1. ⚠️ Assigner le DG aux workflows existants');
    }
    
    if (workflows.some(w => w.responseDrafts?.some(d => d.status === 'PENDING_DG_REVIEW'))) {
      console.log('   2. ✅ Des drafts sont prêts pour révision DG');
    }
    
    if (dgs.length === 0) {
      console.log('   3. ❌ Créer un utilisateur DG');
    } else {
      console.log('   3. ✅ Utilisateur DG existe');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

debugDGAssignment();
