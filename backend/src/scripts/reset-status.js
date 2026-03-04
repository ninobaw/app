const mongoose = require('mongoose');

// Modèles
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

/**
 * Script pour réinitialiser les statuts des correspondances
 * Utile pour tester le workflow sans supprimer les données
 */
async function resetStatus() {
  console.log('🔄 RÉINITIALISATION DES STATUTS');
  console.log('='.repeat(40));
  
  let stats = {
    correspondances: 0,
    users: 0
  };

  try {
    // Connexion MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB');

    // Réinitialiser les correspondances
    const corrResult = await Correspondance.updateMany(
      {},
      {
        $set: {
          status: 'PENDING',
          workflowStatus: 'DRAFT_PENDING',
          responseDate: null,
          finalResponse: null,
          responseDrafts: [],
          processingHistory: []
        },
        $unset: {
          directorValidation: 1,
          directorValidationDate: 1,
          directorValidatedBy: 1,
          directorComments: 1
        }
      }
    );
    stats.correspondances = corrResult.modifiedCount;
    console.log(`📧 ${stats.correspondances} correspondances réinitialisées`);

    // Nettoyer les notifications utilisateurs
    const userResult = await User.updateMany(
      {},
      {
        $set: {
          notifications: [],
          unreadNotifications: 0,
          lastNotificationCheck: new Date()
        }
      }
    );
    stats.users = userResult.modifiedCount;
    console.log(`👥 ${stats.users} utilisateurs nettoyés`);

    console.log('='.repeat(40));
    console.log('✅ RÉINITIALISATION TERMINÉE');
    console.log('🎯 Les correspondances sont prêtes pour un nouveau workflow');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Exécution
if (require.main === module) {
  resetStatus();
}

module.exports = resetStatus;
