const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'abdallah.benkhalifa@tav.aero',
  password: 'password123'
};

let authToken = '';
let testTagId = '';

async function login() {
  try {
    console.log('🔐 Connexion en cours...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Connexion réussie');
      console.log(`   Utilisateur: ${response.data.user.email}`);
      console.log(`   Rôle: ${response.data.user.role}`);
      return true;
    } else {
      console.log('❌ Échec de la connexion:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createTestTag() {
  try {
    console.log('\n📝 Création d\'un tag de test...');
    const tagData = {
      name: 'test-crud-' + Date.now(),
      color: '#FF5733',
      description: 'Tag de test pour CRUD'
    };

    const response = await axios.post(`${API_BASE_URL}/tags`, tagData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      testTagId = response.data.data.id;
      console.log('✅ Tag créé avec succès');
      console.log(`   ID: ${testTagId}`);
      console.log(`   Nom: ${response.data.data.name}`);
      console.log(`   Couleur: ${response.data.data.color}`);
      return true;
    } else {
      console.log('❌ Échec de la création:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de création:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getAllTags() {
  try {
    console.log('\n📋 Récupération de tous les tags...');
    const response = await axios.get(`${API_BASE_URL}/tags/all`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} tags récupérés`);
      
      // Chercher notre tag de test
      const testTag = response.data.data.find(tag => tag.id === testTagId);
      if (testTag) {
        console.log('✅ Tag de test trouvé dans la liste');
        console.log(`   Nom: ${testTag.name}`);
        console.log(`   Actif: ${testTag.isActive}`);
        return true;
      } else {
        console.log('❌ Tag de test non trouvé dans la liste');
        return false;
      }
    } else {
      console.log('❌ Échec de la récupération:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de récupération:', error.response?.data?.message || error.message);
    return false;
  }
}

async function updateTestTag() {
  try {
    console.log('\n✏️ Modification du tag de test...');
    const updateData = {
      name: 'test-crud-updated-' + Date.now(),
      color: '#33FF57',
      description: 'Tag modifié avec succès',
      isActive: false
    };

    const response = await axios.put(`${API_BASE_URL}/tags/${testTagId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Tag modifié avec succès');
      console.log(`   Nouveau nom: ${response.data.data.name}`);
      console.log(`   Nouvelle couleur: ${response.data.data.color}`);
      console.log(`   Actif: ${response.data.data.isActive}`);
      return true;
    } else {
      console.log('❌ Échec de la modification:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de modification:', error.response?.data?.message || error.message);
    console.log('   Status:', error.response?.status);
    console.log('   Data:', error.response?.data);
    return false;
  }
}

async function deleteTestTag() {
  try {
    console.log('\n🗑️ Suppression du tag de test...');
    const response = await axios.delete(`${API_BASE_URL}/tags/${testTagId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Tag supprimé (désactivé) avec succès');
      return true;
    } else {
      console.log('❌ Échec de la suppression:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de suppression:', error.response?.data?.message || error.message);
    console.log('   Status:', error.response?.status);
    console.log('   Data:', error.response?.data);
    return false;
  }
}

async function verifyTagDeleted() {
  try {
    console.log('\n🔍 Vérification de la suppression...');
    const response = await axios.get(`${API_BASE_URL}/tags/all`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const testTag = response.data.data.find(tag => tag.id === testTagId);
      if (testTag) {
        if (!testTag.isActive) {
          console.log('✅ Tag correctement désactivé');
          return true;
        } else {
          console.log('❌ Tag toujours actif après suppression');
          return false;
        }
      } else {
        console.log('❌ Tag non trouvé après suppression');
        return false;
      }
    } else {
      console.log('❌ Échec de la vérification:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de vérification:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Test CRUD des Tags');
  console.log('====================');

  let success = true;

  // 1. Connexion
  success = await login() && success;
  if (!success) return;

  // 2. Création
  success = await createTestTag() && success;
  if (!success) return;

  // 3. Lecture
  success = await getAllTags() && success;
  if (!success) return;

  // 4. Modification
  success = await updateTestTag() && success;

  // 5. Suppression
  success = await deleteTestTag() && success;

  // 6. Vérification
  success = await verifyTagDeleted() && success;

  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Création: OK');
    console.log('✅ Lecture: OK');
    console.log('✅ Modification: OK');
    console.log('✅ Suppression: OK');
  } else {
    console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('Vérifiez les logs ci-dessus pour plus de détails');
  }
  console.log('='.repeat(50));
}

// Exécuter les tests
runTests().catch(console.error);
