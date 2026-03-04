const webpush = require('web-push');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Service de notifications push pour les correspondances
 */
class PushNotificationService {

  /**
   * Initialise le service de notifications push
   */
  static initialize() {
    // Configuration VAPID pour les notifications push
    const vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLEw6_qOkb4HtHuHUxzJrTp1sNiVdGFBWMhEGFGTjuAjNpfhMgpyQhA',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'aUWqaGFOBCLQrRSblfYFla7ilmSu2wpwXKD-6-7F6-Y'
    };

    webpush.setVapidDetails(
      'mailto:admin@tavtunisie.aero',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    console.log('🔔 [PushNotificationService] Service initialisé avec succès');
  }

  /**
   * Envoie une notification push à un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @param {Object} payload - Contenu de la notification
   */
  static async sendPushToUser(userId, payload) {
    try {
      console.log(`🔔 [PushNotificationService] Envoi push à l'utilisateur ${userId}`);

      const user = await User.findById(userId);
      if (!user || !user.pushSubscription) {
        console.log(`⚠️ [PushNotificationService] Utilisateur ${userId} n'a pas d'abonnement push`);
        return false;
      }

      // Vérifier si l'utilisateur a activé les notifications push
      if (!user.pushNotifications) {
        console.log(`⚠️ [PushNotificationService] Utilisateur ${userId} a désactivé les notifications push`);
        return false;
      }

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || '/icons/badge-icon.png',
        data: {
          url: payload.url,
          correspondanceId: payload.correspondanceId,
          type: payload.type || 'CORRESPONDANCE',
          timestamp: new Date().toISOString()
        },
        actions: payload.actions || [
          {
            action: 'view',
            title: '👀 Voir',
            icon: '/icons/view-icon.png'
          },
          {
            action: 'dismiss',
            title: '✖️ Ignorer',
            icon: '/icons/dismiss-icon.png'
          }
        ],
        requireInteraction: payload.urgent || false,
        silent: false,
        vibrate: payload.urgent ? [200, 100, 200, 100, 200] : [100, 50, 100]
      });

      await webpush.sendNotification(user.pushSubscription, notificationPayload);
      
      console.log(`✅ [PushNotificationService] Push envoyé avec succès à ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ [PushNotificationService] Erreur envoi push à ${userId}:`, error.message);
      
      // Si l'abonnement est invalide, le supprimer
      if (error.statusCode === 410 || error.statusCode === 404) {
        await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
        console.log(`🗑️ [PushNotificationService] Abonnement push supprimé pour ${userId}`);
      }
      
