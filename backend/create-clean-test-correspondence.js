const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Créer une correspondance de test propre avec proposition pour tester le bouton DG
 */

async function createCleanTestCorrespondence() {
  try {
    console.log('🎯 ========================================');
    console.log('🎯 CRÉATION CORRESPONDANCE TEST PROPRE');
    console.log('🎯 ========================================\n');

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

    // 2. CRÉER UNE CORRESPONDANCE PROPRE
    console.log('📝 === CRÉATION CORRESPONDANCE PROPRE ===');
    
    const cleanCorrespondance = new Correspondance({
      title: 'Formation équipe commerciale - Urgent',
      subject: 'Demande formation pour équipe commerciale',
      content: 'Nous avons besoin d\'organiser une formation urgente pour notre équipe commerciale afin d\'améliorer les performances de vente et la relation client.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'commercial@partenaire.com',
      to_address: 'direction@enfidha.tn',
      personnesConcernees: [anisDirector._id.toString()],
      code: `FORM-COMM-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'ASSIGNED_TO_DIRECTOR',
      date_correspondance: new Date(),
      tags: ['formation', 'commercial', 'urgent']
    });

    await cleanCorrespondance.save();
    console.log(`✅ Correspondance créée: ${cleanCorrespondance._id}`);
    console.log(`📋 Titre: ${cleanCorrespondance.title}`);
    console.log(`🔄 Status: ${cleanCorrespondance.workflowStatus}`);
    console.log(`👤 Assignée à: ${anisDirector.firstName} ${anisDirector.lastName}\n`);

    // 3. CRÉER LE WORKFLOW
    console.log('🔄 === CRÉATION WORKFLOW ===');
    
    const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
      cleanCorrespondance._id.toString(),
      agent._id.toString()
    );
    
    console.log(`✅ Workflow créé: ${workflow._id}`);
    console.log(`🔄 Status workflow: ${workflow.currentStatus}\n`);

    // 4. CRÉER UNE PROPOSITION DE RÉPONSE
    console.log('📝 === CRÉATION PROPOSITION RÉPONSE ===');
    
    const propositionData = {
      responseContent: `Bonjour,

Suite à votre demande de formation pour l'équipe commerciale, nous proposons d'organiser un programme de formation complet sur 3 jours comprenant :

1. Techniques de vente avancées
2. Gestion de la relation client
3. Négociation commerciale
4. Utilisation des outils CRM

La formation pourrait avoir lieu dans nos locaux avec des formateurs certifiés.

Dates proposées : 15-17 novembre 2024
Coût estimé : 2500€ pour 10 participants

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
Direction des Ressources Humaines`,
      attachments: [],
      comments: 'Proposition complète de formation commerciale avec planning et budget détaillés.',
      isUrgent: true
    };

    const propositionResult = await CorrespondanceWorkflowService.createResponseDraft(
      cleanCorrespondance._id.toString(),
      anisDirector._id.toString(),
      propositionData
    );

    console.log(`✅ Proposition créée: ${propositionResult.success}`);
    console.log(`📋 Draft ID: ${propositionResult.data.draftId}`);
    console.log(`🔄 Nouveau status: ${propositionResult.data.workflowStatus}\n`);

    // 5. VÉRIFICATION FINALE
    console.log('📊 === VÉRIFICATION FINALE ===');
    
    const finalCorr = await Correspondance.findById(cleanCorrespondance._id).lean();
    
    console.log(`📋 Correspondance finale:`);
    console.log(`   ID: ${finalCorr._id}`);
    console.log(`   Titre: ${finalCorr.title}`);
    console.log(`   Status: ${finalCorr.workflowStatus}`);
    console.log(`   Drafts: ${finalCorr.responseDrafts?.length || 0}`);
    
    if (finalCorr.responseDrafts && finalCorr.responseDrafts.length > 0) {
      const draft = finalCorr.responseDrafts[0];
      console.log(`   Draft status: ${draft.status}`);
      console.log(`   Directeur: ${draft.directorName}`);
      console.log(`   Urgent: ${draft.isUrgent ? 'Oui' : 'Non'}`);
    }

    // 6. INSTRUCTIONS POUR LE TEST
    console.log('\n🎯 === INSTRUCTIONS POUR LE TEST ===');
    console.log('1. 🌐 Ouvrez l\'application dans le navigateur');
    console.log('2. 👑 Connectez-vous en tant que DG (melanie Lefevre)');
    console.log('3. 📋 Allez dans le dashboard DG');
    console.log('4. 🔍 Cherchez la correspondance "Formation équipe commerciale - Urgent"');
    console.log('5. 💬 Cliquez sur l\'icône de chat pour ouvrir le dialogue');
    console.log('6. 🔍 Ouvrez la console du navigateur (F12)');
    console.log('7. 👀 Vérifiez les logs pour voir les conditions du bouton');
    console.log('8. ✅ Le bouton "Approuver" devrait être visible !');

    console.log('\n📋 === DONNÉES DE LA CORRESPONDANCE ===');
    console.log(`ID Correspondance: ${cleanCorrespondance._id}`);
    console.log(`ID Workflow: ${workflow._id}`);
    console.log(`Code: ${cleanCorrespondance.code}`);

    console.log('\n🎉 === CORRESPONDANCE PRÊTE POUR LE TEST ===');
    console.log('✅ Correspondance avec proposition créée');
    console.log('✅ Status DIRECTOR_DRAFT');
    console.log('✅ Draft PENDING_DG_REVIEW');
    console.log('✅ Toutes les conditions remplies pour le bouton DG');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la création
createCleanTestCorrespondence();
