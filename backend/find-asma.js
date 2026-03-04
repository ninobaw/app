const mongoose = require('mongoose');
const User = require('./src/models/User');

async function findAsma() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aero-doc-flow');
    console.log('Connexion MongoDB établie');
    
    // Recherche directe par email
    console.log('Recherche par email exact: asma.sahli@tav.aero');
    const asmaExact = await User.findOne({ email: 'asma.sahli@tav.aero' });
    
    if (asmaExact) {
      console.log('✅ TROUVÉE PAR EMAIL EXACT:');
      console.log(`Nom: ${asmaExact.firstName} ${asmaExact.lastName}`);
      console.log(`Email: ${asmaExact.email}`);
      console.log(`Rôle: ${asmaExact.role}`);
      console.log(`Aéroport: ${asmaExact.airport}`);
      console.log(`Actif: ${asmaExact.isActive}`);
    } else {
      console.log('❌ Pas trouvée par email exact');
    }
    
    // Recherche par pattern email
    console.log('\nRecherche par pattern email contenant "asma":');
    const asmaPattern = await User.findOne({ email: /asma/i });
    
    if (asmaPattern) {
      console.log('✅ TROUVÉE PAR PATTERN:');
      console.log(`Nom: ${asmaPattern.firstName} ${asmaPattern.lastName}`);
      console.log(`Email: ${asmaPattern.email}`);
      console.log(`Rôle: ${asmaPattern.role}`);
      console.log(`Aéroport: ${asmaPattern.airport}`);
      console.log(`Actif: ${asmaPattern.isActive}`);
    } else {
      console.log('❌ Pas trouvée par pattern');
    }
    
    // Recherche par prénom
    console.log('\nRecherche par prénom "Asma":');
    const asmaName = await User.findOne({ firstName: /asma/i });
    
    if (asmaName) {
      console.log('✅ TROUVÉE PAR PRÉNOM:');
      console.log(`Nom: ${asmaName.firstName} ${asmaName.lastName}`);
      console.log(`Email: ${asmaName.email}`);
      console.log(`Rôle: ${asmaName.role}`);
      console.log(`Aéroport: ${asmaName.airport}`);
      console.log(`Actif: ${asmaName.isActive}`);
    } else {
      console.log('❌ Pas trouvée par prénom');
    }
    
    // Lister tous les emails pour debug
    console.log('\nTous les emails dans la base:');
    const allUsers = await User.find({}).select('email firstName lastName');
    allUsers.forEach(u => {
      console.log(`${u.email} - ${u.firstName} ${u.lastName}`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

findAsma();
