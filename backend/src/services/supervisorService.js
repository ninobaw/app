const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const EmailNotificationService = require('./emailNotificationService');

/**
 * Service pour l'agent superviseur du bureau d'ordre
 */
class SupervisorService {
  
  /**
   * Récupérer le dashboard de l'agent superviseur avec échéances
   * @param {string} supervisorId - ID de l'agent superviseur
   */
  static async getSupervisorDashboard(supervisorId) {
    try {
      console.log(`[SUPERVISOR] Récupération dashboard pour superviseur ${supervisorId}`);
      
      const supervisor = await User.findById(supervisorId);
      if (!supervisor || !supervisor.isSuperviseurBureauOrdre()) {
        throw new Error('Accès réservé aux superviseurs de bureau d\'ordre');
      }
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Correspondances en retard
      const overdueCorrespondances = await Correspondance.find({
        response_deadline: { $lt: now },
        status: { $in: ['PENDING', 'READY_TO_SEND'] }
      }).populate('authorId', 'firstName lastName email')
        .populate('personnesConcernees', 'firstName lastName email')
        .sort({ response_deadline: 1 });
      
      // Correspondances avec échéance dans les 24h
      const urgentCorrespondances = await Correspondance.find({
        response_deadline: { $gte: now, $lte: tomorrow },
        status: { $in: ['PENDING', 'READY_TO_SEND'] }
      }).populate('authorId', 'firstName lastName email')
        .populate('personnesConcernees', 'firstName lastName email')
        .sort({ response_deadline: 1 });
      
      // Correspondances en attente de validation directeur
      const pendingValidations = await Correspondance.find({
        directorValidation: 'PENDING',
        responseProposal: { $exists: true, $ne: '' }
      }).populate('responseProposalBy', 'firstName lastName email')
        .populate('authorId', 'firstName lastName email')
        .sort({ responseProposalDate: -1 });
      
      // Statistiques générales
      const stats = await this.getGeneralStats();
      
      return {
        overdueCorrespondances,
        urgentCorrespondances,
        pendingValidations,
        stats,
        dashboardGeneratedAt: new Date()
      };
      
    } catch (error) {
      console.error('[SUPERVISOR] Erreur lors de la récupération du dashboard:', error);
      throw error;
    }
  }
  
