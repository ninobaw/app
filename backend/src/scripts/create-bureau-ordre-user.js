const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

async function createBureauOrdreUser() {
  try {
    console.log('🏢 Création d\'un utilisateur Bureau d\'Ordre');
    console.log('=' .repeat(50));

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // Créer un utilisateur bureau d'ordre
    const bureauOrdreUser = {
      _id: uuidv4(),
      firstName: 'Sarah',
      lastName: 'Bouaziz',
      email: 'sarah.bouaziz@tav.aero',
      password: 'password123',
      role: 'AGENT_BUREAU_ORDRE',
      airport: 'ENFIDHA',
      isActive: true,
      department: 'Bureau d\'Ordre',
      position: 'Agent Bureau d\'Ordre'
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: bureauOrdreUser.email });
    
    if (existingUser) {
      console.log(`⚠️ Utilisateur ${bureauOrdreUser.email} existe déjà - Mise à jour du rôle`);
      
      // Mettre à jour le rôle existant
      await User.findByIdAndUpdate(existingUser._id, {
        role: bureauOrdreUser.role,
        airport: bureauOrdreUser.airport,
        department: bureauOrdreUser.department,
        position: bureauOrdreUser.position
      });
      
      console.log(`✅ Rôle mis à jour: ${bureauOrdreUser.firstName} ${bureauOrdreUser.lastName} → ${bureauOrdreUser.role}`);
    } else {
      // Créer un nouvel utilisateur
      const hashedPassword = await bcrypt.hash(bureauOrdreUser.password, 10);
      
      const newUser = new User({
        ...bureauOrdreUser,
        password: hashedPassword
      });
      
      await newUser.save();
      console.log(`✅ Créé: ${bureauOrdreUser.firstName} ${bureauOrdreUser.lastName} (${bureauOrdreUser.role})`);
    }

    // Vérification finale
    console.log('\n🔍 VÉRIFICATION:');
    const finalUser = await User.findOne({ email: bureauOrdreUser.email });
    
    if (finalUser) {
      console.log(`✅ Utilisateur Bureau d'Ordre créé/mis à jour:`);
      console.log(`   Nom: ${finalUser.firstName} ${finalUser.lastName}`);
      console.log(`   Email: ${finalUser.email}`);
      console.log(`   Rôle: ${finalUser.role}`);
      console.log(`   Aéroport: ${finalUser.airport}`);
      console.log(`   Actif: ${finalUser.isActive ? 'Oui' : 'Non'}`);
    }

    console.log('\n💡 UTILISATION:');
    console.log('   1. Connectez-vous avec ce compte pour créer des correspondances:');
    console.log(`      Email: ${bureauOrdreUser.email}`);
    console.log(`      Mot de passe: ${bureauOrdreUser.password}`);
    console.log('   2. Ce compte peut créer des correspondances (pas de restriction 403)');
    console.log('   3. Utilisez les comptes directeurs pour tester le dialogue conversationnel');

    console.log('\n✅ Utilisateur Bureau d\'Ordre créé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la création
createBureauOrdreUser();
