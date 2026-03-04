const axios = require('axios');

async function verifyNewLogin() {
  try {
    console.log('🔐 Test de nouvelle connexion avec token 8h...\n');

    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'abdallah.benkhalifa@tav.aero',
      password: 'password123'
    });

    const { token, user } = response.data;
    
    console.log('✅ Nouvelle connexion réussie');
    console.log('👤 Utilisateur:', user.firstName, user.lastName);
    console.log('🔑 Token (longueur):', token.length);
    
    // Décoder le token pour vérifier l'expiration
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    const expirationTime = new Date(decoded.exp * 1000);
    const hoursUntilExpiration = (expirationTime - new Date()) / (1000 * 60 * 60);
    
    console.log('⏰ Token expire dans:', hoursUntilExpiration.toFixed(2), 'heures');
    console.log('📅 Date d\'expiration:', expirationTime.toLocaleString());
    
    if (hoursUntilExpiration > 7) {
      console.log('\n🎉 SUCCÈS: Le nouveau token dure bien 8 heures !');
      console.log('✅ Utilisez ce token pour résoudre le problème');
    } else {
      console.log('\n⚠️ ATTENTION: Token plus court que prévu');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

verifyNewLogin();
