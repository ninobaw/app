const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

/**
 * Service spécialisé pour les dashboards des directeurs
 */
class DirectorDashboardService {

  /**
   * Obtient les métriques personnalisées pour un directeur
   */
  static async getDirectorMetrics(userId, userRole) {
    try {
      console.log(` [DirectorDashboard] Génération métriques pour ${userRole}`);

      const user = await User.findById(userId);
      if (!user || !user.isDirector()) {
        throw new Error('Utilisateur non trouvé ou n\'est pas un directeur');
      }

      console.log(`👤 [DirectorDashboard] Utilisateur trouvé: ${user.firstName} ${user.lastName}`);
      console.log(`🏢 [DirectorDashboard] Directorate: ${user.directorate}`);
      console.log(`📋 [DirectorDashboard] Départements gérés: ${user.managedDepartments}`);

      // Si l'utilisateur n'a pas de départements gérés, utiliser des valeurs par défaut
      if (!user.managedDepartments || user.managedDepartments.length === 0) {
        console.log(`⚠️ [DirectorDashboard] Aucun département géré défini, utilisation de valeurs par défaut`);
        user.managedDepartments = user.directorate ? [user.directorate] : ['GENERAL'];
      }

      // Construire le filtre selon le rôle du directeur
      const correspondanceFilter = this.buildCorrespondanceFilter(user);
      console.log(`🔍 [DirectorDashboard] Filtre correspondances:`, correspondanceFilter);
      console.log(`👤 [DirectorDashboard] Recherche correspondances pour userId: ${userId}`);

      // Vérifier d'abord s'il y a des correspondances assignées à ce directeur
      const testCorrespondances = await Correspondance.find({ personnesConcernees: userId }).limit(3);
      console.log(`📋 [DirectorDashboard] Correspondances trouvées pour ce directeur:`, testCorrespondances.length);
      if (testCorrespondances.length > 0) {
        console.log(`📄 [DirectorDashboard] Exemple de correspondance:`, {
          id: testCorrespondances[0]._id,
          subject: testCorrespondances[0].subject,
          personnesConcernees: testCorrespondances[0].personnesConcernees,
          status: testCorrespondances[0].status
        });
      }

      // Requêtes parallèles pour les métriques
      const [
        totalAssigned,
        pendingCorrespondances,
        repliedCorrespondances,
        overdueCorrespondances,
        urgentCorrespondances,
        thisWeekCorrespondances,
        recentCorrespondances,
        upcomingDeadlines,
        performanceData
      ] = await Promise.all([
        // Total des correspondances assignées
        Correspondance.countDocuments({
          personnesConcernees: userId
        }),

        // Correspondances en attente
        Correspondance.countDocuments({
          personnesConcernees: userId,
          status: 'PENDING'
        }),

        // Correspondances répondues
        Correspondance.countDocuments({
          personnesConcernees: userId,
          status: 'REPLIED'
        }),

        // Correspondances en retard
        Correspondance.countDocuments({
          personnesConcernees: userId,
          responseDeadline: { $lt: new Date() },
          status: { $ne: 'REPLIED' }
        }),

        // Correspondances urgentes
        Correspondance.countDocuments({
          personnesConcernees: userId,
          priority: 'URGENT',
          status: { $ne: 'REPLIED' }
        }),

        // Correspondances de cette semaine
        Correspondance.countDocuments({
          personnesConcernees: userId,
          createdAt: {
            $gte: this.getStartOfWeek(),
            $lte: new Date()
          }
        }),

        // Correspondances récentes (5 dernières)
        Correspondance.find({
          personnesConcernees: userId
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('authorId', 'firstName lastName')
        .lean(),

        // Échéances approchantes (7 prochains jours)
        Correspondance.find({
          personnesConcernees: userId,
          responseDeadline: {
            $gte: new Date(),
            $lte: this.getDateInDays(7)
          },
          status: { $ne: 'REPLIED' }
        })
        .sort({ responseDeadline: 1 })
        .limit(10)
        .lean(),

        // Données de performance
        this.getPerformanceData(userId, correspondanceFilter)
      ]);

      // Calculer les métriques dérivées
      const responseRate = totalAssigned > 0 ? Math.round((repliedCorrespondances / totalAssigned) * 100) : 0;
      const overdueRate = totalAssigned > 0 ? Math.round((overdueCorrespondances / totalAssigned) * 100) : 0;

      return {
        // Métriques principales
        totalAssigned,
        pendingCorrespondances,
        repliedCorrespondances,
        overdueCorrespondances,
        urgentCorrespondances,
        thisWeekCorrespondances,

        // Taux de performance
        responseRate,
        overdueRate,

        // Données détaillées
        recentCorrespondances: this.formatCorrespondances(recentCorrespondances),
        upcomingDeadlines: this.formatDeadlines(upcomingDeadlines),
        performanceData: this.generateDefaultPerformanceData(), // Données par défaut

        // Métadonnées
        directorInfo: {
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          directorate: user.directorate || 'GENERAL',
          managedDepartments: user.managedDepartments || ['GENERAL']
        },
        lastUpdate: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ [DirectorDashboard] Erreur génération métriques:', error);
      throw error;
    }
  }

  /**
   * Construit le filtre de correspondances selon le rôle du directeur
   */
  static buildCorrespondanceFilter(user) {
    const baseFilter = {};

    // Le Directeur Général voit tout
    if (user.role === 'DIRECTEUR_GENERAL') {
      return baseFilter;
    }

    // Les autres directeurs voient selon leurs départements gérés
    if (user.managedDepartments && user.managedDepartments.length > 0) {
      // Si le directeur gère "TOUS", il voit tout
      if (user.managedDepartments.includes('TOUS')) {
        return baseFilter;
      }

      // Sinon, filtrer par départements gérés ou par tags liés au domaine
      const departmentTags = this.getDepartmentTags(user.directorate);
      
      baseFilter.$or = [
        { department_code: { $in: user.managedDepartments } },
        { tags: { $in: departmentTags } },
        { tags: { $in: user.managedDepartments } }, // Ajouter les départements comme tags possibles
        { departementsResponsables: { $in: user.managedDepartments } } // Nouveau: filtrer par départements responsables
      ];
    } else {
      // Si aucun département géré, filtrer par directorate
      if (user.directorate) {
        const departmentTags = this.getDepartmentTags(user.directorate);
        baseFilter.$or = [
          { tags: { $in: departmentTags } },
          { departementsResponsables: { $in: [user.directorate] } } // Filtrer par directorate dans départements responsables
        ];
      }
    }

    return baseFilter;
  }

  /**
   * Obtient les tags associés à un directorate
   */
  static getDepartmentTags(directorate) {
    const tagMapping = {
      'TECHNIQUE': ['technique', 'maintenance', 'infrastructure', 'it', 'sécurité'],
      'COMMERCIAL': ['commercial', 'marketing', 'ventes', 'client', 'développement'],
      'FINANCIER': ['finance', 'comptabilité', 'budget', 'trésorerie', 'contrôle'],
      'OPERATIONS': ['opérations', 'sûreté', 'logistique', 'qualité', 'aéroportuaire'],
      'RH': ['rh', 'ressources humaines', 'recrutement', 'formation', 'paie']
    };

    return tagMapping[directorate] || [];
  }

  /**
   * Obtient les données de performance sur les 6 derniers mois
   */
  static async getPerformanceData(userId, baseFilter) {
    const months = [];
    const now = new Date();

    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [assigned, replied] = await Promise.all([
        Correspondance.countDocuments({
          ...baseFilter,
          personnesConcernees: userId,
          createdAt: { $gte: date, $lt: nextMonth }
        }),
        Correspondance.countDocuments({
          ...baseFilter,
          personnesConcernees: userId,
          createdAt: { $gte: date, $lt: nextMonth },
          status: 'REPLIED'
        })
      ]);

      months.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        assigned,
        replied,
        responseRate: assigned > 0 ? Math.round((replied / assigned) * 100) : 0
      });
    }

    return months;
  }

