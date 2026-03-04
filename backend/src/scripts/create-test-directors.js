const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow';

async function createTestDirectors() {
  try {
    console.log('🏗️ Création de directeurs de test');
    console.log('=' .repeat(50));

    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB établie');

    // 1. Créer des directeurs de test
    console.log('\n👥 1. CRÉATION DES DIRECTEURS:');

    const directorsToCreate = [
      {
        _id: uuidv4(),
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        email: 'ahmed.benali@tav.aero',
        password: 'password123',
        role: 'DIRECTEUR',
        directorate: 'OPERATIONS', // Utiliser les valeurs enum correctes
        airport: 'ENFIDHA', // Champ requis
        isActive: true,
        managedDepartments: ['Operations', 'Technique'],
        delegationLevel: 3
      },
      {
        _id: uuidv4(),
        firstName: 'Fatma',
        lastName: 'Trabelsi',
        email: 'fatma.trabelsi@tav.aero',
        password: 'password123',
        role: 'SOUS_DIRECTEUR',
        directorate: 'RH', // Valeur enum correcte
        airport: 'MONASTIR', // Champ requis
        isActive: true,
        managedDepartments: ['RH', 'Formation'],
        delegationLevel: 2
      },
      {
        _id: uuidv4(),
        firstName: 'Mohamed',
        lastName: 'Sassi',
        email: 'mohamed.sassi@tav.aero',
        password: 'password123',
        role: 'DIRECTEUR_GENERAL',
        directorate: 'GENERAL', // Valeur enum correcte
        airport: 'GENERALE', // Champ requis
        isActive: true,
        managedDepartments: ['Tous'],
        delegationLevel: 5
      }
    ];

    for (const directorData of directorsToCreate) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: directorData.email });
      
      if (existingUser) {
        console.log(`   ⚠️ Utilisateur ${directorData.email} existe déjà - Mise à jour du rôle`);
        
        // Mettre à jour le rôle existant
        await User.findByIdAndUpdate(existingUser._id, {
          role: directorData.role,
          directorate: directorData.directorate,
          airport: directorData.airport,
          managedDepartments: directorData.managedDepartments,
          delegationLevel: directorData.delegationLevel
        });
        
        console.log(`   ✅ Rôle mis à jour: ${directorData.firstName} ${directorData.lastName} → ${directorData.role}`);
      } else {
        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(directorData.password, 10);
        
        const newDirector = new User({
          ...directorData,
          password: hashedPassword
        });
        
        await newDirector.save();
        console.log(`   ✅ Créé: ${directorData.firstName} ${directorData.lastName} (${directorData.role})`);
      }
    }

    // 2. Créer des correspondances de test assignées aux directeurs
    console.log('\n📬 2. CRÉATION DE CORRESPONDANCES DE TEST:');

    const directors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] } 
    });

    console.log(`   Directeurs trouvés: ${directors.length}`);

    const correspondancesToCreate = [
      {
        title: 'Demande d\'autorisation de vol',
        subject: 'Autorisation de vol charter pour événement spécial',
        content: 'Demande d\'autorisation pour un vol charter dans le cadre d\'un événement spécial organisé par une compagnie locale.',
        from_address: 'pilote@airline.com', // Champ requis
        to_address: 'operations@tav.aero', // Champ requis
        priority: 'HIGH',
        status: 'PENDING',
        type: 'INCOMING', // Valeur enum correcte
        airport: 'ENFIDHA',
        workflowStatus: 'ASSIGNED_TO_DIRECTOR'
      },
      {
        title: 'Réclamation passager',
        subject: 'Réclamation concernant un retard de vol',
        content: 'Un passager se plaint d\'un retard important de son vol et demande une compensation.',
        from_address: 'passager@email.com', // Champ requis
        to_address: 'service.client@tav.aero', // Champ requis
        priority: 'MEDIUM',
        status: 'PENDING',
        type: 'INCOMING', // Valeur enum correcte
        airport: 'MONASTIR',
        workflowStatus: 'ASSIGNED_TO_DIRECTOR'
      },
      {
        title: 'Demande de formation',
        subject: 'Formation sécurité pour nouveau personnel',
        content: 'Demande de mise en place d\'une formation sécurité pour les nouveaux employés recrutés.',
        from_address: 'rh@tav.aero', // Champ requis
        to_address: 'formation@tav.aero', // Champ requis
        priority: 'MEDIUM',
        status: 'PENDING',
        type: 'INCOMING', // Valeur enum correcte
        airport: 'GENERALE',
        workflowStatus: 'ASSIGNED_TO_DIRECTOR'
      }
    ];

    for (let i = 0; i < correspondancesToCreate.length; i++) {
      const corrData = correspondancesToCreate[i];
      const assignedDirector = directors[i % directors.length]; // Répartir entre les directeurs

      // Vérifier si une correspondance similaire existe déjà
      const existingCorr = await Correspondance.findOne({ 
        subject: corrData.subject 
      });

      if (existingCorr) {
        console.log(`   ⚠️ Correspondance "${corrData.subject}" existe déjà`);
        
        // Mettre à jour l'assignation si nécessaire
        if (!existingCorr.personnesConcernees.includes(assignedDirector._id)) {
          await Correspondance.findByIdAndUpdate(existingCorr._id, {
            $addToSet: { personnesConcernees: assignedDirector._id },
            workflowStatus: 'ASSIGNED_TO_DIRECTOR'
          });
          console.log(`   ✅ Assignée à: ${assignedDirector.firstName} ${assignedDirector.lastName}`);
        }
      } else {
        // Créer une nouvelle correspondance
        const newCorr = new Correspondance({
          ...corrData,
          personnesConcernees: [assignedDirector._id],
          authorId: assignedDirector._id, // Champ requis
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newCorr.save();
        console.log(`   ✅ Créée: "${corrData.subject}"`);
        console.log(`      Assignée à: ${assignedDirector.firstName} ${assignedDirector.lastName}`);
      }
    }

    // 3. Vérification finale
    console.log('\n🔍 3. VÉRIFICATION FINALE:');

    const finalDirectors = await User.find({ 
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR', 'DIRECTEUR_GENERAL'] } 
    }).select('firstName lastName email role directorate');

    console.log(`   Directeurs créés: ${finalDirectors.length}`);
    finalDirectors.forEach((director, index) => {
      console.log(`   ${index + 1}. ${director.firstName} ${director.lastName}`);
      console.log(`      Email: ${director.email}`);
      console.log(`      Rôle: ${director.role}`);
      console.log(`      Directorate: ${director.directorate}`);
    });

    const assignedCorrespondances = await Correspondance.find({
      'personnesConcernees': { $in: finalDirectors.map(d => d._id) }
    }).populate('personnesConcernees', 'firstName lastName role');

    console.log(`\n   Correspondances assignées: ${assignedCorrespondances.length}`);
    assignedCorrespondances.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.subject}`);
      console.log(`      Assignée à: ${corr.personnesConcernees.map(p => `${p.firstName} ${p.lastName}`).join(', ')}`);
    });

    console.log('\n✅ Directeurs de test créés avec succès !');
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('   1. Connectez-vous avec un des comptes directeur:');
    console.log('      - ahmed.benali@tav.aero / password123');
    console.log('      - fatma.trabelsi@tav.aero / password123');
    console.log('   2. Allez au Dashboard Directeur');
    console.log('   3. Vous devriez voir des correspondances dans "Mes Propositions de Réponse"');
    console.log('   4. Cliquez sur "Voir détails" pour ouvrir le dialogue conversationnel');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter la création
createTestDirectors();
