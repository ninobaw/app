const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { CorrespondenceWorkflow, WorkflowStatus, ActionType } = require('../models/CorrespondenceWorkflow');
const { Correspondance } = require('../models/Correspondance');
const User = require('../models/User');

// Créer un workflow pour une correspondance
router.post('/create', auth, async (req, res) => {
  try {
    const { correspondenceId, directeurGeneralId, priority = 'MEDIUM' } = req.body;

    // Vérifier que la correspondance existe
    const correspondence = await Correspondance.findById(correspondenceId);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }

    // Vérifier que le DG existe
    const directeurGeneral = await User.findById(directeurGeneralId);
    if (!directeurGeneral || directeurGeneral.role !== 'DIRECTEUR_GENERAL') {
      return res.status(400).json({ success: false, message: 'Directeur Général invalide' });
    }

    // Créer le workflow
    const workflow = new CorrespondenceWorkflow({
      correspondenceId,
      createdBy: req.user.id,
      directeurGeneral: directeurGeneralId,
      currentStatus: WorkflowStatus.CREATED,
      priority,
      actions: [{
        actionType: ActionType.CREATE,
        performedBy: req.user.id,
        comment: 'Correspondance créée et workflow initié'
      }]
    });

    await workflow.save();

    // Passer automatiquement à l'étape de révision DG
    await workflow.updateStatus(WorkflowStatus.DG_REVIEW);
    await workflow.addAction({
      actionType: ActionType.DG_COMMENT,
      performedBy: req.user.id,
      comment: 'En attente de consigne du Directeur Général'
    });

    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email')
      .populate('directeurGeneral', 'firstName lastName email')
      .populate('actions.performedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Workflow créé avec succès',
      data: populatedWorkflow
    });
  } catch (error) {
    console.error('Erreur création workflow:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// DG ajoute un commentaire/consigne et assigne à une personne
router.post('/:workflowId/dg-assign', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { comment, assignedToId } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est le DG assigné
    if (workflow.directeurGeneral.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Seul le Directeur Général peut effectuer cette action' });
    }

    // Vérifier l'état du workflow
    if (workflow.currentStatus !== WorkflowStatus.DG_REVIEW) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    // Vérifier que la personne assignée existe
    const assignedUser = await User.findById(assignedToId);
    if (!assignedUser) {
      return res.status(400).json({ success: false, message: 'Utilisateur assigné non trouvé' });
    }

    // Ajouter l'action et mettre à jour le workflow
    await workflow.addAction({
      actionType: ActionType.DG_COMMENT,
      performedBy: req.user.id,
      comment,
      assignedTo: assignedToId
    });

    workflow.assignedTo = assignedToId;
    await workflow.updateStatus(WorkflowStatus.DG_ASSIGNED);

    await workflow.addAction({
      actionType: ActionType.ASSIGN,
      performedBy: req.user.id,
      comment: `Assigné à ${assignedUser.firstName} ${assignedUser.lastName}`,
      assignedTo: assignedToId
    });

    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email')
      .populate('directeurGeneral', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('actions.performedBy', 'firstName lastName email')
      .populate('actions.assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Consigne ajoutée et correspondance assignée',
      data: populatedWorkflow
    });
  } catch (error) {
    console.error('Erreur assignation DG:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Personne assignée soumet une proposition de réponse
router.post('/:workflowId/submit-draft', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { draftResponse, comment } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est la personne assignée
    if (workflow.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Seule la personne assignée peut soumettre une proposition' });
    }

    // Vérifier l'état du workflow
    if (![WorkflowStatus.DG_ASSIGNED, WorkflowStatus.DG_REVISION].includes(workflow.currentStatus)) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    // Ajouter l'action et mettre à jour le workflow
    await workflow.addAction({
      actionType: ActionType.DRAFT_SUBMIT,
      performedBy: req.user.id,
      comment: comment || 'Proposition de réponse soumise',
      draftResponse
    });

    workflow.currentDraftResponse = draftResponse;
    await workflow.updateStatus(WorkflowStatus.DG_APPROVAL);

    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email')
      .populate('directeurGeneral', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('actions.performedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Proposition de réponse soumise pour approbation',
      data: populatedWorkflow
    });
  } catch (error) {
    console.error('Erreur soumission proposition:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// DG approuve ou demande une révision
router.post('/:workflowId/dg-review', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { action, comment, finalResponse } = req.body; // action: 'approve' ou 'reject'

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est le DG assigné
    if (workflow.directeurGeneral.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Seul le Directeur Général peut effectuer cette action' });
    }

    // Vérifier l'état du workflow
    if (workflow.currentStatus !== WorkflowStatus.DG_APPROVAL) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    if (action === 'approve') {
      // Approbation
      await workflow.addAction({
        actionType: ActionType.DG_APPROVE,
        performedBy: req.user.id,
        comment: comment || 'Réponse approuvée',
        draftResponse: finalResponse || workflow.currentDraftResponse
      });

      workflow.finalResponse = finalResponse || workflow.currentDraftResponse;
      await workflow.updateStatus(WorkflowStatus.APPROVED);

      res.json({
        success: true,
        message: 'Réponse approuvée avec succès',
        data: await CorrespondenceWorkflow.findById(workflow._id)
          .populate('correspondenceId')
          .populate('createdBy', 'firstName lastName email')
          .populate('directeurGeneral', 'firstName lastName email')
          .populate('assignedTo', 'firstName lastName email')
          .populate('actions.performedBy', 'firstName lastName email')
      });
    } else if (action === 'reject') {
      // Demande de révision
      await workflow.addAction({
        actionType: ActionType.DG_REJECT,
        performedBy: req.user.id,
        comment: comment || 'Demande de révision'
      });

      await workflow.updateStatus(WorkflowStatus.DG_REVISION);

      res.json({
        success: true,
        message: 'Demande de révision envoyée',
        data: await CorrespondenceWorkflow.findById(workflow._id)
          .populate('correspondenceId')
          .populate('createdBy', 'firstName lastName email')
          .populate('directeurGeneral', 'firstName lastName email')
          .populate('assignedTo', 'firstName lastName email')
          .populate('actions.performedBy', 'firstName lastName email')
      });
    } else {
      return res.status(400).json({ success: false, message: 'Action invalide' });
    }
  } catch (error) {
    console.error('Erreur révision DG:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Envoyer la réponse finale
router.post('/:workflowId/send-response', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { comment } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur peut envoyer la réponse (DG ou personne assignée)
    if (![workflow.directeurGeneral.toString(), workflow.assignedTo.toString()].includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Non autorisé à envoyer la réponse' });
    }

    // Vérifier l'état du workflow
    if (workflow.currentStatus !== WorkflowStatus.APPROVED) {
      return res.status(400).json({ success: false, message: 'La réponse doit être approuvée avant envoi' });
    }

    // Ajouter l'action et finaliser le workflow
    await workflow.addAction({
      actionType: ActionType.SEND_RESPONSE,
      performedBy: req.user.id,
      comment: comment || 'Réponse envoyée'
    });

    await workflow.updateStatus(WorkflowStatus.RESPONSE_SENT);

    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email')
      .populate('directeurGeneral', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('actions.performedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Réponse envoyée avec succès',
      data: populatedWorkflow
    });
  } catch (error) {
    console.error('Erreur envoi réponse:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir un workflow par ID
router.get('/:workflowId', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;

    const workflow = await CorrespondenceWorkflow.findById(workflowId)
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email role')
      .populate('actions.performedBy', 'firstName lastName email role')
      .populate('actions.assignedTo', 'firstName lastName email role');

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Erreur récupération workflow:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir les workflows par statut
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;

    if (!Object.values(WorkflowStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Statut invalide' });
    }

    const workflows = await CorrespondenceWorkflow.getByStatus(status);

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Erreur récupération workflows par statut:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir les workflows assignés à l'utilisateur connecté
router.get('/my/assigned', auth, async (req, res) => {
  try {
    const workflows = await CorrespondenceWorkflow.getByAssignee(req.user.id);

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Erreur récupération workflows assignés:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir les workflows pour le DG connecté
router.get('/my/dg-review', auth, async (req, res) => {
  try {
    const workflows = await CorrespondenceWorkflow.getForDirecteurGeneral(req.user.id);

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Erreur récupération workflows DG:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir tous les workflows avec pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const workflows = await CorrespondenceWorkflow.find({ isActive: true })
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email')
      .populate('directeurGeneral', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('actions.performedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CorrespondenceWorkflow.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération workflows:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
