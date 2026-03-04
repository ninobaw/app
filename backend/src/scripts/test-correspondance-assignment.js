const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Correspondance = require('../models/Correspondance');
const User = require('../models/User');
const CorrespondanceAssignmentService = require('../services/correspondanceAssignmentService');

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

async function testCorrespondanceAssignment() {
  console.log('\n🔍 === TEST D\'ASSIGNATION DES CORRESPONDANCES ===\n');

  try {
    // 1. Vérifier les correspondances existantes
    console.log('📋 1. Vérification des correspondances existantes...');
    const allCorrespondances = await Correspondance.find({}).populate('authorId', 'firstName lastName');
    console.log(`   Total correspondances: ${allCorrespondances.length}`);
    
    if (allCorrespondances.length > 0) {
      console.log('\n📄 Correspondances trouvées:');
      allCorrespondances.forEach((corresp, index) => {
        console.log(`   ${index + 1}. "${corresp.subject}" par ${corresp.authorId?.firstName || 'Inconnu'}`);
        console.log(`      - ID: ${corresp._id}`);
        console.log(`      - Personnes concernées: ${corresp.personnesConcernees?.length || 0}`);
        console.log(`      - Status workflow: ${corresp.workflowStatus || 'Non défini'}`);
        console.log(`      - Créée le: ${corresp.createdAt}`);
        console.log('');
      });
    }

    // 2. Vérifier les directeurs disponibles
    console.log('👥 2. Vérification des directeurs disponibles...');
    const directors = await User.find({
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'] },
      isActive: true
    });
    console.log(`   Total directeurs: ${directors.length}`);
    
    if (directors.length > 0) {
      console.log('\n👤 Directeurs trouvés:');
      directors.forEach((director, index) => {
        console.log(`   ${index + 1}. ${director.firstName} ${director.lastName}`);
        console.log(`      - ID: ${director._id}`);
        console.log(`      - Rôle: ${director.role}`);
        console.log(`      - Directorate: ${director.directorate || 'Non défini'}`);
        console.log('');
      });
    }

    // 3. Tester l'assignation sur une correspondance existante non assignée
    console.log('🎯 3. Test d\'assignation automatique...');
    const unassignedCorrespondance = await Correspondance.findOne({
      $or: [
        { personnesConcernees: { $exists: false } },
        { personnesConcernees: { $size: 0 } }
      ]
    });

    if (unassignedCorrespondance) {
      console.log(`   Correspondance trouvée: "${unassignedCorrespondance.subject}"`);
      console.log(`   Avant assignation - Personnes concernées: ${unassignedCorrespondance.personnesConcernees?.length || 0}`);
      
      // Tester l'assignation
      const assignedCorrespondance = await CorrespondanceAssignmentService.assignCorrespondance(unassignedCorrespondance);
      
      // Sauvegarder les changements
      await assignedCorrespondance.save();
      
      console.log(`   Après assignation - Personnes concernées: ${assignedCorrespondance.personnesConcernees?.length || 0}`);
      console.log(`   IDs assignés: ${assignedCorrespondance.personnesConcernees}`);
      
    } else {
      console.log('   Aucune correspondance non assignée trouvée');
    }

    // 4. Vérifier les correspondances assignées par directeur
    console.log('\n📊 4. Correspondances par directeur...');
    for (const director of directors) {
      const assignedCount = await Correspondance.countDocuments({
        personnesConcernees: director._id
      });
      console.log(`   ${director.firstName} ${director.lastName}: ${assignedCount} correspondance(s)`);
      
      if (assignedCount > 0) {
        const assignedCorrespondances = await Correspondance.find({
          personnesConcernees: director._id
        }).select('subject createdAt workflowStatus').limit(3);
        
        assignedCorrespondances.forEach((corresp, index) => {
          console.log(`     ${index + 1}. "${corresp.subject}" (${corresp.workflowStatus || 'Pas de workflow'})`);
        });
      }
    }

    // 5. Test de création d'une nouvelle correspondance avec assignation
    console.log('\n🆕 5. Test de création avec assignation automatique...');
    const testCorrespondance = new Correspondance({
      title: 'Test Correspondance Technique',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: 'bureau@aeroport.com',
      subject: 'Maintenance équipement technique urgent',
      content: 'Nous avons besoin d\'une maintenance technique urgente sur les équipements de navigation. L\'infrastructure nécessite une inspection sécuritaire.',
      priority: 'HIGH',
      status: 'PENDING',
      airport: 'ENFIDHA',
      authorId: allCorrespondances[0]?.authorId?._id || directors[0]._id,
      tags: ['technique', 'maintenance', 'sécurité']
    });

    // Assigner automatiquement
    const assignedTestCorrespondance = await CorrespondanceAssignmentService.assignCorrespondance(testCorrespondance);
    
    console.log(`   Correspondance test créée: "${assignedTestCorrespondance.subject}"`);
    console.log(`   Assignée à: ${assignedTestCorrespondance.personnesConcernees?.length || 0} directeur(s)`);
    console.log(`   IDs: ${assignedTestCorrespondance.personnesConcernees}`);
    
    // Ne pas sauvegarder la correspondance test pour éviter de polluer la DB
    console.log('   (Correspondance test non sauvegardée)');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

async function main() {
  await connectDB();
  await testCorrespondanceAssignment();
  
  console.log('\n✅ Test terminé');
  process.exit(0);
}

main();
