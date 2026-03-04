const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Migration vers un modèle unifié : Correspondance.responseDrafts comme source unique
 */

async function migrateToSingleModel() {
  try {
    console.log('🔄 ========================================');
    console.log('🔄 MIGRATION VERS MODÈLE UNIFIÉ');
    console.log('🔄 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. ANALYSER L'ÉTAT ACTUEL
    console.log('📊 === ANALYSE ÉTAT ACTUEL ===');
    
    const correspondances = await Correspondance.find({}).lean();
    const workflows = await CorrespondenceWorkflow.find({}).lean();
    
    console.log(`📋 Correspondances: ${correspondances.length}`);
    console.log(`🔄 Workflows: ${workflows.length}`);

    // Analyser les drafts dans chaque modèle
    let draftsInCorrespondances = 0;
    let draftsInWorkflows = 0;
    
    correspondances.forEach(corr => {
      if (corr.responseDrafts && corr.responseDrafts.length > 0) {
        draftsInCorrespondances += corr.responseDrafts.length;
      }
    });
    
    workflows.forEach(workflow => {
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        draftsInWorkflows += workflow.responseDrafts.length;
      }
    });

    console.log(`📝 Drafts dans Correspondances: ${draftsInCorrespondances}`);
    console.log(`📝 Drafts dans Workflows: ${draftsInWorkflows}`);

    // 2. MIGRER LES DRAFTS MANQUANTS
    console.log('\n🔄 === MIGRATION DES DRAFTS ===');
    
    let migratedCount = 0;
    let updatedCount = 0;

    for (const workflow of workflows) {
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        // Trouver la correspondance associée
        const correspondance = await Correspondance.findById(workflow.correspondanceId);
        
        if (correspondance) {
          console.log(`🔄 Migration drafts pour correspondance: ${correspondance.title || correspondance.subject}`);
          
          // Initialiser responseDrafts si nécessaire
          if (!correspondance.responseDrafts) {
            correspondance.responseDrafts = [];
          }

          // Migrer chaque draft du workflow vers la correspondance
          workflow.responseDrafts.forEach(workflowDraft => {
            // Vérifier si le draft existe déjà dans la correspondance
            const existingDraftIndex = correspondance.responseDrafts.findIndex(
              corrDraft => corrDraft.directorId.toString() === workflowDraft.directorId.toString()
            );

            if (existingDraftIndex >= 0) {
              // Mettre à jour le draft existant avec les données du workflow
              correspondance.responseDrafts[existingDraftIndex] = workflowDraft;
              console.log(`   ✅ Draft mis à jour pour ${workflowDraft.directorName}`);
              updatedCount++;
            } else {
              // Ajouter le nouveau draft
              correspondance.responseDrafts.push(workflowDraft);
              console.log(`   ➕ Nouveau draft ajouté pour ${workflowDraft.directorName}`);
              migratedCount++;
            }
          });

          // Synchroniser le statut workflow
          if (workflow.currentStatus && workflow.currentStatus !== correspondance.workflowStatus) {
            console.log(`   🔄 Status: ${correspondance.workflowStatus} → ${workflow.currentStatus}`);
            correspondance.workflowStatus = workflow.currentStatus;
          }

          // Sauvegarder les modifications
          correspondance.markModified('responseDrafts');
          await correspondance.save();
          console.log(`   💾 Correspondance sauvegardée\n`);
        }
      }
    }

    console.log(`✅ Migration terminée:`);
    console.log(`   📝 Drafts migrés: ${migratedCount}`);
    console.log(`   🔄 Drafts mis à jour: ${updatedCount}`);

    // 3. NETTOYER LES WORKFLOWS (OPTIONNEL - COMMENTÉ POUR SÉCURITÉ)
    console.log('\n🧹 === NETTOYAGE (SIMULATION) ===');
    console.log('⚠️ Nettoyage des workflows désactivé pour sécurité');
    console.log('💡 Pour nettoyer, décommentez la section suivante après vérification');
    
    /*
    // DÉCOMMENTER APRÈS VÉRIFICATION COMPLÈTE
    console.log('🗑️ Suppression des responseDrafts dans CorrespondenceWorkflow...');
    
    for (const workflow of workflows) {
      if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
        await CorrespondenceWorkflow.updateOne(
          { _id: workflow._id },
          { $unset: { responseDrafts: "" } }
        );
        console.log(`   🗑️ Drafts supprimés du workflow ${workflow._id}`);
      }
    }
    */

    // 4. VÉRIFICATION FINALE
    console.log('\n✅ === VÉRIFICATION FINALE ===');
    
    const updatedCorrespondances = await Correspondance.find({}).lean();
    let finalDraftsCount = 0;
    
    updatedCorrespondances.forEach(corr => {
      if (corr.responseDrafts && corr.responseDrafts.length > 0) {
        finalDraftsCount += corr.responseDrafts.length;
      }
    });

    console.log(`📝 Total drafts dans Correspondances après migration: ${finalDraftsCount}`);
    console.log(`📊 Différence: +${finalDraftsCount - draftsInCorrespondances} drafts`);

    // 5. RECOMMANDATIONS POST-MIGRATION
    console.log('\n💡 === ACTIONS POST-MIGRATION ===');
    console.log('1. 🔄 Modifier CorrespondanceWorkflowService pour utiliser uniquement Correspondance.responseDrafts');
    console.log('2. 🔄 Modifier DirectorGeneralWorkflowService pour lire depuis Correspondance');
    console.log('3. 🗑️ Supprimer le champ responseDrafts du modèle CorrespondenceWorkflow');
    console.log('4. 🧪 Tester tous les workflows après modification');
    console.log('5. 🧹 Nettoyer le code redondant');

    console.log('\n🎯 === PROCHAINES ÉTAPES ===');
    console.log('1. Vérifier que tous les drafts sont correctement migrés');
    console.log('2. Modifier les services pour utiliser le modèle unifié');
    console.log('3. Tester le workflow complet');
    console.log('4. Supprimer le code de synchronisation devenu inutile');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la migration
migrateToSingleModel();
