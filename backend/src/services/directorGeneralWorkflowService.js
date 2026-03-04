const { CorrespondenceWorkflow } = require('../models/CorrespondenceWorkflow');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Service unifié pour la gestion des workflows du Directeur Général
 */
class DirectorGeneralWorkflowService {

  /**
   * Récupère toutes les correspondances en attente de révision par le DG
   */
  static async getPendingCorrespondances(dgUserId) {
    try {
      console.log(`👑 [DG-Service] Recherche correspondances en attente pour DG: ${dgUserId}`);
      
      // Vérifier que l'utilisateur est bien DG
      const dgUser = await User.findById(dgUserId);
      if (!dgUser || dgUser.role !== 'DIRECTEUR_GENERAL') {
        throw new Error('Accès réservé au Directeur Général');
      }

      // Normaliser l'ID pour les comparaisons
      const dgObjectId = mongoose.Types.ObjectId.isValid(dgUserId) ? 
        new mongoose.Types.ObjectId(dgUserId) : dgUserId;

      console.log(`🔍 [DG-Service] Recherche avec ID: ${dgUserId} et ObjectId: ${dgObjectId}`);

      // 1. Trouver tous les workflows où le DG est assigné
      const dgWorkflows = await CorrespondenceWorkflow.find({
        $or: [
          { directeurGeneral: dgUserId },
          { directeurGeneral: dgObjectId },
          { directeurGeneral: dgUserId.toString() }
        ]
      })
      .populate('correspondanceId')
      .lean(); // ✅ AJOUT : .lean() pour récupérer les données brutes avec tous les champs

      console.log(`📋 [DG-Service] Total workflows avec DG assigné: ${dgWorkflows.length}`);

      if (dgWorkflows.length === 0) {
        console.log(`⚠️ [DG-Service] Aucun workflow trouvé pour ce DG`);
        return [];
      }

      // 2. Filtrer les workflows avec des drafts en attente - LOGIQUE COMPLÈTE
      const pendingWorkflows = dgWorkflows.filter(workflow => {
        // CRITÈRES : Tous les statuts où le DG doit avoir visibilité
        const statusNeedsDGVisibility = [
          'DIRECTOR_DRAFT',      // Nouvelle proposition à réviser
          'DIRECTOR_REVISION',   // Révision en cours (DG suit le progrès)
          'DG_REVIEW',          // En cours de révision par le DG
          'ASSIGNED_TO_DIRECTOR' // ✅ AJOUTÉ : Correspondance assignée à un directeur
        ].includes(workflow.currentStatus);

        // Vérifier aussi s'il y a des drafts en attente de révision DG
        const hasPendingDrafts = workflow.responseDrafts && 
          workflow.responseDrafts.some(draft => draft.status === 'PENDING_DG_REVIEW');

        console.log(`🔍 [DG-Service] Workflow ${workflow._id}:`);
        console.log(`   - Status: ${workflow.currentStatus}`);
        console.log(`   - Status nécessite visibilité DG: ${statusNeedsDGVisibility}`);
        console.log(`   - Drafts count: ${workflow.responseDrafts?.length || 0}`);
        console.log(`   - Drafts raw:`, workflow.responseDrafts ? 'EXISTE' : 'NULL');
        if (workflow.responseDrafts && workflow.responseDrafts.length > 0) {
          workflow.responseDrafts.forEach((draft, index) => {
            console.log(`     Draft ${index + 1}: ${draft.status} par ${draft.directorName}`);
          });
        }
        console.log(`   - Drafts en attente DG: ${hasPendingDrafts}`);

        // Le DG voit le workflow si :
        // 1. Le status nécessite sa visibilité OU
        // 2. Il y a des drafts en attente de sa révision
        const shouldBeVisible = statusNeedsDGVisibility || hasPendingDrafts;
        
        console.log(`   - ✅ Visible pour DG: ${shouldBeVisible}`);
        
        return shouldBeVisible;
      });

      console.log(`📋 [DG-Service] Workflows avec drafts en attente: ${pendingWorkflows.length}`);

      // 3. Extraire et enrichir les correspondances
      const correspondanceIds = pendingWorkflows
        .filter(w => w.correspondanceId)
        .map(w => w.correspondanceId._id);

      if (correspondanceIds.length === 0) {
        console.log(`⚠️ [DG-Service] Aucune correspondance trouvée dans les workflows`);
        return [];
      }

      // 4. Récupérer les correspondances complètes
      const correspondances = await Correspondance.find({ 
        _id: { $in: correspondanceIds } 
      })
        .populate('personnesConcernees', 'firstName lastName role directorate')
        .populate('responseDrafts.directorId', 'firstName lastName role directorate')
        .populate('responseDrafts.dgFeedbacks.dgId', 'firstName lastName role')
        .sort({ updatedAt: -1 });

      console.log(`✅ [DG-Service] Correspondances finales trouvées: ${correspondances.length}`);

      // 5. Enrichir avec les informations de workflow
      const enrichedCorrespondances = correspondances.map(corresp => {
        const relatedWorkflow = pendingWorkflows.find(w => 
          w.correspondanceId && w.correspondanceId._id.toString() === corresp._id.toString()
        );

        console.log(`🔍 [DG-Service] Enrichissement correspondance ${corresp._id}:`);
        console.log(`   - Workflow trouvé: ${!!relatedWorkflow}`);
        console.log(`   - Drafts dans workflow: ${relatedWorkflow?.responseDrafts?.length || 0}`);

        return {
          ...corresp.toObject(),
          // ✅ MODÈLE UNIFIÉ : Utiliser les drafts de la correspondance (source unique)
          responseDrafts: corresp.responseDrafts || [],
          workflowInfo: {
            workflowId: relatedWorkflow?._id,
            currentStatus: relatedWorkflow?.currentStatus,
            assignedDirector: relatedWorkflow?.assignedDirector,
            directeurGeneral: relatedWorkflow?.directeurGeneral,
            chatMessages: relatedWorkflow?.chatMessages?.length || 0,
            draftsCount: corresp.responseDrafts?.length || 0
          }
        };
      });

      return enrichedCorrespondances;

    } catch (error) {
      console.error('❌ [DG-Service] Erreur récupération correspondances:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques du dashboard DG
   */
  static async getDashboardStats(dgUserId) {
    try {
      console.log(`📊 [DG-Service] Calcul statistiques dashboard pour DG: ${dgUserId}`);

      const pendingCorrespondances = await this.getPendingCorrespondances(dgUserId);
      
      // Calculer les statistiques
      const stats = {
        totalPending: pendingCorrespondances.length,
        byStatus: {},
        byPriority: {},
        avgResponseTime: 0,
        criticalCount: 0
      };

      // Répartition par statut
      pendingCorrespondances.forEach(corresp => {
        const status = corresp.workflowInfo?.currentStatus || 'UNKNOWN';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        const priority = corresp.priorite || 'MEDIUM';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

        if (priority === 'URGENT' || priority === 'HIGH') {
          stats.criticalCount++;
        }
      });

      console.log(`📊 [DG-Service] Statistiques calculées:`, stats);
      return stats;

    } catch (error) {
      console.error('❌ [DG-Service] Erreur calcul statistiques:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le DG a accès à un workflow spécifique
   */
  static async hasWorkflowAccess(dgUserId, workflowId) {
    try {
      const workflow = await CorrespondenceWorkflow.findById(workflowId);
      if (!workflow) return false;

      // Normaliser les IDs pour comparaison
      const dgObjectId = mongoose.Types.ObjectId.isValid(dgUserId) ? 
        new mongoose.Types.ObjectId(dgUserId) : dgUserId;

      const hasAccess = 
        workflow.directeurGeneral?.toString() === dgUserId ||
        workflow.directeurGeneral?.toString() === dgObjectId.toString() ||
        workflow.directeurGeneral === dgUserId ||
        workflow.directeurGeneral === dgObjectId;

      console.log(`🔐 [DG-Service] Accès workflow ${workflowId} pour DG ${dgUserId}: ${hasAccess}`);
      return hasAccess;

    } catch (error) {
      console.error('❌ [DG-Service] Erreur vérification accès:', error);
      return false;
    }
  }
}

module.exports = DirectorGeneralWorkflowService;