      return false;
    }
  }

  /**
   * Envoie des notifications push à plusieurs utilisateurs
   * @param {Array} userIds - Liste des IDs utilisateurs
   * @param {Object} payload - Contenu de la notification
   */
  static async sendPushToUsers(userIds, payload) {
    console.log(`🔔 [PushNotificationService] Envoi push à ${userIds.length} utilisateurs`);
    
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendPushToUser(userId, payload))
    );

    const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - successful;

    console.log(`📊 [PushNotificationService] Résultats: ${successful} réussis, ${failed} échoués`);
    
    return {
      total: userIds.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Notification pour nouvelle correspondance
   * @param {Object} correspondance - La correspondance
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  static async notifyNewCorrespondance(correspondance, userIds) {
    const payload = {
      title: `📧 Nouvelle correspondance${correspondance.priority === 'URGENT' ? ' URGENTE' : ''}`,
      body: `De: ${correspondance.from_address}\nSujet: ${correspondance.subject}`,
      icon: '/icons/mail-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'NEW_CORRESPONDANCE',
      urgent: correspondance.priority === 'URGENT',
      actions: [
        {
          action: 'view',
          title: '👀 Voir la correspondance',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'reply',
          title: '💬 Répondre',
          icon: '/icons/reply-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour réponse à une correspondance
   * @param {Object} correspondance - La correspondance
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  static async notifyCorrespondanceReply(correspondance, userIds) {
    const payload = {
      title: '💬 Nouvelle réponse',
      body: `Réponse reçue pour: ${correspondance.subject}`,
      icon: '/icons/reply-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'CORRESPONDANCE_REPLY',
      actions: [
        {
          action: 'view',
          title: '👀 Voir la réponse',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour modification d'une correspondance
   * @param {Object} correspondance - La correspondance
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  static async notifyCorrespondanceUpdate(correspondance, userIds) {
    const payload = {
      title: '📝 Correspondance modifiée',
      body: `Modifications apportées à: ${correspondance.subject}`,
      icon: '/icons/edit-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'CORRESPONDANCE_UPDATE',
      actions: [
        {
          action: 'view',
          title: '👀 Voir les modifications',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour nouvelle action ajoutée
   * @param {Object} correspondance - La correspondance
   * @param {Object} action - L'action ajoutée
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  static async notifyNewAction(correspondance, action, userIds) {
    const payload = {
      title: '✅ Nouvelle action ajoutée',
      body: `Action: ${action.description}\nCorrespondance: ${correspondance.subject}`,
      icon: '/icons/action-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'NEW_ACTION',
      actions: [
        {
          action: 'view',
          title: '👀 Voir l\'action',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour nouveau commentaire ajouté
   * @param {Object} correspondance - La correspondance
   * @param {Object} comment - Le commentaire ajouté
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  static async notifyNewComment(correspondance, comment, userIds) {
    const payload = {
      title: '💬 Nouveau commentaire',
      body: `${comment.author}: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}\nSur: ${correspondance.subject}`,
      icon: '/icons/comment-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'NEW_COMMENT',
      actions: [
        {
          action: 'view',
          title: '👀 Voir le commentaire',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour nouveau fichier attaché
   * @param {Object} correspondance - La correspondance
   * @param {Object} attachment - Le fichier attaché
   * @param {Array} userIds - IDs des utilisateurs à notifier
   */
  static async notifyNewAttachment(correspondance, attachment, userIds) {
    const payload = {
      title: '📎 Nouvelle pièce jointe',
      body: `Fichier ajouté: ${attachment.originalName}\nSur: ${correspondance.subject}`,
      icon: '/icons/attachment-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'NEW_ATTACHMENT',
      actions: [
        {
          action: 'view',
          title: '👀 Voir la correspondance',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'download',
          title: '📥 Télécharger',
          icon: '/icons/download-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour échéance approchante
   * @param {Object} correspondance - La correspondance
   * @param {Array} userIds - IDs des utilisateurs à notifier
   * @param {Number} daysRemaining - Jours restants
   */
  static async notifyDeadlineWarning(correspondance, userIds, daysRemaining) {
    const payload = {
      title: `⚠️ Échéance dans ${daysRemaining} jour(s)`,
      body: `Correspondance: ${correspondance.subject}\nDe: ${correspondance.from_address}`,
      icon: '/icons/warning-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'DEADLINE_WARNING',
      urgent: daysRemaining <= 1,
      actions: [
        {
          action: 'view',
          title: '⚡ Traiter maintenant',
          icon: '/icons/urgent-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Notification pour échéance expirée
   * @param {Object} correspondance - La correspondance
   * @param {Array} userIds - IDs des utilisateurs à notifier
   * @param {Number} daysOverdue - Jours de retard
   */
  static async notifyDeadlineExpired(correspondance, userIds, daysOverdue) {
    const payload = {
      title: `🚨 ÉCHÉANCE EXPIRÉE (${daysOverdue} jour(s) de retard)`,
      body: `URGENT: ${correspondance.subject}\nDe: ${correspondance.from_address}`,
      icon: '/icons/expired-icon.png',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}`,
      correspondanceId: correspondance._id,
      type: 'DEADLINE_EXPIRED',
      urgent: true,
      actions: [
        {
          action: 'view',
          title: '🚨 TRAITER D\'URGENCE',
          icon: '/icons/urgent-icon.png'
        }
      ]
    };

    return await this.sendPushToUsers(userIds, payload);
  }

  /**
   * Enregistre un abonnement push pour un utilisateur
   * @param {String} userId - ID de l'utilisateur
   * @param {Object} subscription - Abonnement push
   */
  static async subscribePush(userId, subscription) {
    try {
      await User.findByIdAndUpdate(userId, {
        pushSubscription: subscription,
        pushNotifications: true
      });

      console.log(`✅ [PushNotificationService] Abonnement push enregistré pour ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ [PushNotificationService] Erreur enregistrement abonnement ${userId}:`, error.message);
      return false;
    }
  }

  /**
   * Désabonne un utilisateur des notifications push
   * @param {String} userId - ID de l'utilisateur
   */
  static async unsubscribePush(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 },
        pushNotifications: false
      });

      console.log(`✅ [PushNotificationService] Désabonnement push pour ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ [PushNotificationService] Erreur désabonnement ${userId}:`, error.message);
      return false;
    }
  }
}

module.exports = PushNotificationService;
