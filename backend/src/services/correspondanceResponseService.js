const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

/**
 * Service pour gérer les liaisons entre correspondances et réponses
 */
class CorrespondanceResponseService {

  /**
   * Crée une réponse liée à une correspondance originale
   */
  async createResponse(originalCorrespondanceId, responseData, authorId) {
    try {
      // Vérifier que la correspondance originale existe
      const originalCorrespondance = await Correspondance.findById(originalCorrespondanceId);
      if (!originalCorrespondance) {
        throw new Error('Correspondance originale non trouvée');
      }

      // Créer la réponse
      const response = new Correspondance({
        ...responseData,
        type: 'OUTGOING', // Les réponses sont toujours sortantes
        isResponse: true,
        originalCorrespondanceId: originalCorrespondanceId,
        parentCorrespondanceId: originalCorrespondanceId,
        author: authorId,
        responseDate: new Date(),
        status: 'REPLIED'
      });

      await response.save();

      // Mettre à jour la correspondance originale
      await Correspondance.findByIdAndUpdate(originalCorrespondanceId, {
        $push: { childCorrespondanceIds: response._id },
        $set: {
          status: 'REPLIED',
          responseDate: new Date(),
          responseReference: responseData.responseReference
        }
      });

      // Populer les données pour le retour
      await response.populate('author', 'firstName lastName email');
      await response.populate('originalCorrespondanceId', 'title subject priority');

      return response;

    } catch (error) {
      console.error('Erreur createResponse:', error);
      throw error;
    }
  }

  /**
   * Récupère une correspondance avec ses réponses
   */
  async getCorrespondanceWithResponses(correspondanceId) {
    try {
      const correspondance = await Correspondance.findById(correspondanceId)
        .populate('author', 'firstName lastName email')
        .populate('childCorrespondanceIds')
        .populate({
          path: 'childCorrespondanceIds',
          populate: {
            path: 'author',
            select: 'firstName lastName email'
          }
        });

      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      return {
        original: correspondance,
        responses: correspondance.childCorrespondanceIds || [],
        hasResponses: correspondance.childCorrespondanceIds?.length > 0
      };

    } catch (error) {
      console.error('Erreur getCorrespondanceWithResponses:', error);
      throw error;
    }
  }

  /**
   * Récupère une réponse avec sa correspondance originale
   */
  async getResponseWithOriginal(responseId) {
    try {
      const response = await Correspondance.findById(responseId)
        .populate('author', 'firstName lastName email')
        .populate('originalCorrespondanceId')
        .populate({
          path: 'originalCorrespondanceId',
          populate: {
            path: 'author',
            select: 'firstName lastName email'
          }
        });

      if (!response) {
        throw new Error('Réponse non trouvée');
      }

      if (!response.isResponse) {
        throw new Error('Cette correspondance n\'est pas une réponse');
      }

      return {
        response: response,
        original: response.originalCorrespondanceId,
        isLinked: !!response.originalCorrespondanceId
      };

    } catch (error) {
      console.error('Erreur getResponseWithOriginal:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les correspondances d'une chaîne (originale + toutes les réponses)
   */
  async getCorrespondanceChain(correspondanceId) {
    try {
      // Trouver la correspondance
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      let originalId = correspondanceId;

      // Si c'est une réponse, trouver l'originale
      if (correspondance.isResponse && correspondance.originalCorrespondanceId) {
        originalId = correspondance.originalCorrespondanceId;
      }

      // Récupérer l'originale avec toutes ses réponses
      const chain = await this.getCorrespondanceWithResponses(originalId);

      // Trier les réponses par date
      if (chain.responses) {
        chain.responses.sort((a, b) => new Date(a.responseDate) - new Date(b.responseDate));
      }

      return {
        original: chain.original,
        responses: chain.responses,
        totalInChain: 1 + (chain.responses?.length || 0),
        currentCorrespondanceId: correspondanceId
      };

    } catch (error) {
      console.error('Erreur getCorrespondanceChain:', error);
      throw error;
    }
  }

  /**
   * Marque une correspondance comme ayant reçu une réponse
   */
  async markAsReplied(correspondanceId, responseReference = null) {
    try {
      const updateData = {
        status: 'REPLIED',
        responseDate: new Date()
      };

      if (responseReference) {
        updateData.responseReference = responseReference;
      }

      const correspondance = await Correspondance.findByIdAndUpdate(
        correspondanceId,
        updateData,
        { new: true }
      );

      return correspondance;

    } catch (error) {
      console.error('Erreur markAsReplied:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des réponses pour le dashboard superviseur
   */
  async getResponseStatistics(timeframe = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const stats = await Correspondance.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCorrespondances: { $sum: 1 },
            totalResponses: {
              $sum: {
                $cond: [{ $eq: ['$isResponse', true] }, 1, 0]
              }
            },
            totalReplied: {
              $sum: {
                $cond: [{ $eq: ['$status', 'REPLIED'] }, 1, 0]
              }
            },
            totalPending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalCorrespondances: 0,
        totalResponses: 0,
        totalReplied: 0,
        totalPending: 0
      };

      // Calculer le taux de réponse
      const responseRate = result.totalCorrespondances > 0 
        ? Math.round((result.totalReplied / result.totalCorrespondances) * 100)
        : 0;

      return {
        ...result,
        responseRate,
        timeframe,
        startDate
      };

    } catch (error) {
      console.error('Erreur getResponseStatistics:', error);
      throw error;
    }
  }

  /**
   * Valide qu'une correspondance peut recevoir une réponse
   */
  async canReceiveResponse(correspondanceId) {
    try {
      const correspondance = await Correspondance.findById(correspondanceId);
      
      if (!correspondance) {
        return { canRespond: false, reason: 'Correspondance non trouvée' };
      }

      if (correspondance.isResponse) {
        return { canRespond: false, reason: 'Impossible de répondre à une réponse' };
      }

      if (correspondance.status === 'REPLIED') {
        return { canRespond: true, reason: 'Correspondance déjà répondue, mais peut recevoir des réponses supplémentaires' };
      }

      if (correspondance.status === 'INFORMATIF') {
        return { canRespond: false, reason: 'Les correspondances informatives ne nécessitent pas de réponse' };
      }

      return { canRespond: true, reason: 'Correspondance peut recevoir une réponse' };

    } catch (error) {
      console.error('Erreur canReceiveResponse:', error);
      return { canRespond: false, reason: 'Erreur lors de la vérification' };
    }
  }
}

module.exports = new CorrespondanceResponseService();
