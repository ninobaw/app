const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function testCorrespondanceCreation() {
  try {
    console.log('🧪 Test de création de correspondance avec assignation directeur');
    console.log('='.repeat(70));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Recherche du directeur RH
    console.log('\n2. Recherche du directeur RH...');
    const rhDirector = await User.findOne({ 
      role: 'DIRECTEUR',
      department: 'Ressources Humaines'
    });
    
    if (!rhDirector) {
      console.log('❌ Directeur RH non trouvé');
      return;
    }
    
    console.log(`✅ Directeur RH: ${rhDirector.firstName} ${rhDirector.lastName} (${rhDirector._id})`);

    // 3. Créer une correspondance de test assignée au directeur RH
    console.log('\n3. Création d\'une correspondance de test...');
    
    const testCorrespondance = {
      title: 'Test - Demande de congé exceptionnel',
      type: 'INCOMING',
      from_address: 'employe.test@tav.aero',
      to_address: 'rh@tav.aero',
      subject: 'Demande de congé exceptionnel pour formation',
      content: 'Bonjour, je souhaite demander un congé exceptionnel pour suivre une formation en gestion des ressources humaines du 1er au 5 octobre 2025.',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      authorId: rhDirector._id,
      
      // ✅ CHAMPS IMPORTANTS POUR L'ASSIGNATION AU DIRECTEUR
      personnesConcernees: [rhDirector._id], // ID du directeur RH
      departementsResponsables: ['Ressources Humaines'], // Département responsable
      tags: ['RH', 'Congé', 'Formation'], // Tags pour identification
      
      date_correspondance: new Date()
    };

    const savedCorrespondance = await new Correspondance(testCorrespondance).save();
    console.log(`✅ Correspondance créée: ${savedCorrespondance._id}`);

    // 4. Vérifier que la correspondance apparaît dans le dashboard du directeur
    console.log('\n4. Vérification du dashboard directeur...');
    
    const directorCorrespondances = await Correspondance.find({
      personnesConcernees: rhDirector._id
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`📊 Correspondances visibles par le directeur RH: ${directorCorrespondances.length}`);
    
    directorCorrespondances.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.subject}`);
      console.log(`      - Status: ${corr.status}`);
      console.log(`      - Départements: ${corr.departementsResponsables?.join(', ') || 'Aucun'}`);
      console.log(`      - Tags: ${corr.tags?.join(', ') || 'Aucun'}`);
    });

    // 5. Instructions pour l'interface utilisateur
    console.log('\n5. 📋 INSTRUCTIONS pour créer des correspondances assignées aux directeurs:');
    console.log('');
    console.log('   Dans le dialogue de création de correspondance:');
    console.log('');
    console.log('   ✅ Étape 1: Sélectionner le département responsable');
    console.log('      - Choisir "Ressources Humaines" dans la liste déroulante');
    console.log('');
    console.log('   ✅ Étape 2: Ajouter le directeur aux personnes concernées');
    console.log('      - Sélectionner "Anis Ben Janet" dans "Personnes concernées"');
    console.log('      - Ou utiliser l\'ID: ' + rhDirector._id);
    console.log('');
    console.log('   ✅ Étape 3: Ajouter des tags RH (optionnel)');
    console.log('      - Tags suggérés: RH, Ressources Humaines, Personnel, Formation, Congé');
    console.log('');
    console.log('   ✅ Résultat: La correspondance apparaîtra automatiquement dans le dashboard du directeur');

    // 6. Test avec d'autres départements
    console.log('\n6. 📋 MAPPING des départements et directeurs:');
    
    const allDirectors = await User.find({
      role: { $in: ['DIRECTEUR', 'DIRECTEUR_GENERAL', 'SOUS_DIRECTEUR'] }
    }).select('firstName lastName department directorate managedDepartments');

    allDirectors.forEach(director => {
      console.log(`   👤 ${director.firstName} ${director.lastName}`);
      console.log(`      - Département: ${director.department}`);
      console.log(`      - Directorate: ${director.directorate}`);
      console.log(`      - Départements gérés: ${director.managedDepartments?.join(', ') || 'Aucun'}`);
      console.log(`      - ID: ${director._id}`);
      console.log('');
    });

    // 7. Exemple de correspondance pour chaque directeur
    console.log('7. 📝 EXEMPLES de correspondances par département:');
    console.log('');
    console.log('   🏢 Ressources Humaines:');
    console.log('      - Sujets: Congé, Formation, Recrutement, Salaire, Évaluation');
    console.log('      - Directeur: Anis Ben Janet');
    console.log('      - Tags: RH, Personnel, Formation, Congé');
    console.log('');
    console.log('   🔧 Technique:');
    console.log('      - Sujets: Maintenance, Équipement, Infrastructure, Sécurité technique');
    console.log('      - Tags: Technique, Maintenance, Équipement');
    console.log('');
    console.log('   💼 Commercial:');
    console.log('      - Sujets: Contrats, Partenariats, Marketing, Ventes');
    console.log('      - Tags: Commercial, Contrat, Partenariat');
    console.log('');
    console.log('   💰 Financier:');
    console.log('      - Sujets: Budget, Comptabilité, Audit, Investissement');
    console.log('      - Tags: Finance, Budget, Comptabilité');

  } catch (error) {
    console.error('❌ Erreur lors du test:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Test terminé - Connexion MongoDB fermée');
  }
}

// Exécuter le test
testCorrespondanceCreation();
