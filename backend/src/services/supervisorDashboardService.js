const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const { differenceInDays, differenceInHours, addDays, isAfter, isBefore } = require('date-fns');

/**
 * Service pour le dashboard du superviseur bureau d'ordre
 */
class SupervisorDashboardService {
  
  /**
   * Récupère toutes les données du dashboard superviseur
   */
  async getDashboardData(supervisorId, timeframe = 'week') {
    try {
      const supervisor = await User.findById(supervisorId);
      if (!supervisor || !supervisor.isSuperviseurBureauOrdre()) {
        throw new Error('Accès réservé aux superviseurs de bureau d\'ordre');
      }

      // Définir la période selon le timeframe
      const dateRange = this.getDateRange(timeframe);
      
      // Récupérer toutes les correspondances dans la période
      // CORRECTION: Inclure aussi les correspondances plus anciennes qui sont encore actives
      const correspondances = await Correspondance.find({
        $or: [
          // Correspondances créées dans la période
          { createdAt: { $gte: dateRange.start, $lte: dateRange.end } },
          // Correspondances plus anciennes mais encore en attente ou récemment mises à jour
          { 
            status: { $in: ['PENDING', 'REPLIED'] },
            updatedAt: { $gte: dateRange.start }
          },
          // Correspondances avec des échéances dans la période
          {
            response_deadline: { $gte: dateRange.start, $lte: dateRange.end }
          }
        ]
      }).populate('authorId', 'firstName lastName email');

      // CORRECTION: Si aucune correspondance trouvée dans la période, récupérer toutes les correspondances
      let allCorrespondances = correspondances;
      if (correspondances.length === 0) {
        console.log('⚠️ Aucune correspondance trouvée dans la période, récupération de toutes les correspondances...');
        allCorrespondances = await Correspondance.find({})
          .populate('authorId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(50); // Limiter à 50 pour éviter la surcharge
        
        console.log(`📊 Total correspondances récupérées: ${allCorrespondances.length}`);
      }

      // Calculer les statistiques
      const stats = await this.calculateStatistics(allCorrespondances);
      
      // Analyser les échéances
      const deadlineAnalysis = await this.analyzeDeadlines(allCorrespondances);
      
      // Récupérer les correspondances validées pour réponse
      const validatedForResponse = await this.getValidatedCorrespondances();
      
      // Statistiques par aéroport
      const airportStats = await this.getAirportStatistics(allCorrespondances);
      
      // Tendances hebdomadaires
      const weeklyTrends = await this.getWeeklyTrends(dateRange);

      return {
        // Statistiques générales
        totalCorrespondances: stats.total,
        pendingCorrespondances: stats.pending,
        repliedCorrespondances: stats.replied,
        overdueCorrespondances: stats.overdue,
        responseRate: stats.responseRate,
        averageResponseTime: stats.averageResponseTime,

        // Échéances et alertes
        criticalDeadlines: deadlineAnalysis.critical,
        upcomingDeadlines: deadlineAnalysis.upcoming,
        overdueItems: deadlineAnalysis.overdue,

        // Correspondances validées
        validatedForResponse,

        // Répartition par priorité
        priorityBreakdown: stats.priorityBreakdown,

        // Statistiques par aéroport
        airportStats,

        // Tendances
        weeklyTrends,

        // Métadonnées
        lastUpdated: new Date(),
        timeframe,
        dateRange
      };

    } catch (error) {
      console.error('Erreur getDashboardData:', error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques générales
   */
  async calculateStatistics(correspondances) {
    const total = correspondances.length;
    const pending = correspondances.filter(c => c.status === 'PENDING').length;
    const replied = correspondances.filter(c => c.status === 'REPLIED').length;
    const informatif = correspondances.filter(c => c.status === 'INFORMATIF').length;

    // Correspondances en retard (deadline dépassée)
    const now = new Date();
    const overdue = correspondances.filter(c => 
      c.response_deadline && 
      isAfter(now, new Date(c.response_deadline)) && 
      c.status === 'PENDING'
    ).length;

    // Taux de réponse
    const responseRate = total > 0 ? Math.round((replied / total) * 100) : 0;

    // Temps de réponse moyen (en jours)
    const respondedCorrespondances = correspondances.filter(c => 
      c.status === 'REPLIED' && c.response_date && c.date_correspondance
    );
    
    let averageResponseTime = 0;
    if (respondedCorrespondances.length > 0) {
      const totalResponseTime = respondedCorrespondances.reduce((sum, c) => {
        const responseTime = differenceInDays(
          new Date(c.response_date), 
          new Date(c.date_correspondance)
        );
        return sum + responseTime;
      }, 0);
      averageResponseTime = Math.round(totalResponseTime / respondedCorrespondances.length);
    }

    // Répartition par priorité
    const priorityBreakdown = {
      URGENT: correspondances.filter(c => c.priority === 'URGENT').length,
      HIGH: correspondances.filter(c => c.priority === 'HIGH').length,
      MEDIUM: correspondances.filter(c => c.priority === 'MEDIUM').length,
      LOW: correspondances.filter(c => c.priority === 'LOW').length
    };

    return {
      total,
      pending,
      replied,
      informatif,
      overdue,
      responseRate,
      averageResponseTime,
      priorityBreakdown
    };
  }

  /**
   * Analyse les échéances et génère les alertes
   */
  async analyzeDeadlines(correspondances) {
    const now = new Date();
    const critical = [];
    const upcoming = [];
    const overdue = [];

    // Paramètres d'échéances par priorité (configurables via settings)
    const deadlineParams = await this.getDeadlineParameters();

    for (const corresp of correspondances) {
      if (corresp.status !== 'PENDING' || !corresp.response_deadline) continue;

      const deadline = new Date(corresp.response_deadline);
      const daysRemaining = differenceInDays(deadline, now);
      const hoursRemaining = differenceInHours(deadline, now);

      // Correspondance en retard
      if (isAfter(now, deadline)) {
        const daysOverdue = Math.abs(daysRemaining);
        overdue.push({
          id: corresp._id,
          correspondanceId: corresp._id,
          title: corresp.title,
          priority: corresp.priority,
          airport: corresp.airport,
          deadline: deadline.toISOString(),
          daysOverdue,
          assignedTo: [], // À implémenter selon votre logique d'assignation
          lastReminderSent: corresp.lastReminderSent || null
        });
        continue;
      }

      // Déterminer le niveau d'alerte selon la priorité
      const params = deadlineParams[corresp.priority] || deadlineParams.MEDIUM;
      let alertStatus = 'INFO';

      if (daysRemaining <= params.criticalThreshold) {
        alertStatus = 'CRITICAL';
      } else if (daysRemaining <= params.warningThreshold) {
        alertStatus = 'WARNING';
      }

      const alert = {
        id: corresp._id,
        correspondanceId: corresp._id,
        title: corresp.title,
        subject: corresp.subject,
        priority: corresp.priority,
        airport: corresp.airport,
        deadline: deadline.toISOString(),
        daysRemaining: Math.max(0, daysRemaining),
        hoursRemaining: Math.max(0, hoursRemaining),
        status: alertStatus,
        assignedTo: [], // À implémenter
        createdAt: corresp.createdAt
      };

      if (alertStatus === 'CRITICAL') {
        critical.push(alert);
      } else if (alertStatus === 'WARNING' || daysRemaining <= 7) {
        upcoming.push(alert);
      }
    }

    // Trier par urgence
    critical.sort((a, b) => a.daysRemaining - b.daysRemaining);
    upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return { critical, upcoming, overdue };
  }

  /**
   * Récupère les correspondances validées par le DG pour réponse finale
   */
  async getValidatedCorrespondances() {
    try {
      console.log('🔍 [SupervisorDashboard] Recherche des correspondances approuvées par le DG...');
      
      // Correspondances approuvées par le DG et prêtes pour finalisation
      const validated = await Correspondance.find({
        workflowStatus: 'DG_APPROVED', // Nouveau statut workflow
        status: 'PENDING'
      })
      .populate('authorId', 'firstName lastName')
      .populate('personnesConcernees', 'firstName lastName role')
      .sort({ updatedAt: -1 })
      .limit(10);

      console.log(`✅ [SupervisorDashboard] ${validated.length} correspondances approuvées trouvées`);

      return validated.map(corresp => {
        // Récupérer les informations du DG qui a approuvé
        const dgFeedback = corresp.responseDrafts?.[0]?.dgFeedbacks?.find(f => f.action === 'APPROVE');
        const dgName = dgFeedback?.dgName || 'Directeur Général';
        const approvalDate = dgFeedback?.createdAt || corresp.updatedAt;
        const dgComments = dgFeedback?.feedback || 'Approuvé par le DG';

        return {
          id: corresp._id.toString(),
          correspondanceId: corresp._id.toString(),
          title: corresp.title,
          subject: corresp.subject,
          priority: corresp.priority,
          airport: corresp.airport,
          validatedAt: approvalDate?.toISOString(),
          validatedBy: dgName,
          directorComments: dgComments,
          deadline: corresp.response_deadline?.toISOString(),
          responseRequired: true,
          urgencyLevel: this.calculateUrgencyLevel(corresp)
        };
      });

    } catch (error) {
      console.error('❌ [SupervisorDashboard] Erreur getValidatedCorrespondances:', error);
      return [];
    }
  }

  /**
   * Calcule les statistiques par aéroport
   */
  async getAirportStatistics(correspondances) {
    const airports = ['ENFIDHA', 'MONASTIR', 'GENERALE'];
    const stats = [];

    for (const airport of airports) {
      const airportCorrespondances = correspondances.filter(c => c.airport === airport);
      const total = airportCorrespondances.length;
      const responded = airportCorrespondances.filter(c => c.status === 'REPLIED').length;
      const pending = airportCorrespondances.filter(c => c.status === 'PENDING').length;
      const overdue = airportCorrespondances.filter(c => 
        c.response_deadline && 
        isAfter(new Date(), new Date(c.response_deadline)) && 
        c.status === 'PENDING'
      ).length;

      const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

      stats.push({
        airport,
        total,
        responded,
        pending,
        overdue,
        responseRate
      });
    }

    return stats;
  }

  /**
   * Récupère les tendances hebdomadaires
   */
  async getWeeklyTrends(dateRange) {
    // Implémentation simplifiée - à améliorer selon vos besoins
    const trends = [];
    const days = 7;

    for (let i = 0; i < days; i++) {
      const date = addDays(dateRange.start, i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayCorrespondances = await Correspondance.find({
        createdAt: { $gte: dayStart, $lte: dayEnd }
      });

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        created: dayCorrespondances.length,
        responded: dayCorrespondances.filter(c => c.status === 'REPLIED').length,
        overdue: dayCorrespondances.filter(c => 
          c.response_deadline && 
          isAfter(new Date(), new Date(c.response_deadline)) && 
          c.status === 'PENDING'
        ).length
      });
    }

    return trends;
  }

  /**
   * Définit la plage de dates selon le timeframe
   */
  getDateRange(timeframe) {
    const now = new Date();
    let start, end = now;

    switch (timeframe) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = addDays(now, -7);
        break;
      case 'month':
        start = addDays(now, -30);
        break;
      default:
        start = addDays(now, -7);
    }

    return { start, end };
  }

  /**
   * Récupère les paramètres d'échéances (à implémenter avec les settings)
   */
  async getDeadlineParameters() {
    // Paramètres par défaut - à remplacer par les settings de la base
    return {
      URGENT: { criticalThreshold: 0.5, warningThreshold: 1 }, // 12h, 1j
      HIGH: { criticalThreshold: 1, warningThreshold: 2 },     // 1j, 2j
      MEDIUM: { criticalThreshold: 2, warningThreshold: 5 },   // 2j, 5j
      LOW: { criticalThreshold: 5, warningThreshold: 10 }      // 5j, 10j
    };
  }

  /**
   * Calcule le niveau d'urgence d'une correspondance
   */
  calculateUrgencyLevel(correspondance) {
    let urgency = 1;

    // Facteur priorité
    switch (correspondance.priority) {
      case 'URGENT': urgency += 4; break;
      case 'HIGH': urgency += 3; break;
      case 'MEDIUM': urgency += 2; break;
      case 'LOW': urgency += 1; break;
    }

    // Facteur échéance
    if (correspondance.response_deadline) {
      const daysRemaining = differenceInDays(new Date(correspondance.response_deadline), new Date());
      if (daysRemaining <= 1) urgency += 3;
      else if (daysRemaining <= 3) urgency += 2;
      else if (daysRemaining <= 7) urgency += 1;
    }

    // Facteur validation directeur
    if (correspondance.directorValidation === 'APPROVED') {
      urgency += 2;
    }

    return Math.min(urgency, 10); // Max 10
  }
}

module.exports = new SupervisorDashboardService();
