const axios = require('axios');

async function testLogin() {
  try {
    console.log('=== Test de connexion via API ===\n');
    
    const email = 'abdallah.benkhalifa@tav.aero';
    const password = 'password123';
    
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nEnvoi de la requête de connexion...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    
    console.log('✅ Connexion réussie !');
    console.log('\nRéponse:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur de connexion:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data.message}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testLogin();
