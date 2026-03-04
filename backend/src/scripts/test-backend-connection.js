const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

async function testBackendConnection() {
  console.log('🔍 Test de connexion au backend');
  console.log('===============================');

  try {
    // Test 1: Vérifier si le serveur répond
    console.log('1. Test de connectivité du serveur...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Serveur accessible');
  } catch (error) {
    console.log('❌ Serveur non accessible');
    console.log('   Erreur:', error.code || error.message);
    console.log('   Assurez-vous que le backend est démarré sur le port 5000');
    return false;
  }

  try {
    // Test 2: Test de l'endpoint d'authentification
    console.log('\n2. Test de l\'endpoint d\'authentification...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'test@invalid.com',
      password: 'invalid'
    });
    console.log('⚠️ Réponse inattendue (devrait échouer)');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Endpoint d\'authentification fonctionne (401 attendu)');
    } else {
      console.log('❌ Problème avec l\'endpoint d\'authentification');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message || error.message);
    }
  }

  try {
    // Test 3: Test avec les vrais identifiants
    console.log('\n3. Test avec les identifiants réels...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'abdallah.benkhalifa@tav.aero',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      console.log('✅ Connexion réussie !');
      console.log(`   Token reçu: ${loginResponse.data.token ? 'Oui' : 'Non'}`);
      console.log(`   Utilisateur: ${loginResponse.data.user?.email}`);
      console.log(`   Rôle: ${loginResponse.data.user?.role}`);
      return true;
    } else {
      console.log('❌ Connexion échouée');
      console.log('   Message:', loginResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion');
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Le mot de passe pourrait être incorrect.');
      console.log('   Essayez de réinitialiser le mot de passe ou vérifiez la base de données.');
    }
    return false;
  }
}

// Exécuter le test
testBackendConnection()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('🎉 BACKEND OPÉRATIONNEL !');
      console.log('Les tests CRUD peuvent maintenant être exécutés.');
    } else {
      console.log('❌ PROBLÈME AVEC LE BACKEND');
      console.log('Résolvez les problèmes ci-dessus avant de continuer.');
    }
    console.log('='.repeat(50));
  })
  .catch(console.error);
