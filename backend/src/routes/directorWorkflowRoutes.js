const { Router } = require('express');
const DirectorWorkflowService = require('../services/directorWorkflowService');
const { auth, authorize } = require('../middleware/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Director Workflow
 *     description: Workflow de validation du directeur général
 */

/**
 * @swagger
 * /api/director-workflow/consignes:
 *   post:
 *     summary: Ajouter des consignes du directeur à une correspondance
 *     tags: [Director Workflow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correspondanceId
 *               - consignes
 *             properties:
 *               correspondanceId:
 *                 type: string
 *               consignes:
 *                 type: string
 *               comments:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consignes ajoutées avec succès
 *       403:
 *         description: Accès refusé - réservé aux directeurs
 */
router.post('/consignes', 
  auth, 
  authorize('DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'),
  async (req, res) => {
    try {
      const { correspondanceId, consignes, comments, notes } = req.body;
      
      if (!correspondanceId || !consignes) {
        return res.status(400).json({
          success: false,
          message: 'correspondanceId et consignes sont requis'
        });
      }
      
      const result = await DirectorWorkflowService.addDirectorConsignes(
        correspondanceId,
        req.user._id,
        consignes,
        comments,
        notes
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Consignes ajoutées avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout des consignes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'ajout des consignes'
      });
    }
  }
);

/**
 * @swagger
 * /api/director-workflow/response-proposal:
 *   post:
 *     summary: Soumettre une proposition de réponse
 *     tags: [Director Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/response-proposal', auth, async (req, res) => {
  try {
    const { correspondanceId, responseProposal } = req.body;
    
    if (!correspondanceId || !responseProposal) {
      return res.status(400).json({
        success: false,
        message: 'correspondanceId et responseProposal sont requis'
      });
    }
    
    const result = await DirectorWorkflowService.submitResponseProposal(
      correspondanceId,
      req.user._id,
      responseProposal
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Proposition de réponse soumise avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la soumission de la proposition:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la soumission de la proposition'
    });
  }
});

/**
 * @swagger
 * /api/director-workflow/validate-proposal:
 *   post:
 *     summary: Valider ou rejeter une proposition de réponse
 *     tags: [Director Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/validate-proposal', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { correspondanceId, decision, comments } = req.body;
      
      if (!correspondanceId || !decision) {
        return res.status(400).json({
          success: false,
          message: 'correspondanceId et decision sont requis'
        });
      }
      
      if (!['APPROVED', 'REJECTED', 'NEEDS_REVISION'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'decision doit être APPROVED, REJECTED ou NEEDS_REVISION'
        });
      }
      
      const result = await DirectorWorkflowService.validateResponseProposal(
        correspondanceId,
        req.user._id,
        decision,
        comments
      );
      
      res.json({
        success: true,
        data: result,
        message: `Proposition ${decision.toLowerCase()} avec succès`
      });
      
    } catch (error) {
      console.error('Erreur lors de la validation de la proposition:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la validation de la proposition'
      });
    }
  }
);

/**
 * @swagger
 * /api/director-workflow/finalize-response:
 *   post:
 *     summary: Finaliser l'envoi de la réponse avec document de décharge
 *     tags: [Director Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/finalize-response', auth, async (req, res) => {
  try {
    const { correspondanceId, dischargeDocumentPath } = req.body;
    
    if (!correspondanceId || !dischargeDocumentPath) {
      return res.status(400).json({
        success: false,
        message: 'correspondanceId et dischargeDocumentPath sont requis'
      });
    }
    
    const result = await DirectorWorkflowService.finalizeResponse(
      correspondanceId,
      req.user._id,
      dischargeDocumentPath
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Réponse finalisée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la finalisation de la réponse:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la finalisation de la réponse'
    });
  }
});

/**
 * @swagger
 * /api/director-workflow/pending-validations:
 *   get:
 *     summary: Récupérer les correspondances en attente de validation
 *     tags: [Director Workflow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/pending-validations', 
  auth, 
  authorize('DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'),
  async (req, res) => {
    try {
      const result = await DirectorWorkflowService.getPendingValidations(req.user._id);
      
      res.json({
        success: true,
        data: result,
        message: 'Validations en attente récupérées avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des validations en attente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des validations en attente'
      });
    }
  }
);

module.exports = router;
