const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

async function fixDirectorData() {
  try {
    console.log('🔧 Diagnostic et correction des données directeurs');
    console.log('='.repeat(60));

    // 1. Connexion à la base de données
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');

    // 2. Recherche de tous les directeurs
    console.log('\n2. Recherche des directeurs...');
    const directors = await User.find({ 
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    console.log(`✅ ${directors.length} directeur(s) trouvé(s)`);

    // 3. Diagnostic des directeurs
    console.log('\n3. Diagnostic des directeurs:');
    directors.forEach((director, index) => {
      console.log(`\n   Directeur ${index + 1}:`);
      console.log(`   - Nom: ${director.firstName} ${director.lastName}`);
      console.log(`   - Email: ${director.email}`);
      console.log(`   - Rôle: ${director.role}`);
      console.log(`   - Département: ${director.department || 'Non défini'}`);
      console.log(`   - Directorate: ${director.directorate || 'Non défini'}`);
      console.log(`   - Départements gérés: ${director.managedDepartments?.length ? director.managedDepartments.join(', ') : 'Aucun'}`);
      console.log(`   - Aéroport: ${director.airport}`);
    });

    // 4. Correction des données manquantes
    console.log('\n4. Correction des données manquantes...');
    
    for (const director of directors) {
      let needsUpdate = false;
      const updates = {};
      
      // Définir le directorate basé sur le département
      if (!director.directorate && director.department) {
        const departmentToDirectorate = {
          'Ressources Humaines': 'RH',
          'Technique': 'TECHNIQUE',
          'Commercial': 'COMMERCIAL',
          'Financier': 'FINANCIER',
          'Operations': 'OPERATIONS',
          'Général': 'GENERAL'
        };
        
        const directorate = departmentToDirectorate[director.department] || 'GENERAL';
        updates.directorate = directorate;
        needsUpdate = true;
        console.log(`   ✅ ${director.firstName}: Directorate défini à ${directorate}`);
      }
      
      // Définir les départements gérés si vides
      if (!director.managedDepartments || director.managedDepartments.length === 0) {
        if (director.role === 'DIRECTEUR_GENERAL') {
          updates.managedDepartments = ['Technique', 'Commercial', 'Financier', 'Operations', 'Ressources Humaines'];
        } else if (director.department) {
          updates.managedDepartments = [director.department];
        } else {
          updates.managedDepartments = ['Général'];
        }
        needsUpdate = true;
        console.log(`   ✅ ${director.firstName}: Départements gérés définis`);
      }
      
      // Appliquer les mises à jour
      if (needsUpdate) {
        await User.findByIdAndUpdate(director._id, updates);
        console.log(`   💾 ${director.firstName}: Données mises à jour`);
      }
    }

    // 5. Vérification finale
    console.log('\n5. Vérification finale...');
    const updatedDirectors = await User.find({ 
      role: { $in: ['DIRECTEUR_GENERAL', 'DIRECTEUR', 'SOUS_DIRECTEUR'] }
    });
    
    console.log('\n📊 État final des directeurs:');
    updatedDirectors.forEach((director, index) => {
      console.log(`\n   Directeur ${index + 1}:`);
      console.log(`   - Nom: ${director.firstName} ${director.lastName}`);
      console.log(`   - Rôle: ${director.role}`);
      console.log(`   - Directorate: ${director.directorate}`);
      console.log(`   - Départements gérés: ${director.managedDepartments?.join(', ')}`);
      console.log(`   - Statut: ${director.directorate && director.managedDepartments?.length ? '✅ Complet' : '❌ Incomplet'}`);
    });

    // 6. Test de l'API directors/dashboard
    console.log('\n6. Test de l\'API directors/dashboard...');
    
    // Recherche d'un directeur pour tester
    const testDirector = updatedDirectors[0];
    if (testDirector) {
      console.log(`\n   Test avec: ${testDirector.firstName} ${testDirector.lastName}`);
      console.log(`   - ID: ${testDirector._id}`);
      console.log(`   - Directorate: ${testDirector.directorate}`);
      console.log(`   - Départements: ${testDirector.managedDepartments?.join(', ')}`);
      
      // Simuler les métriques que l'API devrait retourner
      const mockMetrics = {
        totalAssigned: 15,
        pending: 8,
        inProgress: 5,
        completed: 2,
        overdue: 3,
        avgResponseTime: 2.5,
        departmentPerformance: testDirector.managedDepartments?.map(dept => ({
          department: dept,
          completed: Math.floor(Math.random() * 10) + 1,
          pending: Math.floor(Math.random() * 5) + 1
        })) || []
      };
      
      console.log('   📊 Métriques simulées:', JSON.stringify(mockMetrics, null, 2));
    }

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
fixDirectorData();
