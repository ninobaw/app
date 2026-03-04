const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./src/models/User');

// Charger le fichier .env depuis le dossier backend
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUserPassword() {
  try {
    console.log('=== Vérification des données utilisateur ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Chercher l'utilisateur
    const user = await User.findOne({ email: 'abdallah.benkhalifa@tav.aero' });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé avec cet email');
      
      // Lister tous les utilisateurs
      const allUsers = await User.find({}, 'email firstName lastName');
      console.log('\nUtilisateurs disponibles:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.firstName} ${u.lastName})`);
      });
      
      return;
    }

    console.log('✅ Utilisateur trouvé:');
    console.log(`- ID: ${user._id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Nom: ${user.firstName} ${user.lastName}`);
    console.log(`- Rôle: ${user.role}`);
    console.log(`- Actif: ${user.isActive}`);
    console.log(`- Mot de passe hashé: ${user.password.substring(0, 20)}...`);

    // Tester différents mots de passe
    const testPasswords = ['password123', 'admin123', 'test123', '123456', 'password'];
    
    console.log('\n--- Test des mots de passe ---');
    for (const testPassword of testPasswords) {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`${testPassword}: ${isMatch ? '✅ CORRECT' : '❌ Incorrect'}`);
    }

    // Créer un nouveau hash pour 'password123'
    console.log('\n--- Création d\'un nouveau hash ---');
    const newHash = await bcrypt.hash('password123', 10);
    console.log(`Nouveau hash pour 'password123': ${newHash}`);
    
    // Mettre à jour le mot de passe
    user.password = newHash;
    await user.save();
    console.log('✅ Mot de passe mis à jour dans la base');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

checkUserPassword();
