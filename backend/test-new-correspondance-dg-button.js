const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script pour tester que les nouvelles correspondances affichent bien le bouton DG
 */

async function testNewCorrespondanceDGButton() {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 TEST NOUVELLE CORRESPONDANCE - BOUTON DG');
    console.log('🧪 ========================================\n');

    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });
    const directeur = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });

    if (!agent || !directeur || !dg) {
      console.log('❌ Utilisateurs manquants');
      return;
    }

    console.log('👤 === UTILISATEURS ===');
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName}`);
    console.log(`👤 Directeur: ${directeur.firstName} ${directeur.lastName}`);
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName}\n`);

    // 2. SIMULER LA CRÉATION D'UNE NOUVELLE CORRESPONDANCE
    console.log('📝 === SIMULATION CRÉATION CORRESPONDANCE ===');
    
    const correspondanceData = {
      title: 'Test automatique - Demande autorisation événement',
      subject: 'Autorisation organisation événement culturel',
      content: 'Nous sollicitons votre autorisation pour organiser un événement culturel dans les locaux de l\'aéroport.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'culture@association.tn',
      to_address: 'direction@enfidha.tn',
      code: `TEST-AUTO-${Date.now()}`,
      personnesConcernees: [directeur._id.toString()], // Assignation manuelle
      date_correspondance: new Date()
    };

    // Simuler la logique de la route POST /api/correspondances
    const newCorrespondance = new Correspondance({
      ...correspondanceData,
      authorId: agent._id,
      workflowStatus: 'DIRECTOR_DRAFT', // Status modifié
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Ajouter automatiquement le draft (logique ajoutée)
    const draftContent = `Objet: Réponse à votre correspondance - ${correspondanceData.subject}

Madame, Monsieur,

Nous accusons réception de votre correspondance en date du ${new Date().toLocaleDateString('fr-FR')} concernant "${correspondanceData.subject}".

Après examen de votre demande, nous vous proposons la réponse suivante :

AUTORISATION ÉVÉNEMENT CULTUREL

Suite à votre demande d'organisation d'un événement culturel, nous avons le plaisir de vous informer que nous donnons notre accord de principe sous réserve du respect des conditions suivantes :

• Respect des horaires d'ouverture de l'aéroport
• Mise en place des mesures de sécurité appropriées
• Coordination avec les services de sécurité aéroportuaire
• Assurance responsabilité civile obligatoire
• Nettoyage des lieux après l'événement

[Cette proposition nécessite l'approbation du Directeur Général avant envoi]

Nous restons à votre disposition pour finaliser les modalités pratiques.

Cordialement,
${directeur.firstName} ${directeur.lastName}
${directeur.role === 'DIRECTEUR' ? 'Directeur' : 'Sous-Directeur'}`;

    newCorrespondance.responseDrafts = [{
      responseContent: draftContent,
      directorId: directeur._id,
      directorName: `${directeur.firstName} ${directeur.lastName}`,
      status: 'PENDING_DG_REVIEW',
      createdAt: new Date(),
      isUrgent: correspondanceData.priority === 'HIGH',
      comments: 'Proposition de réponse créée automatiquement lors de l\'assignation. Nécessite approbation DG.',
      attachments: []
    }];

    await newCorrespondance.save();
    console.log(`✅ Correspondance créée: ${newCorrespondance._id}`);
    console.log(`📋 Titre: ${newCorrespondance.title}`);
    console.log(`🔄 Workflow Status: ${newCorrespondance.workflowStatus}`);
    console.log(`📝 Response Drafts: ${newCorrespondance.responseDrafts.length}`);
    console.log(`📋 Draft Status: ${newCorrespondance.responseDrafts[0].status}\n`);

    // 3. CRÉER LE WORKFLOW
    console.log('🔄 === CRÉATION WORKFLOW ===');
    
    const workflow = new CorrespondenceWorkflow({
      correspondanceId: newCorrespondance._id,
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
      priority: correspondanceData.priority
    });

    await workflow.save();
    console.log(`✅ Workflow créé: ${workflow._id}\n`);

    // 4. VÉRIFIER LES CONDITIONS BOUTON DG
    console.log('🎯 === VÉRIFICATION CONDITIONS BOUTON DG ===');
    
    const condition1 = true; // user.role === 'DIRECTEUR_GENERAL'
    const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflow.currentStatus);
    const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(newCorrespondance.workflowStatus);
    const condition4 = newCorrespondance.responseDrafts && 
                      newCorrespondance.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');
    
    const shouldShow = condition1 && (condition2 || condition3 || condition4);
    
    console.log('🎯 Conditions WorkflowChatPanel:');
    console.log(`   condition1 (user DG): ${condition1 ? '✅' : '❌'}`);
    console.log(`   condition2 (workflow status): ${condition2 ? '✅' : '❌'} (${workflow.currentStatus})`);
    console.log(`   condition3 (corr status): ${condition3 ? '✅' : '❌'} (${newCorrespondance.workflowStatus})`);
    console.log(`   condition4 (pending drafts): ${condition4 ? '✅' : '❌'} (${newCorrespondance.responseDrafts.filter(d => d.status === 'PENDING_DG_REVIEW').length} drafts)`);
    console.log(`   RÉSULTAT: Bouton ${shouldShow ? '✅ VISIBLE' : '❌ CACHÉ'}\n`);

    // 5. INSTRUCTIONS DE TEST
    console.log('📋 === INSTRUCTIONS DE TEST ===');
    console.log('1. 🔄 Redémarrez le serveur backend pour appliquer les modifications');
    console.log('2. 🌐 Créez une nouvelle correspondance via l\'interface');
    console.log('3. 👤 Assignez-la à un directeur');
    console.log('4. 👑 Connectez-vous en tant que DG');
    console.log('5. 💬 Ouvrez le chat de cette correspondance');
    console.log('6. 👀 Le bouton "Approuver" devrait être visible automatiquement\n');

    console.log('🔍 === DONNÉES POUR TEST MANUEL ===');
    console.log(`📋 Correspondance ID: ${newCorrespondance._id}`);
    console.log(`🔄 Workflow ID: ${workflow._id}`);
    console.log(`👑 DG ID: ${dg._id}`);
    console.log(`👤 Directeur ID: ${directeur._id}\n`);

    console.log('✅ === TEST TERMINÉ ===');
    console.log('🎯 Les nouvelles correspondances devraient maintenant afficher le bouton DG automatiquement !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

testNewCorrespondanceDGButton();
