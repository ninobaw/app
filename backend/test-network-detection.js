/**
 * Script de test pour vérifier la détection automatique de l'IP
 */

const { getLocalIPAddress, getFrontendURL, getBackendURL } = require('./src/utils/networkUtils');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   Test de Détection Automatique de l\'Adresse IP      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📡 Détection de l\'adresse IP locale...\n');

const localIP = getLocalIPAddress();
console.log(`✅ Adresse IP détectée : ${localIP}`);

console.log('\n📍 URLs générées :');
console.log(`   Frontend : ${getFrontendURL(8080)}`);
console.log(`   Backend  : ${getBackendURL(5000)}`);

console.log('\n💡 Variable d\'environnement FRONTEND_BASE_URL :');
console.log(`   ${process.env.FRONTEND_BASE_URL || '(non définie - utilise la détection automatique)'}`);

console.log('\n✅ Test terminé !');
