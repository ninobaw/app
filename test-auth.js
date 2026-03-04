import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5000/api';

// Test de connexion simple
const testAuth = async () => {
  console.log('🔐 Test de connexion...');
  
  try {
    // Test avec l'utilisateur admin connu
    const loginData = {
      email: 'abdallah.benkhalifa@tav.aero',
      password: 'password123'
    };
    
    console.log(`📧 Tentative de connexion avec: ${loginData.email}`);
    console.log(`🌐 URL: ${BASE_URL}/auth/login`);
    
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    console.log('📋 Réponse complète:', response.data);
    
    if (response.data.success) {
      console.log('✅ Connexion réussie !');
      console.log(`   Utilisateur: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      console.log(`   Token: ${response.data.token ? 'Présent' : 'Absent'}`);
      
      // Test d'une requête authentifiée
      const token = response.data.token;
      console.log('\n🔧 Test d\'une requête authentifiée...');
      
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Requête authentifiée réussie !');
      console.log(`   Nombre d'utilisateurs: ${usersResponse.data.data?.length || 0}`);
      
    } else {
      console.error('❌ Connexion échouée:', response.data);
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.response?.data || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   URL complète:', error.config?.url);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 PROBLÈME: Le serveur backend n\'est pas démarré !');
      console.log('   Solutions:');
      console.log('   1. Démarrer le backend: cd backend && npm start');
      console.log('   2. Vérifier que le port 5000 est libre');
      console.log('   3. Vérifier l\'URL: http://localhost:5000');
    }
  }
};

// Lancer le test
testAuth();
