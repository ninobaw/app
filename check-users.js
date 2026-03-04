const mongoose = require('mongoose');
const User = require('./backend/src/models/User');

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
    } else {
      console.log('\n--- ASMA NON TROUVÉE ---');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkUsers();
