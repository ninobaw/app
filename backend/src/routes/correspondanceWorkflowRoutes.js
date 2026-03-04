const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const CorrespondanceWorkflowService = require('../services/correspondanceWorkflowService');
const { CorrespondenceWorkflow } = require('../models/CorrespondenceWorkflow');
const User = require('../models/User');

/**
 * Middleware pour vérifier que l'utilisateur est un directeur
 */
const requireDirector = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isDirector()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux directeurs uniquement.'
      });
    }
    req.director = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification des permissions',
      error: error.message
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est le Directeur Général
 */
const requireDG = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'DIRECTEUR_GENERAL') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé au Directeur Général uniquement.'
      });
    }
    req.dg = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification des permissions',
      error: error.message
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est superviseur bureau d'ordre
 */
const requireSupervisor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'SUPERVISEUR_BUREAU_ORDRE') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé au superviseur bureau d\'ordre uniquement.'
      });
    }
    req.supervisor = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification des permissions',
      error: error.message
    });
  }
};

// ==================== ROUTES POUR LES DIRECTEURS ====================

/**
 * POST /api/correspondances/workflow/create-draft
 * Créer une proposition de réponse (Directeurs uniquement)
 */
router.post('/create-draft', auth, requireDirector, async (req, res) => {
  try {
    const { correspondanceId, responseContent, attachments, comments, isUrgent } = req.body;

    if (!correspondanceId || !responseContent) {
      return res.status(400).json({
        success: false,
        message: 'ID de correspondance et contenu de réponse requis'
      });
    }

    const result = await CorrespondanceWorkflowService.createResponseDraft(
      correspondanceId,
      req.director._id,
      { responseContent, attachments, comments, isUrgent }
    );

    // Ajouter message de chat au workflow
    try {
      const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
      if (workflow) {
        console.log(`💬 [WorkflowRoutes] Ajout message chat - Directeur soumet proposition`);
        console.log(`💬 [WorkflowRoutes] De: ${req.director._id} vers: ${workflow.directeurGeneral}`);
        
        await workflow.addChatMessage(
          req.director._id,
          workflow.directeurGeneral,
          `Proposition de réponse soumise:\n\n${responseContent.substring(0, 200)}${responseContent.length > 200 ? '...' : ''}\n\nCommentaires: ${comments || 'Aucun commentaire'}`,
          `Proposition initiale`,
          attachments || []
        );
        
        console.log(`✅ [WorkflowRoutes] Message chat ajouté avec succès`);
      } else {
        console.log(`⚠️ [WorkflowRoutes] Workflow non trouvé pour correspondance: ${correspondanceId}`);
      }
    } catch (chatError) {
      console.error(`❌ [WorkflowRoutes] Erreur ajout message chat:`, chatError);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur création draft:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la proposition de réponse'
    });
  }
});

/**
 * PUT /api/correspondances/workflow/revise-draft/:correspondanceId/:draftIndex
 * Réviser une proposition de réponse selon le feedback du DG
 */
router.put('/revise-draft/:correspondanceId/:draftIndex', auth, requireDirector, async (req, res) => {
  try {
    const { correspondanceId, draftIndex } = req.params;
    const { responseContent, attachments, revisionComments } = req.body;

    if (!responseContent) {
      return res.status(400).json({
        success: false,
        message: 'Contenu de réponse requis'
      });
    }

    const result = await CorrespondanceWorkflowService.reviseResponseDraft(
      correspondanceId,
      parseInt(draftIndex),
      req.director._id,
      { responseContent, attachments, revisionComments }
    );

    // Ajouter message de révision au chat
    try {
      const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
      if (workflow) {
        console.log(`💬 [WorkflowRoutes] Ajout message révision - Directeur révise`);
        console.log(`💬 [WorkflowRoutes] De: ${req.director._id} vers: ${workflow.directeurGeneral}`);
        
        await workflow.addChatMessage(
          req.director._id,
          workflow.directeurGeneral,
          `Proposition révisée (Version ${parseInt(draftIndex) + 1}):\n\n${responseContent.substring(0, 200)}${responseContent.length > 200 ? '...' : ''}\n\nCommentaires de révision: ${revisionComments || 'Aucun commentaire'}`,
          `Révision Version ${parseInt(draftIndex) + 1}`,
          attachments || []
        );
        
        console.log(`✅ [WorkflowRoutes] Message révision ajouté avec succès`);
      } else {
        console.log(`⚠️ [WorkflowRoutes] Workflow non trouvé pour correspondance: ${correspondanceId}`);
      }
    } catch (chatError) {
      console.error(`❌ [WorkflowRoutes] Erreur ajout message révision:`, chatError);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur révision draft:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la révision de la proposition'
    });
  }
});

