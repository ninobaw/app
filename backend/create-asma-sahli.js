const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('./src/models/User');

async function createOrUpdateAsma() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aero-doc-flow');
    console.log('Connexion MongoDB établie');
    
    const email = 'asma.sahli@tav.aero';
    
    // Chercher l'utilisateur existant
    let asma = await User.findOne({ email: email });
    
    if (asma) {
      console.log('Utilisateur Asma trouvé, mise à jour des permissions...');
      
      // Mettre à jour le rôle pour permettre la création de correspondances
      await User.findByIdAndUpdate(asma._id, {
        role: 'AGENT_BUREAU_ORDRE',
        airport: asma.airport || 'GENERALE',
        isActive: true
      });
      
      console.log('✅ Permissions d\'Asma mises à jour !');
      
    } else {
      console.log('Utilisateur Asma non trouvé, création...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      asma = new User({
        _id: uuidv4(),
        firstName: 'Asma',
        lastName: 'Sahli',
        email: email,
        password: hashedPassword,
        role: 'AGENT_BUREAU_ORDRE',
        airport: 'GENERALE',
        isActive: true,
        department: 'Bureau d\'Ordre',
        position: 'Agent Bureau d\'Ordre'
      });
      
      await asma.save();
      console.log('✅ Utilisateur Asma créé !');
    }
    
    // Vérifier les permissions finales
    const finalAsma = await User.findOne({ email: email });
    
    console.log('\n--- ASMA SAHLI ---');
    console.log(`Nom: ${finalAsma.firstName} ${finalAsma.lastName}`);
    console.log(`Email: ${finalAsma.email}`);
    console.log(`Rôle: ${finalAsma.role}`);
    console.log(`Aéroport: ${finalAsma.airport}`);
    console.log(`Actif: ${finalAsma.isActive}`);
    
    // Vérifier les rôles autorisés
    const authorizedRoles = [
      'AGENT_BUREAU_ORDRE', 
      'SUPERVISEUR_BUREAU_ORDRE',
      'DIRECTEUR',
      'SOUS_DIRECTEUR',
      'DIRECTEUR_GENERAL',
      'SUPER_ADMIN'
    ];
    
    const canCreate = authorizedRoles.includes(finalAsma.role);
    console.log(`Peut créer correspondances: ${canCreate ? '✅ OUI' : '❌ NON'}`);
    
    if (canCreate) {
      console.log('\n🎉 Asma peut maintenant créer des correspondances !');
      console.log('Mot de passe: password123');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

createOrUpdateAsma();
