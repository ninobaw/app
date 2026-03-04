const cron = require('node-cron');
const DeadlineService = require('../services/deadlineService');

/**
 * Planificateur de tâches pour la gestion automatique des échéances
 */
class DeadlineScheduler {
  
  static isRunning = false;
  static jobs = [];

  /**
   * Démarre tous les cron jobs
   */
  static start() {
    if (this.isRunning) {
      console.log('⚠️ [DeadlineScheduler] Les tâches sont déjà en cours d\'exécution');
      return;
    }

    console.log('🚀 [DeadlineScheduler] Démarrage des tâches planifiées...');

    // Vérification quotidienne à 8h00
    const dailyCheck = cron.schedule('0 8 * * *', async () => {
      try {
        console.log('🕐 [DeadlineScheduler] Exécution de la vérification quotidienne...');
        const report = await DeadlineService.runDailyCheck();
        console.log('✅ [DeadlineScheduler] Vérification quotidienne terminée:', report.summary);
      } catch (error) {
        console.error('❌ [DeadlineScheduler] Erreur lors de la vérification quotidienne:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Paris"
    });

    // Vérification des échéances approchantes toutes les 4 heures
    const approachingCheck = cron.schedule('0 */4 * * *', async () => {
      try {
        console.log('🔍 [DeadlineScheduler] Vérification des échéances approchantes...');
        const count = await DeadlineService.checkApproachingDeadlines();
        console.log(`✅ [DeadlineScheduler] ${count} notifications d'échéance envoyées`);
      } catch (error) {
        console.error('❌ [DeadlineScheduler] Erreur vérification échéances approchantes:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Paris"
    });

    // Vérification des échéances expirées toutes les heures
    const expiredCheck = cron.schedule('0 * * * *', async () => {
      try {
        console.log('🚨 [DeadlineScheduler] Vérification des échéances expirées...');
        const count = await DeadlineService.checkExpiredDeadlines();
        console.log(`✅ [DeadlineScheduler] ${count} notifications d'expiration envoyées`);
      } catch (error) {
        console.error('❌ [DeadlineScheduler] Erreur vérification échéances expirées:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Paris"
    });

    // Mise à jour des échéances manquantes une fois par jour à 6h00
    const updateMissing = cron.schedule('0 6 * * *', async () => {
      try {
        console.log('🔄 [DeadlineScheduler] Mise à jour des échéances manquantes...');
        const updated = await DeadlineService.updateMissingDeadlines();
        console.log(`✅ [DeadlineScheduler] ${updated} échéances mises à jour`);
      } catch (error) {
        console.error('❌ [DeadlineScheduler] Erreur mise à jour échéances:', error);
      }
    }, {
      scheduled: false,
      timezone: "Europe/Paris"
    });

    // Démarrer toutes les tâches
    dailyCheck.start();
    approachingCheck.start();
    expiredCheck.start();
    updateMissing.start();

    // Stocker les références des jobs
    this.jobs = [dailyCheck, approachingCheck, expiredCheck, updateMissing];
    this.isRunning = true;

    console.log('✅ [DeadlineScheduler] Tâches planifiées démarrées avec succès');
    console.log('📅 [DeadlineScheduler] Planning:');
    console.log('   - Vérification quotidienne: 8h00');
    console.log('   - Échéances approchantes: toutes les 4h');
    console.log('   - Échéances expirées: toutes les heures');
    console.log('   - Mise à jour manquantes: 6h00');
  }

  /**
   * Arrête tous les cron jobs
   */
  static stop() {
    if (!this.isRunning) {
      console.log('⚠️ [DeadlineScheduler] Aucune tâche en cours d\'exécution');
      return;
    }

    console.log('🛑 [DeadlineScheduler] Arrêt des tâches planifiées...');
    
    this.jobs.forEach(job => {
      if (job) {
        job.stop();
        job.destroy();
      }
    });

    this.jobs = [];
    this.isRunning = false;

    console.log('✅ [DeadlineScheduler] Toutes les tâches ont été arrêtées');
  }

  /**
   * Redémarre tous les cron jobs
   */
  static restart() {
    console.log('🔄 [DeadlineScheduler] Redémarrage des tâches planifiées...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  /**
   * Obtient le statut du planificateur
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      jobs: [
        { name: 'Vérification quotidienne', schedule: '8h00 tous les jours' },
        { name: 'Échéances approchantes', schedule: 'Toutes les 4 heures' },
        { name: 'Échéances expirées', schedule: 'Toutes les heures' },
        { name: 'Mise à jour manquantes', schedule: '6h00 tous les jours' }
      ]
    };
  }

  /**
   * Exécute manuellement une vérification complète
   */
  static async runManualCheck() {
    try {
      console.log('🔧 [DeadlineScheduler] Exécution manuelle d\'une vérification complète...');
      const report = await DeadlineService.runDailyCheck();
      console.log('✅ [DeadlineScheduler] Vérification manuelle terminée:', report.summary);
      return report;
    } catch (error) {
      console.error('❌ [DeadlineScheduler] Erreur lors de la vérification manuelle:', error);
      throw error;
    }
  }
}

module.exports = DeadlineScheduler;