// ==================== ROUTES POUR LE DIRECTEUR GÉNÉRAL ====================

/**
 * POST /api/correspondances/workflow/dg-feedback/:correspondanceId/:draftIndex
 * Le DG donne son feedback sur une proposition de réponse
 */
router.post('/dg-feedback/:correspondanceId/:draftIndex', auth, requireDG, async (req, res) => {
  try {
    const { correspondanceId, draftIndex } = req.params;
    const { action, feedback, revisionRequests, isApproved, attachments } = req.body;

    if (!action || !['APPROVE', 'REQUEST_REVISION', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action valide requise (APPROVE, REQUEST_REVISION, REJECT)'
      });
    }

    const result = await CorrespondanceWorkflowService.provideDGFeedback(
      correspondanceId,
      parseInt(draftIndex),
      req.dg._id,
      { 
        action, 
        feedback, 
        revisionRequests, 
        isApproved: action === 'APPROVE',
        attachments: attachments || [] // Inclure les attachements du DG
      }
    );

    // Ajouter message de feedback au chat
    try {
      const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
      if (workflow) {
        console.log(`💬 [WorkflowRoutes] Ajout message feedback DG - Action: ${action}`);
        console.log(`💬 [WorkflowRoutes] De: ${req.dg._id} vers: ${workflow.assignedDirector}`);
        
        let messageContent = '';
        if (action === 'APPROVE') {
          messageContent = `✅ Proposition approuvée par le DG !\n\n${feedback || 'Aucun commentaire supplémentaire.'}\n\n🎯 Le dossier est maintenant transmis au superviseur du bureau d'ordre pour finalisation.`;
          
          // Mettre à jour le statut du workflow
          workflow.currentStatus = 'DG_APPROVED';
          await workflow.save();
          
          // Notifier le superviseur du bureau d'ordre
          try {
            const supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE' });
            const correspondance = await Correspondance.findById(correspondanceId);
            
            if (supervisor && correspondance) {
              console.log(`📢 [WorkflowRoutes] Notification superviseur: ${supervisor.firstName} ${supervisor.lastName}`);
              
              // Ajouter message pour le superviseur
              await workflow.addChatMessage(
                req.dg._id, // ✅ CORRECTION : DG
                supervisor._id, // Superviseur
                `🎯 Dossier transmis au superviseur du bureau d'ordre\n\nLa proposition de réponse a été approuvée par le DG. Vous pouvez maintenant consulter tout le dialogue et finaliser la réponse.`,
                'Transmission au superviseur',
                []
              );
              
              // Créer notification pour le superviseur
              await NotificationService.createNotification({
                userId: supervisor._id,
                type: 'WORKFLOW_APPROVED',
                title: 'Nouvelle correspondance approuvée',
                message: `La correspondance "${correspondance.objet || correspondance.subject}" a été approuvée par le DG et nécessite votre attention pour finalisation.`,
                relatedId: correspondanceId,
                relatedType: 'correspondance'
              });
              
              console.log(`✅ [WorkflowRoutes] Superviseur notifié avec succès`);
            }
          } catch (supervisorError) {
            console.error(`❌ [WorkflowRoutes] Erreur notification superviseur:`, supervisorError);
          }
          
        } else if (action === 'REQUEST_REVISION') {
          messageContent = `🔄 Demande de révision du DG:\n\n${feedback || 'Veuillez réviser la proposition.'}\n\nDemandes spécifiques: ${revisionRequests || 'Voir les commentaires ci-dessus.'}`;
          
          // Mettre à jour le statut du workflow
          workflow.currentStatus = 'DIRECTOR_REVISION';
          await workflow.save();
          
        } else if (action === 'REJECT') {
          messageContent = `❌ Proposition rejetée par le DG:\n\n${feedback || 'La proposition ne peut pas être acceptée en l\'\u00e9tat.'}`;
        }
        
        await workflow.addChatMessage(
          req.dg._id,
          workflow.assignedDirector,
          messageContent,
          `Feedback DG - ${action}`,
          attachments || []
        );
        
        console.log(`✅ [WorkflowRoutes] Message feedback DG ajouté avec succès`);
      } else {
        console.log(`⚠️ [WorkflowRoutes] Workflow non trouvé pour correspondance: ${correspondanceId}`);
      }
    } catch (chatError) {
      console.error(`❌ [WorkflowRoutes] Erreur ajout message feedback DG:`, chatError);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur feedback DG:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du feedback'
    });
  }
});

