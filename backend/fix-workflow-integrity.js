const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const User = require('./src/models/User');

/**
 * Script de correction complète de l'intégrité du workflow
 * Corrige tous les problèmes identifiés dans le système
 */

async function fixWorkflowIntegrity() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 CORRECTION INTÉGRITÉ WORKFLOW COMPLET');
    console.log('🔧 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    let totalFixesApplied = 0;

    // 1. NETTOYAGE DES WORKFLOWS ORPHELINS
    console.log('🧹 === ÉTAPE 1: NETTOYAGE WORKFLOWS ORPHELINS ===');
    
    const workflows = await CorrespondenceWorkflow.find({}).lean();
    const correspondances = await Correspondance.find({}).select('_id').lean();
    const existingCorrespondanceIds = correspondances.map(c => c._id.toString());
    
    const orphanWorkflows = workflows.filter(w => 
      !existingCorrespondanceIds.includes(w.correspondanceId.toString())
    );

    if (orphanWorkflows.length > 0) {
      console.log(`🗑️ Suppression de ${orphanWorkflows.length} workflows orphelins...`);
      const orphanIds = orphanWorkflows.map(o => o._id);
      await CorrespondenceWorkflow.deleteMany({ _id: { $in: orphanIds } });
      console.log(`✅ ${orphanWorkflows.length} workflows orphelins supprimés`);
      totalFixesApplied += orphanWorkflows.length;
    } else {
      console.log('✅ Aucun workflow orphelin détecté');
    }

    // 2. CRÉATION DES WORKFLOWS MANQUANTS
    console.log('\n🔄 === ÉTAPE 2: CRÉATION WORKFLOWS MANQUANTS ===');
    
    const allCorrespondances = await Correspondance.find({}).lean();
    const workflowCorrespondanceIds = workflows
      .filter(w => existingCorrespondanceIds.includes(w.correspondanceId.toString()))
      .map(w => w.correspondanceId.toString());
    
    const correspondancesNeedingWorkflow = allCorrespondances.filter(c => 
      !workflowCorrespondanceIds.includes(c._id.toString()) && 
      c.workflowStatus && 
      c.workflowStatus !== 'PENDING'
    );

    if (correspondancesNeedingWorkflow.length > 0) {
      console.log(`🔄 Création de ${correspondancesNeedingWorkflow.length} workflows manquants...`);
      
      const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL', isActive: true });
      
      for (const corr of correspondancesNeedingWorkflow) {
        try {
          const assignedDirector = corr.personnesConcernees?.[0];
          
          if (assignedDirector && dg) {
            const newWorkflow = new CorrespondenceWorkflow({
              correspondanceId: corr._id,
              currentStatus: corr.workflowStatus || 'ASSIGNED_TO_DIRECTOR',
              createdBy: corr.authorId,
              bureauOrdreAgent: corr.authorId,
              superviseurBureauOrdre: corr.authorId,
              assignedDirector,
              directeurGeneral: dg._id,
              priority: corr.priority || 'MEDIUM',
              chatMessages: [],
              responseDrafts: []
            });
            
            await newWorkflow.save();
            console.log(`   ✅ Workflow créé pour correspondance: ${corr.title || corr.subject}`);
            totalFixesApplied++;
          }
        } catch (error) {
          console.log(`   ❌ Erreur création workflow pour ${corr._id}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Aucun workflow manquant détecté');
    }

    // 3. SYNCHRONISATION DES STATUTS
    console.log('\n🔄 === ÉTAPE 3: SYNCHRONISATION STATUTS ===');
    
    const allWorkflowsUpdated = await CorrespondenceWorkflow.find({}).lean();
    let statusSyncCount = 0;

    for (const workflow of allWorkflowsUpdated) {
      try {
        const correspondance = await Correspondance.findById(workflow.correspondanceId);
        
        if (correspondance && correspondance.workflowStatus !== workflow.currentStatus) {
          console.log(`🔄 Synchronisation statut pour ${correspondance.title || correspondance.subject}`);
          console.log(`   Correspondance: ${correspondance.workflowStatus} → Workflow: ${workflow.currentStatus}`);
          
          // Prioriser le statut de la correspondance (plus récent)
          await CorrespondenceWorkflow.updateOne(
            { _id: workflow._id },
            { 
              currentStatus: correspondance.workflowStatus,
              updatedAt: new Date()
            }
          );
          
          statusSyncCount++;
          totalFixesApplied++;
        }
      } catch (error) {
        console.log(`   ❌ Erreur sync statut workflow ${workflow._id}: ${error.message}`);
      }
    }

    if (statusSyncCount > 0) {
      console.log(`✅ ${statusSyncCount} statuts synchronisés`);
    } else {
      console.log('✅ Tous les statuts sont déjà synchronisés');
    }

    // 4. VÉRIFICATION DES ASSIGNATIONS
    console.log('\n👥 === ÉTAPE 4: VÉRIFICATION ASSIGNATIONS ===');
    
    const correspondancesWithIssues = allCorrespondances.filter(c => 
      c.workflowStatus === 'ASSIGNED_TO_DIRECTOR' && 
      (!c.personnesConcernees || c.personnesConcernees.length === 0)
    );

    if (correspondancesWithIssues.length > 0) {
      console.log(`⚠️ ${correspondancesWithIssues.length} correspondances avec assignation incohérente`);
      
      for (const corr of correspondancesWithIssues) {
        console.log(`   📋 ${corr.title || corr.subject}`);
        console.log(`      Status: ${corr.workflowStatus} mais aucune assignation`);
        console.log(`      Recommandation: Réassigner ou changer le statut à PENDING`);
      }
      
      console.log('\n💡 Action manuelle requise pour ces correspondances');
    } else {
      console.log('✅ Toutes les assignations sont cohérentes');
    }

    // 5. VÉRIFICATION DES DRAFTS
    console.log('\n📝 === ÉTAPE 5: VÉRIFICATION DRAFTS ===');
    
    const correspondancesWithDrafts = allCorrespondances.filter(c => 
      c.responseDrafts && c.responseDrafts.length > 0
    );

    let draftIssues = 0;
    
    for (const corr of correspondancesWithDrafts) {
      const pendingDrafts = corr.responseDrafts.filter(d => 
        d.status === 'PENDING_DG_REVIEW' && 
        (!d.dgFeedbacks || d.dgFeedbacks.length === 0)
      );
      
      if (pendingDrafts.length > 0) {
        draftIssues++;
        console.log(`📝 Correspondance: ${corr.title || corr.subject}`);
        console.log(`   ${pendingDrafts.length} draft(s) en attente de review DG`);
      }
    }

    if (draftIssues > 0) {
      console.log(`⚠️ ${draftIssues} correspondances avec drafts en attente DG`);
      console.log('💡 Vérifier la visibilité des drafts pour le Directeur Général');
    } else {
      console.log('✅ Aucun draft bloqué détecté');
    }

    // 6. STATISTIQUES FINALES
    console.log('\n📊 === STATISTIQUES FINALES ===');
    
    const finalCorrespondances = await Correspondance.find({}).lean();
    const finalWorkflows = await CorrespondenceWorkflow.find({}).lean();
    const users = await User.find({}).lean();
    
    console.log(`📋 Correspondances: ${finalCorrespondances.length}`);
    console.log(`🔄 Workflows: ${finalWorkflows.length}`);
    console.log(`👥 Utilisateurs: ${users.length}`);
    console.log(`🔧 Total corrections appliquées: ${totalFixesApplied}`);

    // 7. RÉSUMÉ DES ACTIONS
    console.log('\n✅ === RÉSUMÉ DES CORRECTIONS ===');
    
    if (totalFixesApplied > 0) {
      console.log('🔧 Actions effectuées:');
      if (orphanWorkflows.length > 0) {
        console.log(`   - ${orphanWorkflows.length} workflows orphelins supprimés`);
      }
      if (correspondancesNeedingWorkflow.length > 0) {
        console.log(`   - ${correspondancesNeedingWorkflow.length} workflows manquants créés`);
      }
      if (statusSyncCount > 0) {
        console.log(`   - ${statusSyncCount} statuts synchronisés`);
      }
      console.log('\n✅ INTÉGRITÉ DU WORKFLOW RESTAURÉE');
    } else {
      console.log('✅ AUCUNE CORRECTION NÉCESSAIRE - Système déjà intègre');
    }

    // 8. RECOMMANDATIONS
    console.log('\n💡 === RECOMMANDATIONS ===');
    console.log('1. Exécuter régulièrement ce script de maintenance');
    console.log('2. Surveiller les logs de création de correspondances');
    console.log('3. Vérifier que les assignations automatiques fonctionnent');
    console.log('4. Tester le processus complet de workflow périodiquement');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la correction
fixWorkflowIntegrity();
