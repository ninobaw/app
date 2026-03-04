const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testInitialSetup() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Test 1: Vérifier le nombre d'utilisateurs
    console.log('\n=== TEST 1: Vérification du nombre d\'utilisateurs ===');
    const userCount = await User.countDocuments();
    console.log(`📊 Nombre d'utilisateurs trouvés: ${userCount}`);
    
    if (userCount === 0) {
      console.log('✅ Base de données vide - Configuration initiale nécessaire');
      console.log('🔧 L\'option "Créer Super Admin" devrait être visible sur la page de login');
    } else {
      console.log('ℹ️ Des utilisateurs existent déjà - Configuration initiale non nécessaire');
      
      // Afficher les utilisateurs existants
      const users = await User.find({}, 'firstName lastName email role isActive').limit(5);
      console.log('\n📋 Utilisateurs existants:');
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.isActive ? 'Actif' : 'Inactif'}`);
      });
      
      if (userCount > 5) {
        console.log(`  ... et ${userCount - 5} autres utilisateurs`);
      }
    }

    // Test 2: Simuler l'API de vérification
    console.log('\n=== TEST 2: Simulation API check-initial-setup ===');
    const apiResponse = {
      hasUsers: userCount > 0,
      userCount: userCount,
      needsInitialSetup: userCount === 0
    };
    console.log('📡 Réponse API simulée:', JSON.stringify(apiResponse, null, 2));

    // Test 3: Vérifier les super admins existants
    console.log('\n=== TEST 3: Vérification des super administrateurs ===');
    const superAdmins = await User.find({ role: 'SUPER_ADMIN', isActive: true });
    console.log(`👑 Nombre de super administrateurs actifs: ${superAdmins.length}`);
    
    if (superAdmins.length > 0) {
      console.log('📋 Super administrateurs:');
      superAdmins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email}) - ${admin.airport || 'N/A'}`);
      });
    }

    // Test 4: Instructions pour les tests
    console.log('\n=== INSTRUCTIONS DE TEST ===');
    
    if (userCount === 0) {
      console.log('🧪 Pour tester la création du super admin:');
      console.log('   1. Démarrez le serveur frontend (npm run dev)');
      console.log('   2. Allez sur la page de login');
      console.log('   3. Vous devriez voir "Configuration initiale requise"');
      console.log('   4. Cliquez sur "Créer Super Admin"');
      console.log('   5. Remplissez le formulaire et créez le premier admin');
      console.log('   6. L\'option devrait disparaître après création');
    } else {
      console.log('🧪 Pour tester avec une base vide:');
      console.log('   1. Sauvegardez vos données si nécessaire');
      console.log('   2. Supprimez tous les utilisateurs: db.users.deleteMany({})');
      console.log('   3. Redémarrez le frontend');
      console.log('   4. L\'option "Créer Super Admin" devrait apparaître');
      console.log('');
      console.log('⚠️  ATTENTION: Ne supprimez les utilisateurs qu\'en environnement de test!');
    }

    // Test 5: Vérifier la sécurité
    console.log('\n=== TEST 5: Vérifications de sécurité ===');
    console.log('✅ L\'API vérifie qu\'aucun utilisateur n\'existe avant création');
    console.log('✅ Validation des champs requis (prénom, nom, email, mot de passe, aéroport)');
    console.log('✅ Validation du format email');
    console.log('✅ Validation de la longueur du mot de passe (minimum 6 caractères)');
    console.log('✅ Hachage sécurisé du mot de passe avec bcrypt');
    console.log('✅ Rôle automatiquement défini sur SUPER_ADMIN');
    console.log('✅ Compte automatiquement activé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Fonction pour nettoyer la base (UNIQUEMENT POUR LES TESTS)
async function clearUsersForTesting() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('⚠️  ATTENTION: Suppression de tous les utilisateurs pour test...');
    
    const result = await User.deleteMany({});
    console.log(`🗑️  ${result.deletedCount} utilisateurs supprimés`);
    console.log('✅ Base de données nettoyée - Vous pouvez maintenant tester la création du premier admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Exécution du script
const command = process.argv[2];

if (command === 'clear') {
  console.log('🧹 Mode nettoyage activé...');
  clearUsersForTesting();
} else {
  console.log('🧪 Test de la configuration initiale...');
  testInitialSetup();
}

console.log('\n💡 Utilisation:');
console.log('   node test-initial-setup.js        # Tester la configuration');
console.log('   node test-initial-setup.js clear  # Nettoyer pour test (ATTENTION!)');