/**
 * GET /api/correspondances/workflow/dg-pending
 * Obtenir les propositions en attente de révision par le DG - VERSION NETTOYÉE
 */
router.get('/dg-pending', auth, requireDG, async (req, res) => {
  try {
    const DirectorGeneralWorkflowService = require('../services/directorGeneralWorkflowService');
    
    console.log(`👑 [DG-Pending-Clean] Recherche correspondances en attente pour DG: ${req.user.id}`);
    
    // Utiliser le nouveau service unifié
    const pendingCorrespondances = await DirectorGeneralWorkflowService.getPendingCorrespondances(req.user.id);
    
    console.log(`✅ [DG-Pending-Clean] Service retourne: ${pendingCorrespondances.length} correspondances`);
    
    // Calculer les statistiques
    const stats = await DirectorGeneralWorkflowService.getDashboardStats(req.user.id);

    res.json({
      success: true,
      data: {
        correspondances: pendingCorrespondances,
        count: pendingCorrespondances.length,
        stats: stats
      }
    });

  } catch (error) {
    console.error('❌ [DG-Pending-Clean] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des propositions en attente'
    });
  }
});

// ==================== ROUTES POUR LE SUPERVISEUR ====================

/**
 * POST /api/correspondances/workflow/finalize/:correspondanceId
 * Finaliser et envoyer la réponse (Superviseur bureau d'ordre uniquement)
 */
router.post('/finalize/:correspondanceId', auth, requireSupervisor, async (req, res) => {
  try {
    console.log('🔄 [WorkflowRoutes] Début finalisation:', req.params.correspondanceId);
    console.log('🔄 [WorkflowRoutes] User:', req.user?.id, req.user?.role);
    console.log('🔄 [WorkflowRoutes] Supervisor:', req.supervisor?._id);
    console.log('🔄 [WorkflowRoutes] Body keys:', Object.keys(req.body));
    
    const { correspondanceId } = req.params;
    const { finalResponseContent, attachments, sendMethod } = req.body;

    if (!finalResponseContent) {
      return res.status(400).json({
        success: false,
        message: 'Contenu de réponse finale requis'
      });
    }

    // Utiliser req.user.id au lieu de req.supervisor._id pour éviter les erreurs
    const supervisorId = req.supervisor?._id || req.user?.id;
    
    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur superviseur non identifié'
      });
    }

    console.log('🔄 [WorkflowRoutes] Finalisation par superviseur:', supervisorId);
    
    const result = await CorrespondanceWorkflowService.finalizeResponse(
      correspondanceId,
      supervisorId,
      { finalResponseContent, attachments, sendMethod, ...req.body }
    );

    res.json(result);

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur finalisation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la finalisation de la réponse'
    });
  }
});

/**
 * GET /api/correspondances/workflow/supervisor-pending
 * Obtenir les réponses approuvées en attente de finalisation
 */
