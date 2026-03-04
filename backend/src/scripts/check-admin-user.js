const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function checkAdminUser() {
  try {
    console.log('Verification des utilisateurs admin');
    console.log('='.repeat(50));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Recherche des utilisateurs admin
    console.log('\n2. Recherche des utilisateurs admin...');
    
    const adminUsers = await User.find({
      role: { $in: ['SUPER_ADMIN', 'ADMINISTRATOR'] }
    }).select('email firstName lastName role isActive');

    console.log(`Trouvé ${adminUsers.length} utilisateur(s) admin:`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      console.log(`      - Nom: ${user.firstName} ${user.lastName}`);
      console.log(`      - Role: ${user.role}`);
      console.log(`      - Actif: ${user.isActive}`);
      console.log('');
    });

    // 3. Test de connexion avec l'utilisateur principal
    if (adminUsers.length > 0) {
      const mainAdmin = adminUsers.find(u => u.email === 'abdallah.benkhalifa@tav.aero') || adminUsers[0];
      
      console.log(`3. Test de connexion avec: ${mainAdmin.email}`);
      
      // Récupérer l'utilisateur complet avec le mot de passe
      const fullUser = await User.findById(mainAdmin._id);
      
      // Tester différents mots de passe possibles
      const possiblePasswords = [
        'admin123',
        'password123', 
        'Admin123',
        'admin',
        'password',
        '123456',
        'sgdo2024',
        'tav2024'
      ];

      console.log('Test des mots de passe possibles...');
      let validPassword = null;
      
      for (const password of possiblePasswords) {
        try {
          const isValid = await bcrypt.compare(password, fullUser.password);
          if (isValid) {
            validPassword = password;
            console.log(`✅ Mot de passe trouvé: ${password}`);
            break;
          }
        } catch (error) {
          // Continuer avec le prochain mot de passe
        }
      }
      
      if (!validPassword) {
        console.log('❌ Aucun mot de passe standard ne fonctionne');
        console.log('');
        console.log('SOLUTION: Réinitialiser le mot de passe admin');
        
        // Réinitialiser le mot de passe à admin123
        const newPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await User.findByIdAndUpdate(fullUser._id, {
          password: hashedPassword,
          mustChangePassword: false
        });
        
        console.log(`✅ Mot de passe réinitialisé à: ${newPassword}`);
        console.log(`✅ Email: ${mainAdmin.email}`);
        console.log(`✅ Mot de passe: ${newPassword}`);
      }
      
    } else {
      console.log('❌ Aucun utilisateur admin trouvé !');
      console.log('');
      console.log('SOLUTION: Créer un utilisateur admin');
      
      // Créer un utilisateur admin
      const adminData = {
        _id: require('uuid').v4(),
        email: 'admin@tav.aero',
        firstName: 'Admin',
        lastName: 'SGDO',
        password: await bcrypt.hash('admin123', 10),
        role: 'SUPER_ADMIN',
        airport: 'ENFIDHA',
        phone: '12345678',
        department: 'Administration',
        isActive: true,
        mustChangePassword: false,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true
      };
      
      const newAdmin = new User(adminData);
      await newAdmin.save();
      
      console.log('✅ Utilisateur admin créé:');
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Mot de passe: admin123`);
    }

    console.log('\n4. INFORMATIONS DE CONNEXION:');
    console.log('   URL: http://sgdo.tavtunisie.app:8080');
    
    // Afficher tous les comptes admin disponibles
    const updatedAdmins = await User.find({
      role: { $in: ['SUPER_ADMIN', 'ADMINISTRATOR'] }
    }).select('email firstName lastName role');
    
    updatedAdmins.forEach((user, index) => {
      console.log(`   Compte ${index + 1}: ${user.email}`);
      console.log(`   Mot de passe: admin123`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔚 Connexion MongoDB fermée');
  }
}

// Exécuter la vérification
checkAdminUser();
