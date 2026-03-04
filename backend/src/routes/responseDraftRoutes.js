const { Router } = require('express');
const ResponseDraft = require('../models/ResponseDraft');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Response Drafts
 *     description: Gestion des drafts de réponse pour les directeurs
 */

/**
 * POST /api/correspondances/response-draft
 * Créer un nouveau draft de réponse (Directeurs uniquement)
 */
router.post('/response-draft', 
  auth, 
  authorize(['DIRECTEUR', 'SOUS_DIRECTEUR']),
  async (req, res) => {
    try {
      const {
        correspondanceId,
        content,
        priority = 'MEDIUM',
        estimatedResponseTime = 3,
        notes,
        requiredApprovals
      } = req.body;

      console.log('📝 Création draft de réponse:', {
        correspondanceId,
        submittedBy: req.user._id,
        priority,
        estimatedResponseTime
      });

      // Vérifier que la correspondance existe
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        return res.status(404).json({
          success: false,
          message: 'Correspondance non trouvée'
        });
      }

      // Vérifier qu'il n'y a pas déjà un draft en attente pour cette correspondance
      const existingDraft = await ResponseDraft.findOne({
        correspondanceId,
        status: { $in: ['DRAFT_PENDING', 'DRAFT_NEEDS_REVISION'] }
      });

      if (existingDraft) {
        return res.status(400).json({
          success: false,
          message: 'Un draft est déjà en cours de traitement pour cette correspondance'
        });
      }

      // Trouver le DG pour l'approbation
      const directorGeneral = await User.findOne({ 
        role: 'DIRECTEUR_GENERAL', 
        isActive: true 
      });

      if (!directorGeneral) {
        return res.status(400).json({
          success: false,
          message: 'Aucun Directeur Général disponible pour l\'approbation'
        });
      }

      // Créer le draft
      const draft = new ResponseDraft({
        correspondanceId,
        content,
        priority,
        estimatedResponseTime,
        notes,
        status: 'DRAFT_PENDING',
        submittedBy: req.user._id,
        requiredApprovals: [directorGeneral._id],
        submittedAt: new Date()
      });

      await draft.save();

      // Populer les données pour la réponse
      await draft.populate([
        { path: 'correspondanceId', select: 'subject from_address priority' },
        { path: 'submittedBy', select: 'firstName lastName email role directorate' },
        { path: 'requiredApprovals', select: 'firstName lastName email role' }
      ]);

      console.log('✅ Draft créé avec succès:', draft._id);

      res.json({
        success: true,
        data: draft,
        message: 'Draft de réponse soumis avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur création draft:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création du draft',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/correspondances/save-draft
 * Sauvegarder un draft sans le soumettre
 */
router.post('/save-draft', 
  auth, 
  authorize(['DIRECTEUR', 'SOUS_DIRECTEUR']),
  async (req, res) => {
    try {
      const {
        correspondanceId,
        content,
        priority = 'MEDIUM',
        estimatedResponseTime = 3,
        notes
      } = req.body;

      // Chercher un draft existant ou en créer un nouveau
      let draft = await ResponseDraft.findOne({
        correspondanceId,
        submittedBy: req.user._id,
        status: 'DRAFT_SAVED'
      });

      if (draft) {
        // Mettre à jour le draft existant
        draft.content = content;
        draft.priority = priority;
        draft.estimatedResponseTime = estimatedResponseTime;
        draft.notes = notes;
      } else {
        // Créer un nouveau draft
        draft = new ResponseDraft({
          correspondanceId,
          content,
          priority,
          estimatedResponseTime,
          notes,
          status: 'DRAFT_SAVED',
          submittedBy: req.user._id
        });
      }

      await draft.save();

      res.json({
        success: true,
        data: draft,
        message: 'Draft sauvegardé avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur sauvegarde draft:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la sauvegarde du draft',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/correspondances/:id/drafts
 * Récupérer tous les drafts pour une correspondance
 */
router.get('/:correspondanceId/drafts', 
  auth,
  async (req, res) => {
    try {
      const { correspondanceId } = req.params;

      const drafts = await ResponseDraft.findByCorrespondance(correspondanceId);

      res.json({
        success: true,
        data: drafts
      });

    } catch (error) {
      console.error('❌ Erreur récupération drafts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des drafts',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/director-general/pending-drafts
 * Récupérer les drafts en attente d'approbation (DG uniquement)
 */
router.get('/pending-drafts', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      const drafts = await ResponseDraft.findPendingForApproval(req.user._id);

      console.log(`📋 ${drafts.length} drafts en attente pour le DG`);

      res.json({
        success: true,
        data: drafts
      });

    } catch (error) {
      console.error('❌ Erreur récupération drafts DG:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des drafts',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/correspondances/pending-drafts
 * Récupérer tous les drafts en attente d'approbation (DG uniquement)
 */
router.get('/pending-drafts', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      console.log('📋 Récupération des drafts en attente pour le DG');

      const drafts = await ResponseDraft.find({
        status: 'DRAFT_PENDING'
      })
      .populate('correspondanceId', 'subject from_address content')
      .populate('submittedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

      console.log(`✅ ${drafts.length} drafts en attente trouvés`);

      res.status(200).json({
        success: true,
        data: drafts,
        count: drafts.length
      });

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des drafts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des drafts en attente',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/correspondances/approve-draft/:id
 * Approuver un draft (DG uniquement)
 */
router.post('/approve-draft/:id', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comments = '' } = req.body;

      const draft = await ResponseDraft.findById(id)
        .populate('correspondanceId')
        .populate('submittedBy', 'firstName lastName email');

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Draft non trouvé'
        });
      }

      if (draft.status !== 'DRAFT_PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Ce draft ne peut pas être approuvé dans son état actuel'
        });
      }

      // Approuver le draft
      await draft.approve(req.user._id, comments);

      // Créer la réponse automatiquement
      const responseCorrespondance = new Correspondance({
        subject: `RE: ${draft.correspondanceId.subject}`,
        content: draft.content,
        from_address: process.env.OFFICIAL_EMAIL || 'direction@tav.aero',
        to_address: draft.correspondanceId.from_address,
        priority: draft.priority,
        status: 'REPLIED',
        airport: draft.correspondanceId.airport,
        type: 'OUTGOING',
        authorId: draft.submittedBy._id,
        parentCorrespondanceId: draft.correspondanceId._id,
        approvedBy: req.user._id,
        approvedAt: new Date()
      });

      await responseCorrespondance.save();

      // Mettre à jour la correspondance originale
      await Correspondance.findByIdAndUpdate(draft.correspondanceId._id, {
        status: 'REPLIED',
        repliedAt: new Date(),
        repliedBy: draft.submittedBy._id
      });

      // Marquer le draft comme envoyé
      draft.status = 'DRAFT_SENT';
      draft.sentAt = new Date();
      await draft.save();

      console.log('✅ Draft approuvé et réponse envoyée:', draft._id);

      res.json({
        success: true,
        data: {
          draft,
          response: responseCorrespondance
        },
        message: 'Draft approuvé et réponse envoyée avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur approbation draft:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'approbation du draft',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/director-general/reject-draft/:id
 * Rejeter un draft (DG uniquement)
 */
router.post('/reject-draft/:id', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comments = '', requestRevision = false } = req.body;

      const draft = await ResponseDraft.findById(id);

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Draft non trouvé'
        });
      }

      if (requestRevision) {
        await draft.requestRevision(req.user._id, comments);
        var message = 'Révision demandée avec succès';
      } else {
        await draft.reject(req.user._id, comments);
        var message = 'Draft rejeté avec succès';
      }

      console.log(`✅ Draft ${requestRevision ? 'révision demandée' : 'rejeté'}:`, draft._id);

      res.json({
        success: true,
        data: draft,
        message
      });

    } catch (error) {
      console.error('❌ Erreur rejet draft:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rejet du draft',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/director-general/add-instruction/:correspondanceId
 * Ajouter des consignes proactives (DG uniquement)
 */
router.post('/add-instruction/:correspondanceId', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      const { correspondanceId } = req.params;
      const { instruction, targetDirector } = req.body;

      if (!instruction || !instruction.trim()) {
        return res.status(400).json({
          success: false,
          message: 'L\'instruction est obligatoire'
        });
      }

      // Vérifier que la correspondance existe
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        return res.status(404).json({
          success: false,
          message: 'Correspondance non trouvée'
        });
      }

      // Chercher un draft existant ou en créer un nouveau pour les instructions
      let draft = await ResponseDraft.findOne({
        correspondanceId,
        status: { $in: ['DRAFT_SAVED', 'DRAFT_PENDING'] }
      });

      if (!draft) {
        // Créer un draft vide pour stocker les instructions
        draft = new ResponseDraft({
          correspondanceId,
          content: '', // Vide car c'est juste pour les instructions
          status: 'DRAFT_SAVED',
          submittedBy: targetDirector || req.user._id, // Si pas de directeur spécifié, utiliser le DG
          requiredApprovals: [req.user._id]
        });
        await draft.save();
      }

      // Ajouter l'instruction
      await draft.addInstruction(instruction, req.user._id, 'PROACTIVE');

      // Notifier le directeur concerné
      if (targetDirector) {
        await NotificationService.notifyDirectorInstruction(draft, targetDirector);
      }

      console.log('✅ Instruction ajoutée:', instruction);

      res.json({
        success: true,
        data: draft,
        message: 'Instruction ajoutée avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur ajout instruction:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de l\'instruction',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/directors/my-drafts
 * Récupérer les drafts du directeur connecté
 */
router.get('/my-drafts', 
  auth, 
  authorize(['DIRECTEUR', 'SOUS_DIRECTEUR']),
  async (req, res) => {
    try {
      const drafts = await ResponseDraft.findByDirector(req.user._id);

      res.json({
        success: true,
        data: drafts
      });

    } catch (error) {
      console.error('❌ Erreur récupération drafts directeur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des drafts',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/correspondances/reject-draft/:id
 * Rejeter un draft (DG uniquement)
 */
router.post('/reject-draft/:id', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comments = '' } = req.body;

      console.log('❌ Rejet draft:', { id, comments });

      const draft = await ResponseDraft.findById(id)
        .populate('submittedBy', 'firstName lastName email')
        .populate('correspondanceId', 'subject');

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Draft non trouvé'
        });
      }

      // Rejeter le draft
      await draft.reject(req.user._id, comments);

      // Notifier le directeur
      await NotificationService.notifyDraftRejected(draft);

      console.log('✅ Draft rejeté avec succès');

      res.json({
        success: true,
        data: draft,
        message: 'Draft rejeté avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur rejet draft:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du rejet du draft',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/correspondances/request-revision/:id
 * Demander une révision d'un draft (DG uniquement)
 */
router.post('/request-revision/:id', 
  auth, 
  authorize(['DIRECTEUR_GENERAL']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { comments = '' } = req.body;

      console.log('🔄 Demande révision draft:', { id, comments });

      const draft = await ResponseDraft.findById(id)
        .populate('submittedBy', 'firstName lastName email')
        .populate('correspondanceId', 'subject');

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Draft non trouvé'
        });
      }

      // Demander révision
      await draft.requestRevision(req.user._id, comments);

      // Notifier le directeur
      await NotificationService.notifyDraftRevisionRequested(draft);

      console.log('✅ Révision demandée avec succès');

      res.json({
        success: true,
        data: draft,
        message: 'Révision demandée avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur demande révision:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la demande de révision',
        error: error.message
      });
    }
  }
);

module.exports = router;