router.get('/supervisor-pending', auth, requireSupervisor, async (req, res) => {
  try {
    const Correspondance = require('../models/Correspondance');
    
    const pendingCorrespondances = await Correspondance.find({
      workflowStatus: CorrespondanceWorkflowService.WORKFLOW_STATES.DG_APPROVED
    })
    .populate('personnesConcernees', 'firstName lastName role directorate')
    .populate('responseDrafts.directorId', 'firstName lastName role directorate')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        correspondances: pendingCorrespondances,
        count: pendingCorrespondances.length
      }
    });

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur récupération pending superviseur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réponses à finaliser'
    });
  }
});

// ==================== ROUTES COMMUNES ====================

/**
 * GET /api/correspondances/workflow/status/:correspondanceId
 * Obtenir le statut du workflow d'une correspondance
 */
router.get('/status/:correspondanceId', auth, async (req, res) => {
  try {
    const { correspondanceId } = req.params;

    const result = await CorrespondanceWorkflowService.getWorkflowStatus(correspondanceId);

    res.json(result);

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur récupération statut:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la récupération du statut'
    });
  }
});

/**
 * GET /api/correspondances/workflow/directors-by-domain
 * Obtenir la liste des directeurs par domaine
 */
router.get('/directors-by-domain', auth, async (req, res) => {
  try {
    const directorsByDomain = await CorrespondanceAssignmentService.getDirectorsByDomain();

    res.json({
      success: true,
      data: directorsByDomain
    });

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur récupération directeurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des directeurs'
    });
  }
});

/**
 * POST /api/correspondances/workflow/reassign/:correspondanceId
 * Réassigner une correspondance manuellement (Admin/DG uniquement)
 */
router.post('/reassign/:correspondanceId', auth, async (req, res) => {
  try {
    const { correspondanceId } = req.params;
    const { directorIds } = req.body;

    // Vérifier les permissions
    const user = await User.findById(req.user.id);
    if (!user || !['SUPER_ADMIN', 'DIRECTEUR_GENERAL'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs et DG.'
      });
    }

    if (!directorIds || !Array.isArray(directorIds) || directorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Liste des directeurs requise'
      });
    }

    const result = await CorrespondanceAssignmentService.reassignCorrespondance(
      correspondanceId,
      directorIds,
      `${user.firstName} ${user.lastName}`
    );

    res.json({
      success: true,
      message: 'Correspondance réassignée avec succès',
      data: result
    });

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur réassignation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la réassignation'
    });
  }
});

/**
 * POST /api/correspondances/workflow/fix-assignments
 * Corriger les assignations des correspondances existantes (Admin uniquement)
 */
