const jwt = require('jsonwebtoken');

// Simuler un token comme celui que l'utilisateur pourrait avoir
const JWT_SECRET = process.env.JWT_SECRET || 'aerodoc_super_secret_key_2025_change_this_in_production';

console.log('🔍 Diagnostic du problème de token...\n');

// Test 1: Créer un nouveau token avec la nouvelle configuration
console.log('1️⃣ Test de génération de nouveau token:');
const newToken = jwt.sign(
  { 
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'USER',
    loginTime: Date.now()
  },
  JWT_SECRET,
  { expiresIn: '8h' }
);

console.log('✅ Nouveau token généré avec durée 8h');
console.log('🔑 Longueur du token:', newToken.length);

// Test 2: Décoder le token pour vérifier l'expiration
const decoded = jwt.decode(newToken);
const expirationTime = new Date(decoded.exp * 1000);
const currentTime = new Date();
const timeUntilExpiration = (expirationTime - currentTime) / (1000 * 60 * 60); // en heures

console.log('📅 Token expire le:', expirationTime.toLocaleString());
console.log('⏰ Temps jusqu\'expiration:', timeUntilExpiration.toFixed(2), 'heures');

// Test 3: Vérifier un ancien token (simulation)
console.log('\n2️⃣ Simulation d\'un ancien token (25 minutes):');
const oldToken = jwt.sign(
  { 
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'USER'
  },
  JWT_SECRET,
  { expiresIn: '25m' }
);

const oldDecoded = jwt.decode(oldToken);
const oldExpirationTime = new Date(oldDecoded.exp * 1000);
const oldTimeUntilExpiration = (oldExpirationTime - currentTime) / (1000 * 60); // en minutes

console.log('📅 Ancien token expire le:', oldExpirationTime.toLocaleString());
console.log('⏰ Temps jusqu\'expiration:', oldTimeUntilExpiration.toFixed(2), 'minutes');

console.log('\n💡 SOLUTION:');
console.log('1. Déconnectez-vous complètement de l\'application');
console.log('2. Videz le cache du navigateur (localStorage)');
console.log('3. Reconnectez-vous pour obtenir un nouveau token 8h');
console.log('4. Le problème devrait être résolu');

console.log('\n🔧 Commandes pour vider le cache:');
console.log('- Ouvrez les outils de développement (F12)');
console.log('- Console: localStorage.clear()');
console.log('- Ou: Application > Storage > Local Storage > Clear All');
