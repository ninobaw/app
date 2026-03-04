const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const { differenceInDays, differenceInHours, addDays, isAfter, isBefore, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

/**
 * Service pour le dashboard et les fonctionnalités du Directeur Général
 */
class DirectorGeneralService {
  
  /**
   * Récupère toutes les données du dashboard stratégique du DG
   */
  async getDashboardData(directorGeneralId, timeframe = 'month') {
    try {
      console.log(`🔄 DirectorGeneralService.getDashboardData - DG: ${directorGeneralId}, Timeframe: ${timeframe}`);
      
      const director = await User.findById(directorGeneralId);
      if (!director || director.role !== 'DIRECTEUR_GENERAL') {
        throw new Error('Accès réservé au Directeur Général');
      }

      // Définir la période selon le timeframe
      const dateRange = this.getDateRange(timeframe);
      
      // Récupérer toutes les correspondances (vue stratégique globale)
      const allCorrespondances = await Correspondance.find({})
        .populate('authorId', 'firstName lastName email directorate department')
        .sort({ createdAt: -1 });

      console.log(`📊 Total correspondances trouvées: ${allCorrespondances.length}`);

      // Correspondances de la période
      const periodCorrespondances = allCorrespondances.filter(c => 
        c.createdAt >= dateRange.start && c.createdAt <= dateRange.end
      );

      // Calculer les métriques stratégiques
      const metrics = await this.calculateStrategicMetrics(allCorrespondances, periodCorrespondances, dateRange);
      
      // Analyser les performances par département
      const departmentPerformance = await this.analyzeDepartmentPerformance(allCorrespondances);
      
      // Identifier les correspondances critiques
      const criticalCorrespondances = await this.getCriticalCorrespondances(allCorrespondances);
      
      // Analyser les tendances
      const weeklyTrends = await this.getWeeklyTrends(dateRange);
      
      // Répartitions par type et priorité
      const typeDistribution = this.getTypeDistribution(allCorrespondances);
      const priorityDistribution = this.getPriorityDistribution(allCorrespondances);

      // Métriques de leadership
      const teamPerformance = await this.getTeamPerformance();

      const dashboardData = {
        // Vue d'ensemble stratégique
        totalCorrespondances: allCorrespondances.length,
        correspondancesThisMonth: periodCorrespondances.length,
        monthlyGrowth: this.calculateGrowthRate(allCorrespondances, dateRange),
        
        // Workflow de traitement
        pendingApproval: await this.getPendingDraftsCount(directorGeneralId),
        awaitingResponse: allCorrespondances.filter(c => c.status === 'PENDING').length,
        completedThisWeek: metrics.completedThisWeek,
        overdueItems: metrics.overdueItems,
        
        // Performance organisationnelle
        averageResponseTime: metrics.averageResponseTime,
        responseRate: metrics.responseRate,
        departmentPerformance,
        
        // Alertes stratégiques
        criticalCorrespondances,
        
        // Tendances et analyses
        weeklyTrends,
        typeDistribution,
        priorityDistribution,
        
        // Métriques de leadership
        teamPerformance,

        // Métadonnées
        lastUpdated: new Date(),
        timeframe,
        dateRange
      };

      console.log('✅ DirectorGeneralService.getDashboardData - Données calculées');
      return dashboardData;

    } catch (error) {
      console.error('❌ Erreur DirectorGeneralService.getDashboardData:', error);
      throw error;
    }
  }

  /**
   * Calcule les métriques stratégiques
   */
  async calculateStrategicMetrics(allCorrespondances, periodCorrespondances, dateRange) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Correspondances complétées cette semaine
    const completedThisWeek = allCorrespondances.filter(c => 
      c.status === 'REPLIED' && 
      c.updatedAt >= oneWeekAgo
    ).length;

    // Correspondances en retard
    const overdueItems = allCorrespondances.filter(c => 
      c.response_deadline && 
      isAfter(now, new Date(c.response_deadline)) && 
      c.status === 'PENDING'
    ).length;

    // Taux de réponse global
    const totalWithDeadline = allCorrespondances.filter(c => c.response_deadline).length;
    const totalReplied = allCorrespondances.filter(c => c.status === 'REPLIED').length;
    const responseRate = totalWithDeadline > 0 ? Math.round((totalReplied / totalWithDeadline) * 100) : 0;

    // Temps de réponse moyen
    const repliedCorrespondances = allCorrespondances.filter(c => 
      c.status === 'REPLIED' && c.createdAt && c.updatedAt
    );
    
    let averageResponseTime = 0;
    if (repliedCorrespondances.length > 0) {
      const totalResponseTime = repliedCorrespondances.reduce((sum, c) => {
        return sum + differenceInDays(new Date(c.updatedAt), new Date(c.createdAt));
      }, 0);
      averageResponseTime = Math.round((totalResponseTime / repliedCorrespondances.length) * 10) / 10;
    }

    return {
      completedThisWeek,
      overdueItems,
      responseRate,
      averageResponseTime
    };
  }

  /**
   * Analyse les performances par département
   */
  async analyzeDepartmentPerformance(correspondances) {
    const departmentStats = {};

    // Grouper par département de l'auteur
    correspondances.forEach(c => {
      const dept = c.authorId?.department || c.authorId?.directorate || 'Non assigné';
      
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          total: 0,
          completed: 0,
          totalResponseTime: 0,
          respondedCount: 0
        };
      }

      departmentStats[dept].total++;
      
      if (c.status === 'REPLIED') {
        departmentStats[dept].completed++;
        
        if (c.createdAt && c.updatedAt) {
          const responseTime = differenceInDays(new Date(c.updatedAt), new Date(c.createdAt));
          departmentStats[dept].totalResponseTime += responseTime;
          departmentStats[dept].respondedCount++;
        }
      }
    });

    // Convertir en tableau avec calculs
    return Object.values(departmentStats)
      .filter(dept => dept.total > 0)
      .map(dept => ({
        department: dept.department,
        total: dept.total,
        completed: dept.completed,
        responseRate: Math.round((dept.completed / dept.total) * 100),
        avgTime: dept.respondedCount > 0 ? 
          Math.round((dept.totalResponseTime / dept.respondedCount) * 10) / 10 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5 départements
  }

  /**
   * Identifie les correspondances critiques nécessitant l'attention du DG
   */
  async getCriticalCorrespondances(correspondances) {
    const now = new Date();
    
    const critical = correspondances
      .filter(c => {
        // Critères de criticité pour le DG
        const isUrgent = c.priority === 'URGENT';
        const isOverdue = c.response_deadline && isAfter(now, new Date(c.response_deadline));
        const isPending = c.status === 'PENDING';
        const isHighPriority = c.priority === 'HIGH';
        
        return isPending && (isUrgent || (isOverdue && isHighPriority));
      })
      .map(c => {
        const daysOverdue = c.response_deadline ? 
          Math.max(0, differenceInDays(now, new Date(c.response_deadline))) : 0;
        
        return {
          id: c._id,
          subject: c.subject || c.title || 'Sans objet',
          from: c.from_address || 'Expéditeur inconnu',
          priority: c.priority,
          daysOverdue,
          assignedTo: c.authorId?.department || c.authorId?.directorate || 'Non assigné'
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 5); // Top 5 critiques

    return critical;
  }

  /**
   * Analyse les tendances hebdomadaires
   */
  async getWeeklyTrends(dateRange) {
    const weeks = [];
    const currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      
      const weekCorrespondances = await Correspondance.find({
        createdAt: { $gte: weekStart, $lte: weekEnd }
      });

      const incoming = weekCorrespondances.length;
      const processed = weekCorrespondances.filter(c => c.status === 'REPLIED').length;
      const pending = incoming - processed;

      weeks.push({
        week: `S${Math.ceil(currentDate.getDate() / 7)}`,
        incoming,
        processed,
        pending
      });

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks.slice(-4); // 4 dernières semaines
  }

  /**
   * Calcule la répartition par type
   */
  getTypeDistribution(correspondances) {
    const typeStats = {};
    const total = correspondances.length;

    correspondances.forEach(c => {
      const type = c.type || 'Non spécifié';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    return Object.entries(typeStats).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  /**
   * Calcule la répartition par priorité
   */
  getPriorityDistribution(correspondances) {
    const priorityStats = {};
    const total = correspondances.length;

    correspondances.forEach(c => {
      const priority = c.priority || 'MEDIUM';
      priorityStats[priority] = (priorityStats[priority] || 0) + 1;
    });

    return Object.entries(priorityStats).map(([priority, count]) => ({
      priority,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  /**
   * Métriques de performance de l'équipe
   */
  async getTeamPerformance() {
    const directors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] },
      isActive: true 
    });

    const totalDirectors = directors.length;
    const activeDirectors = directors.filter(d => 
      d.lastLogin && differenceInDays(new Date(), new Date(d.lastLogin)) <= 7
    ).length;

    const departmentsWithDirectors = new Set(directors.map(d => d.directorate).filter(Boolean));
    const departmentCoverage = Math.round((departmentsWithDirectors.size / 6) * 100); // 6 départements possibles

    return {
      totalDirectors,
      activeDirectors,
      departmentCoverage
    };
  }

  /**
   * Calcule le taux de croissance
   */
  calculateGrowthRate(correspondances, dateRange) {
    const currentPeriod = correspondances.filter(c => 
      c.createdAt >= dateRange.start && c.createdAt <= dateRange.end
    ).length;

    const previousStart = new Date(dateRange.start);
    previousStart.setMonth(previousStart.getMonth() - 1);
    const previousEnd = new Date(dateRange.end);
    previousEnd.setMonth(previousEnd.getMonth() - 1);

    const previousPeriod = correspondances.filter(c => 
      c.createdAt >= previousStart && c.createdAt <= previousEnd
    ).length;

    if (previousPeriod === 0) return 0;
    return Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
  }

  /**
   * Définit la plage de dates selon le timeframe
   */
  getDateRange(timeframe) {
    const now = new Date();
    let start, end;

    switch (timeframe) {
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
        break;
      case 'month':
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
    }

    return { start, end };
  }

  /**
   * Approuve ou rejette une correspondance
   */
  async approveCorrespondance(correspondanceId, directorGeneralId, decision, comments) {
    const correspondance = await Correspondance.findById(correspondanceId);
    if (!correspondance) {
      throw new Error('Correspondance non trouvée');
    }

    // Logique d'approbation spécifique au DG
    correspondance.directorGeneralApproval = {
      decision,
      approvedBy: directorGeneralId,
      approvedAt: new Date(),
      comments
    };

    if (decision === 'approve') {
      correspondance.status = 'APPROVED';
    } else {
      correspondance.status = 'REJECTED';
    }

    await correspondance.save();
    return correspondance;
  }

  /**
   * Autres méthodes pour les fonctionnalités DG...
   */
  async getDepartmentReport(department, period) {
    // Implémentation du rapport de département
    return { department, period, data: 'Mock data' };
  }

  async getStrategicReport(type) {
    // Implémentation du rapport stratégique
    return { type, data: 'Mock strategic report' };
  }

  async escalateCorrespondance(correspondanceId, directorGeneralId, targetDepartment, priority) {
    // Implémentation de l'escalade
    return { correspondanceId, targetDepartment, priority };
  }

  async getStrategicNotifications(directorGeneralId) {
    // Implémentation des notifications stratégiques
    return [];
  }

  async getPerformanceOverview(period) {
    // Implémentation de la vue d'ensemble des performances
    return { period, data: 'Mock performance data' };
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Compter les vrais drafts en attente d'approbation DG
   */
  async getPendingDraftsCount(directorGeneralId) {
    try {
      const DirectorGeneralWorkflowService = require('./directorGeneralWorkflowService');
      
      // Utiliser le service workflow pour récupérer les correspondances avec drafts
      const correspondancesWithDrafts = await DirectorGeneralWorkflowService.getPendingCorrespondances(directorGeneralId);
      
      // Compter tous les drafts PENDING_DG_REVIEW
      let pendingDraftsCount = 0;
      
      correspondancesWithDrafts.forEach(corresp => {
        if (corresp.responseDrafts && corresp.responseDrafts.length > 0) {
          const pendingDrafts = corresp.responseDrafts.filter(draft => 
            draft.status === 'PENDING_DG_REVIEW'
          );
          pendingDraftsCount += pendingDrafts.length;
        }
      });
      
      console.log(`📊 [DirectorGeneralService] Drafts en attente pour DG ${directorGeneralId}: ${pendingDraftsCount}`);
      
      return pendingDraftsCount;
    } catch (error) {
      console.error('❌ Erreur getPendingDraftsCount:', error);
      return 0; // Retourner 0 en cas d'erreur pour éviter de casser le dashboard
    }
  }
}

module.exports = new DirectorGeneralService();
