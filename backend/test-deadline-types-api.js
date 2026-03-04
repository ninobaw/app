const axios = require('axios');

async function testDeadlineTypesAPI() {
  try {
    console.log('🧪 === TEST API TYPES D\'ÉCHÉANCE ===\n');
    
    const baseURL = 'http://localhost:5000';
    
    // Test 1: Récupérer tous les types d'échéance (sans auth)
    console.log('1. Test GET /api/deadline-types (sans auth)...');
    try {
      const response = await axios.get(`${baseURL}/api/deadline-types`);
      console.log('❌ Réponse inattendue (devrait échouer sans auth):', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentification requise (normal)');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }
    
    // Test 2: Vérifier que les types existent en base
    console.log('\n2. Vérification directe en base de données...');
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    
    const db = mongoose.connection.db;
    const deadlineTypes = await db.collection('deadlinetypes').find({}).toArray();
    
    console.log(`📊 Types d'échéance en base: ${deadlineTypes.length}`);
    
    if (deadlineTypes.length > 0) {
      console.log('\n📋 Types trouvés:');
      deadlineTypes.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type.name}: ${type.label} (${type.days}j) - ${type.color}`);
        console.log(`      Actif: ${type.isActive}, Défaut: ${type.isDefault}`);
      });
    } else {
      console.log('❌ Aucun type d\'échéance trouvé en base');
      console.log('💡 Exécutez: node init-deadline-types.js');
    }
    
    // Test 3: Vérifier la route avec un token valide
    console.log('\n3. Test avec authentification...');
    
    // Trouver un utilisateur pour obtenir un token
    const user = await db.collection('users').findOne({ role: 'SUPER_ADMIN' });
    
    if (user) {
      console.log(`👤 Utilisateur test: ${user.firstName} ${user.lastName}`);
      
      // Simuler une connexion pour obtenir un token
      try {
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: user.email,
          password: 'password123' // Mot de passe par défaut
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token obtenu');
        
        // Test avec token
        const typesResponse = await axios.get(`${baseURL}/api/deadline-types`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ API répond: ${typesResponse.status}`);
        console.log(`📊 Types retournés: ${typesResponse.data.data?.length || 0}`);
        
        if (typesResponse.data.data && typesResponse.data.data.length > 0) {
          console.log('\n📋 Réponse API:');
          typesResponse.data.data.forEach((type, index) => {
            console.log(`   ${index + 1}. ${type.name}: ${type.label} (${type.days}j)`);
          });
        }
        
      } catch (authError) {
        console.log('❌ Erreur d\'authentification:', authError.response?.data?.message || authError.message);
        console.log('💡 Vérifiez le mot de passe ou créez un utilisateur test');
      }
    } else {
      console.log('❌ Aucun SUPER_ADMIN trouvé');
    }
    
    await mongoose.disconnect();
    
    console.log('\n🎯 === RÉSUMÉ ===');
    console.log('1. Vérifiez que le serveur backend est démarré');
    console.log('2. Vérifiez que les types d\'échéance existent en base');
    console.log('3. Vérifiez l\'authentification frontend');
    console.log('4. Vérifiez les logs du navigateur pour les erreurs API');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testDeadlineTypesAPI();