router.post('/fix-assignments', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !['SUPER_ADMIN', 'DIRECTEUR_GENERAL'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs et DG.'
      });
    }

    console.log(`🔧 [API] Correction des assignations demandée par ${user.firstName} ${user.lastName}`);

    // Trouver les correspondances non assignées
    const Correspondance = require('../models/Correspondance');
    const unassignedCorrespondances = await Correspondance.find({
      $or: [
        { personnesConcernees: { $exists: false } },
        { personnesConcernees: { $size: 0 } },
        { workflowStatus: { $exists: false } },
        { workflowStatus: 'PENDING' }
      ]
    });

    console.log(`📋 [API] ${unassignedCorrespondances.length} correspondances à corriger`);

    let correctedCount = 0;
    let errorCount = 0;

    for (const correspondance of unassignedCorrespondances) {
      try {
        // Assigner automatiquement
        const assignedCorrespondance = await CorrespondanceAssignmentService.assignCorrespondance(correspondance);
        await assignedCorrespondance.save();
        correctedCount++;
      } catch (error) {
        console.error(`❌ [API] Erreur assignation ${correspondance._id}:`, error.message);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Correction terminée: ${correctedCount} correspondances corrigées, ${errorCount} erreurs`,
      data: {
        totalProcessed: unassignedCorrespondances.length,
        corrected: correctedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur correction assignations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction des assignations',
      error: error.message
    });
  }
});

/**
 * POST /api/correspondances/workflow/fix-objectid-references
 * Corriger les références ObjectId invalides (Admin uniquement)
 */
router.post('/fix-objectid-references', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !['SUPER_ADMIN', 'DIRECTEUR_GENERAL'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs et DG.'
      });
    }

    console.log(`🔧 [API] Correction des références ObjectId demandée par ${user.firstName} ${user.lastName}`);

    const Correspondance = require('../models/Correspondance');
    const allCorrespondances = await Correspondance.find({});
    
    let fixedCount = 0;
    let errorCount = 0;

    for (const correspondance of allCorrespondances) {
      let needsUpdate = false;
      let updateFields = {};

      try {
        // Corriger assignedTo si c'est un ObjectId
        if (correspondance.assignedTo && typeof correspondance.assignedTo === 'object') {
          updateFields.assignedTo = null;
          needsUpdate = true;
        }

        // Corriger assignedBy si c'est un ObjectId
        if (correspondance.assignedBy && typeof correspondance.assignedBy === 'object') {
          updateFields.assignedBy = null;
          needsUpdate = true;
        }

        // Corriger personnesConcernees
        if (correspondance.personnesConcernees && Array.isArray(correspondance.personnesConcernees)) {
          const validPersonnesConcernees = correspondance.personnesConcernees.filter(personId => {
            return typeof personId === 'string' && personId.length > 20; // UUID format
          });
          
          if (validPersonnesConcernees.length !== correspondance.personnesConcernees.length) {
            updateFields.personnesConcernees = validPersonnesConcernees;
            needsUpdate = true;
          }
        }

        // Appliquer les corrections
        if (needsUpdate) {
          await Correspondance.updateOne({ _id: correspondance._id }, { $set: updateFields });
          fixedCount++;
        }

      } catch (error) {
        console.error(`❌ [API] Erreur correction ${correspondance._id}:`, error.message);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Correction terminée: ${fixedCount} correspondances corrigées, ${errorCount} erreurs`,
      data: {
        totalProcessed: allCorrespondances.length,
        fixed: fixedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur correction références ObjectId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction des références',
      error: error.message
    });
  }
});

/**
 * GET /api/correspondances/workflow/debug-proposals
 * Diagnostiquer toutes les propositions de réponse (Admin/DG uniquement)
 */
router.get('/debug-proposals', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !['SUPER_ADMIN', 'DIRECTEUR_GENERAL'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Réservé aux administrateurs et DG.'
      });
    }

    const Correspondance = require('../models/Correspondance');
    
    console.log(`🔍 [Debug-Proposals] Diagnostic des propositions demandé par ${user.firstName} ${user.lastName}`);

    // 1. Toutes les correspondances avec des responseDrafts
    const allCorrespondancesWithDrafts = await Correspondance.find({
      responseDrafts: { $exists: true, $ne: [] }
    })
    .populate('responseDrafts.directorId', 'firstName lastName role directorate')
    .sort({ updatedAt: -1 });

    // 2. Statistiques générales
    const stats = {
      totalCorrespondances: await Correspondance.countDocuments({}),
      correspondancesWithDrafts: allCorrespondancesWithDrafts.length,
      workflowStatuses: {},
      draftStatuses: {}
    };

    // 3. Analyser les statuts
    const allCorrespondances = await Correspondance.find({}).select('workflowStatus responseDrafts');
    
    allCorrespondances.forEach(corresp => {
      const status = corresp.workflowStatus || 'undefined';
      stats.workflowStatuses[status] = (stats.workflowStatuses[status] || 0) + 1;
      
      if (corresp.responseDrafts) {
        corresp.responseDrafts.forEach(draft => {
          const draftStatus = draft.status || 'undefined';
          stats.draftStatuses[draftStatus] = (stats.draftStatuses[draftStatus] || 0) + 1;
        });
      }
    });

    // 4. Détails des correspondances avec propositions
    const detailedAnalysis = allCorrespondancesWithDrafts.map(corresp => ({
      id: corresp._id,
      subject: corresp.subject,
      workflowStatus: corresp.workflowStatus,
      createdAt: corresp.createdAt,
      updatedAt: corresp.updatedAt,
      draftsCount: corresp.responseDrafts?.length || 0,
      drafts: corresp.responseDrafts?.map(draft => ({
        directorName: draft.directorName,
        directorId: draft.directorId,
        status: draft.status,
        createdAt: draft.createdAt,
        hasComments: !!draft.comments,
        hasFeedbacks: draft.dgFeedbacks?.length > 0,
        feedbacksCount: draft.dgFeedbacks?.length || 0
      })) || []
    }));

    res.json({
      success: true,
      data: {
        stats,
        correspondancesWithProposals: detailedAnalysis,
        debugInfo: {
          workflowStates: CorrespondanceWorkflowService.WORKFLOW_STATES,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ [Debug-Proposals] Erreur diagnostic:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic des propositions',
      error: error.message
    });
  }
});

