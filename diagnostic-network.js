#!/usr/bin/env node

console.log('🔍 === DIAGNOSTIC RÉSEAU SGDO ===');
console.log('');

// 1. Vérifier la configuration actuelle
console.log('📍 1. Configuration actuelle :');
console.log('   - Hostname frontend :', window.location?.hostname || 'Non disponible');
console.log('   - Port frontend :', window.location?.port || 'Non disponible');
console.log('   - Protocol frontend :', window.location?.protocol || 'Non disponible');
console.log('   - URL complète frontend :', window.location?.href || 'Non disponible');
console.log('');

// 2. Tester la connectivité au backend
const testBackendConnection = async (url) => {
  console.log(`🔍 2. Test de connexion à : ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      'User-Agent': 'SGDO-Diagnostic-Script/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    console.log('   ✅ Connexion réussie !');
    console.log('   - Status :', response.status);
    console.log('   - Status Text :', response.statusText);
    console.log('   - Headers :', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('   - Response :', data);
    }
    
    return { success: true, status: response.status, data };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.log('   ❌ Erreur de connexion :');
    console.log('   - Message :', error.message);
    console.log('   - Code :', error.code);
    console.log('   - Type :', error.name);
    
    return { success: false, error: error.message, code: error.code };
  }
};

// 3. Tester différentes URLs possibles
const possibleUrls = [
  'http://10.20.14.148:5000',  // URL actuelle (probablement incorrecte)
  'http://10.20.14.148:5000/api/health',  // Health check
  'http://localhost:5000',  // Localhost
  'http://localhost:5000/api/health',  // Localhost health check
  'http://127.0.0.1:5000',  // 127.0.0.1
  'http://127.0.0.1:5000/api/health',  // 127.0.0.1 health check
];

console.log('🔍 3. Tests de connexion :');
console.log('');

for (let i = 0; i < possibleUrls.length; i++) {
  const url = possibleUrls[i];
  const result = await testBackendConnection(url);
  
  console.log(`   Test ${i + 1}/${possibleUrls.length} : ${url}`);
  console.log(`   Résultat : ${result.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  
  if (result.success) {
    console.log(`   🎯 URL FONCTIONNELLE TROUVÉE : ${url}`);
    console.log('');
    console.log('🔧 SOLUTIONS RECOMMANDÉES :');
    console.log('');
    console.log('1. Vérifier que le backend est démarré :');
    console.log('   cd backend && npm start');
    console.log('   ou');
    console.log('   cd backend && node src/server.js');
    console.log('');
    console.log('2. Vérifier la configuration du port :');
    console.log('   - Backend doit écouter sur le port 5000');
    console.log('   - Frontend doit pointer vers http://10.20.14.148:5000');
    console.log('');
    console.log('3. Vérifier les firewall/antivirus :');
    console.log('   - Assurer que le port 5000 est ouvert');
    console.log('   - Vérifier que Node.js n\'est pas bloqué');
    console.log('');
    console.log('4. Configuration .env recommandée :');
    console.log('   FRONTEND_BASE_URL=http://10.20.14.148:8080');
    console.log('   VITE_API_BASE_URL=http://10.20.14.148:5000');
    break;
  } else {
    console.log(`   Erreur : ${result.error} (Code: ${result.code || 'N/A'})`);
  }
  
  console.log('');
  // Attendre 1 seconde entre les tests
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log('');
console.log('🔍 4. Résumé du diagnostic :');
console.log('');
console.log('Si aucune URL ne fonctionne :');
console.log('1. Démarrez le backend : cd backend && npm start');
console.log('2. Vérifiez le port : netstat -an | grep :5000');
console.log('3. Vérifiez les processus : ps aux | grep node');
console.log('4. Vérifiez les logs du backend');
console.log('');
console.log('🔍 === FIN DU DIAGNOSTIC ===');
