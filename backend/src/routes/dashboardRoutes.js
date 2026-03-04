 const { Router } = require('express');
const Document = require('../models/Document.js');
const User = require('../models/User.js');
const Action = require('../models/Action.js');
const Correspondance = require('../models/Correspondance.js'); // Import Correspondance model
const ActivityLog = require('../models/ActivityLog.js');

const router = Router();

// Helper to get dates for the last N months
const getLastNMonthsDates = (n) => {
  const dates = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    dates.push({
      yearMonth: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      monthName: date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
    });
  }
  return dates;
};

// Helper to get correspondences by status statistics
const getCorrespondencesByStatusStats = async (filter) => {
  try {
    const statusStats = await Correspondance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCorrespondences = statusStats.reduce((sum, stat) => sum + stat.count, 0);
    
    return statusStats.map(stat => ({
      status: stat._id || 'UNKNOWN',
      count: stat.count,
      percentage: totalCorrespondences > 0 ? (stat.count / totalCorrespondences) * 100 : 0
    }));
  } catch (error) {
    console.error('Error getting correspondences by status stats:', error);
    return [];
  }
};

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const { userId, userRole } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let documentFilter = {};
    let actionFilter = {};
    let correspondanceFilter = {}; // New filter for correspondences

    let calculatedActiveUsers = 0;
    let calculatedCompletedActions = 0;
    let calculatedPendingActions = 0;
    let calculatedAverageCompletionTime = 0;

    // Apply specific filters for 'AGENT_BUREAU_ORDRE' role
    if (userRole === 'AGENT_BUREAU_ORDRE') {
      documentFilter = {
        $or: [
          { type: 'FORMULAIRE_DOC' }, // Agent can create/view forms
          { type: 'QUALITE_DOC' },
          { type: 'NOUVEAU_DOC' },
          { type: 'GENERAL' },
          { type: 'TEMPLATE' },
          { authorId: userId } // Documents authored by the agent
        ]
      };
      actionFilter = { assignedTo: userId };
      correspondanceFilter = {
        $or: [
          { fromAddress: userId }, // Assuming userId can be an email or a user ID that matches fromAddress/toAddress
          { toAddress: userId },
          { authorId: userId } // If Correspondance also has an authorId
        ]
      };
      calculatedActiveUsers = 0; // Not relevant for this role
    } else {
      // Default filters for other roles (global view)
      documentFilter = {};
      actionFilter = {};
      correspondanceFilter = {};
      calculatedActiveUsers = await User.countDocuments({ isActive: true });
    }

    // Activity logs should always show all recent activity for the dashboard, regardless of role
    // This ensures the "Recent Activity" section provides a global overview.
    const activityLogFilter = {}; 

    const [
      totalDocumentsCount,
      completedActionsCount,
      pendingActionsCount,
      documentsThisMonthCount,
      recentDocuments,
      recentCorrespondences, // Nouvelle ligne pour les correspondances récentes
      urgentActions,
      activityLogs,
      completedActionsForAvgTime,
      documentsCreatedMonthlyRaw, // New: for chart
      documentsByTypeStatsRaw,    // New: for chart
      correspondencesCreatedMonthlyRaw, // New: for chart
      correspondencesByTypeStatsRaw,    // New: for chart
      correspondencesByPriorityStatsRaw // New: for chart
    ] = await Promise.all([
      Document.countDocuments(documentFilter),
      Action.countDocuments({ ...actionFilter, status: 'COMPLETED' }),
      Action.countDocuments({ ...actionFilter, status: 'PENDING' }),
      Document.countDocuments({ createdAt: { $gte: startOfMonth }, ...documentFilter }),
      Document.find(documentFilter).sort({ createdAt: -1 }).limit(3).populate('author', 'firstName lastName'),
      Correspondance.find(correspondanceFilter).sort({ createdAt: -1 }).limit(3).populate('authorId', 'firstName lastName'), // Nouvelle ligne
      Action.find({ ...actionFilter, priority: 'URGENT', status: { $ne: 'COMPLETED' } }).sort({ dueDate: 1 }).limit(3).populate('assignedTo', 'firstName lastName'),
      ActivityLog.find(activityLogFilter).sort({ timestamp: -1 }).limit(4).populate('userId', 'firstName lastName'),
      Action.find({ ...actionFilter, status: 'COMPLETED', actualHours: { $exists: true, $ne: null } }),

      // New aggregation queries for charts
      Document.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, ...documentFilter } }, // Last 6 months
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      Document.aggregate([
        { $match: documentFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      Correspondance.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, ...correspondanceFilter } }, // Last 6 months
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
      Correspondance.aggregate([
        { $match: correspondanceFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      Correspondance.aggregate([
        { $match: correspondanceFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);

    calculatedCompletedActions = completedActionsCount;
    calculatedPendingActions = pendingActionsCount;

    calculatedAverageCompletionTime = completedActionsForAvgTime.length > 0
      ? completedActionsForAvgTime.reduce((acc, action) => acc + (action.actualHours || 0), 0) / completedActionsForAvgTime.length
      : 0;

    const formattedRecentDocuments = recentDocuments.map(doc => ({
      id: doc._id,
      title: doc.title,
      type: doc.type,
      airport: doc.airport,
      status: doc.status,
      created_at: doc.createdAt.toISOString(),
      author: doc.author ? {
        first_name: doc.author.firstName,
        last_name: doc.author.lastName,
      } : null,
    }));

    const formattedRecentCorrespondences = recentCorrespondences.map(correspondance => ({
      id: correspondance._id,
      title: correspondance.title,
      type: correspondance.type,
      status: correspondance.status,
      airport: correspondance.airport,
      created_at: correspondance.createdAt.toISOString(),
      createdBy: correspondance.authorId ? {
        first_name: correspondance.authorId.firstName,
        last_name: correspondance.authorId.lastName,
      } : null,
    }));

    const formattedUrgentActions = urgentActions.map(action => ({
      id: action._id,
      title: action.title,
      priority: action.priority,
      due_date: action.dueDate.toISOString(),
      assigned_to: action.assignedTo.map(user => `${user.firstName} ${user.lastName}`),
    }));

    const formattedActivityLogs = activityLogs.map(log => ({
      id: log._id,
      type: log.action,
      title: log.action.replace(/_/g, ' ').toUpperCase(),
      description: log.details,
      user: log.userId ? {
        name: `${log.userId.firstName} ${log.userId.lastName}`,
        initials: `${log.userId.firstName?.[0] || ''}${log.userId.lastName?.[0] || ''}`,
      } : { name: 'Utilisateur Inconnu', initials: 'UI' },
      timestamp: log.timestamp.toISOString(),
      priority: 'medium',
    }));

    // Format data for charts
    const last6Months = getLastNMonthsDates(6);

    const documentsCreatedMonthly = last6Months.map(month => {
      const found = documentsCreatedMonthlyRaw.find(d => d._id.year === new Date(month.yearMonth).getFullYear() && d._id.month === new Date(month.yearMonth).getMonth() + 1);
      return { name: month.monthName, count: found ? found.count : 0 };
    });

    const documentsByTypeStats = documentsByTypeStatsRaw.map(d => ({ name: d._id, value: d.count }));

    const correspondencesCreatedMonthly = last6Months.map(month => {
      const found = correspondencesCreatedMonthlyRaw.find(d => d._id.year === new Date(month.yearMonth).getFullYear() && d._id.month === new Date(month.yearMonth).getMonth() + 1);
      return { name: month.monthName, count: found ? found.count : 0 };
    });

    const correspondencesByTypeStats = correspondencesByTypeStatsRaw.map(d => ({ name: d._id, value: d.count }));
    const correspondencesByPriorityStats = correspondencesByPriorityStatsRaw.map(d => ({ name: d._id, value: d.count }));

    // Calcul des statistiques spécifiques aux correspondances pour tous les rôles
    const [
      totalCorrespondencesCount,
      pendingCorrespondencesCount,
      repliedCorrespondencesCount,
      informativeCorrespondencesCount,
      // Calculs pour les progressions mensuelles
      totalCorrespondencesLastMonth,
      pendingCorrespondencesLastMonth,
      repliedCorrespondencesLastMonth,
      informativeCorrespondencesLastMonth
    ] = await Promise.all([
      Correspondance.countDocuments(correspondanceFilter),
      Correspondance.countDocuments({ ...correspondanceFilter, status: 'PENDING' }),
      Correspondance.countDocuments({ ...correspondanceFilter, status: 'REPLIED' }),
      Correspondance.countDocuments({ ...correspondanceFilter, status: 'INFORMATIF' }),
      // Comptes du mois dernier pour calculer les progressions
      Correspondance.countDocuments({ 
        ...correspondanceFilter, 
        createdAt: { 
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          $lt: startOfMonth
        }
      }),
      Correspondance.countDocuments({ 
        ...correspondanceFilter, 
        status: 'PENDING',
        createdAt: { 
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          $lt: startOfMonth
        }
      }),
      Correspondance.countDocuments({ 
        ...correspondanceFilter, 
        status: 'REPLIED',
        createdAt: { 
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          $lt: startOfMonth
        }
      }),
      Correspondance.countDocuments({ 
        ...correspondanceFilter, 
        status: 'INFORMATIF',
        createdAt: { 
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          $lt: startOfMonth
        }
      })
    ]);

    // Calcul des progressions réelles
    const calculateProgress = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const progress = ((current - previous) / previous) * 100;
      return `${progress >= 0 ? '+' : ''}${progress.toFixed(1)}%`;
    };

    const totalCorrespondences = totalCorrespondencesCount;
    const pendingCorrespondences = pendingCorrespondencesCount;
    const repliedCorrespondences = repliedCorrespondencesCount;
    const informativeCorrespondences = informativeCorrespondencesCount;

    // Progressions calculées
    const totalCorrespondencesProgress = calculateProgress(totalCorrespondencesCount, totalCorrespondencesLastMonth);
    const pendingCorrespondencesProgress = calculateProgress(pendingCorrespondencesCount, pendingCorrespondencesLastMonth);
    const repliedCorrespondencesProgress = calculateProgress(repliedCorrespondencesCount, repliedCorrespondencesLastMonth);
    const informativeCorrespondencesProgress = calculateProgress(informativeCorrespondencesCount, informativeCorrespondencesLastMonth);

    res.json({
      totalDocuments: totalDocumentsCount,
      activeUsers: calculatedActiveUsers,
      completedActions: calculatedCompletedActions,
      pendingActions: calculatedPendingActions,
      documentsThisMonth: documentsThisMonthCount,
      averageCompletionTime: parseFloat(calculatedAverageCompletionTime.toFixed(1)),
      recentDocuments: formattedRecentDocuments,
      recentCorrespondences: formattedRecentCorrespondences, // Nouvelle ligne
      urgentActions: formattedUrgentActions,
      activityLogs: formattedActivityLogs,
      documentsCreatedMonthly, // New
      documentsByTypeStats,    // New
      correspondencesCreatedMonthly, // New
      correspondencesByTypeStats,    // New
      correspondencesByPriorityStats, // New
      correspondencesByStatusStats: await getCorrespondencesByStatusStats(correspondanceFilter), // New
      // Nouvelles données pour les agents de bureau d'ordre
      totalCorrespondences,
      pendingCorrespondences,
      repliedCorrespondences,
      informativeCorrespondences,
      // Progressions calculées
      totalCorrespondencesProgress,
      pendingCorrespondencesProgress,
      repliedCorrespondencesProgress,
      informativeCorrespondencesProgress
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

module.exports = router;