/**
 * GET /api/correspondances/workflow/debug-history/:correspondanceId
 * Diagnostiquer l'historique des commentaires d'une correspondance
 */
router.get('/debug-history/:correspondanceId', auth, async (req, res) => {
  try {
    const { correspondanceId } = req.params;
    const Correspondance = require('../models/Correspondance');
    
    const correspondance = await Correspondance.findById(correspondanceId)
      .populate('personnesConcernees', 'firstName lastName role')
      .populate('responseDrafts.directorId', 'firstName lastName role');

    if (!correspondance) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }

    // Analyser l'historique
    const historyAnalysis = {
      correspondanceId,
      subject: correspondance.subject,
      workflowStatus: correspondance.workflowStatus,
      responseDraftsCount: correspondance.responseDrafts?.length || 0,
      draftsDetails: []
    };

    if (correspondance.responseDrafts) {
      correspondance.responseDrafts.forEach((draft, index) => {
        const draftAnalysis = {
          draftIndex: index,
          directorName: draft.directorName,
          status: draft.status,
          comments: draft.comments || 'Aucun commentaire',
          revisionComments: draft.revisionComments || 'Aucun commentaire de révision',
          dgFeedbacksCount: draft.dgFeedbacks?.length || 0,
          revisionHistoryCount: draft.revisionHistory?.length || 0,
          dgFeedbacks: draft.dgFeedbacks?.map(feedback => ({
            action: feedback.action,
            feedback: feedback.feedback || 'Aucun feedback',
            revisionRequests: feedback.revisionRequests || [],
            createdAt: feedback.createdAt
          })) || [],
          revisionHistory: draft.revisionHistory?.map(revision => ({
            revisionDate: revision.revisionDate,
            revisionComments: revision.revisionComments || 'Aucun commentaire',
            previousContentLength: revision.previousContent?.length || 0
          })) || []
        };
        historyAnalysis.draftsDetails.push(draftAnalysis);
      });
    }

    res.json({
      success: true,
      data: historyAnalysis
    });

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur debug historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du diagnostic de l\'historique',
      error: error.message
    });
  }
});

