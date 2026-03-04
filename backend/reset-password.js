const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

async function resetPassword() {
  try {
    console.log('=== Réinitialisation du mot de passe ===\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver l'utilisateur
    const user = await User.findOne({ email: 'abdallah.benkhalifa@tav.aero' });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      
      // Lister tous les utilisateurs disponibles
      const allUsers = await User.find({}, 'email firstName lastName');
      console.log('\nUtilisateurs disponibles:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.firstName} ${u.lastName})`);
      });
      
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.firstName} ${user.lastName}`);

    // Créer un nouveau hash pour 'password123'
    const newPassword = 'password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`Nouveau mot de passe: ${newPassword}`);
    console.log(`Hash généré: ${hashedPassword.substring(0, 30)}...`);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Mot de passe mis à jour avec succès!');
    
    // Vérifier que le nouveau mot de passe fonctionne
    const isValid = await bcrypt.compare(newPassword, user.password);
    console.log(`Vérification: ${isValid ? '✅ CORRECT' : '❌ ÉCHEC'}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

resetPassword();
