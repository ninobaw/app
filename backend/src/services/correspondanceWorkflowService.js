const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const { CorrespondenceWorkflow } = require('../models/CorrespondenceWorkflow');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const EmailNotificationService = require('./emailNotificationService');

/**
 * Service de workflow pour les correspondances - Proposition de réponse et va-et-vient avec DG
 */
class CorrespondanceWorkflowService {

  /**
   * États du workflow de réponse
   */
  static WORKFLOW_STATES = {
    PENDING: 'PENDING',                    // En attente d'assignation
    ASSIGNED_TO_DIRECTOR: 'ASSIGNED_TO_DIRECTOR',  // Assignée au directeur
    DIRECTOR_DRAFT: 'DIRECTOR_DRAFT',      // Proposition de réponse créée
    DG_REVIEW: 'DG_REVIEW',               // En révision par le DG
    DG_FEEDBACK: 'DG_FEEDBACK',           // Feedback du DG donné
    DIRECTOR_REVISION: 'DIRECTOR_REVISION', // Révision par le directeur
    DG_APPROVED: 'DG_APPROVED',           // Approuvée par le DG
    SUPERVISOR_NOTIFIED: 'SUPERVISOR_NOTIFIED', // Superviseur notifié
    RESPONSE_PREPARED: 'RESPONSE_PREPARED', // Réponse préparée
    RESPONSE_SENT: 'RESPONSE_SENT'        // Réponse envoyée
  };

  /**
   * Crée automatiquement un workflow pour une correspondance
   */
  static async createWorkflowForCorrespondance(correspondanceId, createdBy) {
    try {
      console.log(`🔄 [Workflow] Création workflow pour correspondance: ${correspondanceId}`);
      
      // Vérifier si le workflow existe déjà
      const existingWorkflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
      if (existingWorkflow) {
        console.log(`ℹ️ [Workflow] Workflow déjà existant: ${existingWorkflow._id}`);
        return existingWorkflow;
      }

      // Récupérer la correspondance
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      // Trouver le directeur assigné et le DG
      const assignedDirector = correspondance.personnesConcernees?.[0]; // Premier directeur assigné
      const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
      
      if (!assignedDirector) {
        console.log(`⚠️ [Workflow] Aucun directeur assigné à la correspondance ${correspondanceId}`);
        return null;
      }

      if (!dg) {
        console.log(`⚠️ [Workflow] Aucun DG trouvé dans le système`);
        return null;
      }

      // Créer le workflow
      const workflow = new CorrespondenceWorkflow({
        correspondanceId,
        currentStatus: 'ASSIGNED_TO_DIRECTOR',
        createdBy,
        bureauOrdreAgent: createdBy,
        superviseurBureauOrdre: createdBy, // Temporaire
        assignedDirector,
        directeurGeneral: dg._id,
        priority: correspondance.priority || 'MEDIUM',
        chatMessages: []
      });

      await workflow.save();
      console.log(`✅ [Workflow] Workflow créé avec succès: ${workflow._id}`);
      return workflow;
      
    } catch (error) {
      console.error(`❌ [Workflow] Erreur création workflow:`, error);
      throw error;
    }
  }

