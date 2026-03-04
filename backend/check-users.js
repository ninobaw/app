const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aero-doc-flow');
    console.log('Connexion MongoDB établie');
    
    const users = await User.find({}).select('firstName lastName email role');
    console.log('\nTous les utilisateurs:');
    users.forEach(u => {
      console.log(`${u.firstName || 'N/A'} ${u.lastName || 'N/A'} - ${u.email} - ${u.role}`);
    });
    
    // Chercher spécifiquement Asma
    const asma = await User.findOne({ 
      $or: [
        { email: 'asma.sahli@tav.aero' },
        { email: /asma/i },
        { firstName: /asma/i }
      ]
    });
    
    if (asma) {
      console.log('\n--- ASMA TROUVÉE ---');
      console.log(`Nom: ${asma.firstName} ${asma.lastName}`);
      console.log(`Email: ${asma.email}`);
      console.log(`Rôle: ${asma.role}`);
      console.log(`Aéroport: ${asma.airport}`);
      
      // Vérifier les permissions
      const authorizedRoles = [
        'AGENT_BUREAU_ORDRE', 
        'SUPERVISEUR_BUREAU_ORDRE',
        'DIRECTEUR',
        'SOUS_DIRECTEUR',
        'DIRECTEUR_GENERAL',
        'SUPER_ADMIN'
      ];
      
      const canCreate = authorizedRoles.includes(asma.role);
      console.log(`Peut créer correspondances: ${canCreate ? 'OUI' : 'NON'}`);
      
      if (!canCreate) {
        console.log('\n🔧 CORRECTION NÉCESSAIRE:');
        console.log('Mise à jour du rôle vers AGENT_BUREAU_ORDRE...');
        
        await User.findByIdAndUpdate(asma._id, {
          role: 'AGENT_BUREAU_ORDRE',
          airport: asma.airport || 'GENERALE'
        });
        
        console.log('✅ Rôle mis à jour !');
      }
    } else {
      console.log('\n--- ASMA NON TROUVÉE ---');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkUsers();
