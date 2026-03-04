const mongoose = require('mongoose');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

async function debugCorrespondancesAsma() {
  try {
    console.log('🔍 Debug Correspondances Asma Sahli');
    console.log('===================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Rechercher Asma Sahli
    console.log('👤 Recherche d\'Asma Sahli...');
    const asma = await User.findOne({ 
      $or: [
        { email: { $regex: /asma/i } },
        { firstName: { $regex: /asma/i } },
        { lastName: { $regex: /sahli/i } }
      ]
    });

    if (asma) {
      console.log('✅ Asma Sahli trouvée:');
      console.log(`   - ID: ${asma._id}`);
      console.log(`   - Nom: ${asma.firstName} ${asma.lastName}`);
      console.log(`   - Email: ${asma.email}`);
      console.log(`   - Rôle: ${asma.role}`);
      console.log(`   - Aéroport: ${asma.airport}\n`);
    } else {
      console.log('❌ Asma Sahli non trouvée\n');
    }

    // 3. Rechercher toutes les correspondances
    console.log('📋 Recherche de toutes les correspondances...');
    const allCorrespondances = await Correspondance.find({})
      .populate('authorId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    console.log(`📊 Total correspondances trouvées: ${allCorrespondances.length}\n`);

    if (allCorrespondances.length > 0) {
      console.log('📝 Liste des correspondances:');
      allCorrespondances.forEach((corresp, index) => {
        const author = corresp.authorId || corresp.author;
        const authorName = author ? `${author.firstName} ${author.lastName}` : 'Auteur inconnu';
        const authorEmail = author ? author.email : 'Email inconnu';
        
        console.log(`   ${index + 1}. ${corresp.title || 'Sans titre'}`);
        console.log(`      - Auteur: ${authorName} (${authorEmail})`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - Priorité: ${corresp.priority}`);
        console.log(`      - Aéroport: ${corresp.airport}`);
        console.log(`      - Créée le: ${corresp.createdAt}`);
        console.log(`      - ID: ${corresp._id}\n`);
      });
    }

    // 4. Rechercher spécifiquement les correspondances d'Asma
    if (asma) {
      console.log('🎯 Correspondances créées par Asma Sahli...');
      const asmaCorrespondances = await Correspondance.find({
        $or: [
          { authorId: asma._id },
          { author: asma._id },
          { 'authorId.email': asma.email }
        ]
      }).populate('authorId', 'firstName lastName email');

      console.log(`📊 Correspondances d'Asma: ${asmaCorrespondances.length}\n`);

      if (asmaCorrespondances.length > 0) {
        asmaCorrespondances.forEach((corresp, index) => {
          console.log(`   ${index + 1}. ${corresp.title || 'Sans titre'}`);
          console.log(`      - Status: ${corresp.status}`);
          console.log(`      - Priorité: ${corresp.priority}`);
          console.log(`      - Aéroport: ${corresp.airport}`);
          console.log(`      - Créée le: ${corresp.createdAt}`);
          console.log(`      - Deadline: ${corresp.response_deadline || 'Aucune'}`);
          console.log(`      - ID: ${corresp._id}\n`);
        });
      }
    }

    // 5. Vérifier les correspondances récentes (dernière semaine)
    console.log('📅 Correspondances de la dernière semaine...');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentCorrespondances = await Correspondance.find({
      createdAt: { $gte: oneWeekAgo }
    }).populate('authorId', 'firstName lastName email');

    console.log(`📊 Correspondances récentes (7 derniers jours): ${recentCorrespondances.length}\n`);

    // 6. Vérifier les correspondances du dernier mois
    console.log('📅 Correspondances du dernier mois...');
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const monthlyCorrespondances = await Correspondance.find({
      createdAt: { $gte: oneMonthAgo }
    }).populate('authorId', 'firstName lastName email');

    console.log(`📊 Correspondances du mois: ${monthlyCorrespondances.length}\n`);

    // 7. Rechercher Siwar Daassa pour comparaison
    console.log('👤 Recherche de Siwar Daassa (superviseur)...');
    const siwar = await User.findOne({ 
      email: 'siwar.daassa1@tav.aero'
    });

    if (siwar) {
      console.log('✅ Siwar Daassa trouvée:');
      console.log(`   - ID: ${siwar._id}`);
      console.log(`   - Nom: ${siwar.firstName} ${siwar.lastName}`);
      console.log(`   - Rôle: ${siwar.role}`);
      console.log(`   - Aéroport: ${siwar.airport}\n`);
    }

    console.log('🎯 ANALYSE DU PROBLÈME:');
    console.log('======================\n');
    
    if (allCorrespondances.length === 0) {
      console.log('❌ PROBLÈME: Aucune correspondance trouvée dans la base de données');
      console.log('   - Vérifier que des correspondances ont été créées');
      console.log('   - Vérifier la connexion à la bonne base de données\n');
    } else if (recentCorrespondances.length === 0) {
      console.log('⚠️  PROBLÈME POTENTIEL: Aucune correspondance récente');
      console.log('   - Le dashboard superviseur filtre par période (semaine/mois)');
      console.log('   - Les correspondances existantes sont peut-être trop anciennes');
      console.log('   - Solution: Modifier le filtre de date ou créer une correspondance récente\n');
    } else {
      console.log('✅ Des correspondances récentes existent');
      console.log('   - Vérifier les filtres dans SupervisorDashboardService');
      console.log('   - Vérifier les permissions d\'accès\n');
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le debug
debugCorrespondancesAsma();
