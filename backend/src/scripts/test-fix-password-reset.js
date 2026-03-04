const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';
const JWT_SECRET = process.env.JWT_SECRET || 'sgdo_super_secret_key_2025_change_this_in_production';
const API_BASE_URL = 'http://localhost:5000';

async function testFixPasswordReset() {
  try {
    console.log('🔧 Test de la correction du modèle User et réinitialisation mot de passe');
    console.log('='.repeat(70));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Vérifier les rôles autorisés dans le modèle
    console.log('\n2. Vérification des rôles autorisés...');
    const userSchema = User.schema.paths.role;
    console.log('✅ Rôles autorisés dans le modèle User:');
    userSchema.enumValues.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role}`);
    });

    // 3. Recherche de l'utilisateur avec le rôle ADMINISTRATOR
    console.log('\n3. Recherche de l\'utilisateur ADMINISTRATOR...');
    const adminUser = await User.findOne({ role: 'ADMINISTRATOR' });
    
    if (adminUser) {
      console.log(`✅ Utilisateur ADMINISTRATOR trouvé: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - ID: ${adminUser._id}`);
      console.log(`   - Rôle: ${adminUser.role}`);
    } else {
      console.log('❌ Aucun utilisateur ADMINISTRATOR trouvé');
    }

    // 4. Test de validation du modèle
    console.log('\n4. Test de validation du modèle User...');
    
    try {
      // Créer un utilisateur test avec le rôle ADMINISTRATOR
      const testUser = new User({
        _id: require('uuid').v4(),
        email: `test.validation.${Date.now()}@aerodoc.tn`,
        firstName: 'Test',
        lastName: 'Validation',
        password: 'hashedpassword123',
        role: 'ADMINISTRATOR',
        airport: 'ENFIDHA',
        isActive: true
      });
      
      // Valider sans sauvegarder
      await testUser.validate();
      console.log('✅ Validation du modèle réussie pour le rôle ADMINISTRATOR');
      
    } catch (error) {
      console.log('❌ Erreur de validation du modèle:');
      console.error('   Message:', error.message);
    }

    // 5. Test de sauvegarde directe
    console.log('\n5. Test de sauvegarde directe...');
    
    if (adminUser) {
      try {
        // Modifier un champ simple pour déclencher la validation
        adminUser.updatedAt = new Date();
        await adminUser.save();
        console.log('✅ Sauvegarde directe réussie');
        
      } catch (error) {
        console.log('❌ Erreur de sauvegarde directe:');
        console.error('   Message:', error.message);
      }
    }

    // 6. Recherche d'un SUPER_ADMIN pour les tests API
    console.log('\n6. Recherche d\'un SUPER_ADMIN...');
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    
    if (!superAdmin) {
      console.log('❌ Aucun SUPER_ADMIN trouvé pour les tests API');
      return;
    }
    
    console.log(`✅ SUPER_ADMIN trouvé: ${superAdmin.firstName} ${superAdmin.lastName}`);

    // 7. Test de réinitialisation via API
    if (adminUser && superAdmin) {
      console.log('\n7. Test de réinitialisation via API...');
      
      const token = jwt.sign(
        { 
          userId: superAdmin._id,
          email: superAdmin.email,
          role: superAdmin.role
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const resetData = {
        newPassword: 'NewPassword123!'
      };

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/users/${adminUser._id}/reset-password`, 
          resetData, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Réinitialisation via API réussie !');
        console.log(`   - Message: ${response.data.message}`);
        console.log(`   - mustChangePassword: ${response.data.mustChangePassword}`);
        
      } catch (error) {
        console.log('❌ Erreur réinitialisation via API:');
        console.error('   Message:', error.message);
        
        if (error.response) {
          console.error('   Status:', error.response.status);
          console.error('   Data:', error.response.data);
        }
      }
    }

    // 8. Statistiques des rôles
    console.log('\n8. Statistiques des rôles dans la base...');
    
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('📊 Répartition des rôles:');
    roleStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count} utilisateur(s)`);
    });

  } catch (error) {
    console.error('❌ Erreur générale du test:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Test terminé - Connexion MongoDB fermée');
  }
}

// Exécuter le test
testFixPasswordReset();
