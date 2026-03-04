const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');
const CorrespondanceAssignmentService = require('../services/CorrespondanceAssignmentService');

async function debugNajehAssignment() {
  try {
    console.log('🔍 === DIAGNOSTIC ASSIGNATION NAJEH CHAOUCH ===\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. Rechercher Najeh Chaouch
    console.log('👤 === RECHERCHE NAJEH CHAOUCH ===');
    const najeh = await User.findOne({ 
      $or: [
        { firstName: 'Najeh', lastName: 'Chaouch' },
        { email: { $regex: /najeh/i } },
        { firstName: { $regex: /najeh/i } }
      ]
    });

    if (!najeh) {
      console.log('❌ Najeh Chaouch non trouvé dans la base de données');
      
      // Lister tous les sous-directeurs
      const sousDirecteurs = await User.find({ role: 'SOUS_DIRECTEUR' });
      console.log(`\n📋 Sous-directeurs disponibles (${sousDirecteurs.length}):`);
      sousDirecteurs.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   🏢 Directorate: ${user.directorate}`);
        console.log(`   🏛️ Aéroport: ${user.airport}`);
        console.log(`   🆔 ID: ${user._id}`);
      });
      
      return;
    }

    console.log('✅ Najeh Chaouch trouvé:');
    console.log(`   📧 Email: ${najeh.email}`);
    console.log(`   🎭 Rôle: ${najeh.role}`);
    console.log(`   🏢 Directorate: ${najeh.directorate}`);
    console.log(`   🏛️ Aéroport: ${najeh.airport}`);
    console.log(`   📋 Départements gérés: ${najeh.managedDepartments}`);
    console.log(`   ✅ Actif: ${najeh.isActive}`);
    console.log(`   🆔 ID: ${najeh._id}`);

    // 2. Vérifier les correspondances assignées à Najeh
    console.log(`\n📋 === CORRESPONDANCES ASSIGNÉES À NAJEH ===`);
    const correspondancesAssignees = await Correspondance.find({
      personnesConcernees: najeh._id.toString()
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`📊 Nombre de correspondances assignées: ${correspondancesAssignees.length}`);
    
    if (correspondancesAssignees.length > 0) {
      console.log(`\n📄 Dernières correspondances assignées:`);
      correspondancesAssignees.forEach((corr, index) => {
        console.log(`${index + 1}. ${corr.subject} (${corr.status})`);
        console.log(`   📅 Créée: ${corr.createdAt}`);
        console.log(`   🏛️ Aéroport: ${corr.airport}`);
        console.log(`   👥 Personnes concernées: ${corr.personnesConcernees.length}`);
      });
    } else {
      console.log('❌ Aucune correspondance assignée à Najeh');
    }

    // 3. Tester l'assignation automatique avec une correspondance type
    console.log(`\n🧪 === TEST ASSIGNATION AUTOMATIQUE ===`);
    
    const testCorrespondance = {
      subject: 'Test assignation pour Najeh Chaouch',
      content: 'Ceci est un test pour vérifier l\'assignation automatique des correspondances techniques.',
      priority: 'MEDIUM',
      type: 'INCOMING',
      tags: ['technique', 'maintenance'],
      airport: 'ENFIDHA'
    };

    console.log('🎯 Test avec correspondance technique:');
    console.log(`   Sujet: ${testCorrespondance.subject}`);
    console.log(`   Contenu: ${testCorrespondance.content}`);
    console.log(`   Tags: ${testCorrespondance.tags}`);
    console.log(`   Aéroport: ${testCorrespondance.airport}`);

    const directorsToAssign = await CorrespondanceAssignmentService.getDirectorsToAssign(testCorrespondance);
    console.log(`\n📊 Directeurs qui seraient assignés: ${directorsToAssign.length}`);
    
    if (directorsToAssign.length > 0) {
      for (const directorId of directorsToAssign) {
        const director = await User.findById(directorId);
        if (director) {
          console.log(`👤 ${director.firstName} ${director.lastName} (${director.role}) - ${director.directorate}`);
          if (director._id.toString() === najeh._id.toString()) {
            console.log('   ✅ Najeh serait assigné à cette correspondance');
          }
        }
      }
      
      if (!directorsToAssign.includes(najeh._id.toString())) {
        console.log('❌ Najeh ne serait PAS assigné à cette correspondance');
        console.log('\n🔍 Raisons possibles:');
        console.log('1. Directorate non défini ou incorrect');
        console.log('2. Mots-clés ne correspondent pas à son domaine');
        console.log('3. Utilisateur inactif');
        console.log('4. Problème dans la logique d\'assignation');
      }
    } else {
      console.log('❌ Aucun directeur ne serait assigné');
    }

    // 4. Vérifier la configuration de Najeh pour l'assignation
    console.log(`\n🔧 === VÉRIFICATION CONFIGURATION NAJEH ===`);
    
    // Vérifier si Najeh correspond aux critères d'assignation
    const criteresAssignation = {
      role: ['DIRECTEUR', 'SOUS_DIRECTEUR'].includes(najeh.role),
      directorate: najeh.directorate !== null && najeh.directorate !== undefined,
      isActive: najeh.isActive === true,
      airport: najeh.airport === 'ENFIDHA'
    };

    console.log('📋 Critères d\'assignation:');
    Object.entries(criteresAssignation).forEach(([critere, valide]) => {
      console.log(`   ${valide ? '✅' : '❌'} ${critere}: ${valide}`);
    });

    // 5. Suggestions de correction
    console.log(`\n💡 === SUGGESTIONS DE CORRECTION ===`);
    
    if (!najeh.directorate) {
      console.log('🔧 Najeh n\'a pas de directorate défini');
      console.log('   Solution: Définir un directorate (TECHNIQUE, COMMERCIAL, OPERATIONS, etc.)');
      console.log('   Commande: UPDATE users SET directorate = "TECHNIQUE" WHERE _id = "' + najeh._id + '"');
    }

    if (!najeh.managedDepartments || najeh.managedDepartments.length === 0) {
      console.log('🔧 Najeh n\'a pas de départements gérés');
      console.log('   Solution: Définir des départements gérés');
      console.log('   Exemple: ["TECHNIQUE", "MAINTENANCE", "INFRASTRUCTURE"]');
    }

    if (!najeh.isActive) {
      console.log('🔧 Najeh n\'est pas actif');
      console.log('   Solution: Activer le compte');
      console.log('   Commande: UPDATE users SET isActive = true WHERE _id = "' + najeh._id + '"');
    }

    // 6. Créer une correspondance de test et l'assigner manuellement
    console.log(`\n🧪 === CRÉATION CORRESPONDANCE DE TEST ===`);
    
    try {
      const testCorr = new Correspondance({
        title: 'Test pour Najeh Chaouch',
        type: 'INCOMING',
        from_address: 'test@example.com',
        to_address: 'najeh.chaouch@tav.aero',
        subject: 'Test d\'assignation manuelle pour Najeh',
        content: 'Ceci est une correspondance de test assignée manuellement à Najeh Chaouch.',
        priority: 'MEDIUM',
        status: 'PENDING',
        airport: 'ENFIDHA',
        code: 'TEST-NAJEH-' + Date.now(),
        personnesConcernees: [najeh._id.toString()],
        authorId: 'system-test',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await testCorr.save();
      console.log(`✅ Correspondance de test créée et assignée à Najeh: ${testCorr._id}`);
      
      // Vérifier l'assignation
      const verification = await Correspondance.findOne({
        _id: testCorr._id,
        personnesConcernees: najeh._id.toString()
      });
      
      if (verification) {
        console.log('✅ Vérification réussie: Najeh est bien dans personnesConcernees');
      } else {
        console.log('❌ Erreur: Najeh non trouvé dans personnesConcernees');
      }

    } catch (error) {
      console.error('❌ Erreur création correspondance test:', error.message);
    }

    console.log('\n🎉 === DIAGNOSTIC TERMINÉ ===');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
debugNajehAssignment().catch(console.error);
