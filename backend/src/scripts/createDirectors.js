const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script pour créer les comptes des directeurs
 */
const directorsData = [
  {
    firstName: 'Mohamed',
    lastName: 'Ben Ali',
    email: 'directeur.general@tav.aero',
    role: 'DIRECTEUR_GENERAL',
    directorate: 'GENERAL',
    position: 'Directeur Général',
    department: 'Direction Générale',
    managedDepartments: ['TOUS'], // Le DG gère tous les départements
    delegationLevel: 5,
    airport: 'ENFIDHA'
  },
  {
    firstName: 'Ahmed',
    lastName: 'Trabelsi',
    email: 'directeur.technique@tav.aero',
    role: 'DIRECTEUR',
    directorate: 'TECHNIQUE',
    position: 'Directeur Technique',
    department: 'Direction Technique',
    managedDepartments: ['MAINTENANCE', 'INFRASTRUCTURE', 'IT', 'SECURITE'],
    delegationLevel: 4,
    airport: 'ENFIDHA'
  },
  {
    firstName: 'Fatma',
    lastName: 'Gharbi',
    email: 'directeur.commercial@tav.aero',
    role: 'DIRECTEUR',
    directorate: 'COMMERCIAL',
    position: 'Directrice Commerciale',
    department: 'Direction Commerciale',
    managedDepartments: ['MARKETING', 'VENTES', 'RELATIONS_CLIENT', 'DEVELOPPEMENT'],
    delegationLevel: 4,
    airport: 'ENFIDHA'
  },
  {
    firstName: 'Karim',
    lastName: 'Bouazizi',
    email: 'directeur.financier@tav.aero',
    role: 'DIRECTEUR',
    directorate: 'FINANCIER',
    position: 'Directeur Financier',
    department: 'Direction Financière',
    managedDepartments: ['COMPTABILITE', 'BUDGET', 'CONTROLE_GESTION', 'TRESORERIE'],
    delegationLevel: 4,
    airport: 'ENFIDHA'
  },
  {
    firstName: 'Sonia',
    lastName: 'Mestiri',
    email: 'directeur.operations@tav.aero',
    role: 'DIRECTEUR',
    directorate: 'OPERATIONS',
    position: 'Directrice des Opérations',
    department: 'Direction des Opérations',
    managedDepartments: ['OPERATIONS_AEROPORTUAIRES', 'SURETE', 'LOGISTIQUE', 'QUALITE'],
    delegationLevel: 4,
    airport: 'ENFIDHA'
  },
  {
    firstName: 'Nabil',
    lastName: 'Hamdi',
    email: 'directeur.rh@tav.aero',
    role: 'SOUS_DIRECTEUR',
    directorate: 'RH',
    position: 'Directeur des Ressources Humaines',
    department: 'Direction RH',
    managedDepartments: ['RECRUTEMENT', 'FORMATION', 'PAIE', 'RELATIONS_SOCIALES'],
    delegationLevel: 3,
    airport: 'ENFIDHA'
  }
];

async function createDirectors() {
  try {
    console.log('🚀 [CREATE DIRECTORS] Début de la création des comptes directeurs...');
    
    const defaultPassword = 'DirecteurTAV2024!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    for (const directorData of directorsData) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email: directorData.email });
        
        if (existingUser) {
          // Mettre à jour l'utilisateur existant
          Object.assign(existingUser, {
            ...directorData,
            password: hashedPassword,
            mustChangePassword: true,
            isActive: true,
            notificationPreferences: {
              correspondanceAssignment: true,
              deadlineWarnings: true,
              urgentCorrespondances: true,
              weeklyReports: true,
              delegationRequests: true
            },
            performanceMetrics: {
              totalAssigned: 0,
              totalCompleted: 0,
              averageResponseTime: 0,
              overdueCount: 0,
              lastMetricsUpdate: new Date()
            },
            updatedAt: new Date()
          });
          
          await existingUser.save();
          updated++;
          console.log(`✅ [UPDATE] ${directorData.firstName} ${directorData.lastName} (${directorData.role}) mis à jour`);
        } else {
          // Créer un nouveau directeur
          const newDirector = new User({
            _id: uuidv4(),
            ...directorData,
            password: hashedPassword,
            mustChangePassword: true,
            isActive: true,
            notificationPreferences: {
              correspondanceAssignment: true,
              deadlineWarnings: true,
              urgentCorrespondances: true,
              weeklyReports: true,
              delegationRequests: true
            },
            performanceMetrics: {
              totalAssigned: 0,
              totalCompleted: 0,
              averageResponseTime: 0,
              overdueCount: 0,
              lastMetricsUpdate: new Date()
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await newDirector.save();
          created++;
          console.log(`✅ [CREATE] ${directorData.firstName} ${directorData.lastName} (${directorData.role}) créé`);
        }
        
      } catch (error) {
        console.error(`❌ [ERROR] Erreur pour ${directorData.firstName} ${directorData.lastName}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 [RÉSULTATS] Création des directeurs terminée:');
    console.log(`   ✅ Créés: ${created}`);
    console.log(`   🔄 Mis à jour: ${updated}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📧 Mot de passe par défaut: ${defaultPassword}`);
    console.log('\n⚠️ [IMPORTANT] Tous les directeurs doivent changer leur mot de passe à la première connexion');
    
    return {
      created,
      updated,
      errors,
      defaultPassword
    };
    
  } catch (error) {
    console.error('❌ [FATAL ERROR] Erreur lors de la création des directeurs:', error);
    throw error;
  }
}

// Exporter la fonction pour utilisation via API
module.exports = { createDirectors, directorsData };

// Permettre l'exécution directe du script
if (require.main === module) {
  const mongoose = require('mongoose');
  
  // Connexion à la base de données
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sgdo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(async () => {
    console.log('📡 [DATABASE] Connexion à MongoDB établie');
    
    try {
      await createDirectors();
      console.log('\n🎉 [SUCCESS] Script terminé avec succès !');
    } catch (error) {
      console.error('\n💥 [FAILURE] Échec du script:', error);
    } finally {
      await mongoose.disconnect();
      console.log('📡 [DATABASE] Déconnexion de MongoDB');
      process.exit(0);
    }
  }).catch(error => {
    console.error('❌ [DATABASE ERROR] Impossible de se connecter à MongoDB:', error);
    process.exit(1);
  });
}
