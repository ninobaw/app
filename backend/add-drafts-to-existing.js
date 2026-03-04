const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script pour ajouter des propositions de réponse aux correspondances existantes
 */

async function addDraftsToExisting() {
  try {
    console.log('📝 ========================================');
    console.log('📝 AJOUT DRAFTS AUX CORRESPONDANCES EXISTANTES');
    console.log('📝 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. TROUVER LES CORRESPONDANCES SANS DRAFTS
    console.log('🔍 === RECHERCHE CORRESPONDANCES SANS DRAFTS ===');
    
    const correspondancesSansDrafts = await Correspondance.find({
      $or: [
        { responseDrafts: { $exists: false } },
        { responseDrafts: { $size: 0 } }
      ],
      personnesConcernees: { $exists: true, $ne: [] }
    }).populate('personnesConcernees').lean();

    console.log(`📋 Correspondances sans drafts: ${correspondancesSansDrafts.length}\n`);

    if (correspondancesSansDrafts.length === 0) {
      console.log('✅ Toutes les correspondances ont déjà des drafts');
      return;
    }

    // 2. AJOUTER DES DRAFTS POUR CHAQUE CORRESPONDANCE
    for (const corr of correspondancesSansDrafts.slice(0, 3)) { // Limiter à 3 pour test
      console.log(`📝 Traitement: ${corr.title}`);
      
      if (!corr.personnesConcernees || corr.personnesConcernees.length === 0) {
        console.log('   ⚠️ Pas de personnes concernées, ignoré\n');
        continue;
      }

      const directeur = corr.personnesConcernees[0];
      
      // Créer une proposition de réponse
      const draftContent = `Objet: Réponse à votre correspondance - ${corr.subject}

Madame, Monsieur,

Nous accusons réception de votre correspondance en date du ${new Date(corr.date_correspondance).toLocaleDateString('fr-FR')} concernant "${corr.subject}".

Après examen de votre demande, nous souhaitons vous apporter les éléments de réponse suivants :

${corr.type === 'INCOMING' ? 
  `Suite à votre demande, nous confirmons notre accord de principe et vous proposons les modalités suivantes :

• Traitement dans les meilleurs délais
• Respect des procédures en vigueur
• Suivi personnalisé de votre dossier

Nous restons à votre disposition pour tout complément d'information.` :
  `Nous prenons bonne note de votre information et vous en remercions.

Cette communication sera transmise aux services concernés pour traitement et suivi approprié.`
}

Cordialement,
${directeur.firstName} ${directeur.lastName}
${directeur.role === 'DIRECTEUR' ? 'Directeur' : 'Sous-Directeur'}`;

      // Mettre à jour la correspondance
      const updateResult = await Correspondance.findByIdAndUpdate(
        corr._id,
        {
          $set: {
            workflowStatus: 'DIRECTOR_DRAFT',
            responseDrafts: [{
              responseContent: draftContent,
              directorId: directeur._id,
              directorName: `${directeur.firstName} ${directeur.lastName}`,
              status: 'PENDING_DG_REVIEW',
              createdAt: new Date(),
              isUrgent: corr.priority === 'HIGH' || corr.priority === 'URGENT',
              comments: `Proposition de réponse créée automatiquement pour "${corr.title}". Nécessite approbation DG.`,
              attachments: []
            }]
          }
        },
        { new: true }
      );

      if (updateResult) {
        console.log(`   ✅ Draft ajouté par ${directeur.firstName} ${directeur.lastName}`);
        console.log(`   🔄 Status: ${updateResult.workflowStatus}`);
        console.log(`   📋 Draft status: ${updateResult.responseDrafts[0].status}`);
        
        // Créer ou mettre à jour le workflow si nécessaire
        let workflow = await CorrespondenceWorkflow.findOne({ correspondanceId: corr._id });
        
        if (!workflow) {
          console.log('   🔄 Création workflow...');
          
          const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
          const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
          
          if (agent && dg) {
            workflow = new CorrespondenceWorkflow({
              correspondanceId: corr._id,
              currentStatus: 'DIRECTOR_DRAFT',
              createdBy: agent._id,
              bureauOrdreAgent: agent._id,
              assignedDirector: directeur._id,
              directeurGeneral: dg._id,
              actions: [
                {
                  actionType: 'CREATE',
                  performedBy: agent._id,
                  comment: 'Correspondance créée'
                },
                {
                  actionType: 'ASSIGN_TO_DIRECTOR',
                  performedBy: agent._id,
                  assignedTo: directeur._id,
                  comment: 'Assignée au directeur'
                },
                {
                  actionType: 'DIRECTOR_DRAFT',
                  performedBy: directeur._id,
                  comment: 'Proposition créée automatiquement',
                  draftResponse: draftContent
                }
              ],
              priority: corr.priority || 'MEDIUM'
            });

            await workflow.save();
            console.log(`   ✅ Workflow créé: ${workflow._id}`);
          }
        } else {
          // Mettre à jour le workflow existant
          workflow.currentStatus = 'DIRECTOR_DRAFT';
          workflow.actions.push({
            actionType: 'DIRECTOR_DRAFT',
            performedBy: directeur._id,
            comment: 'Proposition créée automatiquement',
            draftResponse: draftContent
          });
          await workflow.save();
          console.log(`   ✅ Workflow mis à jour: ${workflow._id}`);
        }
      } else {
        console.log(`   ❌ Échec mise à jour`);
      }
      
      console.log('');
    }

    // 3. VÉRIFICATION FINALE
    console.log('🎯 === VÉRIFICATION FINALE ===');
    
    const correspondancesAvecDrafts = await Correspondance.find({
      responseDrafts: { $exists: true, $ne: [] }
    }).lean();

    console.log(`📝 Total correspondances avec drafts: ${correspondancesAvecDrafts.length}`);
    
    const correspondancesAvecPendingDG = correspondancesAvecDrafts.filter(corr =>
      corr.responseDrafts && 
      corr.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW')
    );

    console.log(`👑 Correspondances avec drafts PENDING_DG_REVIEW: ${correspondancesAvecPendingDG.length}`);
    
    correspondancesAvecPendingDG.forEach(corr => {
      console.log(`   - "${corr.title}" (${corr._id})`);
    });

    console.log('\n✅ === OPÉRATION TERMINÉE ===');
    console.log('🎯 Le bouton DG devrait maintenant apparaître sur plus de correspondances !');
    console.log('🔄 Connectez-vous en tant que DG pour voir les nouveaux boutons d\'approbation');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

addDraftsToExisting();
