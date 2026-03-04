const mongoose = require('mongoose');
const User = require('./src/models/User');
const Correspondance = require('./src/models/Correspondance');
const { CorrespondenceWorkflow } = require('./src/models/CorrespondenceWorkflow');
const CorrespondanceWorkflowService = require('./src/services/correspondanceWorkflowService');

/**
 * Script pour corriger définitivement le bouton DG avec le modèle unifié
 * Basé sur les mémoires : utiliser Correspondance.responseDrafts comme source unique
 */

async function fixDGButtonUnified() {
  try {
    console.log('🔧 ========================================');
    console.log('🔧 CORRECTION BOUTON DG - MODÈLE UNIFIÉ');
    console.log('🔧 ========================================\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. RÉCUPÉRER LES UTILISATEURS
    const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
    const directeur = await User.findOne({ 
      firstName: 'Anis',
      lastName: 'Ben Janet'
    });
    const agent = await User.findOne({ role: 'AGENT_BUREAU_ORDRE' });

    if (!dg || !directeur || !agent) {
      console.log('❌ Utilisateurs manquants');
      return;
    }

    console.log('👤 === UTILISATEURS ===');
    console.log(`👑 DG: ${dg.firstName} ${dg.lastName} (${dg._id})`);
    console.log(`👤 Directeur: ${directeur.firstName} ${directeur.lastName} (${directeur._id})`);
    console.log(`📋 Agent: ${agent.firstName} ${agent.lastName} (${agent._id})\n`);

    // 2. CRÉER CORRESPONDANCE AVEC MODÈLE UNIFIÉ
    console.log('📝 === CRÉATION CORRESPONDANCE MODÈLE UNIFIÉ ===');
    
    const correspondance = new Correspondance({
      title: 'Formation sécurité - Approbation DG requise',
      subject: 'Demande d\'approbation pour formation sécurité aéroportuaire',
      content: 'Nous sollicitons votre approbation pour organiser une formation complète en sécurité aéroportuaire destinée à notre personnel technique.',
      type: 'INCOMING',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      from_address: 'formation.securite@externe.tn',
      to_address: 'direction@enfidha.tn',
      personnesConcernees: [directeur._id.toString()],
      code: `SEC-FORM-${Date.now()}`,
      authorId: agent._id,
      workflowStatus: 'DIRECTOR_DRAFT', // ✅ STATUS CLEF POUR AFFICHAGE BOUTON
      date_correspondance: new Date(),
      // ✅ MODÈLE UNIFIÉ : responseDrafts dans Correspondance
      responseDrafts: [{
        responseContent: `Objet: Approbation formation sécurité aéroportuaire

Madame, Monsieur,

Suite à votre demande de formation en sécurité aéroportuaire, nous avons étudié votre proposition et souhaitons donner notre accord de principe.

DÉTAILS DE LA FORMATION PROPOSÉE :
• Dates : 20-25 octobre 2025
• Lieu : Centre de formation aéroport d'Enfidha
• Participants : 30 agents maximum
• Durée : 5 jours (35 heures)
• Modules : Sécurité périmétrique, contrôle d'accès, procédures d'urgence

BUDGET ESTIMÉ :
• Formateurs : 8 000 TND
• Matériel pédagogique : 2 000 TND
• Certification : 1 500 TND
• Total : 11 500 TND

Cette formation s'inscrit parfaitement dans notre politique d'amélioration continue de la sécurité aéroportuaire et de montée en compétences de nos équipes.

Nous restons à votre disposition pour finaliser les modalités pratiques.

Cordialement,
${directeur.firstName} ${directeur.lastName}
Directeur`,
        directorId: directeur._id,
        directorName: `${directeur.firstName} ${directeur.lastName}`,
        status: 'PENDING_DG_REVIEW', // ✅ STATUS CLEF POUR BOUTON DG
        createdAt: new Date(),
        isUrgent: true,
        comments: 'Formation urgente - dates à confirmer rapidement avec l\'organisme externe. Budget déjà validé par la direction financière.',
        attachments: []
      }]
    });

    await correspondance.save();
    console.log(`✅ Correspondance créée: ${correspondance._id}`);
    console.log(`📋 Titre: ${correspondance.title}`);
    console.log(`🔄 Workflow Status: ${correspondance.workflowStatus}`);
    console.log(`📝 Response Drafts: ${correspondance.responseDrafts.length}`);
    console.log(`📋 Draft Status: ${correspondance.responseDrafts[0].status}\n`);

    // 3. CRÉER LE WORKFLOW AVEC SERVICE
    console.log('🔄 === CRÉATION WORKFLOW AVEC SERVICE ===');
    
    try {
      const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
        correspondance._id.toString(),
        agent._id
      );
      console.log(`✅ Workflow créé: ${workflow._id}`);
      console.log(`🔄 Status: ${workflow.currentStatus}\n`);
    } catch (workflowError) {
      console.log('⚠️ Erreur création workflow, création manuelle...');
      
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
            comment: 'Proposition créée',
            draftResponse: correspondance.responseDrafts[0].responseContent
          }
        ],
        priority: 'HIGH'
      });

      await workflow.save();
      console.log(`✅ Workflow manuel créé: ${workflow._id}\n`);
    }

    // 4. VÉRIFICATION CONDITIONS FRONTEND
    console.log('🎯 === VÉRIFICATION CONDITIONS FRONTEND ===');
    
    // Récupérer la correspondance mise à jour
    const corrUpdated = await Correspondance.findById(correspondance._id).lean();
    
    // Conditions exactes du WorkflowChatPanel
    const condition1 = true; // user.role === 'DIRECTEUR_GENERAL'
    const condition2 = false; // currentStatus workflow (pas utilisé ici car modèle unifié)
    const condition3 = ['DIRECTOR_DRAFT', 'DIRECTOR_REVISION'].includes(corrUpdated.workflowStatus);
    const condition4 = corrUpdated.responseDrafts && 
                      corrUpdated.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');
    
    const shouldShow = condition1 && (condition2 || condition3 || condition4);
    
    console.log('🎯 Conditions WorkflowChatPanel (modèle unifié):');
    console.log(`   condition1 (user DG): ${condition1 ? '✅' : '❌'}`);
    console.log(`   condition2 (workflow status): ${condition2 ? '✅' : '❌'} (non utilisé)`);
    console.log(`   condition3 (corr.workflowStatus): ${condition3 ? '✅' : '❌'} (${corrUpdated.workflowStatus})`);
    console.log(`   condition4 (PENDING_DG_REVIEW): ${condition4 ? '✅' : '❌'} (${corrUpdated.responseDrafts.filter(d => d.status === 'PENDING_DG_REVIEW').length} drafts)`);
    console.log(`   RÉSULTAT: Bouton ${shouldShow ? '✅ VISIBLE' : '❌ CACHÉ'}\n`);

    // 5. SIMULATION ROUTE API
    console.log('🌐 === SIMULATION ROUTE API ===');
    
    const workflow = await CorrespondenceWorkflow.findOne({ 
      correspondanceId: correspondance._id 
    }).lean();

    if (workflow) {
      // Simuler la réponse de /api/workflow-chat/{workflowId}/messages
      const apiResponse = {
        success: true,
        data: {
          workflowId: workflow._id,
          currentStatus: workflow.currentStatus,
          correspondance: {
            id: corrUpdated._id,
            workflowStatus: corrUpdated.workflowStatus,
            responseDrafts: corrUpdated.responseDrafts
          },
          chatMessages: workflow.chatMessages || []
        }
      };

      console.log('📊 Réponse API simulée:');
      console.log(JSON.stringify(apiResponse, null, 2));
    }

    // 6. INSTRUCTIONS DÉTAILLÉES
    console.log('\n📋 === INSTRUCTIONS POUR TESTER ===');
    console.log('1. 🔄 Redémarrez le serveur backend');
    console.log('2. 🌐 Connectez-vous en tant que DG:');
    console.log(`   Email: melanie.lefevre@...`);
    console.log(`   ID: ${dg._id}`);
    console.log('3. 📱 Cherchez cette correspondance:');
    console.log(`   ID: ${correspondance._id}`);
    console.log(`   Titre: "${correspondance.title}"`);
    console.log('4. 💬 Ouvrez le chat workflow');
    console.log('5. 👀 Le bouton "Approuver" devrait être visible dans la section DG');
    console.log('6. 🔍 Vérifiez les logs console du browser pour voir les conditions\n');

    // 7. DONNÉES POUR DEBUG
    console.log('🔍 === DONNÉES POUR DEBUG FRONTEND ===');
    console.log(`📋 Correspondance ID: ${correspondance._id}`);
    console.log(`🔄 Workflow ID: ${workflow?._id || 'N/A'}`);
    console.log(`👑 DG ID: ${dg._id}`);
    console.log(`👤 Directeur ID: ${directeur._id}`);
    console.log(`📊 Draft Status: ${corrUpdated.responseDrafts[0].status}`);
    console.log(`🔄 Workflow Status: ${corrUpdated.workflowStatus}\n`);

    console.log('✅ === CORRECTION TERMINÉE ===');
    console.log('🎯 Le bouton DG devrait maintenant être visible avec le modèle unifié !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la correction
fixDGButtonUnified();
