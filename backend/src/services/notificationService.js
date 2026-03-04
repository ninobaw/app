const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Service de gestion des notifications pour les correspondances
 */
class NotificationService {
  
  /**
   * Envoie une notification push à tous les utilisateurs concernés par une correspondance
   * @param {Object} correspondance - La correspondance créée
   * @param {Array} personnesConcernees - Liste des IDs des personnes concernées
   * @param {String} type - Type de notification ('NEW_CORRESPONDANCE', 'CORRESPONDANCE_REPLY', etc.)
   */
  static async sendCorrespondanceNotification(correspondance, personnesConcernees, type = 'NEW_CORRESPONDANCE') {
    try {
      const notifications = [];
      
      for (const userId of personnesConcernees) {
        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
          console.warn(`Utilisateur non trouvé: ${userId}`);
          continue;
        }

        let title, message, notificationType, actionRequired;
        
        switch (type) {
          case 'NEW_CORRESPONDANCE':
            title = `Nouvelle correspondance: ${correspondance.subject}`;
            message = `Une nouvelle correspondance vous a été assignée de ${correspondance.from_address}`;
            notificationType = 'info';
            actionRequired = correspondance.status === 'PENDING';
            break;
            
          case 'CORRESPONDANCE_REPLY':
            title = `Réponse à la correspondance: ${correspondance.subject}`;
            message = `Une réponse a été apportée à la correspondance ${correspondance.responseReference}`;
            notificationType = 'success';
            actionRequired = false;
            break;
            
          case 'CORRESPONDANCE_URGENT':
            title = `URGENT - Correspondance: ${correspondance.subject}`;
            message = `Correspondance urgente nécessitant votre attention immédiate`;
            notificationType = 'warning';
            actionRequired = true;
            break;
            
          default:
            title = `Correspondance: ${correspondance.subject}`;
            message = `Notification concernant la correspondance ${correspondance._id}`;
            notificationType = 'info';
            actionRequired = false;
        }

        const notification = new Notification({
          _id: uuidv4(),
          userId: userId,
          title: title,
          message: message,
          type: notificationType,
          entityId: correspondance._id,
          entityType: type === 'CORRESPONDANCE_REPLY' ? 'CORRESPONDANCE_REPLY' : 'CORRESPONDANCE',
          correspondanceId: correspondance._id,
          actionRequired: actionRequired,
          priority: correspondance.priority || 'MEDIUM',
          isRead: false
        });

        await notification.save();
        notifications.push(notification);
        
        console.log(`Notification envoyée à ${user.email} pour la correspondance ${correspondance._id}`);
      }
      
      return notifications;
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error);
      throw error;
    }
  }

  /**
   * Marque toutes les notifications d'une correspondance comme lues pour un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @param {String} correspondanceId - ID de la correspondance
   */
  static async markCorrespondanceNotificationsAsRead(userId, correspondanceId) {
    try {
      await Notification.updateMany(
        { 
          userId: userId, 
          correspondanceId: correspondanceId,
          isRead: false 
        },
        { 
          isRead: true,
          updatedAt: new Date()
        }
      );
      
      console.log(`Notifications marquées comme lues pour l'utilisateur ${userId} et la correspondance ${correspondanceId}`);
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les notifications non lues d'un utilisateur
   * @param {String} userId - ID de l'utilisateur
   */
  static async getUnreadNotifications(userId) {
    try {
      const notifications = await Notification.find({
        userId: userId,
        isRead: false
      }).sort({ createdAt: -1 });
      
      return notifications;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Supprime les anciennes notifications (plus de 30 jours)
   */
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
      
      console.log(`${result.deletedCount} anciennes notifications supprimées`);
      return result.deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
