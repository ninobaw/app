const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Modèles
const Correspondance = require('../models/Correspondance');
const Response = require('../models/Response');
const User = require('../models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * Script de nettoyage complet de l'application
 * Supprime toutes les correspondances, réponses, fichiers et notifications
 */
class ApplicationCleaner {
  
  constructor() {
    this.stats = {
      correspondancesDeleted: 0,
      responsesDeleted: 0,
      filesDeleted: 0,
      foldersDeleted: 0,
      notificationsCleared: 0,
      usersUpdated: 0,
      errors: []
    };
  }

  /**
   * Connexion à MongoDB
   */
  async connectDatabase() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connexion MongoDB établie');
    } catch (error) {
      console.error('❌ Erreur connexion MongoDB:', error);
      throw error;
    }
  }

  /**
   * Suppression de tous les fichiers dans le répertoire uploads
   */
  async cleanUploadFiles() {
    console.log('\n🗂️  Nettoyage des fichiers uploads...');
    
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('📁 Répertoire uploads n\'existe pas');
      return;
    }

    try {
      await this.deleteDirectoryRecursive(UPLOADS_DIR, true);
      console.log(`✅ ${this.stats.filesDeleted} fichiers supprimés`);
      console.log(`✅ ${this.stats.foldersDeleted} dossiers supprimés`);
    } catch (error) {
      console.error('❌ Erreur nettoyage fichiers:', error);
      this.stats.errors.push(`Nettoyage fichiers: ${error.message}`);
    }
  }

  /**
   * Suppression récursive d'un répertoire
   */
  async deleteDirectoryRecursive(dirPath, preserveRoot = false) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        await this.deleteDirectoryRecursive(filePath);
        fs.rmdirSync(filePath);
        this.stats.foldersDeleted++;
        console.log(`🗂️  Dossier supprimé: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        this.stats.filesDeleted++;
        console.log(`📄 Fichier supprimé: ${filePath}`);
      }
    }

    // Ne pas supprimer le répertoire racine uploads
    if (!preserveRoot) {
      fs.rmdirSync(dirPath);
      this.stats.foldersDeleted++;
    }
  }

  /**
   * Suppression de toutes les correspondances
   */
  async cleanCorrespondances() {
    console.log('\n📧 Nettoyage des correspondances...');
    
    try {
      const result = await Correspondance.deleteMany({});
      this.stats.correspondancesDeleted = result.deletedCount;
      console.log(`✅ ${this.stats.correspondancesDeleted} correspondances supprimées`);
    } catch (error) {
      console.error('❌ Erreur suppression correspondances:', error);
      this.stats.errors.push(`Correspondances: ${error.message}`);
    }
  }

  /**
   * Suppression de toutes les réponses
   */
  async cleanResponses() {
    console.log('\n📤 Nettoyage des réponses...');
    
    try {
      const result = await Response.deleteMany({});
      this.stats.responsesDeleted = result.deletedCount;
      console.log(`✅ ${this.stats.responsesDeleted} réponses supprimées`);
    } catch (error) {
      console.error('❌ Erreur suppression réponses:', error);
      this.stats.errors.push(`Réponses: ${error.message}`);
    }
  }

  /**
   * Nettoyage des notifications dans les profils utilisateurs
   */
  async cleanUserNotifications() {
    console.log('\n🔔 Nettoyage des notifications utilisateurs...');
    
    try {
      const result = await User.updateMany(
        {},
        {
          $unset: {
            notifications: 1,
            unreadNotifications: 1,
            lastNotificationCheck: 1
          },
          $set: {
            notifications: [],
            unreadNotifications: 0,
            lastNotificationCheck: new Date()
          }
        }
      );
      
      this.stats.usersUpdated = result.modifiedCount;
      this.stats.notificationsCleared = result.modifiedCount;
      console.log(`✅ Notifications nettoyées pour ${this.stats.usersUpdated} utilisateurs`);
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
      this.stats.errors.push(`Notifications: ${error.message}`);
    }
  }

  /**
   * Nettoyage des données de workflow dans les utilisateurs
   */
  async cleanUserWorkflowData() {
    console.log('\n⚙️  Nettoyage des données de workflow utilisateurs...');
    
    try {
      const result = await User.updateMany(
        {},
        {
          $unset: {
            assignedCorrespondances: 1,
            completedTasks: 1,
            workflowHistory: 1,
            lastActivity: 1
          },
          $set: {
            assignedCorrespondances: [],
            completedTasks: [],
            workflowHistory: [],
            lastActivity: new Date()
          }
        }
      );
      
      console.log(`✅ Données workflow nettoyées pour ${result.modifiedCount} utilisateurs`);
    } catch (error) {
      console.error('❌ Erreur nettoyage workflow utilisateurs:', error);
      this.stats.errors.push(`Workflow utilisateurs: ${error.message}`);
    }
  }

  /**
   * Nettoyage des collections de logs (si elles existent)
   */
  async cleanLogs() {
    console.log('\n📋 Nettoyage des logs...');
    
    try {
      // Nettoyer les collections de logs courantes
      const logCollections = [
        'logs',
        'auditlogs',
        'systemlogs',
        'errorlogs',
        'activitylogs'
      ];

      for (const collectionName of logCollections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const result = await collection.deleteMany({});
          if (result.deletedCount > 0) {
            console.log(`✅ ${result.deletedCount} entrées supprimées de ${collectionName}`);
          }
        } catch (error) {
          // Collection n'existe pas, ignorer
        }
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage logs:', error);
      this.stats.errors.push(`Logs: ${error.message}`);
    }
  }

  /**
   * Recréation des répertoires uploads essentiels
   */
  async recreateUploadStructure() {
    console.log('\n📁 Recréation de la structure uploads...');
    
    const directories = [
      'correspondances',
      'correspondances/ENFIDHA',
      'correspondances/ENFIDHA/Arrivee',
      'correspondances/ENFIDHA/Depart',
      'correspondances/MONASTIR',
      'correspondances/MONASTIR/Arrivee',
      'correspondances/MONASTIR/Depart',
      'correspondances/GENERALE',
      'correspondances/GENERALE/Arrivee',
      'correspondances/GENERALE/Depart',
      'responses',
      'discharge',
      'temp'
    ];

    try {
      for (const dir of directories) {
        const fullPath = path.join(UPLOADS_DIR, dir);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
          console.log(`📁 Créé: ${dir}`);
        }
      }
      console.log('✅ Structure uploads recréée');
    } catch (error) {
      console.error('❌ Erreur recréation structure:', error);
      this.stats.errors.push(`Structure uploads: ${error.message}`);
    }
  }

  /**
   * Création d'un fichier .gitkeep pour préserver les dossiers vides
   */
  async createGitkeepFiles() {
    console.log('\n📝 Création des fichiers .gitkeep...');
    
    const directories = [
      'correspondances/ENFIDHA/Arrivee',
      'correspondances/ENFIDHA/Depart',
      'correspondances/MONASTIR/Arrivee',
      'correspondances/MONASTIR/Depart',
      'correspondances/GENERALE/Arrivee',
      'correspondances/GENERALE/Depart',
      'responses',
      'discharge',
      'temp'
    ];

    try {
      for (const dir of directories) {
        const gitkeepPath = path.join(UPLOADS_DIR, dir, '.gitkeep');
        fs.writeFileSync(gitkeepPath, '# Dossier préservé pour les uploads\n');
      }
      console.log('✅ Fichiers .gitkeep créés');
    } catch (error) {
      console.error('❌ Erreur création .gitkeep:', error);
      this.stats.errors.push(`Gitkeep: ${error.message}`);
    }
  }

  /**
   * Affichage du rapport final
   */
  displayReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE NETTOYAGE');
    console.log('='.repeat(60));
    
    console.log(`📧 Correspondances supprimées: ${this.stats.correspondancesDeleted}`);
    console.log(`📤 Réponses supprimées: ${this.stats.responsesDeleted}`);
    console.log(`📄 Fichiers supprimés: ${this.stats.filesDeleted}`);
    console.log(`🗂️  Dossiers supprimés: ${this.stats.foldersDeleted}`);
    console.log(`🔔 Notifications nettoyées: ${this.stats.notificationsCleared}`);
    console.log(`👥 Utilisateurs mis à jour: ${this.stats.usersUpdated}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERREURS RENCONTRÉES:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NETTOYAGE TERMINÉ SANS ERREUR');
    }
    
    console.log('\n🎯 APPLICATION PRÊTE POUR TESTS RÉELS');
    console.log('='.repeat(60));
  }

  /**
   * Exécution complète du nettoyage
   */
  async run() {
    console.log('🧹 DÉBUT DU NETTOYAGE COMPLET DE L\'APPLICATION');
    console.log('='.repeat(60));
    
    try {
      await this.connectDatabase();
      
      // Nettoyage des données
      await this.cleanCorrespondances();
      await this.cleanResponses();
      await this.cleanUserNotifications();
      await this.cleanUserWorkflowData();
      await this.cleanLogs();
      
      // Nettoyage des fichiers
      await this.cleanUploadFiles();
      
      // Recréation de la structure
      await this.recreateUploadStructure();
      await this.createGitkeepFiles();
      
      // Rapport final
      this.displayReport();
      
    } catch (error) {
      console.error('❌ Erreur critique lors du nettoyage:', error);
      this.stats.errors.push(`Erreur critique: ${error.message}`);
      this.displayReport();
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Connexion MongoDB fermée');
    }
  }
}

