const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('./src/models/User');

async function createAsma() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aero-doc-flow');
    console.log('Connexion MongoDB établie');
    
    // Vérifier si Asma existe déjà
    const existingAsma = await User.findOne({ 
      $or: [
        { email: 'asma@tav.aero' },
        { email: 'asma.bureau@tav.aero' }
      ]
    });
    
    if (existingAsma) {
      console.log('Asma existe déjà, mise à jour du rôle...');
      await User.findByIdAndUpdate(existingAsma._id, {
        role: 'AGENT_BUREAU_ORDRE',
        airport: 'GENERALE',
        isActive: true
      });
      console.log('✅ Rôle d\'Asma mis à jour !');
    } else {
      console.log('Création d\'un nouvel utilisateur Asma...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const asmaUser = new User({
        _id: uuidv4(),
        firstName: 'Asma',
        lastName: 'Bureau',
        email: 'asma@tav.aero',
        password: hashedPassword,
        role: 'AGENT_BUREAU_ORDRE',
        airport: 'GENERALE',
        isActive: true,
        department: 'Bureau d\'Ordre',
        position: 'Agent Bureau d\'Ordre'
      });
      
      await asmaUser.save();
      console.log('✅ Utilisateur Asma créé avec succès !');
    }
    
    // Vérifier la création
    const asma = await User.findOne({ email: 'asma@tav.aero' });
    console.log('\n--- ASMA CRÉÉE ---');
    console.log(`Nom: ${asma.firstName} ${asma.lastName}`);
    console.log(`Email: ${asma.email}`);
    console.log(`Rôle: ${asma.role}`);
    console.log(`Aéroport: ${asma.airport}`);
    console.log(`Mot de passe: password123`);
    
    await mongoose.disconnect();
    console.log('\n✅ Asma peut maintenant créer des correspondances !');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

createAsma();