  /**
   * Formate les correspondances pour l'affichage
   */
  static formatCorrespondances(correspondances) {
    return correspondances.map(c => ({
      id: c._id,
      subject: c.subject,
      priority: c.priority,
      status: c.status,
      createdAt: c.createdAt,
      author: c.authorId ? `${c.authorId.firstName} ${c.authorId.lastName}` : 'Inconnu',
      daysAgo: Math.floor((new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24))
    }));
  }

  /**
   * Formate les échéances pour l'affichage
   */
  static formatDeadlines(deadlines) {
    return deadlines.map(d => ({
      id: d._id,
      subject: d.subject,
      priority: d.priority,
      deadline: d.responseDeadline,
      daysRemaining: Math.ceil((new Date(d.responseDeadline) - new Date()) / (1000 * 60 * 60 * 24)),
      urgencyLevel: this.getUrgencyLevel(d.responseDeadline, d.priority)
    }));
  }

  /**
   * Détermine le niveau d'urgence d'une échéance
   */
  static getUrgencyLevel(deadline, priority) {
    const daysRemaining = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 1 || priority === 'URGENT') return 'critical';
    if (daysRemaining <= 3) return 'warning';
    return 'normal';
  }

  /**
   * Obtient le début de la semaine courante
   */
  static getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
    return new Date(now.setDate(diff));
  }

  /**
   * Obtient une date dans X jours
   */
  static getDateInDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Met à jour les métriques de performance d'un directeur
   */
  static async updateDirectorMetrics(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isDirector()) return;

      const filter = this.buildCorrespondanceFilter(user);
      
      const [totalAssigned, totalCompleted, overdueCount] = await Promise.all([
        Correspondance.countDocuments({
          ...filter,
          personnesConcernees: userId
        }),
        Correspondance.countDocuments({
          ...filter,
          personnesConcernees: userId,
          status: 'REPLIED'
        }),
        Correspondance.countDocuments({
          ...filter,
          personnesConcernees: userId,
          responseDeadline: { $lt: new Date() },
          status: { $ne: 'REPLIED' }
        })
      ]);

      // Calculer le temps de réponse moyen
      const avgResponseTime = await this.calculateAverageResponseTime(userId, filter);

      await user.updatePerformanceMetrics({
        totalAssigned,
        totalCompleted,
        averageResponseTime: avgResponseTime,
        overdueCount
      });

      console.log(` [DirectorDashboard] Métriques mises à jour pour ${user.firstName} ${user.lastName}`);

    } catch (error) {
      console.error(' [DirectorDashboard] Erreur mise à jour métriques:', error);
    }
  }

  /**
   * Calcule le temps de réponse moyen en heures
   */
  static async calculateAverageResponseTime(userId, filter) {
    const repliedCorrespondances = await Correspondance.find({
      ...filter,
      personnesConcernees: userId,
      status: 'REPLIED',
      responseDate: { $exists: true }
    }).select('createdAt responseDate').lean();

    if (repliedCorrespondances.length === 0) return 0;

    const totalHours = repliedCorrespondances.reduce((sum, c) => {
      const hours = (new Date(c.responseDate) - new Date(c.createdAt)) / (1000 * 60 * 60);
      return sum + Math.max(0, hours);
    }, 0);

    return Math.round(totalHours / repliedCorrespondances.length);
  }

  /**
   * Génère des données de performance par défaut
   */
  static generateDefaultPerformanceData() {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        assigned: Math.floor(Math.random() * 10) + 5,
        replied: Math.floor(Math.random() * 8) + 3,
        responseRate: Math.floor(Math.random() * 30) + 70 // Entre 70 et 100%
      });
    }

    return months;
  }
}

module.exports = DirectorDashboardService;
