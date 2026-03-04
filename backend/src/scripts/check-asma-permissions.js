const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

async function checkAsmaPermissions() {
  try {
    console.log('🔍 Vérification des permissions d\'Asma');
    console.log('='.repeat(50));

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Rechercher Asma par email
    const asmaUser = await User.findOne({ 
      $or: [
        { email: 'asma@tav.aero' },
        { email: 'asma.bureau@tav.aero' },
        { firstName: { $regex: /asma/i } }
      ]
    });

    if (asmaUser) {
      console.log('\n👤 UTILISATEUR TROUVÉ:');
      console.log(`   Nom: ${asmaUser.firstName} ${asmaUser.lastName}`);
      console.log(`   Email: ${asmaUser.email}`);
      console.log(`   Rôle: ${asmaUser.role}`);
      console.log(`   Aéroport: ${asmaUser.airport}`);
      console.log(`   Actif: ${asmaUser.isActive ? 'Oui' : 'Non'}`);
      console.log(`   ID: ${asmaUser._id}`);

      // Vérifier les rôles autorisés pour création correspondances
      const authorizedRoles = [
        'AGENT_BUREAU_ORDRE', 
        'SUPERVISEUR_BUREAU_ORDRE',
        'DIRECTEUR',
        'SOUS_DIRECTEUR',
        'DIRECTEUR_GENERAL',
        'SUPER_ADMIN'
      ];

      const isAuthorized = authorizedRoles.includes(asmaUser.role);
      
      console.log('\n🔑 VÉRIFICATION PERMISSIONS:');
      console.log(`   Rôles autorisés: ${authorizedRoles.join(', ')}`);
      console.log(`   Rôle d'Asma: ${asmaUser.role}`);
      console.log(`   Peut créer correspondances: ${isAuthorized ? '✅ OUI' : '❌ NON'}`);

      if (!isAuthorized) {
        console.log('\n🔧 CORRECTION NÉCESSAIRE:');
        console.log('   Le rôle d\'Asma doit être changé pour un rôle autorisé');
        console.log('   Rôles recommandés:');
        console.log('   - AGENT_BUREAU_ORDRE (pour agent normal)');
        console.log('   - SUPERVISEUR_BUREAU_ORDRE (pour superviseur)');
        
        // Proposer une correction
        const newRole = 'AGENT_BUREAU_ORDRE';
        console.log(`\n💡 PROPOSITION: Changer le rôle vers "${newRole}"`);
        console.log('   Voulez-vous appliquer cette correction ? (Redémarrez le script avec --fix)');
      } else {
        console.log('\n✅ PERMISSIONS OK: Asma peut créer des correspondances');
      }

    } else {
      console.log('\n❌ UTILISATEUR NON TROUVÉ');
      console.log('   Recherche effectuée pour:');
      console.log('   - Email: asma@tav.aero');
      console.log('   - Email: asma.bureau@tav.aero');
      console.log('   - Prénom contenant "asma"');
      
      console.log('\n🔍 RECHERCHE ÉLARGIE:');
      const allUsers = await User.find({}).select('firstName lastName email role').limit(10);
      console.log('   Utilisateurs existants:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
      });
    }

    // Vérifier si l'argument --fix est passé
    if (process.argv.includes('--fix') && asmaUser) {
      console.log('\n🔧 APPLICATION DE LA CORRECTION...');
      
      const newRole = 'AGENT_BUREAU_ORDRE';
      await User.findByIdAndUpdate(asmaUser._id, {
        role: newRole,
        airport: asmaUser.airport || 'GENERALE' // S'assurer qu'un aéroport est défini
      });
      
      console.log(`✅ Rôle d'Asma mis à jour vers: ${newRole}`);
      console.log('✅ Asma peut maintenant créer des correspondances');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
checkAsmaPermissions();
