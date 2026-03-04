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
 * Script de vérification après nettoyage
 * Vérifie que l'application est bien nettoyée et prête pour les tests
 */
class CleanupVerifier {
  
  constructor() {
    this.report = {
      database: {
        correspondances: 0,
        responses: 0,
        users: 0,
        usersWithNotifications: 0
      },
      files: {
        totalFiles: 0,
        correspondanceFiles: 0,
        responseFiles: 0,
        tempFiles: 0
      },
      structure: {
        uploadsExists: false,
        requiredFolders: [],
        missingFolders: []
      },
      status: 'UNKNOWN'
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
   * Vérification de la base de données
   */
  async verifyDatabase() {
    console.log('\n🗄️  Vérification base de données...');
    
    try {
      // Compter les correspondances
      this.report.database.correspondances = await Correspondance.countDocuments();
      console.log(`📧 Correspondances: ${this.report.database.correspondances}`);
      
      // Compter les réponses
      this.report.database.responses = await Response.countDocuments();
      console.log(`📤 Réponses: ${this.report.database.responses}`);
      
      // Compter les utilisateurs
      this.report.database.users = await User.countDocuments();
      console.log(`👥 Utilisateurs: ${this.report.database.users}`);
      
      // Compter les utilisateurs avec notifications
      this.report.database.usersWithNotifications = await User.countDocuments({
        $or: [
          { 'notifications.0': { $exists: true } },
          { unreadNotifications: { $gt: 0 } }
        ]
      });
      console.log(`🔔 Utilisateurs avec notifications: ${this.report.database.usersWithNotifications}`);
      
    } catch (error) {
      console.error('❌ Erreur vérification base de données:', error);
    }
  }

  /**
   * Vérification des fichiers
   */
  async verifyFiles() {
    console.log('\n📁 Vérification fichiers...');
    
    try {
      if (fs.existsSync(UPLOADS_DIR)) {
        this.report.structure.uploadsExists = true;
        
        // Compter tous les fichiers
        this.report.files.totalFiles = await this.countFiles(UPLOADS_DIR);
        console.log(`📄 Total fichiers: ${this.report.files.totalFiles}`);
        
        // Compter les fichiers de correspondances
        const corrDir = path.join(UPLOADS_DIR, 'correspondances');
        if (fs.existsSync(corrDir)) {
          this.report.files.correspondanceFiles = await this.countFiles(corrDir, true);
          console.log(`📧 Fichiers correspondances: ${this.report.files.correspondanceFiles}`);
        }
        
        // Compter les fichiers de réponses
        const respDir = path.join(UPLOADS_DIR, 'responses');
        if (fs.existsSync(respDir)) {
          this.report.files.responseFiles = await this.countFiles(respDir, true);
          console.log(`📤 Fichiers réponses: ${this.report.files.responseFiles}`);
        }
        
        // Compter les fichiers temporaires
        const tempDir = path.join(UPLOADS_DIR, 'temp');
        if (fs.existsSync(tempDir)) {
          this.report.files.tempFiles = await this.countFiles(tempDir, true);
          console.log(`🗂️  Fichiers temporaires: ${this.report.files.tempFiles}`);
        }
        
      } else {
        console.log('❌ Répertoire uploads n\'existe pas');
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification fichiers:', error);
    }
  }

  /**
   * Vérification de la structure des dossiers
   */
  async verifyStructure() {
    console.log('\n🏗️  Vérification structure...');
    
    const requiredFolders = [
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

    for (const folder of requiredFolders) {
      const folderPath = path.join(UPLOADS_DIR, folder);
      if (fs.existsSync(folderPath)) {
        this.report.structure.requiredFolders.push(folder);
        console.log(`✅ ${folder}`);
      } else {
        this.report.structure.missingFolders.push(folder);
        console.log(`❌ ${folder} (manquant)`);
      }
    }
  }

  /**
   * Compter les fichiers dans un répertoire
   */
  async countFiles(dirPath, excludeGitkeep = false) {
    let count = 0;
    
    if (!fs.existsSync(dirPath)) {
      return count;
    }

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        count += await this.countFiles(itemPath, excludeGitkeep);
      } else {
        if (!excludeGitkeep || item !== '.gitkeep') {
          count++;
        }
      }
    }
    
    return count;
  }

  /**
   * Déterminer le statut global
   */
  determineStatus() {
    const hasData = this.report.database.correspondances > 0 || 
                   this.report.database.responses > 0;
    
    const hasFiles = this.report.files.correspondanceFiles > 0 || 
                    this.report.files.responseFiles > 0;
    
    const hasNotifications = this.report.database.usersWithNotifications > 0;
    
    const structureComplete = this.report.structure.missingFolders.length === 0;

    if (!hasData && !hasFiles && !hasNotifications && structureComplete) {
      this.report.status = 'CLEAN';
    } else if (hasData || hasFiles) {
      this.report.status = 'HAS_DATA';
    } else if (hasNotifications) {
      this.report.status = 'HAS_NOTIFICATIONS';
    } else if (!structureComplete) {
      this.report.status = 'INCOMPLETE_STRUCTURE';
    } else {
      this.report.status = 'PARTIAL';
    }
  }

  /**
   * Affichage du rapport final
   */
  displayReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT DE VÉRIFICATION');
    console.log('='.repeat(60));
    
    // Statut global
    const statusEmoji = {
      'CLEAN': '✅',
      'HAS_DATA': '⚠️',
      'HAS_NOTIFICATIONS': '🔔',
      'INCOMPLETE_STRUCTURE': '🏗️',
      'PARTIAL': '⚡',
      'UNKNOWN': '❓'
    };
    
    console.log(`${statusEmoji[this.report.status]} STATUT: ${this.report.status}`);
    console.log('');
    
    // Base de données
    console.log('🗄️  BASE DE DONNÉES:');
    console.log(`   📧 Correspondances: ${this.report.database.correspondances}`);
    console.log(`   📤 Réponses: ${this.report.database.responses}`);
    console.log(`   👥 Utilisateurs: ${this.report.database.users}`);
    console.log(`   🔔 Avec notifications: ${this.report.database.usersWithNotifications}`);
    console.log('');
    
    // Fichiers
    console.log('📁 FICHIERS:');
    console.log(`   📄 Total: ${this.report.files.totalFiles}`);
    console.log(`   📧 Correspondances: ${this.report.files.correspondanceFiles}`);
    console.log(`   📤 Réponses: ${this.report.files.responseFiles}`);
    console.log(`   🗂️  Temporaires: ${this.report.files.tempFiles}`);
    console.log('');
    
    // Structure
    console.log('🏗️  STRUCTURE:');
    console.log(`   ✅ Dossiers présents: ${this.report.structure.requiredFolders.length}`);
    console.log(`   ❌ Dossiers manquants: ${this.report.structure.missingFolders.length}`);
    
    if (this.report.structure.missingFolders.length > 0) {
      console.log('   Manquants:');
      this.report.structure.missingFolders.forEach(folder => {
        console.log(`     - ${folder}`);
      });
    }
    
    console.log('');
    
    // Recommandations
    this.displayRecommendations();
    
    console.log('='.repeat(60));
  }

  /**
   * Affichage des recommandations
   */
  displayRecommendations() {
    console.log('💡 RECOMMANDATIONS:');
    
    switch (this.report.status) {
      case 'CLEAN':
        console.log('   🎯 Application prête pour tests réels !');
        console.log('   ✅ Vous pouvez créer de nouvelles correspondances');
        break;
        
      case 'HAS_DATA':
        console.log('   🧹 Exécutez un script de nettoyage :');
        console.log('   - Nettoyage rapide: node src/scripts/quick-clean.js');
        console.log('   - Nettoyage complet: node src/scripts/clean-application.js');
        break;
        
      case 'HAS_NOTIFICATIONS':
        console.log('   🔔 Nettoyez les notifications :');
        console.log('   - Réinitialisation: node src/scripts/reset-status.js');
        break;
        
      case 'INCOMPLETE_STRUCTURE':
        console.log('   🏗️  Recréez la structure :');
        console.log('   - Nettoyage complet: node src/scripts/clean-application.js');
        break;
        
      case 'PARTIAL':
        console.log('   ⚡ Nettoyage partiel détecté');
        console.log('   - Vérifiez manuellement les éléments restants');
        break;
        
      default:
        console.log('   ❓ Statut inconnu, vérification manuelle recommandée');
    }
  }

  /**
   * Exécution complète de la vérification
   */
  async run() {
    console.log('🔍 VÉRIFICATION DE L\'ÉTAT DE L\'APPLICATION');
    console.log('='.repeat(60));
    
    try {
      await this.connectDatabase();
      await this.verifyDatabase();
      await this.verifyFiles();
      await this.verifyStructure();
      
      this.determineStatus();
      this.displayReport();
      
    } catch (error) {
      console.error('❌ Erreur critique lors de la vérification:', error);
      this.report.status = 'ERROR';
      this.displayReport();
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Connexion MongoDB fermée');
    }
  }
}

// Exécution du script
async function main() {
  try {
    const verifier = new CleanupVerifier();
    await verifier.run();
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancement du script
if (require.main === module) {
  main();
}

module.exports = CleanupVerifier;
