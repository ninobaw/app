  const { Router } = require('express');
const { auth } = require('../middleware/auth');
const DirectorDashboardService = require('../services/directorDashboardService');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');

const router = Router();

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

// GET /api/directors/dashboard - Dashboard personnalisé du directeur
router.get('/dashboard', auth, requireDirector, async (req, res) => {
  try {
    console.log(`📊 [DirectorDashboard] Génération dashboard pour ${req.director.firstName} ${req.director.lastName}`);
    
    const metrics = await DirectorDashboardService.getDirectorMetrics(
      req.director._id,
      req.director.role
    );
    
    res.json({
      success: true,
      data: metrics,
      message: 'Dashboard généré avec succès'
    });

  } catch (error) {
    console.error('❌ [DirectorDashboard] Erreur génération dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du dashboard',
      error: error.message
    });
  }
});

// GET /api/directors/correspondances - Correspondances assignées au directeur
router.get('/correspondances', auth, requireDirector, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, search } = req.query;
    
    // Construire le filtre de base
    const baseFilter = DirectorDashboardService.buildCorrespondanceFilter(req.director);
    const filter = {
      ...baseFilter,
      personnesConcernees: req.director._id
    };

    // Ajouter des filtres optionnels
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [correspondances, total] = await Promise.all([
      Correspondance.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('authorId', 'firstName lastName')
        .lean(),
      Correspondance.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        correspondances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ [DirectorRoutes] Erreur récupération correspondances:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des correspondances',
      error: error.message
    });
  }
});

// GET /api/directors/team - Équipe gérée par le directeur
router.get('/team', auth, requireDirector, async (req, res) => {
  try {
    const teamMembers = await User.find({
      department: { $in: req.director.managedDepartments },
      isActive: true,
      _id: { $ne: req.director._id } // Exclure le directeur lui-même
    }).select('firstName lastName email role department position').lean();

    res.json({
      success: true,
      data: {
        teamMembers,
        totalMembers: teamMembers.length,
        managedDepartments: req.director.managedDepartments
      }
    });

  } catch (error) {
    console.error('❌ [DirectorRoutes] Erreur récupération équipe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'équipe',
      error: error.message
    });
  }
});

// GET /api/directors/notifications - Notifications spécifiques au directeur
router.get('/notifications', auth, requireDirector, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Notifications d'échéances approchantes
    const upcomingDeadlines = await Correspondance.find({
      personnesConcernees: req.director._id,
      responseDeadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      },
      status: { $ne: 'REPLIED' }
    })
    .sort({ responseDeadline: 1 })
    .limit(parseInt(limit))
    .select('subject priority responseDeadline')
    .lean();

    // Correspondances urgentes non traitées
    const urgentCorrespondances = await Correspondance.find({
      personnesConcernees: req.director._id,
      priority: 'URGENT',
      status: 'PENDING'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('subject createdAt')
    .lean();

    // Correspondances en retard
    const overdueCorrespondances = await Correspondance.find({
      personnesConcernees: req.director._id,
      responseDeadline: { $lt: new Date() },
      status: { $ne: 'REPLIED' }
    })
    .sort({ responseDeadline: 1 })
    .limit(parseInt(limit))
    .select('subject responseDeadline')
    .lean();

    const notifications = [
      ...upcomingDeadlines.map(c => ({
        type: 'DEADLINE_APPROACHING',
        title: 'Échéance approchante',
        message: `${c.subject} - Échéance: ${new Date(c.responseDeadline).toLocaleDateString()}`,
        priority: c.priority,
        correspondanceId: c._id,
        date: c.responseDeadline
      })),
      ...urgentCorrespondances.map(c => ({
        type: 'URGENT_CORRESPONDENCE',
        title: 'Correspondance urgente',
        message: c.subject,
        priority: 'URGENT',
        correspondanceId: c._id,
        date: c.createdAt
      })),
      ...overdueCorrespondances.map(c => ({
        type: 'OVERDUE_CORRESPONDENCE',
        title: 'Correspondance en retard',
        message: `${c.subject} - En retard depuis le ${new Date(c.responseDeadline).toLocaleDateString()}`,
        priority: 'CRITICAL',
        correspondanceId: c._id,
        date: c.responseDeadline
      }))
    ];

    // Trier par date
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        notifications: notifications.slice(0, parseInt(limit)),
        counts: {
          upcomingDeadlines: upcomingDeadlines.length,
          urgentCorrespondances: urgentCorrespondances.length,
          overdueCorrespondances: overdueCorrespondances.length
        }
      }
    });

  } catch (error) {
    console.error('❌ [DirectorRoutes] Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message
    });
  }
});

// POST /api/directors/fix-roles - Corriger les rôles des directeurs existants
router.post('/fix-roles', auth, async (req, res) => {
  try {
    console.log('🔧 [API] Correction des rôles des directeurs...');
    
    const roleMapping = {
      'DIRECTEUR_TECHNIQUE': { role: 'DIRECTEUR', directorate: 'TECHNIQUE' },
      'DIRECTEUR_COMMERCIAL': { role: 'DIRECTEUR', directorate: 'COMMERCIAL' },
      'DIRECTEUR_FINANCIER': { role: 'DIRECTEUR', directorate: 'FINANCIER' },
      'DIRECTEUR_OPERATIONS': { role: 'DIRECTEUR', directorate: 'OPERATIONS' },
      'DIRECTEUR_RH': { role: 'SOUS_DIRECTEUR', directorate: 'RH' }
    };
    
    let updated = 0;
    const results = [];
    
    for (const [oldRole, newData] of Object.entries(roleMapping)) {
      const result = await User.updateMany(
        { role: oldRole },
        { 
          $set: { 
            role: newData.role,
            directorate: newData.directorate,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ [FIX] ${result.modifiedCount} utilisateur(s) mis à jour: ${oldRole} → ${newData.role}`);
        updated += result.modifiedCount;
        results.push({
          oldRole,
          newRole: newData.role,
          directorate: newData.directorate,
          count: result.modifiedCount
        });
      }
    }
    
    res.json({
      success: true,
      message: `${updated} rôle(s) corrigé(s) avec succès`,
      data: {
        totalUpdated: updated,
        details: results
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur correction des rôles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la correction des rôles',
      error: error.message
    });
  }
});

module.exports = router;
