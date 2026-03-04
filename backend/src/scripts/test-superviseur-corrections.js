const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const API_BASE_URL = 'http://localhost:5000/api';

async function testSuperviseurCorrections() {
  try {
    console.log('🔧 Test des Corrections Superviseur Bureau d\'Ordre');
    console.log('=================================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Vérifier les utilisateurs
    console.log('👥 Vérification des utilisateurs...');
    
    const asma = await User.findOne({ email: 'asma.sahli@tav.aero' });
    const siwar = await User.findOne({ email: 'siwar.daassa1@tav.aero' });
    
    console.log(`📊 Asma Sahli: ${asma ? '✅ Trouvée' : '❌ Non trouvée'}`);
    console.log(`📊 Siwar Daassa: ${siwar ? '✅ Trouvée' : '❌ Non trouvée'}`);
    
    if (asma) {
      console.log(`   - Asma: ${asma.firstName} ${asma.lastName} (${asma.role})`);
    }
    if (siwar) {
      console.log(`   - Siwar: ${siwar.firstName} ${siwar.lastName} (${siwar.role})`);
    }
    console.log('');

    // 3. Vérifier les correspondances
    console.log('📋 Vérification des correspondances...');
    
    const allCorrespondances = await Correspondance.find({})
      .populate('authorId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total correspondances: ${allCorrespondances.length}`);
    
    if (allCorrespondances.length > 0) {
      console.log('📝 Correspondances trouvées:');
      allCorrespondances.forEach((corresp, index) => {
        const author = corresp.authorId || corresp.author;
        const authorName = author ? `${author.firstName} ${author.lastName}` : 'Auteur inconnu';
        
        console.log(`   ${index + 1}. "${corresp.title || 'Sans titre'}"`);
        console.log(`      - Auteur: ${authorName}`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - Créée: ${corresp.createdAt.toLocaleDateString()}`);
      });
    }
    console.log('');

    // 4. Tester l'accès aux correspondances avec Siwar
    if (siwar) {
      console.log('🔑 Test d\'accès aux correspondances avec Siwar...');
      
      const token = jwt.sign(
        { 
          userId: siwar._id,
          email: siwar.email, 
          role: siwar.role 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Test GET /api/correspondances
      console.log('🔄 Test: GET /api/correspondances');
      try {
        const response = await axios.get(`${API_BASE_URL}/correspondances`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { page: 1, limit: 10 }
        });
        
        console.log(`✅ Accès correspondances: ${response.status}`);
        console.log(`📊 Correspondances récupérées: ${response.data.correspondances?.length || 0}`);
        
        if (response.data.correspondances && response.data.correspondances.length > 0) {
          console.log('📝 Correspondances accessibles:');
          response.data.correspondances.slice(0, 3).forEach((corresp, index) => {
            console.log(`   ${index + 1}. ${corresp.title || 'Sans titre'} (${corresp.status})`);
          });
        }
      } catch (error) {
        console.log(`❌ Erreur accès correspondances: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      console.log('');

      // Test Dashboard Superviseur
      console.log('🔄 Test: GET /api/supervisor/dashboard');
      try {
        const response = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { timeframe: 'month' } // Utiliser 'month' pour avoir plus de chances de récupérer des données
        });
        
        console.log(`✅ Dashboard superviseur: ${response.status}`);
        
        if (response.data.success && response.data.data) {
          const data = response.data.data;
          console.log('📈 Données du dashboard:');
          console.log(`   - Total correspondances: ${data.totalCorrespondances || 0}`);
          console.log(`   - En attente: ${data.pendingCorrespondances || 0}`);
          console.log(`   - Répondues: ${data.repliedCorrespondances || 0}`);
          console.log(`   - En retard: ${data.overdueCorrespondances || 0}`);
          console.log(`   - Taux de réponse: ${data.responseRate || 0}%`);
          
          if (data.totalCorrespondances > 0) {
            console.log('✅ CORRECTION RÉUSSIE: Les données réelles s\'affichent maintenant !');
          } else {
            console.log('⚠️  Aucune correspondance dans les données du dashboard');
          }
        }
      } catch (error) {
        console.log(`❌ Erreur dashboard: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      console.log('');
    }

    // 5. Résumé des corrections
    console.log('🎯 RÉSUMÉ DES CORRECTIONS APPLIQUÉES');
    console.log('====================================\n');
    
    console.log('✅ CORRECTION 1: Accès aux correspondances');
    console.log('   - Ajout du middleware authorizeBureauOrdre aux routes GET');
    console.log('   - Le superviseur peut maintenant accéder aux correspondances');
    console.log('   - Routes corrigées: GET /correspondances et GET /correspondances/:id\n');
    
    console.log('✅ CORRECTION 2: Données réelles dans le dashboard');
    console.log('   - Modification du filtre de date dans SupervisorDashboardService');
    console.log('   - Inclusion des correspondances plus anciennes mais encore actives');
    console.log('   - Fallback vers toutes les correspondances si aucune trouvée dans la période');
    console.log('   - Correction des champs author/authorId dans les requêtes\n');
    
    console.log('🚀 RÉSULTATS ATTENDUS:');
    console.log('   1. Siwar peut maintenant voir la page Correspondances');
    console.log('   2. Le dashboard superviseur affiche les vraies données');
    console.log('   3. Les correspondances d\'Asma Sahli sont visibles');
    console.log('   4. Les statistiques reflètent les données réelles\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testSuperviseurCorrections();
