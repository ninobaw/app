const Correspondance = require('../models/Correspondance');
const EmailNotificationService = require('./emailNotificationService');
const NotificationService = require('./notificationService');

/**
 * Service de gestion des échéances et notifications de deadline
 */
class DeadlineService {
  
  /**
   * Calcule et assigne automatiquement les échéances pour une correspondance
   */
  static async assignDeadline(correspondance) {
    try {
      if (!correspondance.responseDeadline) {
        const calculatedDeadline = correspondance.calculateDeadline();
        if (calculatedDeadline) {
          correspondance.responseDeadline = calculatedDeadline;
          await correspondance.save();
          console.log(`📅 [DeadlineService] Échéance assignée pour correspondance ${correspondance._id}: ${calculatedDeadline.toLocaleDateString()}`);
        }
      }
      return correspondance;
    } catch (error) {
      console.error(`❌ [DeadlineService] Erreur assignation échéance:`, error);
      throw error;
    }
  }

  /**
   * Vérifie et envoie les notifications d'échéance approchante (3 jours avant)
   */
  static async checkApproachingDeadlines() {
    try {
      console.log('🔍 [DeadlineService] Vérification des échéances approchantes...');
      
      const approachingCorrespondances = await Correspondance.findApproachingDeadline(3);
      console.log(`📊 [DeadlineService] ${approachingCorrespondances.length} correspondances approchent de l'échéance`);

      for (const correspondance of approachingCorrespondances) {
        await this.sendDeadlineWarningNotification(correspondance);
        
        // Marquer la notification comme envoyée
        correspondance.deadlineNotificationSent = true;
        await correspondance.save();
      }

      return approachingCorrespondances.length;
    } catch (error) {
      console.error('❌ [DeadlineService] Erreur vérification échéances:', error);
      throw error;
    }
  }

  /**
   * Vérifie et envoie les notifications d'expiration
   */
  static async checkExpiredDeadlines() {
    try {
      console.log('🔍 [DeadlineService] Vérification des échéances expirées...');
      
      // Remplacer la méthode inexistante par une requête standard
      const expiredCorrespondances = await Correspondance.find({
        deadline: { $lt: new Date() },
        status: { $ne: 'REPLIED' },
        expirationNotificationSent: { $ne: true }
      });
      
      console.log(`📊 [DeadlineService] ${expiredCorrespondances.length} correspondances ont expiré`);

      for (const correspondance of expiredCorrespondances) {
        await this.sendExpirationNotification(correspondance);
        
        // Marquer la notification comme envoyée
        correspondance.expirationNotificationSent = true;
        await correspondance.save();
      }

      return expiredCorrespondances.length;
    } catch (error) {
      console.error('❌ [DeadlineService] Erreur vérification expirations:', error);
      throw error;
    }
  }

  /**
   * Envoie une notification d'avertissement d'échéance
   */
  static async sendDeadlineWarningNotification(correspondance) {
    try {
      const daysRemaining = correspondance.getDaysUntilDeadline();
      console.log(`⚠️ [DeadlineService] Envoi notification échéance pour ${correspondance._id} (${daysRemaining} jours restants)`);

      if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
        // Email de notification d'échéance
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          correspondance.personnesConcernees,
          'DEADLINE_WARNING'
        );

        // Notification push
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          correspondance.personnesConcernees,
          'DEADLINE_WARNING'
        );
      }

      return true;
    } catch (error) {
      console.error(`❌ [DeadlineService] Erreur envoi notification échéance:`, error);
      throw error;
    }
  }

  /**
   * Envoie une notification d'expiration
   */
  static async sendExpirationNotification(correspondance) {
    try {
      const daysOverdue = Math.abs(correspondance.getDaysUntilDeadline());
      console.log(`🚨 [DeadlineService] Envoi notification expiration pour ${correspondance._id} (${daysOverdue} jours de retard)`);

      if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
        // Email de notification d'expiration
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          correspondance.personnesConcernees,
          'DEADLINE_EXPIRED'
        );

        // Notification push
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          correspondance.personnesConcernees,
          'DEADLINE_EXPIRED'
        );
      }

      return true;
    } catch (error) {
      console.error(`❌ [DeadlineService] Erreur envoi notification expiration:`, error);
      throw error;
    }
  }

  /**
   * Obtient un rapport des échéances
   */
  static async getDeadlineReport() {
    try {
      const [approaching, expired, overdue] = await Promise.all([
        Correspondance.findApproachingDeadline(7), // 7 jours
        Correspondance.find({
          deadline: { $lt: new Date() },
          status: { $ne: 'REPLIED' },
          expirationNotificationSent: { $ne: true }
        }),
        Correspondance.findOverdue()
      ]);

      return {
        approaching: approaching.length,
        expired: expired.length,
        overdue: overdue.length,
        details: {
          approachingList: approaching.map(c => ({
            id: c._id,
            subject: c.subject,
            deadline: c.responseDeadline,
            daysRemaining: c.getDaysUntilDeadline(),
            priority: c.priority
          })),
          expiredList: expired.map(c => ({
            id: c._id,
            subject: c.subject,
            deadline: c.responseDeadline,
            daysOverdue: Math.abs(c.getDaysUntilDeadline()),
            priority: c.priority
          }))
        }
      };
    } catch (error) {
      console.error('❌ [DeadlineService] Erreur génération rapport:', error);
      throw error;
    }
  }

  /**
   * Met à jour les échéances pour toutes les correspondances sans échéance
   */
  static async updateMissingDeadlines() {
    try {
      console.log('🔄 [DeadlineService] Mise à jour des échéances manquantes...');
      
      const correspondancesWithoutDeadline = await Correspondance.find({
        responseDeadline: { $exists: false },
        status: { $in: ['PENDING', 'DRAFT'] }
      });

      console.log(`📊 [DeadlineService] ${correspondancesWithoutDeadline.length} correspondances sans échéance trouvées`);

      let updated = 0;
      for (const correspondance of correspondancesWithoutDeadline) {
        const deadline = correspondance.calculateDeadline();
        if (deadline) {
          correspondance.responseDeadline = deadline;
          await correspondance.save();
          updated++;
        }
      }

      console.log(`✅ [DeadlineService] ${updated} échéances mises à jour`);
      return updated;
    } catch (error) {
      console.error('❌ [DeadlineService] Erreur mise à jour échéances:', error);
      throw error;
    }
  }

  /**
   * Exécute toutes les vérifications de routine
   */
  static async runDailyCheck() {
    try {
      console.log('🕐 [DeadlineService] Exécution des vérifications quotidiennes...');
      
      const [approaching, expired, updated] = await Promise.all([
        this.checkApproachingDeadlines(),
        this.checkExpiredDeadlines(),
        this.updateMissingDeadlines()
      ]);

      const report = {
        timestamp: new Date(),
        approaching,
        expired,
        updated,
        summary: `${approaching} notifications d'échéance, ${expired} notifications d'expiration, ${updated} échéances mises à jour`
      };

      console.log('✅ [DeadlineService] Vérifications terminées:', report.summary);
      return report;
    } catch (error) {
      console.error('❌ [DeadlineService] Erreur vérifications quotidiennes:', error);
      throw error;
    }
  }
}

module.exports = DeadlineService;
