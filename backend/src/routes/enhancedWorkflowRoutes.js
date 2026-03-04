const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const { CorrespondenceWorkflow, WorkflowStatus, ActionType } = require('../models/CorrespondenceWorkflow');
const { Correspondance } = require('../models/Correspondance');
const User = require('../models/User');

// Configuration multer pour les attachements
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/workflow-attachments/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// 1. CRÉATION DE WORKFLOW PAR BUREAU D'ORDRE
router.post('/create-by-bureau-ordre', auth, async (req, res) => {
  try {
    const { correspondenceId, assignedDirectorId, superviseurBureauOrdreId, directeurGeneralId, priority = 'MEDIUM' } = req.body;

    // Vérifier que l'utilisateur est agent bureau d'ordre
    if (!['BUREAU_ORDRE', 'SUPERVISOR_BUREAU_ORDRE', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Seul le bureau d\'ordre peut créer un workflow' });
    }

    // Vérifier que la correspondance existe
    const correspondence = await Correspondance.findById(correspondenceId);
    if (!correspondence) {
      return res.status(404).json({ success: false, message: 'Correspondance non trouvée' });
    }

    // Vérifier que les utilisateurs existent
    const [assignedDirector, superviseur, dg] = await Promise.all([
      User.findById(assignedDirectorId),
      superviseurBureauOrdreId ? User.findById(superviseurBureauOrdreId) : null,
      User.findById(directeurGeneralId)
    ]);

    if (!assignedDirector || !dg) {
      return res.status(400).json({ success: false, message: 'Directeur assigné ou DG non trouvé' });
    }

    // Créer le workflow
    const workflow = new CorrespondenceWorkflow({
      correspondenceId,
      createdBy: req.user.id,
      bureauOrdreAgent: req.user.id,
      superviseurBureauOrdre: superviseurBureauOrdreId,
      assignedDirector: assignedDirectorId,
      directeurGeneral: directeurGeneralId,
      currentStatus: WorkflowStatus.CREATED,
      priority,
      actions: [{
        actionType: ActionType.CREATE,
        performedBy: req.user.id,
        comment: `Correspondance créée et assignée à ${assignedDirector.firstName} ${assignedDirector.lastName}`
      }]
    });

    await workflow.save();

    // Transition automatique vers ASSIGNED_TO_DIRECTOR
    await workflow.updateStatus(WorkflowStatus.ASSIGNED_TO_DIRECTOR);
    await workflow.addAction({
      actionType: ActionType.ASSIGN_TO_DIRECTOR,
      performedBy: req.user.id,
      comment: `Assigné au directeur ${assignedDirector.firstName} ${assignedDirector.lastName}`,
      assignedTo: assignedDirectorId
    });

    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondenceId')
      .populate('createdBy', 'firstName lastName email role')
      .populate('bureauOrdreAgent', 'firstName lastName email role')
      .populate('superviseurBureauOrdre', 'firstName lastName email role')
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role')
      .populate('actions.performedBy', 'firstName lastName email role');

    res.status(201).json({
      success: true,
      message: 'Workflow créé et assigné avec succès',
      data: populatedWorkflow
    });
  } catch (error) {
    console.error('Erreur création workflow bureau d\'ordre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 2. DIRECTEUR SOUMET PROPOSITION DE RÉPONSE
router.post('/:workflowId/director-submit-draft', upload.array('attachments', 5), auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { draftContent, comment } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est le directeur assigné
    if (workflow.assignedDirector.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Seul le directeur assigné peut soumettre une proposition' });
    }

    // Vérifier l'état du workflow
    if (![WorkflowStatus.ASSIGNED_TO_DIRECTOR, WorkflowStatus.DIRECTOR_REVISION].includes(workflow.currentStatus)) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    // Traiter les attachements
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Ajouter nouvelle version de proposition
    await workflow.addDraftVersion(draftContent, req.user.id, attachments);

    // Ajouter action
    await workflow.addAction({
      actionType: ActionType.DIRECTOR_DRAFT,
      performedBy: req.user.id,
      comment: comment || 'Proposition de réponse soumise',
      draftResponse: draftContent,
      attachments
    });

    // Changer statut vers DG_REVIEW
    await workflow.updateStatus(WorkflowStatus.DG_REVIEW);

    const populatedWorkflow = await CorrespondenceWorkflow.findById(workflow._id)
      .populate('correspondenceId')
      .populate('assignedDirector', 'firstName lastName email role')
      .populate('directeurGeneral', 'firstName lastName email role')
      .populate('actions.performedBy', 'firstName lastName email role')
      .populate('draftVersions.createdBy', 'firstName lastName email role');

    res.json({
      success: true,
      message: 'Proposition soumise pour révision DG',
      data: populatedWorkflow
    });
  } catch (error) {
    console.error('Erreur soumission proposition directeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 3. DG DONNE FEEDBACK/COMMENTAIRES
router.post('/:workflowId/dg-feedback', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { feedback, action, draftVersion } = req.body; // action: 'approve' ou 'request_revision'

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est le DG
    if (workflow.directeurGeneral.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Seul le Directeur Général peut donner un feedback' });
    }

    // Vérifier l'état du workflow
    if (workflow.currentStatus !== WorkflowStatus.DG_REVIEW) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    if (action === 'approve') {
      // DG approuve la proposition
      await workflow.updateDraftStatus(draftVersion || workflow.currentDraftVersion, 'APPROVED', feedback);
      
      await workflow.addAction({
        actionType: ActionType.DG_APPROVE,
        performedBy: req.user.id,
        comment: feedback || 'Proposition approuvée'
      });

      await workflow.updateStatus(WorkflowStatus.DG_APPROVED);

      // Notifier automatiquement le superviseur bureau d'ordre
      if (workflow.superviseurBureauOrdre) {
        await workflow.addAction({
          actionType: ActionType.NOTIFY_SUPERVISOR,
          performedBy: req.user.id,
          comment: 'Superviseur bureau d\'ordre notifié de l\'approbation'
        });
        await workflow.updateStatus(WorkflowStatus.SUPERVISOR_NOTIFIED);
      }

      res.json({
        success: true,
        message: 'Proposition approuvée avec succès',
        data: await getPopulatedWorkflow(workflowId)
      });

    } else if (action === 'request_revision') {
      // DG demande révision
      await workflow.updateDraftStatus(draftVersion || workflow.currentDraftVersion, 'NEEDS_REVISION', feedback);
      
      // Ajouter message dans le chat
      // Ajouter le message de feedback sans effacer l'historique
      console.log(`💬 [DG-Feedback] Ajout du message de feedback au chat`);
      console.log(`📝 [DG-Feedback] Feedback: ${feedback?.substring(0, 100)}...`);
      console.log(`👥 [DG-Feedback] Messages existants avant: ${workflow.chatMessages.length}`);
      
      await workflow.addChatMessage(
        req.user.id,
        workflow.assignedDirector,
        feedback,
        `Version ${draftVersion || workflow.currentDraftVersion}`
      );
      
      console.log(`👥 [DG-Feedback] Messages existants après: ${workflow.chatMessages.length}`);

      await workflow.addAction({
        actionType: ActionType.DG_REQUEST_REVISION,
        performedBy: req.user.id,
        comment: feedback || 'Révision demandée'
      });

      await workflow.updateStatus(WorkflowStatus.DG_FEEDBACK);

      res.json({
        success: true,
        message: 'Demande de révision envoyée',
        data: await getPopulatedWorkflow(workflowId)
      });
    } else {
      return res.status(400).json({ success: false, message: 'Action invalide' });
    }
  } catch (error) {
    console.error('Erreur feedback DG:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 4. DIRECTEUR RÉVISE SELON FEEDBACK DG
router.post('/:workflowId/director-revise', upload.array('attachments', 5), auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { revisedContent, responseToFeedback } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est le directeur assigné
    if (workflow.assignedDirector.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Seul le directeur assigné peut réviser' });
    }

    // Vérifier l'état du workflow
    if (workflow.currentStatus !== WorkflowStatus.DG_FEEDBACK) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    // Traiter les attachements
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Ajouter réponse au chat
    if (responseToFeedback) {
      await workflow.addChatMessage(
        req.user.id,
        workflow.directeurGeneral,
        responseToFeedback,
        `Version ${workflow.currentDraftVersion + 1}`,
        attachments
      );
    }

    // Ajouter nouvelle version révisée
    await workflow.addDraftVersion(revisedContent, req.user.id, attachments);

    await workflow.addAction({
      actionType: ActionType.DIRECTOR_REVISION,
      performedBy: req.user.id,
      comment: 'Proposition révisée selon feedback DG',
      draftResponse: revisedContent,
      attachments
    });

    // Retour vers révision DG
    await workflow.updateStatus(WorkflowStatus.DG_REVIEW);

    res.json({
      success: true,
      message: 'Proposition révisée soumise',
      data: await getPopulatedWorkflow(workflowId)
    });
  } catch (error) {
    console.error('Erreur révision directeur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 5. SUPERVISEUR PRÉPARE RÉPONSE FINALE
router.post('/:workflowId/supervisor-prepare-response', upload.array('attachments', 5), auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { finalResponseContent, comment } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que l'utilisateur est superviseur bureau d'ordre
    if (!['SUPERVISOR_BUREAU_ORDRE', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(req.user.role) || 
        (workflow.superviseurBureauOrdre && workflow.superviseurBureauOrdre.toString() !== req.user.id && !['ADMINISTRATOR', 'SUPER_ADMIN'].includes(req.user.role))) {
      return res.status(403).json({ success: false, message: 'Seul le superviseur bureau d\'ordre peut préparer la réponse' });
    }

    // Vérifier l'état du workflow
    if (![WorkflowStatus.DG_APPROVED, WorkflowStatus.SUPERVISOR_NOTIFIED].includes(workflow.currentStatus)) {
      return res.status(400).json({ success: false, message: 'Action non autorisée dans l\'état actuel' });
    }

    // Traiter les attachements
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Préparer la réponse finale
    workflow.finalResponse = {
      content: finalResponseContent,
      attachments,
      preparedBy: req.user.id,
      preparedAt: new Date()
    };

    await workflow.addAction({
      actionType: ActionType.PREPARE_RESPONSE,
      performedBy: req.user.id,
      comment: comment || 'Réponse finale préparée',
      attachments
    });

    await workflow.updateStatus(WorkflowStatus.RESPONSE_PREPARED);
    await workflow.save();

    res.json({
      success: true,
      message: 'Réponse finale préparée',
      data: await getPopulatedWorkflow(workflowId)
    });
  } catch (error) {
    console.error('Erreur préparation réponse superviseur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 6. ENVOYER RÉPONSE FINALE
router.post('/:workflowId/send-final-response', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { comment } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier permissions
    if (!['SUPERVISOR_BUREAU_ORDRE', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Seul le superviseur peut envoyer la réponse' });
    }

    // Vérifier l'état du workflow
    if (workflow.currentStatus !== WorkflowStatus.RESPONSE_PREPARED) {
      return res.status(400).json({ success: false, message: 'La réponse doit être préparée avant envoi' });
    }

    // Marquer comme envoyée
    workflow.finalResponse.sentAt = new Date();

    await workflow.addAction({
      actionType: ActionType.SEND_RESPONSE,
      performedBy: req.user.id,
      comment: comment || 'Réponse finale envoyée'
    });

    await workflow.updateStatus(WorkflowStatus.RESPONSE_SENT);
    await workflow.save();

    res.json({
      success: true,
      message: 'Réponse envoyée avec succès',
      data: await getPopulatedWorkflow(workflowId)
    });
  } catch (error) {
    console.error('Erreur envoi réponse finale:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 7. CHAT ENTRE DG ET DIRECTEUR
router.get('/:workflowId/chat', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;

    const workflow = await CorrespondenceWorkflow.findById(workflowId)
      .populate('chatMessages.from', 'firstName lastName email role')
      .populate('chatMessages.to', 'firstName lastName email role');

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier permissions
    if (![workflow.directeurGeneral.toString(), workflow.assignedDirector.toString()].includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé au chat' });
    }

    // Marquer messages comme lus
    await workflow.markMessagesAsRead(req.user.id);

    res.json({
      success: true,
      data: {
        messages: workflow.chatMessages,
        unreadCount: workflow.getUnreadMessagesCount(req.user.id)
      }
    });
  } catch (error) {
    console.error('Erreur récupération chat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 8. ENVOYER MESSAGE CHAT
router.post('/:workflowId/chat/send', upload.array('attachments', 3), auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { message, toUserId, draftVersion } = req.body;

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier permissions
    if (![workflow.directeurGeneral.toString(), workflow.assignedDirector.toString()].includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé au chat' });
    }

    // Traiter les attachements
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    await workflow.addChatMessage(req.user.id, toUserId, message, draftVersion, attachments);

    res.json({
      success: true,
      message: 'Message envoyé',
      data: await getPopulatedWorkflow(workflowId)
    });
  } catch (error) {
    console.error('Erreur envoi message chat:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// 9. OBTENIR WORKFLOWS POUR SUPERVISEUR BUREAU D'ORDRE
router.get('/supervisor/pending', auth, async (req, res) => {
  try {
    if (!['SUPERVISOR_BUREAU_ORDRE', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const workflows = await CorrespondenceWorkflow.find({
      $or: [
        { superviseurBureauOrdre: req.user.id },
        { currentStatus: { $in: [WorkflowStatus.SUPERVISOR_NOTIFIED, WorkflowStatus.RESPONSE_PREPARED] } }
      ],
      isActive: true
    })
    .populate('correspondenceId')
    .populate('assignedDirector', 'firstName lastName email role')
    .populate('directeurGeneral', 'firstName lastName email role')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Erreur récupération workflows superviseur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// Fonction utilitaire pour récupérer workflow populé
async function getPopulatedWorkflow(workflowId) {
  return await CorrespondenceWorkflow.findById(workflowId)
    .populate('correspondenceId')
    .populate('createdBy', 'firstName lastName email role')
    .populate('bureauOrdreAgent', 'firstName lastName email role')
    .populate('superviseurBureauOrdre', 'firstName lastName email role')
    .populate('assignedDirector', 'firstName lastName email role')
    .populate('directeurGeneral', 'firstName lastName email role')
    .populate('actions.performedBy', 'firstName lastName email role')
    .populate('draftVersions.createdBy', 'firstName lastName email role')
    .populate('chatMessages.from', 'firstName lastName email role')
    .populate('chatMessages.to', 'firstName lastName email role')
    .populate('finalResponse.preparedBy', 'firstName lastName email role');
}

// 5. SUPERVISEUR FINALISE LA RÉPONSE
router.post('/:workflowId/supervisor-finalize', auth, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { finalResponse } = req.body;

    console.log(`📋 [Supervisor-Finalize] Finalisation par superviseur: ${workflowId}`);
    console.log(`👤 [Supervisor-Finalize] Superviseur: ${req.user.firstName} ${req.user.lastName}`);

    // Vérifier que l'utilisateur est superviseur bureau d'ordre
    if (req.user.role !== 'SUPERVISEUR_BUREAU_ORDRE' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Seul le superviseur bureau d\'ordre peut finaliser la réponse' 
      });
    }

    if (!finalResponse || !finalResponse.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'La réponse finale est requise' 
      });
    }

    const workflow = await CorrespondenceWorkflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow non trouvé' });
    }

    // Vérifier que le workflow est dans un état approprié
    const validStates = ['DG_APPROVED', 'COMPLETED'];
    if (!validStates.includes(workflow.currentStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le workflow doit être approuvé par le DG avant finalisation' 
      });
    }

    // Mettre à jour la réponse finale
    workflow.finalResponse = finalResponse.trim();
    
    // Ajouter une action pour tracer la finalisation
    await workflow.addAction({
      actionType: 'SUPERVISOR_FINALIZE',
      performedBy: req.user.id,
      comment: 'Réponse finale formulée par le superviseur bureau d\'ordre'
    });

    // Mettre à jour le statut
    await workflow.updateStatus('FINAL_RESPONSE_READY');

    console.log(`✅ [Supervisor-Finalize] Réponse finale enregistrée`);
    console.log(`📝 [Supervisor-Finalize] Longueur: ${finalResponse.length} caractères`);

    res.json({
      success: true,
      message: 'Réponse finale enregistrée avec succès',
      data: await getPopulatedWorkflow(workflowId)
    });

  } catch (error) {
    console.error('❌ [Supervisor-Finalize] Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// 6. LISTE DES WORKFLOWS POUR SUPERVISEUR
router.get('/supervisor/list', auth, async (req, res) => {
  try {
    console.log(`📋 [Supervisor-List] Récupération workflows pour superviseur: ${req.user.firstName} ${req.user.lastName}`);

    // Vérifier que l'utilisateur est superviseur bureau d'ordre
    if (req.user.role !== 'SUPERVISEUR_BUREAU_ORDRE' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès réservé au superviseur bureau d\'ordre' 
      });
    }

    // Récupérer tous les workflows avec leurs informations de base
    const workflows = await CorrespondenceWorkflow.find({})
      .populate('correspondenceId', 'subject priority createdAt')
      .populate('assignedDirector', 'firstName lastName role')
      .populate('assignedDG', 'firstName lastName role')
      .sort({ updatedAt: -1 })
      .lean();

    // Formater les données pour le dashboard
    const workflowSummaries = workflows.map(workflow => ({
      id: workflow._id,
      correspondanceSubject: workflow.correspondenceId?.subject || 'Sujet non disponible',
      currentStatus: workflow.currentStatus,
      assignedDirector: {
        firstName: workflow.assignedDirector?.firstName || '',
        lastName: workflow.assignedDirector?.lastName || '',
        role: workflow.assignedDirector?.role || ''
      },
      assignedDG: {
        firstName: workflow.assignedDG?.firstName || '',
        lastName: workflow.assignedDG?.lastName || '',
        role: workflow.assignedDG?.role || ''
      },
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      priority: workflow.correspondenceId?.priority || 'MEDIUM',
      messagesCount: workflow.chatMessages?.length || 0,
      actionsCount: workflow.actions?.length || 0
    }));

    console.log(`✅ [Supervisor-List] ${workflowSummaries.length} workflows récupérés`);

    res.json({
      success: true,
      data: workflowSummaries,
      total: workflowSummaries.length,
      summary: {
        total: workflowSummaries.length,
        approved: workflowSummaries.filter(w => w.currentStatus === 'DG_APPROVED').length,
        completed: workflowSummaries.filter(w => w.currentStatus === 'COMPLETED').length,
        finalReady: workflowSummaries.filter(w => w.currentStatus === 'FINAL_RESPONSE_READY').length,
        inDiscussion: workflowSummaries.filter(w => w.currentStatus === 'DG_FEEDBACK').length
      }
    });

  } catch (error) {
    console.error('❌ [Supervisor-List] Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

module.exports = router;
