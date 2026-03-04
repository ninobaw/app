#!/usr/bin/env node

console.log('🔍 === TEST DE LA ROUTE DE CHANGEMENT DE MOT DE PASSE ===');
console.log('');

// Importer les modules nécessaires
import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://10.20.14.148:5000';
const TEST_USER_ID = 'test-user-id'; // À remplacer avec un vrai ID

// Données de test
const testData = {
  currentPassword: 'tempPassword123',
  newPassword: 'newSecurePassword456'
};

console.log('📍 1. Configuration du test :');
console.log(`   - URL API : ${API_BASE_URL}`);
console.log(`   - Route : PUT /api/users/${TEST_USER_ID}/change-password`);
console.log(`   - Données :`, { ...testData, currentPassword: '***', newPassword: '***' });
console.log('');

async function testPasswordChange() {
  try {
    console.log('🔄 2. Envoi de la requête...');
    
    const response = await axios.put(
      `${API_BASE_URL}/api/users/${TEST_USER_ID}/change-password`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SGDO-Test-Script/1.0'
        },
        timeout: 10000 // 10 secondes
      }
    );

    console.log('✅ 3. Réponse réussie !');
    console.log('   - Status :', response.status);
    console.log('   - Message :', response.data.message);
    console.log('   - mustChangePassword :', response.data.mustChangePassword);
    console.log('   - Timestamp :', response.data.timestamp);
    
  } catch (error) {
    console.log('❌ 3. Erreur détectée :');
    
    if (error.response) {
      // Erreur de réponse du serveur
      console.log('   - Status :', error.response.status);
      console.log('   - Message :', error.response.data?.message || 'Pas de message');
      console.log('   - Erreur :', error.response.data?.error || 'Pas de détails');
    } else if (error.request) {
      // Erreur de réseau
      console.log('   - Type : Erreur réseau');
      console.log('   - Message :', error.message);
      console.log('   - Code :', error.code);
    } else {
      // Erreur de configuration
      console.log('   - Type : Erreur de configuration');
      console.log('   - Message :', error.message);
    }
  }
}

// Exécuter le test
testPasswordChange().then(() => {
  console.log('');
  console.log('🔍 === FIN DU TEST ===');
}).catch(error => {
  console.error('Erreur inattendue:', error);
});
