const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

async function testPermissions() {
  try {
    console.log('🔐 Test des permissions - Vérification des rôles');
    console.log('=' .repeat(60));

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Simuler le middleware authorizeBureauOrdre
    const authorizedRoles = [
      'AGENT_BUREAU_ORDRE', 
      'SUPERVISEUR_BUREAU_ORDRE',
      'DIRECTEUR',
      'SOUS_DIRECTEUR',
      'DIRECTEUR_GENERAL',
      'SUPER_ADMIN'
    ];

    console.log('\n🔑 RÔLES AUTORISÉS POUR CRÉATION CORRESPONDANCES:');
    authorizedRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role}`);
    });

    // Vérifier les utilisateurs existants
    console.log('\n👥 UTILISATEURS ET LEURS PERMISSIONS:');
    const users = await User.find({}).select('firstName lastName email role');
    
    users.forEach((user, index) => {
      const isAuthorized = authorizedRoles.includes(user.role);
      const status = isAuthorized ? '✅ AUTORISÉ' : '❌ NON AUTORISÉ';
      
      console.log(`   ${index + 1}. ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Rôle: ${user.role}`);
      console.log(`      Statut: ${status}`);
      console.log('');
    });

    // Vérifier spécifiquement le compte directeur de test
    console.log('\n🎯 VÉRIFICATION COMPTE DIRECTEUR DE TEST:');
    const testDirector = await User.findOne({ email: 'ahmed.benali@tav.aero' });
    
    if (testDirector) {
      const isAuthorized = authorizedRoles.includes(testDirector.role);
      console.log(`   Nom: ${testDirector.firstName} ${testDirector.lastName}`);
      console.log(`   Email: ${testDirector.email}`);
      console.log(`   Rôle: ${testDirector.role}`);
      console.log(`   Peut créer correspondances: ${isAuthorized ? '✅ OUI' : '❌ NON'}`);
      
      if (isAuthorized) {
        console.log('\n💡 RÉSULTAT: Le compte directeur DEVRAIT pouvoir créer des correspondances');
        console.log('   Si erreur 403 persiste, le serveur n\'a pas encore redémarré avec les nouvelles permissions');
      } else {
        console.log('\n⚠️ PROBLÈME: Le compte directeur ne peut pas créer de correspondances');
        console.log('   Vérifiez que les modifications du middleware auth.js ont été appliquées');
      }
    } else {
      console.log('   ❌ Compte directeur de test non trouvé');
    }

    console.log('\n📋 RECOMMANDATIONS:');
    console.log('   1. Attendez que le serveur backend redémarre complètement');
    console.log('   2. Vérifiez que les modifications du fichier auth.js sont prises en compte');
    console.log('   3. Testez la création de correspondance avec le compte directeur');
    console.log('   4. Si erreur 403 persiste, redémarrez manuellement le serveur');

    console.log('\n✅ Test des permissions terminé');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le test
testPermissions();
