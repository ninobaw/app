const os = require('os');
const fs = require('fs');
const path = require('path');

function getNetworkInfo() {
  console.log('🌐 Informations réseau de la machine');
  console.log('='.repeat(60));
  
  const interfaces = os.networkInterfaces();
  const networkInfo = {
    localhost: 'localhost',
    ipAddresses: [],
    recommendedIp: null
  };
  
  console.log('\n📡 Interfaces réseau détectées:');
  
  for (const name of Object.keys(interfaces)) {
    console.log(`\n🔗 Interface: ${name}`);
    
    for (const iface of interfaces[name]) {
      const { address, family, internal, netmask } = iface;
      
      if (family === 'IPv4') {
        console.log(`   - IPv4: ${address} ${internal ? '(interne)' : '(externe)'}`);
        
        if (!internal) {
          networkInfo.ipAddresses.push({
            interface: name,
            address: address,
            netmask: netmask,
            isPrivate: isPrivateIP(address)
          });
          
          // Recommander la première IP privée trouvée
          if (isPrivateIP(address) && !networkInfo.recommendedIp) {
            networkInfo.recommendedIp = address;
          }
        }
      }
    }
  }
  
  return networkInfo;
}

function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  
  return false;
}

function generateEnvConfigs(networkInfo) {
  const frontendEnvPath = path.join(__dirname, '../../../.env');
  const backendEnvPath = path.join(__dirname, '../../.env');
  
  console.log('\n⚙️ Configuration recommandée:');
  console.log('='.repeat(40));
  
  if (networkInfo.recommendedIp) {
    console.log(`🏠 Accès local: http://localhost:8080`);
    console.log(`🌐 Accès réseau: http://${networkInfo.recommendedIp}:8080`);
    console.log(`🔧 Backend API: http://${networkInfo.recommendedIp}:5000`);
    
    // Générer les configurations
    const localConfig = `# Configuration pour accès LOCAL uniquement
VITE_API_BASE_URL=http://localhost:5000
FRONTEND_BASE_URL=http://localhost:8080`;

    const networkConfig = `# Configuration pour accès RÉSEAU
VITE_API_BASE_URL=http://${networkInfo.recommendedIp}:5000
FRONTEND_BASE_URL=http://${networkInfo.recommendedIp}:8080`;

    console.log('\n📝 Configurations générées:');
    console.log('\n🏠 .env.local (accès local uniquement):');
    console.log(localConfig);
    
    console.log('\n🌐 .env.network (accès réseau):');
    console.log(networkConfig);
    
    // Sauvegarder les configurations
    try {
      fs.writeFileSync(path.join(__dirname, '../../../.env.local'), localConfig);
      fs.writeFileSync(path.join(__dirname, '../../../.env.network'), networkConfig);
      
      console.log('\n✅ Fichiers de configuration sauvegardés:');
      console.log('   - .env.local (pour accès local)');
      console.log('   - .env.network (pour accès réseau)');
      
      console.log('\n🔄 Pour basculer entre les modes:');
      console.log('   1. Mode local: copiez le contenu de .env.local dans .env');
      console.log('   2. Mode réseau: copiez le contenu de .env.network dans .env');
      console.log('   3. Redémarrez les serveurs frontend et backend');
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error.message);
    }
    
  } else {
    console.log('❌ Aucune adresse IP réseau privée détectée');
    console.log('   Vérifiez votre connexion réseau');
  }
}

function checkCurrentConfig() {
  console.log('\n🔍 Configuration actuelle:');
  console.log('='.repeat(30));
  
  const frontendEnvPath = path.join(__dirname, '../../../.env');
  const backendEnvPath = path.join(__dirname, '../../.env');
  
  try {
    if (fs.existsSync(frontendEnvPath)) {
      const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
      const apiUrlMatch = frontendEnv.match(/VITE_API_BASE_URL=(.+)/);
      const frontendUrlMatch = frontendEnv.match(/FRONTEND_BASE_URL=(.+)/);
      
      console.log('📱 Frontend (.env):');
      console.log(`   - API URL: ${apiUrlMatch ? apiUrlMatch[1] : 'non définie'}`);
      console.log(`   - Frontend URL: ${frontendUrlMatch ? frontendUrlMatch[1] : 'non définie'}`);
    }
    
    if (fs.existsSync(backendEnvPath)) {
      const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      const frontendUrlMatch = backendEnv.match(/FRONTEND_BASE_URL=(.+)/);
      
      console.log('🔧 Backend (.env):');
      console.log(`   - Frontend URL: ${frontendUrlMatch ? frontendUrlMatch[1] : 'non définie'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lecture configuration:', error.message);
  }
}

function showInstructions(networkInfo) {
  console.log('\n📋 Instructions pour les clients réseau:');
  console.log('='.repeat(45));
  
  if (networkInfo.recommendedIp) {
    console.log(`1. 🔥 Configurez le pare-feu Windows:`);
    console.log(`   - Ouvrez "Pare-feu Windows Defender"`);
    console.log(`   - Cliquez sur "Paramètres avancés"`);
    console.log(`   - Créez une règle entrante pour les ports 5000 et 8080`);
    
    console.log(`\n2. 🌐 Donnez cette URL aux clients:`);
    console.log(`   Frontend: http://${networkInfo.recommendedIp}:8080`);
    
    console.log(`\n3. 🧪 Testez la connexion:`);
    console.log(`   - Depuis un autre PC: ping ${networkInfo.recommendedIp}`);
    console.log(`   - Testez l'API: http://${networkInfo.recommendedIp}:5000/api/test`);
    
    console.log(`\n4. 🔧 Si ça ne marche pas:`);
    console.log(`   - Vérifiez que l'antivirus n'bloque pas les connexions`);
    console.log(`   - Essayez de désactiver temporairement le pare-feu`);
    console.log(`   - Vérifiez que vous êtes sur le même réseau`);
  }
}

// Exécution principale
console.log('🚀 Diagnostic réseau AeroDoc');
console.log('='.repeat(60));

const networkInfo = getNetworkInfo();
checkCurrentConfig();
generateEnvConfigs(networkInfo);
showInstructions(networkInfo);

console.log('\n✨ Diagnostic terminé !');