  /**
   * Crée une proposition de réponse par un directeur
   */
  static async createResponseDraft(correspondanceId, directorId, draftData) {
    try {
      const { responseContent, attachments = [], comments = '', isUrgent = false } = draftData;

      console.log(`📝 [Workflow] Création draft pour correspondance: ${correspondanceId} par directeur: ${directorId}`);

      // Vérifier que la correspondance existe
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      // Trouver ou créer le workflow
      let workflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
      if (!workflow) {
        console.log(`🔄 [Workflow] Création nouveau workflow pour correspondance ${correspondanceId}`);
        
        // Trouver le DG
        const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL', isActive: true });
        if (!dg) {
          throw new Error('Aucun Directeur Général actif trouvé');
        }

        workflow = new CorrespondenceWorkflow({
          correspondanceId,
          assignedDirector: directorId,
          directeurGeneral: dg._id,
          currentStatus: this.WORKFLOW_STATES.DIRECTOR_DRAFT,
          responseDrafts: [],
          chatMessages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Vérifier que le directeur est bien un directeur
      const director = await User.findById(directorId);
      if (!director || !director.isDirector()) {
        throw new Error('Utilisateur non autorisé');
      }

      // Créer ou mettre à jour la proposition de réponse
      const responseDraft = {
        id: new mongoose.Types.ObjectId(),
        directorId: directorId,
        directorName: `${director.firstName} ${director.lastName}`,
        directorate: director.directorate,
        responseContent,
        attachments,
        comments,
        isUrgent,
        status: 'PENDING_DG_REVIEW', // ✅ CORRECTION CRITIQUE : Status pour visibilité DG
        createdAt: new Date(),
        updatedAt: new Date(),
        dgFeedbacks: [],
        revisionHistory: []
      };

      console.log(`📝 [Workflow] Draft créé avec status: ${responseDraft.status}`);

      // ✅ MODÈLE UNIFIÉ: Utiliser uniquement Correspondance.responseDrafts
      console.log(`📝 [Workflow] Ajout draft à la correspondance (modèle unifié)...`);
      
      // Initialiser responseDrafts si nécessaire
      if (!correspondance.responseDrafts) {
        correspondance.responseDrafts = [];
      }

      // Remplacer ou ajouter le draft dans la correspondance
      const existingDraftIndex = correspondance.responseDrafts.findIndex(
        draft => draft.directorId.toString() === directorId.toString()
      );

      if (existingDraftIndex >= 0) {
        correspondance.responseDrafts[existingDraftIndex] = responseDraft;
        console.log(`🔄 [Workflow] Draft mis à jour par ${director.firstName} ${director.lastName}`);
      } else {
        correspondance.responseDrafts.push(responseDraft);
        console.log(`➕ [Workflow] Nouveau draft créé par ${director.firstName} ${director.lastName}`);
      }

      console.log(`💬 [Workflow] Commentaires sauvegardés:`, {
        comments: comments || 'Aucun commentaire',
        responseContentLength: responseContent?.length || 0,
        isUrgent,
        directorName: director.firstName + ' ' + director.lastName
      });

      // Mettre à jour les statuts (workflow et correspondance synchronisés)
      const newStatus = this.WORKFLOW_STATES.DIRECTOR_DRAFT;
      correspondance.workflowStatus = newStatus;
      correspondance.updatedAt = new Date();
      
      // Mettre à jour aussi le workflow pour cohérence
      workflow.currentStatus = newStatus;
      workflow.updatedAt = new Date();
      
      // Sauvegarder les deux modèles
      correspondance.markModified('responseDrafts');
      await correspondance.save();
      await workflow.save();
      
      console.log(`✅ [Workflow] Correspondance mise à jour avec ${correspondance.responseDrafts.length} draft(s)`);

      // ✅ CORRECTION : Notification DG (optionnelle)
      try {
        console.log(`📧 [Workflow] Notification DG: Nouvelle proposition de ${director.firstName} ${director.lastName}`);
        // TODO: Implémenter notification email/push si nécessaire
      } catch (notificationError) {
        console.warn('⚠️ [Workflow] Erreur notification DG:', notificationError.message);
      }

      console.log(`📝 [Workflow] Proposition de réponse créée pour la correspondance ${correspondanceId}`);
      console.log(`👑 [Workflow] DG assigné: ${workflow.directeurGeneral}`);
      console.log(`📋 [Workflow] Status: ${workflow.currentStatus}`);

      return {
        success: true,
        message: 'Proposition de réponse créée avec succès',
        data: {
          correspondanceId,
          workflowId: workflow._id,
          draftId: responseDraft.id,
          workflowStatus: workflow.currentStatus
        }
      };

    } catch (error) {
      console.error('❌ [Workflow] Erreur création proposition de réponse:', error);
      throw error;
    }
  }

  /**
   * Le DG donne son feedback sur une proposition de réponse
   */
  static async provideDGFeedback(correspondanceId, draftIndex, dgId, feedbackData) {
    try {
      const { action, feedback, revisionRequests = [], isApproved = false } = feedbackData;

      // Vérifier que l'utilisateur est le DG
      const dg = await User.findById(dgId);
      if (!dg || dg.role !== 'DIRECTEUR_GENERAL') {
        throw new Error('Seul le Directeur Général peut donner un feedback');
      }

      // ✅ MODÈLE UNIFIÉ : Utiliser Correspondance.responseDrafts comme source unique
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      // Récupérer aussi le workflow pour les métadonnées
      const workflow = await CorrespondenceWorkflow.findOne({ correspondanceId });
      if (!workflow) {
        throw new Error('Workflow non trouvé');
      }

      // ✅ MODÈLE UNIFIÉ : Vérifier que la proposition existe dans la correspondance
      if (!correspondance.responseDrafts || !correspondance.responseDrafts[draftIndex]) {
        throw new Error('Proposition de réponse non trouvée');
      }

      const draft = correspondance.responseDrafts[draftIndex];

      // Ajouter le feedback du DG
      const dgFeedback = {
        dgId,
        dgName: `${dg.firstName} ${dg.lastName}`,
        action, // 'APPROVE', 'REQUEST_REVISION', 'REJECT'
        feedback,
        revisionRequests,
        isApproved,
        createdAt: new Date()
      };

      if (!draft.dgFeedbacks) {
        draft.dgFeedbacks = [];
      }
      draft.dgFeedbacks.push(dgFeedback);
      
      console.log(`👑 [Workflow] Feedback DG ajouté:`, {
        action,
        feedback: feedback || 'Aucun feedback',
        revisionRequestsCount: revisionRequests?.length || 0,
        feedbackHistoryCount: draft.dgFeedbacks.length,
        dgName: dg.firstName + ' ' + dg.lastName
      });

      console.log(`📝 [Workflow] Draft après ajout feedback:`, {
        draftStatus: draft.status,
        dgFeedbacksCount: draft.dgFeedbacks?.length || 0,
        workflowDraftsCount: workflow.responseDrafts?.length || 0
      });

      // Mettre à jour le statut selon l'action
      let newStatus;
      let notificationMessage;

      switch (action) {
        case 'APPROVE':
          draft.status = 'APPROVED';
          newStatus = this.WORKFLOW_STATES.DG_APPROVED;
          notificationMessage = 'Votre proposition de réponse a été approuvée par le Directeur Général';
          // Notifier le superviseur bureau d'ordre
          await this.notifySupervisorForFinalResponse(correspondance);
          break;

        case 'REQUEST_REVISION':
          draft.status = 'REVISION_REQUESTED';
          newStatus = this.WORKFLOW_STATES.DG_FEEDBACK;
          notificationMessage = 'Le Directeur Général demande des révisions sur votre proposition de réponse';
          break;

        case 'REJECT':
          draft.status = 'REJECTED';
          newStatus = this.WORKFLOW_STATES.DG_FEEDBACK;
          notificationMessage = 'Votre proposition de réponse a été rejetée par le Directeur Général';
          break;

        default:
          throw new Error('Action non valide');
      }

      // ✅ MODÈLE UNIFIÉ : Sauvegarder les drafts dans la correspondance (source unique)
      correspondance.workflowStatus = newStatus;
      correspondance.updatedAt = new Date();
      correspondance.markModified('responseDrafts');
      await correspondance.save();

      // Mettre à jour aussi le workflow pour cohérence des métadonnées
      await CorrespondenceWorkflow.updateOne(
        { _id: workflow._id },
        {
          $set: {
            currentStatus: newStatus,
            updatedAt: new Date()
          }
        }
      );

      // Notifier le directeur du feedback
      await this.notifyDirectorOfFeedback(correspondance, draft.directorId, notificationMessage, dgFeedback);

      console.log(`👑 [Workflow] DG feedback donné: ${action} pour la correspondance ${correspondanceId}`);

      return {
        success: true,
        message: 'Feedback enregistré avec succès',
        data: {
          correspondanceId,
          draftIndex,
          action,
          workflowStatus: correspondance.workflowStatus
        }
      };

    } catch (error) {
      console.error('❌ [Workflow] Erreur feedback DG:', error);
      throw error;
    }
  }

  /**
   * Le directeur révise sa proposition selon le feedback du DG
   */
  static async reviseResponseDraft(correspondanceId, draftIndex, directorId, revisionData) {
    try {
      const { responseContent, attachments = [], revisionComments = '' } = revisionData;

      // Récupérer la correspondance
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      // Vérifier que la proposition existe
      if (!correspondance.responseDrafts || !correspondance.responseDrafts[draftIndex]) {
        throw new Error('Proposition de réponse non trouvée');
      }

      const draft = correspondance.responseDrafts[draftIndex];

      // Vérifier que c'est le bon directeur
      if (draft.directorId.toString() !== directorId.toString()) {
        throw new Error('Non autorisé à modifier cette proposition');
      }

      // Vérifier que des révisions sont demandées
      if (draft.status !== 'REVISION_REQUESTED') {
        throw new Error('Aucune révision demandée pour cette proposition');
      }

      // Sauvegarder le contenu précédent avant modification
      const previousContent = draft.responseContent;

      // Mettre à jour la proposition
      draft.responseContent = responseContent;
      draft.attachments = attachments;
      draft.revisionComments = revisionComments;
      draft.status = 'REVISED';
      draft.updatedAt = new Date();

      // Ajouter l'historique de révision
      if (!draft.revisionHistory) {
        draft.revisionHistory = [];
      }
      
      const revisionEntry = {
        revisionDate: new Date(),
        revisionComments,
        previousContent // Utiliser la valeur sauvegardée
      };
      
      draft.revisionHistory.push(revisionEntry);
      
      console.log(`📝 [Workflow] Ajout à l'historique de révision:`, {
        revisionComments,
        previousContentLength: previousContent?.length || 0,
        newContentLength: responseContent?.length || 0,
        historyCount: draft.revisionHistory.length
      });

      correspondance.workflowStatus = this.WORKFLOW_STATES.DIRECTOR_REVISION;
      correspondance.updatedAt = new Date();

      // Marquer le document comme modifié pour forcer la sauvegarde
      correspondance.markModified('responseDrafts');
      await correspondance.save();

      // Notifier le DG de la révision
      await this.notifyDGOfRevision(correspondance, draft);

      console.log(`🔄 [Workflow] Proposition révisée par le directeur pour la correspondance ${correspondanceId}`);

      return {
        success: true,
        message: 'Proposition révisée avec succès',
        data: {
          correspondanceId,
          draftIndex,
          workflowStatus: correspondance.workflowStatus
        }
      };

    } catch (error) {
      console.error('❌ [Workflow] Erreur révision proposition:', error);
      throw error;
    }
  }

  /**
   * Finalise la réponse (par le superviseur bureau d'ordre)
   */
  static async finalizeResponse(correspondanceId, supervisorId, finalData) {
    try {
      const { 
        finalResponseContent, 
        attachments = [], 
        sendMethod = 'EMAIL',
        recipientEmail,
        recipientAddress,
        deliveryMethod = 'EMAIL', // EMAIL, POSTAL, HAND_DELIVERY
        trackingNumber,
        deliveryNotes,
        outgoingCorrespondance = {}
      } = finalData;

      // Vérifier que l'utilisateur est superviseur bureau d'ordre
      const supervisor = await User.findById(supervisorId);
      if (!supervisor || supervisor.role !== 'SUPERVISEUR_BUREAU_ORDRE') {
        throw new Error('Seul le superviseur bureau d\'ordre peut finaliser la réponse');
      }

      // Récupérer la correspondance
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      // Vérifier qu'il y a une proposition approuvée
      const approvedDraft = correspondance.responseDrafts?.find(draft => draft.status === 'APPROVED');
      if (!approvedDraft) {
        throw new Error('Aucune proposition de réponse approuvée trouvée');
      }

      // Créer la réponse finale avec informations complètes
      const finalResponse = {
        id: require('uuid').v4(),
        supervisorId,
        supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
        finalResponseContent,
        attachments, // Pièces jointes de la réponse
        dischargeFiles: finalData.dischargeFiles || [], // Fichiers de décharge/accusé de réception
        sendMethod,
        deliveryMethod,
        recipientEmail,
        recipientAddress,
        trackingNumber,
        deliveryNotes,
        basedOnDraft: {
          draftId: approvedDraft.id,
          directorId: approvedDraft.directorId,
          directorName: approvedDraft.directorName,
          originalContent: approvedDraft.responseContent,
          dgApproval: approvedDraft.dgFeedbacks?.find(f => f.action === 'APPROVE')
        },
        sentAt: new Date(),
        status: 'SENT',
        deliveryStatus: 'PENDING', // PENDING, DELIVERED, FAILED
        readStatus: 'UNREAD', // UNREAD, READ, ACKNOWLEDGED
        metadata: {
          originalCorrespondanceId: correspondanceId,
          workflowCompletedAt: new Date(),
          totalProcessingTime: new Date() - new Date(correspondance.createdAt),
          participantsCount: correspondance.personnesConcernees?.length || 0
        }
      };

      // Mettre à jour la correspondance avec la liaison
      correspondance.finalResponse = finalResponse;
      correspondance.workflowStatus = this.WORKFLOW_STATES.RESPONSE_SENT;
      correspondance.status = 'REPLIED';
      correspondance.responseDate = new Date();
      correspondance.updatedAt = new Date();
      
      // Ajouter des métadonnées de traçabilité
      correspondance.processingHistory = correspondance.processingHistory || [];
      correspondance.processingHistory.push({
        action: 'RESPONSE_FINALIZED',
        userId: supervisorId,
        userName: `${supervisor.firstName} ${supervisor.lastName}`,
        timestamp: new Date(),
        details: {
          deliveryMethod,
          attachmentsCount: attachments.length,
          dischargeFilesCount: (finalData.dischargeFiles || []).length,
          trackingNumber
        }
      });

      await correspondance.save();

      // Créer une entrée séparée pour la réponse (pour faciliter les requêtes)
      // const ResponseModel = require('../models/Response'); // Modèle non créé - commenté
      // Création d'un enregistrement de réponse (modèle Response non disponible)
      console.log('📝 [Workflow] Réponse finalisée:', {
        id: finalResponse.id,
        correspondanceId,
        supervisorId,
        content: finalResponseContent.substring(0, 100) + '...',
        attachmentsCount: attachments.length,
        deliveryMethod
      });

      // await responseRecord.save(); // Commenté car modèle Response non disponible

      console.log('✅ [Workflow] Finalisation terminée avec succès');

      return {
        success: true,
        message: 'Réponse finalisée et envoyée avec succès',
        data: {
          correspondanceId,
          finalResponseId: finalResponse.id,
          workflowStatus: correspondance.workflowStatus,
          responseDate: correspondance.responseDate,
          deliveryMethod,
          attachmentsCount: attachments.length
        }
      };

    } catch (error) {
      console.error('❌ [Workflow] Erreur finalisation réponse:', error);
      throw error;
    }
  }

  /**
   * Notifications privées
   */

  // Notifier le DG qu'une proposition est prête pour révision
  static async notifyDGForReview(correspondance, director) {
    try {
      const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL', isActive: true });
      if (!dg) return;

      const notification = {
        type: 'RESPONSE_DRAFT_READY',
        title: 'Nouvelle proposition de réponse à réviser',
        message: `${director.firstName} ${director.lastName} a créé une proposition de réponse pour "${correspondance.subject}"`,
        correspondanceId: correspondance._id,
        priority: correspondance.priority
      };

      await NotificationService.sendNotification(dg._id, notification);
      await EmailNotificationService.sendEmail(dg.email, 'Nouvelle proposition de réponse', notification.message);

    } catch (error) {
      console.error('❌ [Workflow] Erreur notification DG:', error);
    }
  }

  // Notifier le directeur du feedback du DG
  static async notifyDirectorOfFeedback(correspondance, directorId, message, feedback) {
    try {
      const notification = {
        type: 'DG_FEEDBACK_RECEIVED',
        title: 'Feedback du Directeur Général',
        message,
        correspondanceId: correspondance._id,
        feedback
      };

      await NotificationService.sendNotification(directorId, notification);
      
      const director = await User.findById(directorId);
      if (director) {
        await EmailNotificationService.sendEmail(director.email, 'Feedback du Directeur Général', message);
      }

    } catch (error) {
      console.error('❌ [Workflow] Erreur notification directeur:', error);
    }
  }

  // Notifier le DG d'une révision
  static async notifyDGOfRevision(correspondance, draft) {
    try {
      const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL', isActive: true });
      if (!dg) return;

      const notification = {
        type: 'DRAFT_REVISED',
        title: 'Proposition de réponse révisée',
        message: `La proposition de réponse pour "${correspondance.subject}" a été révisée et est prête pour une nouvelle révision`,
        correspondanceId: correspondance._id
      };

      await NotificationService.sendNotification(dg._id, notification);
      await EmailNotificationService.sendEmail(dg.email, 'Proposition révisée', notification.message);

    } catch (error) {
      console.error('❌ [Workflow] Erreur notification révision DG:', error);
    }
  }

  // Notifier le superviseur pour la finalisation
  static async notifySupervisorForFinalResponse(correspondance) {
    try {
      const supervisor = await User.findOne({ role: 'SUPERVISEUR_BUREAU_ORDRE', isActive: true });
      if (!supervisor) return;

      const notification = {
        type: 'RESPONSE_APPROVED_FOR_SENDING',
        title: 'Réponse approuvée - Prête à envoyer',
        message: `La réponse pour "${correspondance.subject}" a été approuvée par le DG et est prête à être finalisée`,
        correspondanceId: correspondance._id
      };

      await NotificationService.sendNotification(supervisor._id, notification);
      await EmailNotificationService.sendEmail(supervisor.email, 'Réponse à finaliser', notification.message);

    } catch (error) {
      console.error('❌ [Workflow] Erreur notification superviseur:', error);
    }
  }

  // Notifier que la réponse a été envoyée
  static async notifyResponseSent(correspondance) {
    try {
      // Notifier toutes les personnes concernées
      const notifications = correspondance.personnesConcernees.map(async (personId) => {
        const notification = {
          type: 'RESPONSE_SENT',
          title: 'Réponse envoyée',
          message: `La réponse à "${correspondance.subject}" a été finalisée et envoyée`,
          correspondanceId: correspondance._id
        };

        await NotificationService.sendNotification(personId, notification);
      });

      await Promise.all(notifications);

    } catch (error) {
      console.error('❌ [Workflow] Erreur notification réponse envoyée:', error);
    }
  }

  /**
   * Obtient l'état du workflow d'une correspondance
   */
  static async getWorkflowStatus(correspondanceId) {
    try {
      const correspondance = await Correspondance.findById(correspondanceId)
        .populate('personnesConcernees', 'firstName lastName role directorate')
        .populate('responseDrafts.directorId', 'firstName lastName role directorate');

      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      return {
        success: true,
        data: {
          correspondanceId,
          workflowStatus: correspondance.workflowStatus || this.WORKFLOW_STATES.PENDING,
          responseDrafts: correspondance.responseDrafts || [],
          finalResponse: correspondance.finalResponse,
          personnesConcernees: correspondance.personnesConcernees,
          timeline: this.generateWorkflowTimeline(correspondance)
        }
      };

    } catch (error) {
      console.error('❌ [Workflow] Erreur récupération statut workflow:', error);
      throw error;
    }
  }

  /**
   * Génère la timeline du workflow
   */
  static generateWorkflowTimeline(correspondance) {
    const timeline = [];

    // Création de la correspondance
    timeline.push({
      step: 'CREATED',
      title: 'Correspondance créée',
      date: correspondance.createdAt,
      status: 'completed'
    });

    // Assignation
    if (correspondance.personnesConcernees && correspondance.personnesConcernees.length > 0) {
      timeline.push({
        step: 'ASSIGNED',
        title: 'Assignée aux directeurs',
        date: correspondance.createdAt,
        status: 'completed'
      });
    }

    // Propositions de réponse
    if (correspondance.responseDrafts && correspondance.responseDrafts.length > 0) {
      correspondance.responseDrafts.forEach((draft, index) => {
        timeline.push({
          step: 'DRAFT_CREATED',
          title: `Proposition de ${draft.directorName}`,
          date: draft.createdAt,
          status: 'completed'
        });

        // Feedbacks du DG
        if (draft.dgFeedbacks && draft.dgFeedbacks.length > 0) {
          draft.dgFeedbacks.forEach(feedback => {
            timeline.push({
              step: 'DG_FEEDBACK',
              title: `Feedback DG: ${feedback.action}`,
              date: feedback.createdAt,
              status: 'completed'
            });
          });
        }
      });
    }

    // Réponse finale
    if (correspondance.finalResponse) {
      timeline.push({
        step: 'RESPONSE_SENT',
        title: 'Réponse envoyée',
        date: correspondance.finalResponse.sentAt,
        status: 'completed'
      });
    }

    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Crée un message de chat pour une proposition de réponse
   */
  static async createChatMessageForDraft(workflowId, draft, draftIndex) {
    try {
      const WorkflowChatMessage = require('../models/WorkflowChatMessage');
      
      // Vérifier si un message existe déjà pour ce draft
      const existingMessage = await WorkflowChatMessage.findOne({
        workflowId,
        messageType: 'DRAFT_PROPOSAL',
        draftIndex
      });
      
      if (existingMessage) {
        console.log(`💬 [Workflow] Message chat déjà existant pour draft ${draftIndex}`);
        return;
      }
      
      // Créer le message de chat
      const chatMessage = new WorkflowChatMessage({
        workflowId,
        senderId: draft.directorId,
        senderName: draft.directorName,
        senderRole: 'DIRECTEUR',
        content: `📝 **Proposition de réponse**\n\n${draft.responseContent}${draft.comments ? `\n\n**Commentaires :** ${draft.comments}` : ''}`,
        attachments: draft.attachments || [],
        messageType: 'DRAFT_PROPOSAL',
        draftIndex,
        isRead: false,
        createdAt: draft.createdAt || new Date(),
        updatedAt: draft.updatedAt || new Date()
      });
      
      await chatMessage.save();
      console.log(`💬 [Workflow] Message chat créé pour draft ${draftIndex} par ${draft.directorName}`);
      
    } catch (error) {
      console.error('❌ [Workflow] Erreur création message chat:', error);
      // Ne pas faire échouer le processus principal
    }
  }

  /**
   * Créer une correspondance sortante liée à la correspondance originale
   */
  static async createOutgoingCorrespondance(originalCorrespondance, finalResponse, supervisor) {
    try {
      console.log(`📤 [Workflow] Création correspondance sortante pour ${originalCorrespondance._id}`);
      
      const Correspondance = require('../models/Correspondance');
      
      // Extraire les informations de correspondance sortante
      const outgoingInfo = finalResponse.outgoingCorrespondance || {};
      
      // Créer la correspondance sortante
      const outgoingCorrespondance = new Correspondance({
        title: `Réponse: ${originalCorrespondance.title || originalCorrespondance.subject}`,
        type: 'OUTGOING',
        from_address: supervisor.email || 'bureau.ordre@tav.aero',
        to_address: finalResponse.recipientEmail || originalCorrespondance.from_address,
        subject: outgoingInfo.subject || `RE: ${originalCorrespondance.subject}`,
        code: outgoingInfo.code || `REP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        content: finalResponse.finalResponseContent,
        priority: outgoingInfo.priority || originalCorrespondance.priority || 'MEDIUM',
        tags: outgoingInfo.tags || originalCorrespondance.tags || [],
        airport: originalCorrespondance.airport || 'ENFIDHA',
        
        // Informations de liaison
        parentCorrespondanceId: originalCorrespondance._id,
        responseToCorrespondanceId: originalCorrespondance._id,
        
        // Informations de workflow
        workflowStatus: 'RESPONSE_SENT',
        status: 'REPLIED',
        
        // Informations de livraison
        deliveryMethod: finalResponse.deliveryMethod,
        trackingNumber: finalResponse.trackingNumber,
        deliveryNotes: finalResponse.deliveryNotes,
        
        // Pièces jointes et fichiers
        file_path: finalResponse.attachments?.[0]?.path,
        file_type: finalResponse.attachments?.[0]?.type,
        attachments: finalResponse.attachments || [],
        
        // Métadonnées
        createdBy: supervisor._id,
        assignedTo: supervisor._id,
        responseDate: finalResponse.sentAt,
        
        // Informations de traçabilité
        processingHistory: [{
          action: 'OUTGOING_CORRESPONDENCE_CREATED',
          userId: supervisor._id,
          userName: `${supervisor.firstName} ${supervisor.lastName}`,
          timestamp: new Date(),
          details: {
            basedOnResponse: finalResponse.id,
            originalCorrespondanceId: originalCorrespondance._id,
            deliveryMethod: finalResponse.deliveryMethod,
            attachmentsCount: finalResponse.attachments?.length || 0
          }
        }],
        
        // Métadonnées spécifiques
        metadata: {
          isResponse: true,
          originalCorrespondanceId: originalCorrespondance._id,
          responseId: finalResponse.id,
          workflowCompletedAt: finalResponse.sentAt,
          supervisorId: supervisor._id,
          deliveryMethod: finalResponse.deliveryMethod
        }
      });
      
      await outgoingCorrespondance.save();
      
      console.log(`✅ [Workflow] Correspondance sortante créée: ${outgoingCorrespondance._id}`);
      
      return outgoingCorrespondance;
      
    } catch (error) {
      console.error('❌ [Workflow] Erreur création correspondance sortante:', error);
      // Ne pas faire échouer le processus principal, juste logger l'erreur
      return null;
    }
  }
}

module.exports = CorrespondanceWorkflowService;
