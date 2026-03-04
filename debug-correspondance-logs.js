// Script de débogage pour vérifier les correspondances
const mongoose = require('mongoose');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow-enfidha';

async function debugCorrespondances() {
  try {
    console.log('🔍 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Importer le modèle
    const Correspondance = require('./backend/src/models/Correspondance');
    const User = require('./backend/src/models/User');

    console.log('\n📊 STATISTIQUES DES CORRESPONDANCES:');
    console.log('=====================================');
    
    // Compter les correspondances
    const totalCorrespondances = await Correspondance.countDocuments();
    console.log(`Total des correspondances: ${totalCorrespondances}`);
    
    const pendingCorrespondances = await Correspondance.countDocuments({ status: 'PENDING' });
    console.log(`Correspondances en attente: ${pendingCorrespondances}`);
    
    const incomingCorrespondances = await Correspondance.countDocuments({ type: 'INCOMING' });
    console.log(`Correspondances entrantes: ${incomingCorrespondances}`);
    
    const outgoingCorrespondances = await Correspondance.countDocuments({ type: 'OUTGOING' });
    console.log(`Correspondances sortantes: ${outgoingCorrespondances}`);

    console.log('\n📋 DERNIÈRES CORRESPONDANCES CRÉÉES:');
    console.log('====================================');
    
    const recentCorrespondances = await Correspondance.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('authorId', 'firstName lastName email')
      .populate('personnesConcernees', 'firstName lastName email');
    
    recentCorrespondances.forEach((corr, index) => {
      console.log(`\n${index + 1}. ${corr.title}`);
      console.log(`   ID: ${corr._id}`);
      console.log(`   Type: ${corr.type}`);
      console.log(`   Statut: ${corr.status}`);
      console.log(`   Priorité: ${corr.priority}`);
      console.log(`   De: ${corr.from_address}`);
      console.log(`   À: ${corr.to_address}`);
      console.log(`   Auteur: ${corr.authorId ? `${corr.authorId.firstName} ${corr.authorId.lastName}` : 'Non défini'}`);
      console.log(`   Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
      console.log(`   Créée le: ${corr.createdAt}`);
      console.log(`   Échéance: ${corr.response_deadline || 'Non définie'}`);
    });

    console.log('\n👥 UTILISATEURS AVEC ACCÈS AUX CORRESPONDANCES:');
    console.log('===============================================');
    
    const users = await User.find({
      $or: [
        { role: 'SUPER_ADMIN' },
        { role: 'ADMINISTRATOR' },
        { role: 'AGENT_BUREAU_ORDRE' },
        { role: 'DIRECTEUR_GENERAL' },
        { role: 'DIRECTEUR_RH' },
        { role: 'DIRECTEUR_TECHNIQUE' },
        { role: 'DIRECTEUR_COMMERCIAL' }
      ]
    });
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Actif: ${user.isActive !== false ? 'Oui' : 'Non'}`);
    });

    console.log('\n🔧 VÉRIFICATIONS TECHNIQUES:');
    console.log('============================');
    
    // Vérifier les correspondances sans auteur
    const correspondancesSansAuteur = await Correspondance.countDocuments({ 
      $or: [
        { authorId: { $exists: false } },
        { authorId: null },
        { authorId: '' }
      ]
    });
    console.log(`Correspondances sans auteur: ${correspondancesSansAuteur}`);
    
    // Vérifier les correspondances avec échéance
    const correspondancesAvecEcheance = await Correspondance.countDocuments({ 
      response_deadline: { $exists: true, $ne: null }
    });
    console.log(`Correspondances avec échéance: ${correspondancesAvecEcheance}`);
    
    // Vérifier les correspondances avec personnes concernées
    const correspondancesAvecPersonnes = await Correspondance.countDocuments({ 
      personnesConcernees: { $exists: true, $not: { $size: 0 } }
    });
    console.log(`Correspondances avec personnes concernées: ${correspondancesAvecPersonnes}`);

    console.log('\n✅ Débogage terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
debugCorrespondances();
