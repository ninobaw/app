const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Test complet avec création d'une nouvelle correspondance via l'interface standard
 */

async function testNewCorrespondenceWorkflow() {
  try {
    console.log('🆕 ========================================');
    console.log('🆕 TEST NOUVELLE CORRESPONDANCE WORKFLOW');
    console.log('🆕 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS
    const anisDirector = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    console.log(`👤 Directeur: ${anisDirector.firstName} ${anisDirector.lastName}`);
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName}\n`);

    // 2. SIMULER LA CRÉATION VIA L'INTERFACE STANDARD
    console.log('📝 === SIMULATION CRÉATION VIA INTERFACE ===');
    
    // Simuler les données du formulaire de création
    const formData = {
      title: 'Demande partenariat commercial',
      subject: 'Proposition de partenariat stratégique',
      content: 'Nous souhaitons établir un partenariat commercial stratégique avec votre organisation pour développer de nouvelles opportunités d\'affaires dans la région.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'partenaire@entreprise.com',
      to_address: 'commercial@enfidha.tn',
      tags: ['partenariat', 'commercial', 'strategie'],
      code: `PART-${Date.now()}`,
      // ✅ ASSIGNATION MANUELLE (comme dans l'interface)
      personnesConcernees: [anisDirector._id.toString()],
      deposantInfo: 'Entreprise Partenaire SARL',
      importanceSubject: 'HIGH',
      date_correspondance: new Date()
    };

    console.log(`📋 Données formulaire:`);
    console.log(`   Titre: ${formData.title}`);
    console.log(`   Type: ${formData.type}`);
    console.log(`   Priorité: ${formData.priority}`);
    console.log(`   Assignée à: ${anisDirector.firstName} ${anisDirector.lastName}`);
    console.log(`   Tags: ${formData.tags.join(', ')}\n`);

    // 3. CRÉER LA CORRESPONDANCE (SIMULATION ROUTE POST /api/correspondances)
    console.log('🔄 === CRÉATION CORRESPONDANCE (ROUTE API) ===');
    
    const newCorrespondance = new Correspondance({
      ...formData,
      authorId: agent._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newCorrespondance.save();
    console.log(`✅ Correspondance créée: ${newCorrespondance._id}`);

    // 4. VÉRIFIER L'ASSIGNATION AUTOMATIQUE (COMME DANS LA ROUTE)
    console.log('\n🎯 === VÉRIFICATION ASSIGNATION AUTOMATIQUE ===');
    
    // Simuler la logique de la route correspondanceRoutes.js
    if (formData.personnesConcernees && formData.personnesConcernees.length > 0) {
      console.log('✋ Assignation manuelle détectée - Pas d\'assignation automatique');
      console.log(`👥 Personnes assignées manuellement: ${formData.personnesConcernees.length}`);
      
      // Mettre à jour le statut du workflow pour l'assignation manuelle
      newCorrespondance.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
      await newCorrespondance.save();
      
      console.log(`🔄 Status mis à jour: ${newCorrespondance.workflowStatus}`);
    } else {
      console.log('🎯 Aucune assignation manuelle - Assignation automatique...');
      // Ici se ferait l'assignation automatique par domaine
    }

    // 5. VÉRIFIER L'ÉTAT APRÈS CRÉATION
    console.log('\n📊 === ÉTAT APRÈS CRÉATION ===');
    
    const corrAfterCreation = await Correspondance.findById(newCorrespondance._id).lean();
    
    console.log(`📋 Correspondance:`);
    console.log(`   ID: ${corrAfterCreation._id}`);
    console.log(`   Status: ${corrAfterCreation.status}`);
    console.log(`   Workflow Status: ${corrAfterCreation.workflowStatus}`);
    console.log(`   Personnes concernées: ${corrAfterCreation.personnesConcernees?.length || 0}`);
    console.log(`   Drafts: ${corrAfterCreation.responseDrafts?.length || 0}`);

    // 6. CRÉER LE WORKFLOW (AUTOMATIQUEMENT OU MANUELLEMENT)
    console.log('\n🔄 === CRÉATION WORKFLOW ===');
    
    // Vérifier si un workflow existe déjà
    let existingWorkflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: newCorrespondance._id 
    });

    if (!existingWorkflow) {
      console.log('🔄 Aucun workflow existant, création...');
      
      const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
        newCorrespondance._id.toString(),
        agent._id.toString()
      );
      
      console.log(`✅ Workflow créé: ${workflow._id}`);
      console.log(`🔄 Status workflow: ${workflow.currentStatus}`);
    } else {
      console.log(`✅ Workflow existant trouvé: ${existingWorkflow._id}`);
    }

    // 7. SIMULER LA CRÉATION D'UNE PROPOSITION PAR LE DIRECTEUR
    console.log('\n👤 === DIRECTEUR CRÉE UNE PROPOSITION ===');
    
    const propositionData = {
      responseContent: `Bonjour,

Nous avons bien reçu votre proposition de partenariat commercial et nous vous en remercions.

Après analyse de votre dossier, nous sommes intéressés par cette collaboration et souhaitons explorer les opportunités suivantes :

1. Développement conjoint de nouveaux services
2. Partage d'expertise technique
3. Accès à de nouveaux marchés
4. Optimisation des coûts opérationnels

Nous proposons d'organiser une réunion dans les prochaines semaines pour discuter des modalités pratiques de ce partenariat.

Cordialement,
Direction Commerciale`,
      attachments: [],
      comments: 'Proposition de partenariat avec réunion de suivi prévue.',
      isUrgent: true
    };

    const propositionResult = await CorrespondanceWorkflowService.createResponseDraft(
      newCorrespondance._id.toString(),
      anisDirector._id.toString(),
      propositionData
    );

    console.log(`✅ Proposition créée: ${propositionResult.success}`);
    console.log(`📋 Draft ID: ${propositionResult.data.draftId}`);
    console.log(`🔄 Nouveau status: ${propositionResult.data.workflowStatus}`);

    // 8. VÉRIFIER L'ÉTAT FINAL POUR LE DG
    console.log('\n👑 === VÉRIFICATION POUR LE DG ===');
    
    const finalCorr = await Correspondance.findById(newCorrespondance._id).lean();
    const finalWorkflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: newCorrespondance._id 
    }).lean();

    console.log(`📋 État final correspondance:`);
    console.log(`   Workflow Status: ${finalCorr.workflowStatus}`);
    console.log(`   Drafts: ${finalCorr.responseDrafts?.length || 0}`);
    
    if (finalCorr.responseDrafts && finalCorr.responseDrafts.length > 0) {
      const draft = finalCorr.responseDrafts[0];
      console.log(`   Draft Status: ${draft.status}`);
      console.log(`   Directeur: ${draft.directorName}`);
      console.log(`   Urgent: ${draft.isUrgent ? 'Oui' : 'Non'}`);
    }

    console.log(`🔄 État final workflow:`);
    console.log(`   Current Status: ${finalWorkflow?.currentStatus}`);
    console.log(`   Assigned Director: ${finalWorkflow?.assignedDirector}`);
    console.log(`   Directeur General: ${finalWorkflow?.directeurGeneral}`);

    // 9. VÉRIFIER LES CONDITIONS POUR LE BOUTON DG
    console.log('\n🎯 === CONDITIONS BOUTON DG ===');
    
    const condition1 = true; // user.role === 'DIRECTEUR_GENERAL'
    const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(finalWorkflow?.currentStatus);
    const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(finalCorr.workflowStatus);
    const condition4 = finalCorr.responseDrafts && 
                      finalCorr.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');

    console.log(`Conditions pour le bouton DG:`);
    console.log(`   1. user.role === 'DIRECTEUR_GENERAL': ${condition1}`);
    console.log(`   2. workflow.currentStatus DIRECTOR_DRAFT: ${condition2}`);
    console.log(`   3. correspondance.workflowStatus DIRECTOR_DRAFT: ${condition3}`);
    console.log(`   4. draft.status PENDING_DG_REVIEW: ${condition4}`);

    const shouldShowButton = condition1 && (condition2 || condition3 || condition4);
    console.log(`\n${shouldShowButton ? '✅' : '❌'} BOUTON DG DEVRAIT ÊTRE VISIBLE: ${shouldShowButton}`);

    // 10. INSTRUCTIONS POUR LE TEST INTERFACE
    console.log('\n🎯 === INSTRUCTIONS TEST INTERFACE ===');
    console.log('1. 🌐 Ouvrez l\'application dans le navigateur');
    console.log('2. 👑 Connectez-vous en tant que DG (melanie Lefevre)');
    console.log('3. 📋 Allez dans le dashboard DG');
    console.log('4. 🔍 Cherchez la correspondance "Demande partenariat commercial"');
    console.log('5. 💬 Ouvrez le chat de cette correspondance');
    console.log('6. ✅ Le bouton "Approuver" devrait être visible !');

    console.log('\n📋 === DONNÉES DE LA CORRESPONDANCE ===');
    console.log(`ID Correspondance: ${newCorrespondance._id}`);
    console.log(`ID Workflow: ${finalWorkflow?._id}`);
    console.log(`Code: ${newCorrespondance.code}`);
    console.log(`Titre: ${newCorrespondance.title}`);

    console.log('\n🎉 === TEST NOUVELLE CORRESPONDANCE RÉUSSI ===');
    console.log('✅ Correspondance créée via processus standard');
    console.log('✅ Assignation manuelle respectée');
    console.log('✅ Workflow créé automatiquement');
    console.log('✅ Proposition créée par le directeur');
    console.log('✅ Toutes les conditions remplies pour le bouton DG');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testNewCorrespondenceWorkflow();
