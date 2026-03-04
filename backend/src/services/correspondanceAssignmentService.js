const User = require('../models/User');

/**
 * Service d'assignation automatique des correspondances aux directeurs
 */
class CorrespondanceAssignmentService {

  /**
   * Détermine les directeurs à assigner selon le contenu de la correspondance
   */
  static async getDirectorsToAssign(correspondanceData) {
    try {
      const { subject, content, priority, type, tags = [] } = correspondanceData;
      
      // Mots-clés par domaine pour l'assignation automatique
      const domainKeywords = {
        'TECHNIQUE': [
          'technique', 'technical', 'maintenance', 'équipement', 'infrastructure',
          'sécurité', 'security', 'audit', 'inspection', 'certification',
          'piste', 'runway', 'aérogare', 'terminal', 'bagages', 'navigation',
          'météo', 'weather', 'radar', 'communication', 'radio', 'électricité',
          'climatisation', 'ascenseur', 'escalator', 'éclairage', 'signalisation'
        ],
        'COMMERCIAL': [
          'commercial', 'compagnie', 'airline', 'vol', 'flight', 'passager',
          'passenger', 'tarif', 'pricing', 'contrat', 'contract', 'négociation',
          'partenariat', 'partnership', 'marketing', 'promotion', 'publicité',
          'boutique', 'shop', 'duty-free', 'restaurant', 'location', 'parking'
        ],
        'FINANCIER': [
          'financier', 'financial', 'budget', 'coût', 'cost', 'facture',
          'invoice', 'paiement', 'payment', 'comptabilité', 'accounting',
          'investissement', 'investment', 'crédit', 'débit', 'trésorerie',
          'audit financier', 'bilan', 'résultat', 'profit', 'perte', 'taxe'
        ],
        'OPERATIONS': [
          'opération', 'operations', 'exploitation', 'planning', 'horaire',
          'schedule', 'coordination', 'logistique', 'logistics', 'transport',
          'handling', 'manutention', 'fret', 'cargo', 'douane', 'customs',
          'immigration', 'police', 'pompier', 'urgence', 'emergency', 'crise'
        ],
        'RH': [
          'ressources humaines', 'human resources', 'personnel', 'staff',
          'recrutement', 'recruitment', 'formation', 'training', 'salaire',
          'salary', 'congé', 'leave', 'disciplinaire', 'sanction', 'promotion',
          'évaluation', 'performance', 'conflit', 'médiation', 'syndicat'
        ]
      };

      // Analyser le contenu pour déterminer les domaines concernés
      const textToAnalyze = `${subject} ${content} ${tags.join(' ')}`.toLowerCase();
      const domainsScores = {};

      // Calculer le score pour chaque domaine
      for (const [domain, keywords] of Object.entries(domainKeywords)) {
        domainsScores[domain] = 0;
        keywords.forEach(keyword => {
          if (textToAnalyze.includes(keyword.toLowerCase())) {
            domainsScores[domain] += 1;
            // Bonus si le mot-clé est dans le sujet (plus important)
            if (subject.toLowerCase().includes(keyword.toLowerCase())) {
              domainsScores[domain] += 2;
            }
          }
        });
      }

      console.log(`📊 [Assignment] Scores par domaine:`, domainsScores);

      // Déterminer les domaines à assigner (score > 0)
      const domainsToAssign = Object.entries(domainsScores)
        .filter(([domain, score]) => score > 0)
        .sort(([,a], [,b]) => b - a) // Trier par score décroissant
        .map(([domain]) => domain);

      // Si aucun domaine détecté, assigner selon la priorité
      if (domainsToAssign.length === 0) {
        if (priority === 'URGENT') {
          // Les urgences vont au Directeur Général + tous les directeurs
          domainsToAssign.push('DIRECTEUR_GENERAL', 'TECHNIQUE', 'COMMERCIAL', 'OPERATIONS');
        } else {
          // Par défaut, assigner aux opérations
          domainsToAssign.push('OPERATIONS');
        }
      }

      console.log(`🎯 [Assignment] Domaines à assigner:`, domainsToAssign);

      // Récupérer les directeurs correspondants
      const directorsToAssign = [];

      // Toujours inclure le Directeur Général pour les correspondances importantes
      if (priority === 'URGENT' || priority === 'HIGH') {
        const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL', isActive: true });
        if (dg) {
          directorsToAssign.push(dg._id);
          console.log(`👑 [Assignment] DG assigné: ${dg.firstName} ${dg.lastName}`);
        }
      }

      // Récupérer les directeurs par domaine
      for (const domain of domainsToAssign) {
        if (domain === 'DIRECTEUR_GENERAL') continue; // Déjà traité

        const directors = await User.find({
          $or: [
            { role: 'DIRECTEUR', directorate: domain },
            { role: 'SOUS_DIRECTEUR', directorate: domain }
          ],
          isActive: true
        });

        directors.forEach(director => {
          if (!directorsToAssign.includes(director._id)) {
            directorsToAssign.push(director._id);
            console.log(`👤 [Assignment] Directeur assigné: ${director.firstName} ${director.lastName} (${director.directorate})`);
          }
        });
      }

      return directorsToAssign;

    } catch (error) {
      console.error('❌ [Assignment] Erreur lors de l\'assignation:', error);
      return [];
    }
  }

