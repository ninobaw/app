#!/usr/bin/env node

console.log('🔍 === TEST AVEC VRAI UTILISATEUR ===');
console.log('');

import axios from 'axios';

const API_BASE_URL = 'http://10.20.14.148:5000';

async function testWithRealUser() {
  try {
    console.log('🔄 1. Recherche d\'un utilisateur valide...');
    
    // Essayer de trouver un utilisateur (peut-être le premier admin)
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@sgdo.com', // Essayez avec l'email admin par défaut
      password: 'admin123' // Ou un mot de passe connu
    }).catch(() => {
      console.log('❌ Login avec admin@sgdo.com échoué');
      return null;
    });

    if (!loginResponse.data) {
      console.log('❌ Impossible de trouver un utilisateur pour le test');
      return;
    }

    const user = loginResponse.data.user;
    const token = loginResponse.data.token;
    
    console.log('✅ Utilisateur trouvé :');
    console.log(`   - ID : ${user.id}`);
    console.log(`   - Email : ${user.email}`);
    console.log(`   - Rôle : ${user.role}`);
    console.log(`   - mustChangePassword : ${user.mustChangePassword}`);
    console.log('');

    // Maintenant tester le changement de mot de passe
    console.log('🔄 2. Test de changement de mot de passe...');
    
    const changePasswordData = {
      currentPassword: 'admin123', // Le mot de passe actuel
      newPassword: 'newSecurePassword456' // Nouveau mot de passe
    };

    const changeResponse = await axios.put(
      `${API_BASE_URL}/api/users/${user.id}/change-password`,
      changePasswordData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Changement de mot de passe réussi !');
    console.log('   - Status :', changeResponse.status);
    console.log('   - Message :', changeResponse.data.message);
    console.log('   - mustChangePassword :', changeResponse.data.mustChangePassword);

  } catch (error) {
    console.log('❌ Erreur lors du test :');
    
    if (error.response) {
      console.log('   - Status :', error.response.status);
      console.log('   - Message :', error.response.data?.message || 'Pas de message');
      console.log('   - Erreur :', error.response.data?.error || 'Pas de détails');
    } else if (error.request) {
      console.log('   - Type : Erreur réseau');
      console.log('   - Message :', error.message);
    } else {
      console.log('   - Type : Erreur de configuration');
      console.log('   - Message :', error.message);
    }
  }
}

testWithRealUser().then(() => {
  console.log('');
  console.log('🔍 === FIN DU TEST ===');
});
