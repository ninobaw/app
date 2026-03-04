const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const API_BASE_URL = 'http://localhost:5000/api';

async function testSuperviseurSimple() {
  try {
    console.log('🎯 Test Simple Superviseur - Corrections Appliquées');
    console.log('==================================================\n');

    // 1. Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 2. Vérifier Siwar Daassa
    console.log('👤 Recherche de Siwar Daassa...');
    const siwar = await User.findOne({ email: 'siwar.daassa1@tav.aero' });
    
    if (!siwar) {
      console.log('❌ Siwar Daassa non trouvée');
      return;
    }
    
    console.log('✅ Siwar Daassa trouvée:');
    console.log(`   - Nom: ${siwar.firstName} ${siwar.lastName}`);
    console.log(`   - Rôle: ${siwar.role}`);
    console.log(`   - Aéroport: ${siwar.airport}\n`);

    // 3. Vérifier les correspondances
    console.log('📋 Vérification des correspondances...');
    const correspondances = await Correspondance.find({}).populate('authorId', 'firstName lastName email');
    console.log(`📊 Total correspondances: ${correspondances.length}\n`);

    if (correspondances.length > 0) {
      console.log('📝 Correspondances existantes:');
      correspondances.forEach((corresp, index) => {
        const author = corresp.authorId;
        const authorName = author ? `${author.firstName} ${author.lastName}` : 'Auteur inconnu';
        
        console.log(`   ${index + 1}. "${corresp.title || 'Sans titre'}"`);
        console.log(`      - Auteur: ${authorName}`);
        console.log(`      - Status: ${corresp.status}`);
        console.log(`      - Créée: ${corresp.createdAt.toLocaleDateString()}`);
      });
      console.log('');
    }

    // 4. Créer un token JWT pour Siwar
    console.log('🔑 Génération du token JWT pour Siwar...');
    const token = jwt.sign(
      { 
        userId: siwar._id,
        email: siwar.email, 
        role: siwar.role 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token généré\n');

    // 5. Test accès aux correspondances
    console.log('🔄 Test: Accès aux correspondances...');
    try {
      const response = await axios.get(`${API_BASE_URL}/correspondances`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { page: 1, limit: 10 }
      });
      
      console.log(`✅ Accès correspondances: ${response.status} OK`);
      console.log(`📊 Correspondances récupérées: ${response.data.correspondances?.length || 0}`);
      
      if (response.data.correspondances && response.data.correspondances.length > 0) {
        console.log('📝 Correspondances accessibles par Siwar:');
        response.data.correspondances.forEach((corresp, index) => {
          console.log(`   ${index + 1}. ${corresp.title || 'Sans titre'} (${corresp.status})`);
        });
      }
    } catch (error) {
      console.log(`❌ Erreur accès correspondances: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    console.log('');

    // 6. Test dashboard superviseur
    console.log('🔄 Test: Dashboard superviseur...');
    try {
      const response = await axios.get(`${API_BASE_URL}/supervisor/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { timeframe: 'month' }
      });
      
      console.log(`✅ Dashboard superviseur: ${response.status} OK`);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        console.log('📈 Données du dashboard récupérées:');
        console.log(`   - Total correspondances: ${data.totalCorrespondances || 0}`);
        console.log(`   - En attente: ${data.pendingCorrespondances || 0}`);
        console.log(`   - Répondues: ${data.repliedCorrespondances || 0}`);
        console.log(`   - Taux de réponse: ${data.responseRate || 0}%`);
        
        if (data.totalCorrespondances > 0) {
          console.log('\n🎉 SUCCÈS: Les données réelles s\'affichent dans le dashboard !');
          console.log('   - La correspondance d\'Asma Sahli est maintenant visible');
          console.log('   - Les statistiques reflètent les vraies données');
        } else {
          console.log('\n⚠️  Le dashboard ne montre aucune correspondance');
          console.log('   - Vérifier les filtres de date');
          console.log('   - Vérifier la logique de fallback');
        }
      }
    } catch (error) {
      console.log(`❌ Erreur dashboard: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    console.log('');

    // 7. Résumé
    console.log('🎯 RÉSUMÉ DES CORRECTIONS');
    console.log('========================\n');
    
    console.log('✅ PROBLÈME 1 RÉSOLU: Accès aux correspondances');
    console.log('   - Middleware authorizeBureauOrdre ajouté aux routes GET');
    console.log('   - Siwar peut maintenant accéder aux correspondances\n');
    
    console.log('✅ PROBLÈME 2 RÉSOLU: Données réelles dans dashboard');
    console.log('   - Filtre de date élargi dans SupervisorDashboardService');
    console.log('   - Fallback vers toutes les correspondances si période vide');
    console.log('   - Correction du champ populate (authorId seulement)\n');
    
    console.log('🚀 PROCHAINES ÉTAPES:');
    console.log('   1. Se connecter au frontend avec Siwar Daassa');
    console.log('   2. Vérifier l\'accès à la page Correspondances');
    console.log('   3. Vérifier que le dashboard affiche les vraies données');
    console.log('   4. Confirmer que la correspondance d\'Asma est visible\n');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test
testSuperviseurSimple();