  /**
   * Envoyer un rappel manuel pour une correspondance
   * @param {string} supervisorId - ID de l'agent superviseur
   * @param {string} correspondanceId - ID de la correspondance
   * @param {Array} userIds - IDs des utilisateurs à rappeler
   * @param {string} message - Message personnalisé du rappel
   */
  static async sendManualReminder(supervisorId, correspondanceId, userIds, message = '') {
    try {
      console.log(`[SUPERVISOR] Envoi rappel manuel pour correspondance ${correspondanceId}`);
      
      const supervisor = await User.findById(supervisorId);
      if (!supervisor || !supervisor.isSuperviseurBureauOrdre()) {
        throw new Error('Accès réservé aux superviseurs de bureau d\'ordre');
      }
      
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }
      
      // Ajouter le rappel à l'historique
      const reminder = {
        date: new Date(),
        sentBy: supervisorId,
        sentTo: userIds,
        type: 'MANUAL_REMINDER'
      };
      
      await Correspondance.findByIdAndUpdate(correspondanceId, {
        $push: { remindersSent: reminder },
        lastReminderDate: new Date(),
        updatedAt: new Date()
      });
      
      // Envoyer les notifications
      await NotificationService.sendCorrespondanceNotification(
        correspondance,
        userIds,
        'MANUAL_REMINDER',
        message
      );
      
      await EmailNotificationService.sendCorrespondanceEmailNotification(
        correspondance,
        userIds,
        'MANUAL_REMINDER',
        message
      );
      
      console.log(`[SUPERVISOR] Rappel manuel envoyé à ${userIds.length} utilisateurs`);
      return { success: true, remindersSent: userIds.length };
      
    } catch (error) {
      console.error('[SUPERVISOR] Erreur lors de l\'envoi du rappel manuel:', error);
      throw error;
    }
  }
  
  /**
   * Marquer une correspondance comme en retard
   * @param {string} supervisorId - ID de l'agent superviseur
   * @param {string} correspondanceId - ID de la correspondance
   */
  static async markAsOverdue(supervisorId, correspondanceId) {
    try {
      console.log(`[SUPERVISOR] Marquage en retard pour correspondance ${correspondanceId}`);
      
      const supervisor = await User.findById(supervisorId);
      if (!supervisor || !supervisor.isSuperviseurBureauOrdre()) {
        throw new Error('Accès réservé aux superviseurs de bureau d\'ordre');
      }
      
      const correspondance = await Correspondance.findByIdAndUpdate(
        correspondanceId,
        {
          isOverdue: true,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('personnesConcernees', 'firstName lastName email');
      
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }
      
      // Notifier les personnes concernées du retard
      if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
        const userIds = correspondance.personnesConcernees.map(p => p._id);
        
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          userIds,
          'CORRESPONDANCE_OVERDUE'
        );
        
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          userIds,
          'CORRESPONDANCE_OVERDUE'
        );
      }
      
      console.log(`[SUPERVISOR] Correspondance marquée en retard`);
      return correspondance;
      
    } catch (error) {
      console.error('[SUPERVISOR] Erreur lors du marquage en retard:', error);
      throw error;
    }
  }
  
  /**
   * Générer un rapport personnalisé
   * @param {string} supervisorId - ID de l'agent superviseur
   * @param {Object} filters - Filtres pour le rapport
   */
  static async generateCustomReport(supervisorId, filters = {}) {
    try {
      console.log(`[SUPERVISOR] Génération rapport personnalisé`);
      
      const supervisor = await User.findById(supervisorId);
      if (!supervisor || !supervisor.isSuperviseurBureauOrdre()) {
        throw new Error('Accès réservé aux superviseurs de bureau d\'ordre');
      }
      
      const {
        startDate,
        endDate,
        airport,
        status,
        priority,
        includeOverdue = true,
        includeStats = true
      } = filters;
      
      // Construction du filtre
      let filter = {};
      
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (airport) filter.airport = airport;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      
      // Récupérer les correspondances
      const correspondances = await Correspondance.find(filter)
        .populate('authorId', 'firstName lastName email')
        .populate('personnesConcernees', 'firstName lastName email')
        .populate('responseProposalBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
      
      // Statistiques si demandées
      let stats = {};
      if (includeStats) {
        stats = await this.calculateReportStats(correspondances, includeOverdue);
      }
      
      return {
        correspondances,
        stats,
        filters,
        generatedAt: new Date(),
        generatedBy: supervisorId
      };
      
    } catch (error) {
      console.error('[SUPERVISOR] Erreur lors de la génération du rapport:', error);
      throw error;
    }
  }
  
  /**
   * Calculer les statistiques générales
   */
  static async getGeneralStats() {
    try {
      const now = new Date();
      
      const [
        totalCorrespondances,
        pendingCorrespondances,
        overdueCorrespondances,
        repliedCorrespondances,
        pendingValidations
      ] = await Promise.all([
        Correspondance.countDocuments({}),
        Correspondance.countDocuments({ status: 'PENDING' }),
        Correspondance.countDocuments({ 
          response_deadline: { $lt: now },
          status: { $in: ['PENDING', 'READY_TO_SEND'] }
        }),
        Correspondance.countDocuments({ status: 'REPLIED' }),
        Correspondance.countDocuments({ 
          directorValidation: 'PENDING',
          responseProposal: { $exists: true, $ne: '' }
        })
      ]);
      
      return {
        totalCorrespondances,
        pendingCorrespondances,
        overdueCorrespondances,
        repliedCorrespondances,
        pendingValidations,
        responseRate: totalCorrespondances > 0 ? 
          ((repliedCorrespondances / totalCorrespondances) * 100).toFixed(1) : 0
      };
      
    } catch (error) {
      console.error('[SUPERVISOR] Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
  
  /**
   * Calculer les statistiques pour un rapport
   */
  static async calculateReportStats(correspondances, includeOverdue) {
    const stats = {
      total: correspondances.length,
      byStatus: {},
      byPriority: {},
      byAirport: {},
      averageResponseTime: 0
    };
    
    // Grouper par statut
    correspondances.forEach(corr => {
      stats.byStatus[corr.status] = (stats.byStatus[corr.status] || 0) + 1;
      stats.byPriority[corr.priority] = (stats.byPriority[corr.priority] || 0) + 1;
      stats.byAirport[corr.airport] = (stats.byAirport[corr.airport] || 0) + 1;
    });
    
    // Calculer le temps de réponse moyen pour les correspondances répondues
    const repliedCorrespondances = correspondances.filter(c => c.status === 'REPLIED' && c.responseDate);
    if (repliedCorrespondances.length > 0) {
      const totalResponseTime = repliedCorrespondances.reduce((sum, corr) => {
        const responseTime = (new Date(corr.responseDate) - new Date(corr.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + responseTime;
      }, 0);
      stats.averageResponseTime = (totalResponseTime / repliedCorrespondances.length).toFixed(1);
    }
    
    if (includeOverdue) {
      const now = new Date();
      stats.overdue = correspondances.filter(c => 
        c.response_deadline && 
        new Date(c.response_deadline) < now && 
        c.status !== 'REPLIED'
      ).length;
    }
    
    return stats;
  }
}

module.exports = SupervisorService;
