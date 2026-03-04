const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function fixDirectorCorrespondances() {
  try {
    console.log('🔧 Diagnostic et correction des correspondances directeurs');
    console.log('='.repeat(70));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Recherche du directeur RH
    console.log('\n2. Recherche du directeur des Ressources Humaines...');
    const rhDirector = await User.findOne({ 
      role: 'DIRECTEUR',
      department: 'Ressources Humaines'
    });
    
    if (!rhDirector) {
      console.log('❌ Directeur RH non trouvé');
      return;
    }
    
    console.log(`✅ Directeur RH trouvé: ${rhDirector.firstName} ${rhDirector.lastName}`);
    console.log(`   - Email: ${rhDirector.email}`);
    console.log(`   - ID: ${rhDirector._id}`);
    console.log(`   - Département: ${rhDirector.department}`);
    console.log(`   - Directorate: ${rhDirector.directorate}`);
    console.log(`   - Départements gérés: ${rhDirector.managedDepartments?.join(', ') || 'Aucun'}`);

    // 3. Recherche de toutes les correspondances
    console.log('\n3. Analyse des correspondances existantes...');
    const allCorrespondances = await Correspondance.find({}).lean();
    console.log(`📊 Total des correspondances: ${allCorrespondances.length}`);

    // 4. Correspondances déjà assignées au directeur RH
    const assignedToRH = await Correspondance.find({
      personnesConcernees: rhDirector._id
    }).lean();
    console.log(`✅ Correspondances déjà assignées au directeur RH: ${assignedToRH.length}`);

    // 5. Correspondances liées aux RH mais pas assignées
    const rhRelatedCorrespondances = await Correspondance.find({
      $and: [
        { personnesConcernees: { $ne: rhDirector._id } },
        {
          $or: [
            { tags: { $in: ['RH', 'Ressources Humaines', 'ressources humaines', 'rh'] } },
            { departementsResponsables: { $in: ['Ressources Humaines', 'RH'] } },
            { subject: { $regex: /(rh|ressources humaines|personnel|recrutement|formation|salaire)/i } },
            { content: { $regex: /(rh|ressources humaines|personnel|recrutement|formation|salaire)/i } }
          ]
        }
      ]
    }).lean();

    console.log(`🔍 Correspondances RH non assignées trouvées: ${rhRelatedCorrespondances.length}`);

    if (rhRelatedCorrespondances.length > 0) {
      console.log('\n📋 Détails des correspondances RH non assignées:');
      rhRelatedCorrespondances.forEach((corr, index) => {
        console.log(`\n   ${index + 1}. ${corr.subject}`);
        console.log(`      - ID: ${corr._id}`);
        console.log(`      - Date: ${new Date(corr.createdAt).toLocaleDateString()}`);
        console.log(`      - Tags: ${corr.tags?.join(', ') || 'Aucun'}`);
        console.log(`      - Départements responsables: ${corr.departementsResponsables?.join(', ') || 'Aucun'}`);
        console.log(`      - Personnes concernées: ${corr.personnesConcernees?.length || 0}`);
      });
    }

    // 6. Correction automatique
    console.log('\n6. Correction automatique des assignations...');
    
    if (rhRelatedCorrespondances.length > 0) {
      const updateResult = await Correspondance.updateMany(
        {
          _id: { $in: rhRelatedCorrespondances.map(c => c._id) }
        },
        {
          $addToSet: { 
            personnesConcernees: rhDirector._id,
            departementsResponsables: 'Ressources Humaines'
          },
          $set: { updatedAt: new Date() }
        }
      );

      console.log(`✅ ${updateResult.modifiedCount} correspondances mises à jour`);
    }

    // 7. Créer une correspondance de test pour le directeur RH
    console.log('\n7. Création d\'une correspondance de test...');
    
    const testCorrespondance = new Correspondance({
      title: 'Test - Correspondance RH',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: rhDirector.email,
      subject: 'Test - Demande de formation du personnel',
      content: 'Ceci est une correspondance de test pour vérifier l\'affichage dans le dashboard du directeur RH.',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: rhDirector.airport,
      authorId: rhDirector._id,
      personnesConcernees: [rhDirector._id],
      departementsResponsables: ['Ressources Humaines'],
      tags: ['RH', 'Formation', 'Test'],
      date_correspondance: new Date()
    });

    await testCorrespondance.save();
    console.log(`✅ Correspondance de test créée: ${testCorrespondance._id}`);

    // 8. Vérification finale
    console.log('\n8. Vérification finale...');
    const finalAssignedCount = await Correspondance.countDocuments({
      personnesConcernees: rhDirector._id
    });
    console.log(`📊 Total des correspondances assignées au directeur RH: ${finalAssignedCount}`);

    // 9. Test du filtre du dashboard
    console.log('\n9. Test du filtre du dashboard directeur...');
    
    // Simuler le filtre utilisé par le service DirectorDashboard
    const dashboardFilter = {
      personnesConcernees: rhDirector._id
    };
    
    const dashboardCorrespondances = await Correspondance.find(dashboardFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject createdAt status priority')
      .lean();

    console.log(`📊 Correspondances visibles dans le dashboard: ${dashboardCorrespondances.length}`);
    
    if (dashboardCorrespondances.length > 0) {
      console.log('\n📋 Aperçu du dashboard:');
      dashboardCorrespondances.forEach((corr, index) => {
        console.log(`   ${index + 1}. ${corr.subject}`);
        console.log(`      - Status: ${corr.status}`);
        console.log(`      - Priorité: ${corr.priority}`);
        console.log(`      - Date: ${new Date(corr.createdAt).toLocaleDateString()}`);
      });
    }

    // 10. Instructions pour créer des correspondances assignées
    console.log('\n10. 📋 INSTRUCTIONS pour créer des correspondances assignées au directeur RH:');
    console.log('');
    console.log('   Lors de la création d\'une correspondance, assurez-vous d\'inclure:');
    console.log('');
    console.log('   ✅ personnesConcernees: ["' + rhDirector._id + '"]');
    console.log('   ✅ departementsResponsables: ["Ressources Humaines"]');
    console.log('   ✅ tags: ["RH"] ou ["Ressources Humaines"]');
    console.log('');
    console.log('   Ou utilisez des mots-clés dans le sujet/contenu:');
    console.log('   - RH, Ressources Humaines, Personnel, Recrutement, Formation, Salaire');
    console.log('');
    console.log('   📧 Email du directeur RH: ' + rhDirector.email);
    console.log('   🆔 ID du directeur RH: ' + rhDirector._id);

  } catch (error) {
    console.error('❌ Erreur lors de la correction:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Correction terminée - Connexion MongoDB fermée');
  }
}

// Exécuter la correction
fixDirectorCorrespondances();