  /**
   * Assigne automatiquement une correspondance aux directeurs appropriés
   */
  static async assignCorrespondance(correspondance) {
    try {
      console.log(`🎯 [Assignment] === DÉBUT ASSIGNATION AUTOMATIQUE ===`);
      console.log(`📝 [Assignment] Correspondance: "${correspondance.subject}"`);
      console.log(`🏛️ [Assignment] Aéroport: ${correspondance.airport}`);
      console.log(`🏷️ [Assignment] Tags: ${correspondance.tags || []}`);
      console.log(`⚡ [Assignment] Priorité: ${correspondance.priority}`);
      
      // ✅ CORRECTION CRITIQUE: Ne pas écraser les assignations manuelles
      const originalPersonnes = correspondance.personnesConcernees || [];
      if (originalPersonnes.length > 0) {
        console.log(`⚠️ [Assignment] Assignation manuelle détectée (${originalPersonnes.length} personne(s))`);
        console.log(`✋ [Assignment] L'assignation automatique est IGNORÉE pour respecter l'assignation manuelle`);
        return correspondance;
      }
      
      const directorsToAssign = await this.getDirectorsToAssign(correspondance);
      
      if (directorsToAssign.length > 0) {
        console.log(`👥 [Assignment] ${directorsToAssign.length} directeur(s) identifié(s) pour assignation:`);
        
        // Afficher les détails de chaque directeur assigné
        for (const directorId of directorsToAssign) {
          const User = require('../models/User');
          const director = await User.findById(directorId);
          if (director) {
            console.log(`   👤 ${director.firstName} ${director.lastName} (${director.role}) - ${director.directorate}`);
          }
        }
        
        // ✅ CORRECTION: Remplacer complètement au lieu d'ajouter
        correspondance.personnesConcernees = directorsToAssign.map(id => id.toString());
        
        console.log(`📋 [Assignment] Personnes concernées assignées: ${correspondance.personnesConcernees.length}`);
        console.log(`✅ [Assignment] Assignation terminée avec succès`);
        
        // Mettre à jour le statut du workflow
        correspondance.workflowStatus = 'ASSIGNED_TO_DIRECTOR';
        
        // ✅ CORRECTION CRITIQUE: Sauvegarder la correspondance
        console.log(`💾 [Assignment] Sauvegarde de la correspondance...`);
        correspondance.markModified('personnesConcernees');
        await correspondance.save();
        console.log(`✅ [Assignment] Correspondance sauvegardée avec ${correspondance.personnesConcernees.length} assignation(s)`);
      } else {
        console.log(`⚠️ [Assignment] AUCUN directeur assigné à la correspondance`);
        console.log(`🔍 [Assignment] Vérifiez les critères d'assignation et les directeurs disponibles`);
      }

      return correspondance;

    } catch (error) {
      console.error('❌ [Assignment] Erreur lors de l\'assignation de la correspondance:', error);
      return correspondance;
    }
  }

  /**
   * Obtient la liste des directeurs par domaine
   */
  static async getDirectorsByDomain() {
    try {
      const directors = await User.find({
        role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'] },
        isActive: true
      }).select('firstName lastName email role directorate managedDepartments');

      const directorsByDomain = {};
      
      directors.forEach(director => {
        const domain = director.directorate || 'GENERAL';
        if (!directorsByDomain[domain]) {
          directorsByDomain[domain] = [];
        }
        directorsByDomain[domain].push({
          id: director._id,
          name: `${director.firstName} ${director.lastName}`,
          email: director.email,
          role: director.role
        });
      });

      return directorsByDomain;

    } catch (error) {
      console.error('❌ [Assignment] Erreur lors de la récupération des directeurs:', error);
      return {};
    }
  }

  /**
   * Réassigne une correspondance manuellement
   */
  static async reassignCorrespondance(correspondanceId, directorIds, assignedBy) {
    try {
      const Correspondance = require('../models/Correspondance');
      
      const correspondance = await Correspondance.findById(correspondanceId);
      if (!correspondance) {
        throw new Error('Correspondance non trouvée');
      }

      // Mettre à jour les personnes concernées
      correspondance.personnesConcernees = directorIds;
      correspondance.updatedAt = new Date();
      
      await correspondance.save();

      console.log(`🔄 [Assignment] Correspondance ${correspondanceId} réassignée par ${assignedBy}`);
      console.log(`👥 [Assignment] Nouveaux assignés:`, directorIds);

      return correspondance;

    } catch (error) {
      console.error('❌ [Assignment] Erreur lors de la réassignation:', error);
      throw error;
    }
  }
}

module.exports = CorrespondanceAssignmentService;
