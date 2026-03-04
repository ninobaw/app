const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');

/**
 * Script pour restaurer le bouton d'approbation DG en créant une correspondance avec proposition
 */

async function restoreDGButton() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 RESTAURATION BOUTON APPROBATION DG');
    console.log('🔧 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS NÉCESSAIRES
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const directeur = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    if (!dg || !directeur || !agent) {
      console.log('❌ Utilisateurs manquants:');
      console.log(`   DG: ${dg ? '✅' : '❌'}`);
      console.log(`   Directeur: ${directeur ? '✅' : '❌'}`);
      console.log(`   Agent: ${agent ? '✅' : '❌'}`);
      return;
    }

    console.log('👤 === UTILISATEURS TROUVÉS ===');
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName}`);
    console.log(`👤 Directeur: ${directeur.firstName} ${directeur.lastName}`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName}\n`);

    // 2. CRÉER UNE CORRESPONDANCE AVEC PROPOSITION DE RÉPONSE
    console.log('📝 === CRÉATION CORRESPONDANCE AVEC PROPOSITION ===');
    
    const correspondance = new Correspondance({
      title: 'Demande de formation en sécurité aéroportuaire',
      subject: 'Formation sécurité - Demande d\'approbation',
      content: 'Nous sollicitons votre approbation pour organiser une formation en sécurité aéroportuaire pour notre personnel.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'formation@externe.tn',
      to_address: 'direction@enfidha.tn',
      personnesConcernees: [directeur._id.toString()],
      code: `FORM-SEC-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'DIRECTOR_DRAFT',
      date_correspondance: new Date(),
      responseDrafts: [{
        responseContent: `Objet: Approbation formation sécurité aéroportuaire

Madame, Monsieur,

Suite à votre demande de formation en sécurité aéroportuaire, nous avons le plaisir de vous informer que nous approuvons cette initiative.

La formation pourra se dérouler selon les modalités suivantes :
- Dates proposées : Du 15 au 20 octobre 2025
- Lieu : Centre de formation de l'aéroport d'Enfidha
- Participants : 25 agents maximum
- Durée : 5 jours (30 heures)

Cette formation s'inscrit dans notre politique d'amélioration continue de la sécurité aéroportuaire.

Nous restons à votre disposition pour toute information complémentaire.

Cordialement,
${directeur.firstName} ${directeur.lastName}
Directeur`,
        directorId: directeur._id,
        directorName: `${directeur.firstName} ${directeur.lastName}`,
        status: 'PENDING_DG_REVIEW',
        createdAt: new Date(),
        isUrgent: true,
        comments: 'Proposition de réponse pour approbation formation sécurité. Demande urgente car dates à confirmer rapidement.',
        attachments: []
      }]
    });

    await correspondance.save();
    console.log(`✅ Correspondance créée: ${correspondance._id}`);
    console.log(`📋 Titre: ${correspondance.title}`);
    console.log(`🔄 Status: ${correspondance.workflowStatus}`);
    console.log(`📝 Drafts: ${correspondance.responseDrafts.length}`);
    console.log(`📋 Draft status: ${correspondance.responseDrafts[0].status}\n`);

    // 3. CRÉER LE WORKFLOW CORRESPONDANT
    console.log('🔄 === CRÉATION WORKFLOW ===');
    
    const workflow = new CorrespondenceWorkflow({
      correspondanceId: correspondance._id,
      currentStatus: 'DIRECTOR_DRAFT',
      createdBy: agent._id,
      bureauOrdreAgent: agent._id,
      assignedDirector: directeur._id,
      directeurGeneral: dg._id,
      actions: [
        {
          actionType: 'CREATE',
          performedBy: agent._id,
          performedAt: new Date(),
          comment: 'Correspondance créée par bureau d\'ordre'
        },
        {
          actionType: 'ASSIGN_TO_DIRECTOR',
          performedBy: agent._id,
          performedAt: new Date(),
          assignedTo: directeur._id,
          comment: 'Correspondance assignée au directeur'
        },
        {
          actionType: 'DIRECTOR_DRAFT',
          performedBy: directeur._id,
          performedAt: new Date(),
          comment: 'Proposition de réponse créée',
          draftResponse: correspondance.responseDrafts[0].responseContent
        }
      ],
      responseDrafts: [{
        directorId: directeur._id,
        directorName: `${directeur.firstName} ${directeur.lastName}`,
        responseContent: correspondance.responseDrafts[0].responseContent,
        comments: correspondance.responseDrafts[0].comments,
        isUrgent: true,
        status: 'PENDING_DG_REVIEW',
        attachments: [],
        dgFeedbacks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      priority: 'HIGH'
    });

    await workflow.save();
    console.log(`✅ Workflow créé: ${workflow._id}`);
    console.log(`🔄 Status workflow: ${workflow.currentStatus}`);
    console.log(`👑 DG assigné: ${workflow.directeurGeneral ? 'Oui' : 'Non'}\n`);

    // 4. VÉRIFICATION DES CONDITIONS D'AFFICHAGE
    console.log('🎯 === VÉRIFICATION CONDITIONS BOUTON DG ===');
    
    const condition1 = true; // user.role === 'DIRECTEUR_GENERAL'
    const condition2 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(workflow.currentStatus);
    const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(correspondance.workflowStatus);
    const condition4 = correspondance.responseDrafts && 
                      correspondance.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');
    
    const shouldShow = condition1 && (condition2 || condition3 || condition4);
    
    console.log('🎯 Conditions d\'affichage:');
    console.log(`   Condition 1 (User DG): ${condition1 ? '✅' : '❌'}`);
    console.log(`   Condition 2 (Workflow Status): ${condition2 ? '✅' : '❌'} (${workflow.currentStatus})`);
    console.log(`   Condition 3 (Corr Status): ${condition3 ? '✅' : '❌'} (${correspondance.workflowStatus})`);
    console.log(`   Condition 4 (Pending Drafts): ${condition4 ? '✅' : '❌'} (${correspondance.responseDrafts.filter(d => d.status === 'PENDING_DG_REVIEW').length} drafts)`);
    console.log(`   RÉSULTAT: Bouton ${shouldShow ? '✅ VISIBLE' : '❌ CACHÉ'}\n`);

    // 5. INSTRUCTIONS POUR TESTER
    console.log('📋 === INSTRUCTIONS POUR TESTER ===');
    console.log('1. 🔄 Redémarrez le serveur backend si nécessaire');
    console.log('2. 🌐 Connectez-vous en tant que DG (melanie.lefevre@...)');
    console.log('3. 📱 Allez dans le chat workflow de cette correspondance');
    console.log('4. 👀 Le bouton "Approuver" devrait maintenant être visible');
    console.log('5. ✅ Testez l\'approbation pour vérifier le fonctionnement\n');

    // 6. INFORMATIONS POUR LE FRONTEND
    console.log('🔍 === INFORMATIONS POUR DEBUG FRONTEND ===');
    console.log(`📋 ID Correspondance: ${correspondance._id}`);
    console.log(`🔄 ID Workflow: ${workflow._id}`);
    console.log(`👑 ID DG: ${dg._id}`);
    console.log(`👤 ID Directeur: ${directeur._id}`);
    console.log('💡 Recherchez ces IDs dans les logs du chat pour vérifier les données\n');

    console.log('✅ === RESTAURATION TERMINÉE ===');
    console.log('🎯 Le bouton d\'approbation DG devrait maintenant être visible !');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la restauration
restoreDGButton();
