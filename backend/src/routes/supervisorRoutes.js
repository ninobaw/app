const { Router } = require('express');
const SupervisorService = require('../services/supervisorService');
const SupervisorDashboardService = require('../services/supervisorDashboardService');
const { auth, authorize } = require('../middleware/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Supervisor
 *     description: Fonctionnalités de l'agent superviseur du bureau d'ordre
 */

/**
 * @swagger
 * /api/supervisor/dashboard:
 *   get:
 *     summary: Récupérer le dashboard de l'agent superviseur
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', 
  auth, 
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const { timeframe = 'week' } = req.query;
      const dashboardData = await SupervisorDashboardService.getDashboardData(req.user._id, timeframe);
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Erreur dashboard superviseur:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/supervisor/send-reminder:
 *   post:
 *     summary: Envoyer un rappel manuel pour une correspondance
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.post('/send-reminder', 
  auth, 
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const { correspondanceId, userIds, message } = req.body;
      
      if (!correspondanceId || !userIds || !Array.isArray(userIds)) {
        return res.status(400).json({
          success: false,
          message: 'correspondanceId et userIds (array) sont requis'
        });
      }
      
      const result = await SupervisorService.sendManualReminder(
        req.user._id,
        correspondanceId,
        userIds,
        message
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Rappel envoyé avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'envoi du rappel'
      });
    }
  }
);

/**
 * @swagger
 * /api/supervisor/mark-overdue:
 *   post:
 *     summary: Marquer une correspondance comme en retard
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.post('/mark-overdue', 
  auth, 
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const { correspondanceId } = req.body;
      
      if (!correspondanceId) {
        return res.status(400).json({
          success: false,
          message: 'correspondanceId est requis'
        });
      }
      
      const result = await SupervisorService.markAsOverdue(
        req.user._id,
        correspondanceId
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Correspondance marquée en retard avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors du marquage en retard:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors du marquage en retard'
      });
    }
  }
);

/**
 * @swagger
 * /api/supervisor/generate-report:
 *   post:
 *     summary: Générer un rapport personnalisé
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.post('/generate-report', 
  auth, 
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const filters = req.body;
      
      const report = await SupervisorService.generateCustomReport(
        req.user._id,
        filters
      );
      
      res.json({
        success: true,
        data: report,
        message: 'Rapport généré avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la génération du rapport'
      });
    }
  }
);

/**
 * @swagger
 * /api/supervisor/stats:
 *   get:
 *     summary: Récupérer les statistiques générales
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', 
  auth, 
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const stats = await SupervisorService.getGeneralStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Statistiques récupérées avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * @swagger
 * /api/supervisor/validated-correspondances:
 *   get:
 *     summary: Récupérer les correspondances validées pour réponse
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/validated-correspondances',
  auth,
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const validatedCorrespondances = await SupervisorDashboardService.getValidatedCorrespondances();
      
      res.json({
        success: true,
        data: validatedCorrespondances,
        message: 'Correspondances validées récupérées avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des correspondances validées:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des correspondances validées'
      });
    }
  }
);

/**
 * @swagger
 * /api/supervisor/deadline-alerts:
 *   get:
 *     summary: Récupérer les alertes d'échéances
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/deadline-alerts',
  auth,
  authorize('SUPERVISEUR_BUREAU_ORDRE'),
  async (req, res) => {
    try {
      const { timeframe = 'week' } = req.query;
      const dashboardData = await SupervisorDashboardService.getDashboardData(req.user._id, timeframe);
      
      res.json({
        success: true,
        data: {
          critical: dashboardData.criticalDeadlines,
          upcoming: dashboardData.upcomingDeadlines,
          overdue: dashboardData.overdueItems
        },
        message: 'Alertes d\'échéances récupérées avec succès'
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des alertes'
      });
    }
  }
);

module.exports = router;
