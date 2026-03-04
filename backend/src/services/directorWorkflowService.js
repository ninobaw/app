const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const EmailNotificationService = require('./emailNotificationService');

/**
 * Service pour gérer le workflow de validation du directeur général
 */
class DirectorWorkflowService {
  
  /**
   * Ajouter des consignes du directeur à une correspondance
   * @param {string} correspondanceId - ID de la correspondance
   * @param {string} directorId - ID du directeur
   * @param {string} consignes - Consignes du directeur
   * @param {string} comments - Commentaires optionnels
   * @param {string} notes - Notes privées optionnelles
   */
  static async addDirectorConsignes(correspondanceId, directorId, consignes, comments = '', notes = '') {
    try {
      console.log(`[DIRECTOR WORKFLOW] Ajout consignes directeur pour correspondance ${correspondanceId}`);
      
      // Vérifier que l'utilisateur est bien un directeur
      const director = await User.findById(directorId);
      if (!director || !director.isDirector()) {
        throw new Error('Seuls les directeurs peuvent ajouter des consignes');
      }
      
      // Mettre à jour la correspondance
      const correspondance = await Correspondance.findByIdAndUpdate(
        correspondanceId,
        {
          directorConsignes: consignes,
          directorComments: comments,
          directorNotes: notes,
          directorValidation: 'PENDING',
          updatedAt: new Date()
        },
        { new: true }
      ).populate('personnesConcernees', 'firstName lastName email');
      
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }
      
      // Notifier les personnes concernées des nouvelles consignes
      if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
        const userIds = correspondance.personnesConcernees.map(p => p._id);
        
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          userIds,
          'DIRECTOR_CONSIGNES_ADDED'
        );
        
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          userIds,
          'DIRECTOR_CONSIGNES_ADDED'
        );
      }
      
      console.log(`[DIRECTOR WORKFLOW] Consignes ajoutées avec succès`);
      return correspondance;
      
    } catch (error) {
      console.error('[DIRECTOR WORKFLOW] Erreur lors de l\'ajout des consignes:', error);
      throw error;
    }
  }
  
  /**
   * Soumettre une proposition de réponse
   * @param {string} correspondanceId - ID de la correspondance
   * @param {string} userId - ID de l'utilisateur qui propose
   * @param {string} responseProposal - Proposition de réponse
   */
  static async submitResponseProposal(correspondanceId, userId, responseProposal) {
    try {
      console.log(`[DIRECTOR WORKFLOW] Soumission proposition de réponse pour correspondance ${correspondanceId}`);
      
      const correspondance = await Correspondance.findByIdAndUpdate(
        correspondanceId,
        {
          responseProposal: responseProposal,
          responseProposalBy: userId,
          responseProposalDate: new Date(),
          directorValidation: 'PENDING',
          updatedAt: new Date()
        },
        { new: true }
      );
      
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }
      
      // Notifier le directeur général de la nouvelle proposition
      const directorsGeneral = await User.find({ role: 'DIRECTEUR_GENERAL', isActive: true });
      
      if (directorsGeneral.length > 0) {
        const directorIds = directorsGeneral.map(d => d._id);
        
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          directorIds,
          'RESPONSE_PROPOSAL_SUBMITTED'
        );
        
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          directorIds,
          'RESPONSE_PROPOSAL_SUBMITTED'
        );
      }
      
      console.log(`[DIRECTOR WORKFLOW] Proposition soumise avec succès`);
      return correspondance;
      
    } catch (error) {
      console.error('[DIRECTOR WORKFLOW] Erreur lors de la soumission de la proposition:', error);
      throw error;
    }
  }
  
  /**
   * Valider ou rejeter une proposition de réponse par le directeur
   * @param {string} correspondanceId - ID de la correspondance
   * @param {string} directorId - ID du directeur
   * @param {string} decision - 'APPROVED', 'REJECTED', 'NEEDS_REVISION'
   * @param {string} comments - Commentaires du directeur
   */
  static async validateResponseProposal(correspondanceId, directorId, decision, comments = '') {
    try {
      console.log(`[DIRECTOR WORKFLOW] Validation proposition par directeur ${directorId}: ${decision}`);
      
      // Vérifier que l'utilisateur est bien un directeur général
      const director = await User.findById(directorId);
      if (!director || director.role !== 'DIRECTEUR_GENERAL') {
        throw new Error('Seul le directeur général peut valider les propositions de réponse');
      }
      
      const updateData = {
        directorValidation: decision,
        directorValidationDate: new Date(),
        directorValidatedBy: directorId,
        directorComments: comments,
        updatedAt: new Date()
      };
      
      // Si approuvé, marquer la correspondance comme prête pour envoi
      if (decision === 'APPROVED') {
        updateData.status = 'READY_TO_SEND'; // Nouveau statut
      }
      
      const correspondance = await Correspondance.findByIdAndUpdate(
        correspondanceId,
        updateData,
        { new: true }
      ).populate('responseProposalBy', 'firstName lastName email')
       .populate('personnesConcernees', 'firstName lastName email');
      
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }
      
      // Notifier la personne qui a proposé la réponse
      const notificationUserIds = [];
      if (correspondance.responseProposalBy) {
        notificationUserIds.push(correspondance.responseProposalBy._id);
      }
      
      // Notifier aussi les personnes concernées
      if (correspondance.personnesConcernees) {
        notificationUserIds.push(...correspondance.personnesConcernees.map(p => p._id));
      }
      
      if (notificationUserIds.length > 0) {
        const notificationType = decision === 'APPROVED' ? 
          'RESPONSE_PROPOSAL_APPROVED' : 
          'RESPONSE_PROPOSAL_REJECTED';
          
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          notificationUserIds,
          notificationType
        );
        
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          notificationUserIds,
          notificationType
        );
      }
      
      console.log(`[DIRECTOR WORKFLOW] Validation effectuée avec succès: ${decision}`);
      return correspondance;
      
    } catch (error) {
      console.error('[DIRECTOR WORKFLOW] Erreur lors de la validation:', error);
      throw error;
    }
  }
  
  /**
   * Finaliser l'envoi de la réponse avec document de décharge
   * @param {string} correspondanceId - ID de la correspondance
   * @param {string} userId - ID de l'utilisateur qui finalise
   * @param {string} dischargeDocumentPath - Chemin vers le document de décharge
   */
  static async finalizeResponse(correspondanceId, userId, dischargeDocumentPath) {
    try {
      console.log(`[DIRECTOR WORKFLOW] Finalisation de la réponse pour correspondance ${correspondanceId}`);
      
      const correspondance = await Correspondance.findByIdAndUpdate(
        correspondanceId,
        {
          status: 'REPLIED',
          dischargeDocument: dischargeDocumentPath,
          responseDate: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      ).populate('personnesConcernees', 'firstName lastName email');
      
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }
      
      // Notifier toutes les parties concernées que la réponse a été envoyée
      if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
        const userIds = correspondance.personnesConcernees.map(p => p._id);
        
        await NotificationService.sendCorrespondanceNotification(
          correspondance,
          userIds,
          'RESPONSE_FINALIZED'
        );
        
        await EmailNotificationService.sendCorrespondanceEmailNotification(
          correspondance,
          userIds,
          'RESPONSE_FINALIZED'
        );
      }
      
      console.log(`[DIRECTOR WORKFLOW] Réponse finalisée avec succès`);
      return correspondance;
      
    } catch (error) {
      console.error('[DIRECTOR WORKFLOW] Erreur lors de la finalisation:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer les correspondances en attente de validation du directeur
   * @param {string} directorId - ID du directeur
   */
  static async getPendingValidations(directorId) {
    try {
      const director = await User.findById(directorId);
      if (!director || !director.isDirector()) {
        throw new Error('Accès réservé aux directeurs');
      }
      
      const filter = {
        $or: [
          { directorValidation: 'PENDING', responseProposal: { $exists: true, $ne: '' } },
          { directorValidation: 'NEEDS_REVISION' }
        ]
      };
      
      // Si ce n'est pas le directeur général, filtrer par aéroport
      if (director.role !== 'DIRECTEUR_GENERAL') {
        filter.airport = director.airport;
      }
      
      const correspondances = await Correspondance.find(filter)
        .populate('responseProposalBy', 'firstName lastName email')
        .populate('personnesConcernees', 'firstName lastName email')
        .populate('authorId', 'firstName lastName email')
        .sort({ responseProposalDate: -1 });
      
      return correspondances;
      
    } catch (error) {
      console.error('[DIRECTOR WORKFLOW] Erreur lors de la récupération des validations en attente:', error);
      throw error;
    }
  }
}

module.exports = DirectorWorkflowService;
