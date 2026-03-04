const axios = require('axios');

async function testAPIRoute() {
  try {
    console.log('🧪 Test de la route API POST /api/users');
    console.log('='.repeat(50));

    // Données de test (même format que le frontend)
    const userData = {
      email: 'test.api@tav.aero',
      firstName: 'Test',
      lastName: 'API',
      role: 'AGENT',
      airport: 'ENFIDHA',
      phone: '12345678',
      department: 'Test API',
      password: 'password123',
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    };

    console.log('📋 Données à envoyer:');
    console.log(JSON.stringify(userData, null, 2));

    // Test 1: Sans authentification (doit échouer)
    console.log('\n1. Test sans authentification...');
    try {
      const response = await axios.post('http://10.20.14.130:5000/api/users', userData);
      console.log('❌ Erreur: La requête sans auth a réussi (ne devrait pas)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Erreur 401 attendue (pas d\'authentification)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status, error.response?.data);
      }
    }

    // Test 2: Avec un token invalide
    console.log('\n2. Test avec token invalide...');
    try {
      const response = await axios.post('http://10.20.14.130:5000/api/users', userData, {
        headers: {
          'Authorization': 'Bearer invalid-token-123'
        }
      });
      console.log('❌ Erreur: La requête avec token invalide a réussi');
    } catch (error) {
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Erreur d\'authentification attendue');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data);
      }
    }

    // Test 3: Test de la route de login pour obtenir un token valide
    console.log('\n3. Test de connexion pour obtenir un token...');
    try {
      const loginResponse = await axios.post('http://10.20.14.130:5000/api/auth/login', {
        email: 'abdallah.benkhalifa@tav.aero', // SUPER_ADMIN existant
        password: 'admin123' // Mot de passe par défaut
      });
      
      const token = loginResponse.data.token;
      console.log('✅ Token obtenu:', token ? 'Présent' : 'Absent');
      
      if (token) {
        // Test 4: Avec token valide
        console.log('\n4. Test avec token valide...');
        try {
          const response = await axios.post('http://10.20.14.130:5000/api/users', userData, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ Utilisateur créé avec succès!');
          console.log('Status:', response.status);
          console.log('Utilisateur:', response.data.email);
          
        } catch (error) {
          console.log('❌ Erreur lors de la création:');
          console.log('Status:', error.response?.status);
          console.log('Message:', error.response?.data?.message);
          console.log('Détails:', error.response?.data);
          
          // Log de l'erreur complète pour debug
          if (error.response?.status === 500) {
            console.log('\n🔍 ERREUR 500 DÉTECTÉE:');
            console.log('Headers de réponse:', error.response.headers);
            console.log('Données de réponse complètes:', error.response.data);
          }
        }
      }
      
    } catch (loginError) {
      console.log('❌ Erreur de connexion:', loginError.response?.data?.message);
      console.log('Impossible de tester avec un token valide');
    }

  } catch (error) {
    console.error('❌ Erreur générale du test:');
    console.error('Message:', error.message);
  }
}

// Exécuter le test
testAPIRoute();
