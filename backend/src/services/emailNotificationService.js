const { sendEmail } = require('../utils/emailSender');
const User = require('../models/User');
const NotificationService = require('./notificationService');

/**
 * Service de notifications email pour les correspondances avec templates modernes
 */
class EmailNotificationService {

  /**
   * Template HTML moderne pour les notifications de correspondances
   */
  static getEmailTemplate(type, data) {
    const baseStyle = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body { 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .email-container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: #ffffff; 
          border-radius: 16px; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        
        .header { 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.1;
        }
        
        .header h1 { 
          margin: 0; 
          font-size: 28px; 
          font-weight: 700;
          position: relative;
          z-index: 1;
        }
        
        .header .subtitle { 
          margin: 10px 0 0 0; 
          font-size: 16px; 
          opacity: 0.9;
          font-weight: 400;
          position: relative;
          z-index: 1;
        }
        
        .content { 
          padding: 40px 30px; 
        }
        
        .priority-badge { 
          display: inline-block; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        
        .priority-urgent { 
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
          color: white; 
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        
        .priority-high { 
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); 
          color: white; 
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }
        
        .priority-medium { 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
          color: white; 
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .priority-low { 
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); 
          color: white; 
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }
        
        .info-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
          position: relative;
        }
        
        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 2px;
        }
        
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 12px; 
          align-items: center;
        }
        
        .info-row:last-child { 
          margin-bottom: 0; 
        }
        
        .info-label { 
          font-weight: 600; 
          color: #4b5563; 
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value { 
          color: #1f2937; 
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }
        
        .content-preview {
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          font-style: italic;
          color: #4b5563;
          position: relative;
        }
        
        .content-preview::before {
          content: '"';
          position: absolute;
          top: -10px;
          left: 15px;
          font-size: 48px;
          color: #d1d5db;
          font-family: serif;
        }
        
        .divider { 
          height: 2px; 
          background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%); 
          margin: 32px 0; 
          border: none;
        }
        
        .btn { 
          display: inline-block; 
          padding: 16px 32px; 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
          color: white !important; 
          text-decoration: none; 
          border-radius: 12px; 
          font-weight: 600; 
          font-size: 16px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
        }
        
        .btn.warning { 
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        }
        