// Fonction de confirmation pour éviter les suppressions accidentelles
async function confirmCleanup() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('⚠️  ATTENTION: Cette opération va supprimer TOUTES les correspondances et fichiers !');
    console.log('📋 Éléments qui seront supprimés:');
    console.log('   - Toutes les correspondances');
    console.log('   - Toutes les réponses');
    console.log('   - Tous les fichiers uploads');
    console.log('   - Toutes les notifications');
    console.log('   - Données de workflow utilisateurs');
    console.log('   - Logs système');
    console.log('');
    
    rl.question('Êtes-vous sûr de vouloir continuer ? (tapez "OUI" pour confirmer): ', (answer) => {
      rl.close();
      resolve(answer.toUpperCase() === 'OUI');
    });
  });
}

// Exécution du script
async function main() {
  try {
    // Vérifier si l'argument --force est passé pour éviter la confirmation
    const forceMode = process.argv.includes('--force');
    
    if (!forceMode) {
      const confirmed = await confirmCleanup();
      if (!confirmed) {
        console.log('❌ Nettoyage annulé par l\'utilisateur');
        process.exit(0);
      }
    }
    
    const cleaner = new ApplicationCleaner();
    await cleaner.run();
    
    console.log('\n🎉 Nettoyage terminé avec succès !');
    console.log('💡 Vous pouvez maintenant tester avec des correspondances réelles');
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancement du script
if (require.main === module) {
  main();
}

module.exports = ApplicationCleaner;
