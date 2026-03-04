/**
 * Améliorations pour intégrer le workflow complet dans la création de correspondances
 */

// 1. AMÉLIORATION DU SERVICE DE CRÉATION DE CORRESPONDANCES
// Fichier: src/services/correspondanceService.js

const enhancedCorrespondenceCreation = {
  
  // Fonction améliorée pour créer une correspondance avec workflow automatique
  async createCorrespondenceWithWorkflow(correspondenceData, authorId) {
    try {
      console.log('📝 [Enhanced] Création correspondance avec workflow automatique');
      
      // 1. Créer la correspondance
      const correspondence = new Correspondance({
        ...correspondenceData,
        authorId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await correspondence.save();
      console.log(`✅ [Enhanced] Correspondance créée: ${correspondence._id}`);
      
      // 2. Créer automatiquement le workflow si des personnes sont assignées
      if (correspondenceData.personnesConcernees && correspondenceData.personnesConcernees.length > 0) {
        console.log('🔄 [Enhanced] Création workflow automatique...');
        
        const workflow = await CorrespondanceWorkflowService.createWorkflowForCorrespondance(
          correspondence._id.toString(),
          authorId
        );
        
        if (workflow) {
          console.log(`✅ [Enhanced] Workflow créé: ${workflow._id}`);
          
          // Mettre à jour le status de la correspondance
          correspondence.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
          await correspondence.save();
        }
      }
      
      return {
        success: true,
        data: {
          correspondence,
          workflowCreated: !!workflow
        }
      };
      
    } catch (error) {
      console.error('❌ [Enhanced] Erreur création correspondance:', error);
      throw error;
    }
  },

  // Fonction pour créer une correspondance avec proposition pré-remplie (optionnel)
  async createCorrespondenceWithDraft(correspondenceData, authorId, draftData = null) {
    try {
      // Créer la correspondance avec workflow
      const result = await this.createCorrespondenceWithWorkflow(correspondenceData, authorId);
      
      // Si des données de draft sont fournies, créer la proposition
      if (draftData && correspondenceData.personnesConcernees && correspondenceData.personnesConcernees.length > 0) {
        console.log('📝 [Enhanced] Création proposition automatique...');
        
        const directorId = correspondenceData.personnesConcernees[0]; // Premier directeur assigné
        
        const draftResult = await CorrespondanceWorkflowService.createResponseDraft(
          result.data.correspondence._id.toString(),
          directorId,
          draftData
        );
        
        if (draftResult.success) {
          console.log('✅ [Enhanced] Proposition créée automatiquement');
          result.data.draftCreated = true;
          result.data.draftId = draftResult.data.draftId;
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [Enhanced] Erreur création avec draft:', error);
      throw error;
    }
  }
};

// 2. AMÉLIORATION DE LA ROUTE DE CRÉATION
// Fichier: src/routes/correspondanceRoutes.js

const enhancedRouteHandler = {
  
  // Route améliorée POST /api/correspondances
  async createCorrespondence(req, res) {
    try {
      const {
        title, subject, content, type, priority, status, airport,
        from_address, to_address, tags, code,
        personnesConcernees, // Personnes assignées
        deposantInfo, importanceSubject,
        // Nouveaux paramètres optionnels
        autoCreateWorkflow = true, // Créer automatiquement le workflow
        autoCreateDraft = false,   // Créer automatiquement une proposition
        draftTemplate = null       // Template de proposition
      } = req.body;

      console.log('📝 [Enhanced Route] Création correspondance améliorée');
      console.log(`🔄 [Enhanced Route] Auto workflow: ${autoCreateWorkflow}`);
      console.log(`📝 [Enhanced Route] Auto draft: ${autoCreateDraft}`);

      // Données de la correspondance
      const correspondenceData = {
        title, subject, content, type, priority, status, airport,
        from_address, to_address, tags, code,
        personnesConcernees: personnesConcernees || [],
        deposantInfo, importanceSubject,
        date_correspondance: new Date()
      };

      let result;

      if (autoCreateDraft && draftTemplate) {
        // Créer avec proposition automatique
        result = await enhancedCorrespondenceCreation.createCorrespondenceWithDraft(
          correspondenceData,
          req.user.id,
          draftTemplate
        );
      } else if (autoCreateWorkflow) {
        // Créer avec workflow automatique
        result = await enhancedCorrespondenceCreation.createCorrespondenceWithWorkflow(
          correspondenceData,
          req.user.id
        );
      } else {
        // Création standard (existante)
        result = await this.createStandardCorrespondence(correspondenceData, req.user.id);
      }

      // Réponse enrichie
      res.status(201).json({
        success: true,
        message: 'Correspondance créée avec succès',
        data: {
          correspondence: result.data.correspondence,
          workflowCreated: result.data.workflowCreated || false,
          draftCreated: result.data.draftCreated || false,
          draftId: result.data.draftId || null,
          // Informations pour le frontend
          readyForDGReview: result.data.draftCreated || false,
          nextStep: result.data.draftCreated ? 'DG_REVIEW' : 'DIRECTOR_RESPONSE'
        }
      });

    } catch (error) {
      console.error('❌ [Enhanced Route] Erreur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la correspondance',
        error: error.message
      });
    }
  }
};

// 3. AMÉLIORATION DU FRONTEND
// Fichier: src/components/correspondances/CreateCorrespondanceDialog.tsx

const frontendEnhancements = {
  
  // Nouvelles options dans le formulaire de création
  formOptions: {
    // Checkbox pour créer automatiquement le workflow
    autoCreateWorkflow: true,
    
    // Checkbox pour créer une proposition automatique (pour les cas urgents)
    autoCreateDraft: false,
    
    // Template de proposition pré-rempli
    draftTemplate: {
      responseContent: '',
      comments: '',
      isUrgent: false
    }
  },

  // Fonction de soumission améliorée
  async submitEnhancedForm(formData) {
    try {
      const payload = {
        ...formData,
        autoCreateWorkflow: this.formOptions.autoCreateWorkflow,
        autoCreateDraft: this.formOptions.autoCreateDraft,
        draftTemplate: this.formOptions.autoCreateDraft ? this.formOptions.draftTemplate : null
      };

      const response = await api.post('/api/correspondances', payload);

      if (response.data.success) {
        // Notification enrichie
        if (response.data.data.readyForDGReview) {
          toast({
            title: "Correspondance créée et prête pour le DG",
            description: "La proposition a été créée automatiquement et est en attente d'approbation du Directeur Général.",
            duration: 6000
          });
        } else if (response.data.data.workflowCreated) {
          toast({
            title: "Correspondance créée avec workflow",
            description: "La correspondance a été assignée et le workflow est actif.",
            duration: 4000
          });
        } else {
          toast({
            title: "Correspondance créée",
            description: "La correspondance a été créée avec succès.",
            duration: 3000
          });
        }

        return response.data;
      }

    } catch (error) {
      console.error('Erreur création correspondance:', error);
      throw error;
    }
  }
};

// 4. TEMPLATES DE CORRESPONDANCES COURANTES
const correspondenceTemplates = {
  
  formation: {
    title: "Demande de formation",
    draftTemplate: {
      responseContent: `Suite à votre demande de formation, nous proposons d'organiser un programme adapté comprenant :

1. Analyse des besoins spécifiques
2. Conception du programme de formation
3. Planification des sessions
4. Évaluation des résultats

Nous restons à votre disposition pour définir ensemble les modalités pratiques.

Cordialement,`,
      comments: "Proposition de formation avec approche structurée",
      isUrgent: false
    }
  },

  commercial: {
    title: "Demande commerciale",
    draftTemplate: {
      responseContent: `Nous avons bien reçu votre demande et nous vous remercions de votre intérêt.

Après étude de votre dossier, nous pouvons vous proposer :

1. Une solution adaptée à vos besoins
2. Un accompagnement personnalisé
3. Des conditions préférentielles

Notre équipe commerciale prendra contact avec vous sous 48h pour finaliser les détails.

Cordialement,`,
      comments: "Réponse commerciale standard avec suivi personnalisé",
      isUrgent: true
    }
  }
};

console.log('📋 === AMÉLIORATIONS PROPOSÉES ===');
console.log('✅ Création automatique de workflow lors de l\'assignation');
console.log('✅ Option de création automatique de proposition');
console.log('✅ Templates de réponses pré-remplies');
console.log('✅ Notifications enrichies selon le type de création');
console.log('✅ Workflow complet prêt pour approbation DG');

module.exports = {
  enhancedCorrespondenceCreation,
  enhancedRouteHandler,
  frontendEnhancements,
  correspondenceTemplates
};
