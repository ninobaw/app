const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testNetworkConfig() {
  console.log('🔍 Test de diagnostic de la configuration réseau');
  console.log('='.repeat(60));

  // 1. Vérifier le fichier .env
  console.log('\n1. Vérification du fichier .env...');
  const envPath = path.join(__dirname, '../../../.env');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Fichier .env trouvé');
    
    // Extraire VITE_API_BASE_URL
    const apiUrlMatch = envContent.match(/VITE_API_BASE_URL=(.+)/);
    const frontendUrlMatch = envContent.match(/FRONTEND_BASE_URL=(.+)/);
    
    if (apiUrlMatch) {
      console.log(`📡 API URL configurée: ${apiUrlMatch[1]}`);
      
      if (apiUrlMatch[1].includes('localhost')) {
        console.log('❌ PROBLÈME: API URL pointe encore vers localhost !');
        console.log('   Les clients réseau ne pourront pas se connecter.');
      } else if (apiUrlMatch[1].includes('10.20.14.130')) {
        console.log('✅ API URL correctement configurée pour le réseau');
      }
    } else {
      console.log('❌ VITE_API_BASE_URL non trouvé dans .env');
    }
    
    if (frontendUrlMatch) {
      console.log(`🌐 Frontend URL configurée: ${frontendUrlMatch[1]}`);
    }
    
  } catch (error) {
    console.log('❌ Erreur lecture fichier .env:', error.message);
  }

  // 2. Test de connectivité locale
  console.log('\n2. Test de connectivité locale...');
  try {
    const response = await axios.get('http://localhost:5000/api/test', { timeout: 5000 });
    console.log('✅ Backend local accessible (localhost:5000)');
  } catch (error) {
    console.log('❌ Backend local non accessible:', error.message);
  }

  // 3. Test de connectivité réseau
  console.log('\n3. Test de connectivité réseau...');
  try {
    const response = await axios.get('http://10.20.14.130:5000/api/test', { timeout: 5000 });
    console.log('✅ Backend réseau accessible (10.20.14.130:5000)');
  } catch (error) {
    console.log('❌ Backend réseau non accessible:', error.message);
    console.log('   Vérifiez que le backend écoute sur 0.0.0.0 et non localhost');
  }

  // 4. Vérifier la configuration du backend
  console.log('\n4. Vérification de la configuration backend...');
  const backendEnvPath = path.join(__dirname, '../../../backend/.env');
  
  try {
    if (fs.existsSync(backendEnvPath)) {
      const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
      console.log('✅ Fichier backend/.env trouvé');
      
      const frontendUrlMatch = backendEnvContent.match(/FRONTEND_BASE_URL=(.+)/);
      if (frontendUrlMatch) {
        console.log(`🔗 Backend FRONTEND_BASE_URL: ${frontendUrlMatch[1]}`);
      }
    } else {
      console.log('⚠️  Fichier backend/.env non trouvé');
    }
  } catch (error) {
    console.log('❌ Erreur lecture backend/.env:', error.message);
  }

  // 5. Recommandations
  console.log('\n5. Recommandations...');
  console.log('📋 Pour résoudre les problèmes de configuration réseau:');
  console.log('');
  console.log('🔧 Si l\'API URL pointe vers localhost:');
  console.log('   1. Exécutez: force-network-update.bat');
  console.log('   2. Redémarrez les serveurs');
  console.log('   3. Videz le cache navigateur des clients');
  console.log('');
  console.log('🔥 Si le backend réseau n\'est pas accessible:');
  console.log('   1. Vérifiez le pare-feu Windows (ports 5000, 8080)');
  console.log('   2. Vérifiez que le backend écoute sur 0.0.0.0');
  console.log('   3. Testez: ping 10.20.14.130 depuis un client');
  console.log('');
  console.log('🌐 Configuration réseau correcte:');
  console.log('   - VITE_API_BASE_URL=http://10.20.14.130:5000');
  console.log('   - FRONTEND_BASE_URL=http://10.20.14.130:8080');
  console.log('   - Backend écoute sur 0.0.0.0:5000');
  console.log('');
  console.log('✨ Test terminé !');
}

// Exécuter le test
testNetworkConfig().catch(console.error);