/**
 * GET /api/correspondances/workflow/my-tasks
 * Obtenir les tâches en cours de l'utilisateur connecté
 */
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const Correspondance = require('../models/Correspondance');
    
    console.log(`📋 [My-Tasks] Récupération des tâches pour ${user.firstName} ${user.lastName} (${user.role})`);
    
    let filter = {};
    let tasks = [];

    switch (user.role) {
      case 'DIRECTEUR_GENERAL':
        console.log(`👑 [My-Tasks-Clean] Recherche des tâches pour le DG`);
        
        // Utiliser le nouveau service unifié
        const DirectorGeneralWorkflowService = require('../services/directorGeneralWorkflowService');
        tasks = await DirectorGeneralWorkflowService.getPendingCorrespondances(user._id);
        
        console.log(`✅ [My-Tasks-Clean] Service DG retourne: ${tasks.length} tâches`);
        break;

      case 'DIRECTEUR':
      case 'SOUS_DIRECTEUR':
        console.log(`👤 [My-Tasks] Recherche des tâches pour le directeur ${user._id}`);
        
        // ✅ CORRECTION : Utiliser la même logique que la route /api/correspondances
        filter = {
          parentCorrespondanceId: { $exists: false }, // Exclure les réponses
          $or: [
            { assignedTo: user._id },                    // Assignation directe
            { assignedTo: user._id.toString() },         // Assignation directe (string)
            { personnesConcernees: user._id },           // Dans personnesConcernees
            { personnesConcernees: user._id.toString() }, // Dans personnesConcernees (string)
            { assignedTo: { $exists: false } },          // Correspondances non assignées
            { assignedTo: null }                         // Correspondances avec assignedTo null
          ]
        };
        tasks = await Correspondance.find(filter)
          .populate('assignedTo', 'firstName lastName role directorate')
          .populate('personnesConcernees', 'firstName lastName role directorate')
          .populate('responseDrafts.directorId', 'firstName lastName role directorate')
          .populate('responseDrafts.dgFeedbacks.dgId', 'firstName lastName role')
          .sort({ updatedAt: -1 });
        
        console.log(`👤 [My-Tasks] ${tasks.length} tâches trouvées pour le directeur`);
        console.log(`🔍 [My-Tasks] Filtre utilisé:`, JSON.stringify(filter, null, 2));
        
        // Log détaillé des tâches trouvées
        if (tasks.length > 0) {
          console.log(`📊 [My-Tasks] Détails des tâches du directeur:`);
          tasks.forEach((task, index) => {
            const userDrafts = task.responseDrafts?.filter(draft => 
              draft.directorId?.toString() === user._id.toString()
            ) || [];
            
            console.log(`   ${index + 1}. "${task.subject}"`);
            console.log(`      - Workflow Status: ${task.workflowStatus}`);
            console.log(`      - Mes propositions: ${userDrafts.length}`);
            
            userDrafts.forEach((draft, draftIndex) => {
              console.log(`        Proposition ${draftIndex + 1}: Status ${draft.status}, Feedbacks: ${draft.dgFeedbacks?.length || 0}`);
            });
          });
        }
        break;

      case 'SUPERVISEUR_BUREAU_ORDRE':
        console.log(`🏢 [My-Tasks] Recherche des tâches pour le superviseur`);
        // Réponses approuvées à finaliser
        filter = {
          workflowStatus: CorrespondanceWorkflowService.WORKFLOW_STATES.DG_APPROVED
        };
        tasks = await Correspondance.find(filter)
          .populate('personnesConcernees', 'firstName lastName role directorate')
          .populate('responseDrafts.directorId', 'firstName lastName role directorate')
          .populate('responseDrafts.dgFeedbacks.dgId', 'firstName lastName role')
          .sort({ updatedAt: -1 });
        
        console.log(`🏢 [My-Tasks] ${tasks.length} tâches trouvées pour le superviseur`);
        break;

      default:
        console.log(`❓ [My-Tasks] Rôle non reconnu: ${user.role}`);
        tasks = [];
    }

    // Enrichir les données avec des informations supplémentaires
    const enrichedTasks = tasks.map(task => {
      const taskData = task.toObject();
      
      // Ajouter des métadonnées utiles
      taskData.hasResponses = taskData.responseDrafts && taskData.responseDrafts.length > 0;
      taskData.totalFeedbacks = taskData.responseDrafts?.reduce((total, draft) => 
        total + (draft.dgFeedbacks?.length || 0), 0) || 0;
      
      // Pour les directeurs, filtrer leurs propres propositions
      if (['DIRECTEUR', 'SOUS_DIRECTEUR'].includes(user.role)) {
        taskData.myDrafts = taskData.responseDrafts?.filter(draft => 
          draft.directorId?.toString() === user._id.toString()
        ) || [];
        taskData.hasMyDrafts = taskData.myDrafts.length > 0;
      }
      
      return taskData;
    });

    console.log(`✅ [My-Tasks] Retour de ${enrichedTasks.length} tâches enrichies pour ${user.role}`);

    res.json({
      success: true,
      data: {
        tasks: enrichedTasks,
        count: enrichedTasks.length,
        userRole: user.role,
        userId: user._id
      }
    });

  } catch (error) {
    console.error('❌ [WorkflowRoutes] Erreur récupération tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tâches'
    });
  }
});

