const { Router } = require('express');
const DirectorGeneralService = require('../services/directorGeneralService');
const { auth, authorize } = require('../middleware/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Director General
 *     description: Fonctionnalités spécialisées du Directeur Général
 */

/**
 * @swagger
 * /api/director-general/dashboard:
 *   get:
 *     summary: Récupérer le dashboard stratégique du Directeur Général
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { timeframe = 'month' } = req.query;
      console.log(`🔄 Dashboard DG - Timeframe: ${timeframe}, User: ${req.user._id}`);
      
      const dashboardData = await DirectorGeneralService.getDashboardData(req.user._id, timeframe);
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Erreur dashboard directeur général:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/director-general/approve/{id}:
 *   post:
 *     summary: Approuver ou rejeter une correspondance
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.post('/approve/:id', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { decision, comments } = req.body;
      
      if (!decision || !['approve', 'reject'].includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Decision must be either "approve" or "reject"'
        });
      }

      const result = await DirectorGeneralService.approveCorrespondance(
        id,
        req.user._id,
        decision,
        comments
      );
      
      res.json({
        success: true,
        data: result,
        message: `Correspondance ${decision === 'approve' ? 'approuvée' : 'rejetée'} avec succès`
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'approbation'
      });
    }
  }
);

/**
 * @swagger
 * /api/director-general/department-report:
 *   get:
 *     summary: Récupérer le rapport de performance d'un département
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.get('/department-report', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { department, period = 'month' } = req.query;
      
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department parameter is required'
        });
      }

      const report = await DirectorGeneralService.getDepartmentReport(department, period);
      
      res.json({
        success: true,
        data: report
      });
      
    } catch (error) {
      console.error('Erreur rapport département:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/director-general/strategic-report:
 *   get:
 *     summary: Récupérer le rapport stratégique
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.get('/strategic-report', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { type = 'monthly' } = req.query;
      
      const report = await DirectorGeneralService.getStrategicReport(type);
      
      res.json({
        success: true,
        data: report
      });
      
    } catch (error) {
      console.error('Erreur rapport stratégique:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/director-general/escalate/{id}:
 *   post:
 *     summary: Escalader une correspondance vers un département
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.post('/escalate/:id', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { targetDepartment, priority } = req.body;
      
      if (!targetDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Target department is required'
        });
      }

      const result = await DirectorGeneralService.escalateCorrespondance(
        id,
        req.user._id,
        targetDepartment,
        priority
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Correspondance escaladée avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'escalade:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/director-general/notifications:
 *   get:
 *     summary: Récupérer les notifications stratégiques du DG
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.get('/notifications', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const notifications = await DirectorGeneralService.getStrategicNotifications(req.user._id);
      
      res.json({
        success: true,
        data: notifications
      });
      
    } catch (error) {
      console.error('Erreur notifications DG:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/director-general/performance-overview:
 *   get:
 *     summary: Vue d'ensemble des performances organisationnelles
 *     tags: [Director General]
 *     security:
 *       - bearerAuth: []
 */
router.get('/performance-overview', 
  auth, 
  authorize('DIRECTEUR_GENERAL'),
  async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      
      const overview = await DirectorGeneralService.getPerformanceOverview(period);
      
      res.json({
        success: true,
        data: overview
      });
      
    } catch (error) {
      console.error('Erreur vue d\'ensemble performance:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