        .btn.urgent { 
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .footer { 
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb;
        }
        
        .footer p { 
          margin: 0; 
          color: #6b7280; 
          font-size: 14px;
          line-height: 1.5;
        }
        
        .footer .logo {
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .icon {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 8px;
          vertical-align: middle;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container { 
            margin: 20px; 
            border-radius: 12px;
          }
          
          .header, .content, .footer { 
            padding: 24px 20px; 
          }
          
          .header h1 { 
            font-size: 24px; 
          }
          
          .info-row { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 4px;
          }
          
          .info-value { 
            text-align: left; 
            max-width: 100%;
          }
          
          .btn { 
            padding: 14px 24px; 
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    `;

    const templates = {
      NEW_CORRESPONDANCE: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>📧 Nouvelle Correspondance</h1>
            <div class="subtitle">Une nouvelle correspondance vous a été assignée</div>
          </div>
          <div class="content">
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Sujet</div>
                <div class="info-value">${data.subject}</div>
              </div>
              <div class="info-row">
                <div class="info-label">De</div>
                <div class="info-value">${data.from_address}</div>
              </div>
              <div class="info-row">
                <div class="info-label">À</div>
                <div class="info-value">${data.to_address}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Priorité</div>
                <div class="info-value">
                  <span class="priority-badge priority-${data.priority?.toLowerCase() || 'medium'}">
                    ${data.priority === 'URGENT' ? '🚨' : data.priority === 'HIGH' ? '⚡' : data.priority === 'MEDIUM' ? '📊' : '📝'} ${data.priority || 'MEDIUM'}
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Aéroport</div>
                <div class="info-value">${data.airport}</div>
              </div>
            </div>
            
            <div class="content-preview">
              ${data.content?.substring(0, 200)}${data.content?.length > 200 ? '...' : ''}
            </div>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${data._id}" class="btn">
                👀 Voir la correspondance
              </a>
            </div>
          </div>
          <div class="footer">
            <p>📧 Système de Gestion Documentaire - OACA Enfidha</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `,

      CORRESPONDANCE_REPLY: `
        ${baseStyle}
        <div class="email-container">
          <div class="header">
            <h1>💬 Nouvelle Réponse</h1>
            <div class="subtitle">Une réponse a été apportée à votre correspondance</div>
          </div>
          <div class="content">
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Correspondance originale</div>
                <div class="info-value">${data.originalSubject || data.subject}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Référence de réponse</div>
                <div class="info-value">${data.responseReference}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Statut</div>
                <div class="info-value">
                  <span class="priority-badge priority-replied">
                    ✅ RÉPONDU
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Date de réponse</div>
                <div class="info-value">${new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            
            <div class="content-preview">
              ${data.content?.substring(0, 200)}${data.content?.length > 200 ? '...' : ''}
            </div>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${data._id}" class="btn">
                👀 Voir la réponse
              </a>
            </div>
          </div>
          <div class="footer">
            <p>📧 Système de Gestion Documentaire - OACA Enfidha</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `,

      CORRESPONDANCE_URGENT: `
        ${baseStyle}
        <div class="email-container">
          <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <h1>🚨 CORRESPONDANCE URGENTE</h1>
            <div class="subtitle">Attention immédiate requise</div>
          </div>
          <div class="content">
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Sujet</div>
                <div class="info-value">${data.subject}</div>
              </div>
              <div class="info-row">
                <div class="info-label">De</div>
                <div class="info-value">${data.from_address}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Priorité</div>
                <div class="info-value">
                  <span class="priority-badge priority-urgent">
                    🚨 URGENT
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Échéance</div>
                <div class="info-value">${data.responseDeadline ? new Date(data.responseDeadline).toLocaleDateString('fr-FR') : 'Immédiate'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Aéroport</div>
                <div class="info-value">${data.airport}</div>
              </div>
            </div>
            
            <div class="content-preview">
              ${data.content?.substring(0, 200)}${data.content?.length > 200 ? '...' : ''}
            </div>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${data._id}" class="btn urgent">
                🚨 TRAITER MAINTENANT
              </a>
            </div>
          </div>
          <div class="footer">
            <p>📧 Système de Gestion Documentaire - OACA Enfidha</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `,

      CORRESPONDANCE_UPDATED: `
        ${baseStyle}
        <div class="email-container">
          <div class="header" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);">
            <h1>📝 Correspondance Modifiée</h1>
            <div class="subtitle">Une correspondance a été mise à jour</div>
          </div>
          <div class="content">
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Sujet</div>
                <div class="info-value">${data.subject}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Statut actuel</div>
                <div class="info-value">
                  <span class="priority-badge priority-${data.status?.toLowerCase()}">
                    ${data.status === 'PENDING' ? '⏳' : data.status === 'REPLIED' ? '✅' : '📋'} ${data.status}
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Dernière modification</div>
                <div class="info-value">${new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            
            <div class="content-preview">
              ${data.content?.substring(0, 200)}${data.content?.length > 200 ? '...' : ''}
            </div>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${data._id}" class="btn">
                👀 Voir les modifications
              </a>
            </div>
          </div>
          <div class="footer">
            <p>📧 Système de Gestion Documentaire - OACA Enfidha</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      `,

      DEADLINE_WARNING: `
        ${baseStyle}
        <div class="email-container">
          <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <h1>⚠️ Échéance Approchante</h1>
            <div class="subtitle">Une correspondance nécessite votre attention</div>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.recipientName}</strong>,</p>
            
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Sujet</div>
                <div class="info-value">${data.subject}</div>
              </div>
              <div class="info-row">
                <div class="info-label">De</div>
                <div class="info-value">${data.from_address}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Priorité</div>
                <div class="info-value">
                  <span class="priority-badge priority-${data.priority?.toLowerCase() || 'medium'}">
                    ${data.priority === 'URGENT' ? '🚨' : data.priority === 'HIGH' ? '⚡' : data.priority === 'MEDIUM' ? '📊' : '📝'} ${data.priority || 'MEDIUM'}
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Aéroport</div>
                <div class="info-value">${data.airport}</div>
              </div>
            </div>
            
            <div class="content-preview">
              ${data.content?.substring(0, 200)}${data.content?.length > 200 ? '...' : ''}
            </div>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${data._id}" class="btn warning">
                ⚡ TRAITER MAINTENANT
              </a>
            </div>
            
            <p><strong>Action requise :</strong> Cette correspondance nécessite une réponse avant l'expiration de l'échéance.</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système SGDO.</p>
            <p>Aéroport ${data.airport} - Système de Gestion des Correspondances</p>
          </div>
        </div>
      `,

      DEADLINE_EXPIRED: `
        ${baseStyle}
        <div class="email-container">
          <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
            <h1>🚨 Échéance Expirée</h1>
            <div class="subtitle">Action urgente requise</div>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.recipientName}</strong>,</p>
            
            <div class="info-card">
              <div class="info-row">
                <div class="info-label">Sujet</div>
                <div class="info-value">${data.subject}</div>
              </div>
              <div class="info-row">
                <div class="info-label">De</div>
                <div class="info-value">${data.from_address}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Priorité</div>
                <div class="info-value">
                  <span class="priority-badge priority-urgent">
                    🚨 URGENT
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">Aéroport</div>
                <div class="info-value">${data.airport}</div>
              </div>
            </div>
            
            <div class="content-preview">
              ${data.content?.substring(0, 200)}${data.content?.length > 200 ? '...' : ''}
            </div>
            
            <div class="divider"></div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${data._id}" class="btn urgent">
                🚨 TRAITER D'URGENCE
              </a>
            </div>
            
            <p><strong>Action immédiate requise :</strong> Cette correspondance est en retard et nécessite un traitement prioritaire.</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système SGDO.</p>
            <p>Aéroport ${data.airport} - Système de Gestion des Correspondances</p>
          </div>
        </div>
      `,
    };

    return templates[type] || templates.NEW_CORRESPONDANCE;
  }

  /**
   * Détermine si l'email doit être forcé selon le type et la priorité
   */
  static shouldForceEmailNotification(type, priority) {
    // Forcer les emails pour les correspondances urgentes
    if (type === 'CORRESPONDANCE_URGENT' || priority === 'URGENT') {
      return true;
    }

    // Forcer les emails pour les réponses à des correspondances urgentes
    if (type === 'CORRESPONDANCE_REPLY' && priority === 'URGENT') {
      return true;
    }

    // Ne pas forcer les emails pour les autres types et priorités
    return false;
  }

  /**
   * Envoie une notification email pour une correspondance
   */
  static async sendCorrespondanceEmailNotification(correspondance, userIds, type = 'NEW_CORRESPONDANCE') {
    try {
      console.log(`[EmailNotificationService] 🚀 DÉBUT - Envoi notification ${type} pour correspondance ${correspondance._id}`);
      console.log(`[EmailNotificationService] 👥 Destinataires: ${userIds.length} utilisateurs`);
      console.log(`[EmailNotificationService] 📋 UserIds:`, userIds);

      const emailPromises = [];

      for (const userId of userIds) {
        try {
          console.log(`[EmailNotificationService] 🔍 Traitement utilisateur: ${userId}`);
          
          // Récupérer les détails de l'utilisateur
          const user = await User.findById(userId);
          if (!user || !user.email) {
            console.warn(`[EmailNotificationService] ⚠️ Utilisateur ${userId} non trouvé ou sans email`);
            continue;
          }

          console.log(`[EmailNotificationService] ✅ Utilisateur trouvé: ${user.firstName} ${user.lastName} (${user.email})`);

          // Générer le contenu de l'email
          const emailData = {
            ...correspondance.toObject(),
            recipientName: `${user.firstName} ${user.lastName}`,
            recipientEmail: user.email
          };

          console.log(`[EmailNotificationService] 🎨 Génération template pour type: ${type}`);
          const htmlContent = this.getEmailTemplate(type, emailData);
          
          // Définir le sujet selon le type
          let subject;
          switch (type) {
            case 'NEW_CORRESPONDANCE':
              subject = `📧 Nouvelle correspondance: ${correspondance.subject}`;
              break;
            case 'CORRESPONDANCE_REPLY':
              subject = `💬 Réponse à: ${correspondance.subject}`;
              break;
            case 'CORRESPONDANCE_URGENT':
              subject = `🚨 URGENT - ${correspondance.subject}`;
              break;
            case 'CORRESPONDANCE_UPDATED':
              subject = `📝 Modification - ${correspondance.subject}`;
              break;
            case 'DEADLINE_WARNING':
              subject = `⚠️ Échéance Approchante - ${correspondance.subject}`;
              break;
            case 'DEADLINE_EXPIRED':
              subject = `🚨 Échéance Expirée - ${correspondance.subject}`;
              break;
            default:
              subject = `📧 Notification - ${correspondance.subject}`;
          }

          // Version texte simple
          const textContent = `
            ${subject}
            
            Bonjour ${user.firstName} ${user.lastName},
            
            ${type === 'NEW_CORRESPONDANCE' ? 'Une nouvelle correspondance vous a été assignée' : 
              type === 'CORRESPONDANCE_REPLY' ? 'Une réponse a été apportée à votre correspondance' :
              type === 'CORRESPONDANCE_URGENT' ? 'ATTENTION: Correspondance urgente nécessitant votre attention immédiate' :
              type === 'CORRESPONDANCE_UPDATED' ? 'Une correspondance a été modifiée' :
              type === 'DEADLINE_WARNING' ? 'Échéance approchante pour la correspondance' :
              type === 'DEADLINE_EXPIRED' ? 'Échéance expirée pour la correspondance' :
              'Notification'}.
            
            Sujet: ${correspondance.subject}
            De: ${correspondance.from_address}
            À: ${correspondance.to_address}
            Priorité: ${correspondance.priority}
            Aéroport: ${correspondance.airport}
            
            Veuillez consulter la correspondance sur: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/correspondances/${correspondance._id}
            
            ---
            Système de Gestion Documentaire - OACA Enfidha
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          `;

          // Déterminer si l'email doit être forcé selon le type et la priorité
          const shouldForceEmail = this.shouldForceEmailNotification(type, emailData.priority);
          
          console.log(`[EmailNotificationService] 🔧 Force email: ${shouldForceEmail} (Type: ${type}, Priorité: ${emailData.priority})`);

          // Ajouter à la liste des promesses d'envoi
          const emailPromise = sendEmail(
            userId,
            subject,
            textContent,
            htmlContent,
            shouldForceEmail // Forçage intelligent selon le contexte
          ).then(result => {
            console.log(`[EmailNotificationService] ✅ Email envoyé avec succès à ${user.email}:`, result);
            return result;
          }).catch(error => {
            console.error(`[EmailNotificationService] ❌ Erreur envoi email à ${user.email}:`, error.message);
            return { success: false, userId, error: error.message };
          });

          emailPromises.push(emailPromise);

        } catch (error) {
          console.error(`[EmailNotificationService] Erreur traitement utilisateur ${userId}:`, error.message);
        }
      }

      // Envoyer tous les emails en parallèle
      const results = await Promise.all(emailPromises);
      
      // Compter les succès et échecs
      const successful = results.filter(r => r && r.success).length;
      const failed = results.filter(r => r && !r.success).length;

      console.log(`[EmailNotificationService] Résultats envoi: ${successful} succès, ${failed} échecs`);

      // Envoyer aussi les notifications push
      await NotificationService.sendCorrespondanceNotification(correspondance, userIds, type);

      return {
        success: true,
        emailsSent: successful,
        emailsFailed: failed,
        totalRecipients: userIds.length
      };

    } catch (error) {
      console.error('[EmailNotificationService] Erreur générale:', error);
      throw error;
    }
  }

  /**
   * Envoie une notification pour une nouvelle correspondance
   */
  static async notifyNewCorrespondance(correspondance, personnesConcernees) {
    const type = correspondance.priority === 'URGENT' ? 'CORRESPONDANCE_URGENT' : 'NEW_CORRESPONDANCE';
    return await this.sendCorrespondanceEmailNotification(correspondance, personnesConcernees, type);
  }

  /**
   * Envoie une notification pour une réponse à une correspondance
   */
  static async notifyCorrespondanceReply(correspondance, personnesConcernees) {
    return await this.sendCorrespondanceEmailNotification(correspondance, personnesConcernees, 'CORRESPONDANCE_REPLY');
  }

  /**
   * Envoie une notification pour une modification de correspondance
   */
  static async notifyCorrespondanceUpdate(correspondance, personnesConcernees) {
    return await this.sendCorrespondanceEmailNotification(correspondance, personnesConcernees, 'CORRESPONDANCE_UPDATED');
  }

  /**
   * Envoie une notification pour une échéance approchante
   */
  static async notifyDeadlineWarning(correspondance, personnesConcernees) {
    return await this.sendCorrespondanceEmailNotification(correspondance, personnesConcernees, 'DEADLINE_WARNING');
  }

  /**
   * Envoie une notification pour une échéance expirée
   */
  static async notifyDeadlineExpired(correspondance, personnesConcernees) {
    return await this.sendCorrespondanceEmailNotification(correspondance, personnesConcernees, 'DEADLINE_EXPIRED');
  }
}

module.exports = EmailNotificationService;