// Route pour récupérer les détails complets d'une correspondance (pour superviseurs)
router.get('/correspondence-details/:correspondanceId', auth, async (req, res) => {
  try {
    const { correspondanceId } = req.params;
    console.log(`📋 [Correspondence-Details] Récupération pour ${correspondanceId}`);
    
    // Vérifier que l'utilisateur est superviseur
    if (req.user.role !== 'SUPERVISEUR_BUREAU_ORDRE') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux superviseurs du bureau d\'ordre'
      });
    }

    // Récupérer la correspondance avec tous les détails
    const correspondence = await Correspondance.findById(correspondanceId)
      .populate('assignedTo', 'firstName lastName role directorate')
      .populate('personnesConcernees', 'firstName lastName role directorate')
      .populate('responseDrafts.directorId', 'firstName lastName role directorate')
      .populate('responseDrafts.dgFeedbacks.dgId', 'firstName lastName role');

    if (!correspondence) {
      return res.status(404).json({
        success: false,
        message: 'Correspondance non trouvée'
      });
    }

    console.log(`✅ [Correspondence-Details] Correspondance trouvée: ${correspondence.subject}`);

    // Structurer les données pour l'interface
    const responseData = {
      originalCorrespondence: {
        _id: correspondence._id,
        subject: correspondence.subject,
        from_address: correspondence.from_address,
        to_address: correspondence.to_address,
        content: correspondence.content,
        priority: correspondence.priority,
        attachments: correspondence.attachments || [],
        createdAt: correspondence.createdAt,
        updatedAt: correspondence.updatedAt
      },
      workflowHistory: correspondence.responseDrafts || [],
      workflowStatus: correspondence.workflowStatus,
      assignedTo: correspondence.assignedTo,
      personnesConcernees: correspondence.personnesConcernees
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ [Correspondence-Details] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails'
    });
  }
});

// Route pour récupérer les propositions approuvées (pour superviseurs)
router.get('/approved-proposals', auth, async (req, res) => {
  try {
    console.log(`📋 [Approved-Proposals] Récupération pour ${req.user.role}`);
    
    // Vérifier que l'utilisateur est superviseur
    if (req.user.role !== 'SUPERVISEUR_BUREAU_ORDRE') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux superviseurs du bureau d\'ordre'
      });
    }

    // Chercher les correspondances avec des propositions approuvées
    const approvedProposals = await Correspondance.find({
      workflowStatus: 'DG_APPROVED',
      'responseDrafts.dgFeedbacks.action': 'APPROVE'
    })
    .populate('assignedTo', 'firstName lastName role directorate')
    .populate('personnesConcernees', 'firstName lastName role directorate')
    .populate('responseDrafts.directorId', 'firstName lastName role directorate')
    .sort({ updatedAt: -1 });

    console.log(`✅ [Approved-Proposals] ${approvedProposals.length} propositions approuvées trouvées`);

    // Enrichir les données
    const enrichedProposals = approvedProposals.map(proposal => {
      const proposalData = proposal.toObject();
      
      // Filtrer pour ne garder que les drafts avec approbation
      proposalData.responseDrafts = proposalData.responseDrafts.filter(draft => 
        draft.dgFeedbacks && draft.dgFeedbacks.some(feedback => feedback.action === 'APPROVE')
      );
      
      return proposalData;
    });

    res.json({
      success: true,
      data: enrichedProposals,
      count: enrichedProposals.length
    });

  } catch (error) {
    console.error('❌ [Approved-Proposals] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des propositions approuvées'
    });
  }
});

// Route pour récupérer le statut du workflow d'une correspondance
router.get('/status/:correspondanceId', auth, async (req, res) => {
  try {
    const { correspondanceId } = req.params;
    
    console.log(`🔍 [WorkflowStatus] Récupération du statut pour correspondance: ${correspondanceId}`);
    console.log(`🔍 [WorkflowStatus] Utilisateur: ${req.user.id} (${req.user.role})`);

    // Récupérer les données du workflow
    const result = await CorrespondanceWorkflowService.getWorkflowStatus(correspondanceId);
    
    console.log(`🔍 [WorkflowStatus] Données récupérées:`, {
      workflowStatus: result?.data?.workflowStatus,
      responseDraftsCount: result?.data?.responseDrafts?.length || 0,
      hasData: !!result?.data
    });

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ [WorkflowStatus] Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut du workflow',
      error: error.message
    });
  }
});

module.exports = router;
