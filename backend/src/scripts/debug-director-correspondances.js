const mongoose = require('mongoose');
const User = require('../models/User');
const Correspondance = require('../models/Correspondance');
const DirectorDashboardService = require('../services/directorDashboardService');

async function debugDirectorCorrespondances() {
  try {
    console.log('🔍 === DIAGNOSTIC CORRESPONDANCES DIRECTEUR ADJOINT ===\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. Rechercher tous les directeurs adjoints (SOUS_DIRECTEUR)
    console.log('👥 === RECHERCHE DES DIRECTEURS ADJOINTS ===');
    const sousDirecteurs = await User.find({ role: 'SOUS_DIRECTEUR' });
    console.log(`📊 Nombre de sous-directeurs trouvés: ${sousDirecteurs.length}\n`);

    if (sousDirecteurs.length === 0) {
      console.log('❌ Aucun sous-directeur trouvé dans la base de données');
      console.log('💡 Créons un sous-directeur de test...\n');
      
      // Créer un sous-directeur de test
      const testSousDirecteur = new User({
        _id: 'test-sous-directeur-' + Date.now(),
        email: 'sous.directeur.test@tav.aero',
        firstName: 'Test',
        lastName: 'Sous-Directeur',
        password: '$2b$10$test.hash.password',
        role: 'SOUS_DIRECTEUR',
        directorate: 'TECHNIQUE',
        airport: 'ENFIDHA',
        managedDepartments: ['TECHNIQUE', 'MAINTENANCE'],
        isActive: true
      });
      
      await testSousDirecteur.save();
      console.log('✅ Sous-directeur de test créé:', testSousDirecteur.email);
      sousDirecteurs.push(testSousDirecteur);
    }

    // 2. Analyser chaque sous-directeur
    for (const sousDirecteur of sousDirecteurs) {
      console.log(`\n🔍 === ANALYSE SOUS-DIRECTEUR: ${sousDirecteur.firstName} ${sousDirecteur.lastName} ===`);
      console.log(`📧 Email: ${sousDirecteur.email}`);
      console.log(`🏢 Directorate: ${sousDirecteur.directorate}`);
      console.log(`📋 Départements gérés: ${sousDirecteur.managedDepartments}`);
      console.log(`🏛️ Aéroport: ${sousDirecteur.airport}`);
      console.log(`✅ Actif: ${sousDirecteur.isActive}`);
      console.log(`👤 ID: ${sousDirecteur._id}`);

      // Vérifier si c'est bien un directeur
      console.log(`🎯 Est directeur: ${sousDirecteur.isDirector()}`);

      // 3. Rechercher les correspondances assignées directement
      console.log(`\n📋 === CORRESPONDANCES ASSIGNÉES DIRECTEMENT ===`);
      const correspondancesDirectes = await Correspondance.find({
        personnesConcernees: sousDirecteur._id.toString()
      }).limit(5);
      
      console.log(`📊 Correspondances assignées directement: ${correspondancesDirectes.length}`);
      
      if (correspondancesDirectes.length > 0) {
        correspondancesDirectes.forEach((corr, index) => {
          console.log(`  ${index + 1}. ${corr.subject} (${corr.status}) - ${corr.priority}`);
          console.log(`     Personnes concernées: ${corr.personnesConcernees}`);
        });
      } else {
        console.log('❌ Aucune correspondance assignée directement');
      }

      // 4. Rechercher toutes les correspondances pour voir s'il y en a
      console.log(`\n📋 === TOUTES LES CORRESPONDANCES ===`);
      const toutesCorrespondances = await Correspondance.find({}).limit(10);
      console.log(`📊 Total correspondances dans la base: ${await Correspondance.countDocuments({})}`);
      
      if (toutesCorrespondances.length > 0) {
        console.log(`📄 Exemples de correspondances existantes:`);
        toutesCorrespondances.slice(0, 3).forEach((corr, index) => {
          console.log(`  ${index + 1}. ${corr.subject} (${corr.status})`);
          console.log(`     Personnes concernées: ${corr.personnesConcernees}`);
          console.log(`     Auteur: ${corr.authorId}`);
        });
      }

      // 5. Tester le service DirectorDashboardService
      console.log(`\n🎯 === TEST DIRECTOR DASHBOARD SERVICE ===`);
      try {
        const metrics = await DirectorDashboardService.getDirectorMetrics(
          sousDirecteur._id.toString(), 
          sousDirecteur.role
        );
        
        console.log(`📊 Métriques obtenues:`);
        console.log(`  - Total assigné: ${metrics.totalAssigned}`);
        console.log(`  - En attente: ${metrics.pendingCorrespondances}`);
        console.log(`  - Répondues: ${metrics.repliedCorrespondances}`);
        console.log(`  - En retard: ${metrics.overdueCorrespondances}`);
        console.log(`  - Urgentes: ${metrics.urgentCorrespondances}`);
        console.log(`  - Cette semaine: ${metrics.thisWeekCorrespondances}`);
        console.log(`  - Correspondances récentes: ${metrics.recentCorrespondances.length}`);
        
        if (metrics.recentCorrespondances.length > 0) {
          console.log(`📄 Correspondances récentes:`);
          metrics.recentCorrespondances.forEach((corr, index) => {
            console.log(`  ${index + 1}. ${corr.subject} (${corr.status}) - ${corr.author}`);
          });
        }
        
      } catch (error) {
        console.error(`❌ Erreur DirectorDashboardService:`, error.message);
      }

      // 6. Créer une correspondance de test assignée au sous-directeur
      console.log(`\n🧪 === CRÉATION CORRESPONDANCE DE TEST ===`);
      try {
        const testCorrespondance = new Correspondance({
          title: 'Test Correspondance pour Sous-Directeur',
          type: 'INCOMING',
          from_address: 'test@example.com',
          to_address: 'tav@enfidha.aero',
          subject: 'Test d\'assignation au sous-directeur',
          content: 'Ceci est une correspondance de test pour vérifier l\'assignation au sous-directeur.',
          priority: 'MEDIUM',
          status: 'PENDING',
          airport: 'ENFIDHA',
          code: 'TEST-SOUS-DIR-' + Date.now(),
          personnesConcernees: [sousDirecteur._id.toString()],
          authorId: 'system-test',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await testCorrespondance.save();
        console.log(`✅ Correspondance de test créée: ${testCorrespondance._id}`);
        console.log(`📋 Assignée à: ${testCorrespondance.personnesConcernees}`);

        // Vérifier que la correspondance est bien assignée
        const verification = await Correspondance.findOne({
          _id: testCorrespondance._id,
          personnesConcernees: sousDirecteur._id.toString()
        });
        
        if (verification) {
          console.log(`✅ Vérification réussie: correspondance bien assignée`);
        } else {
          console.log(`❌ Erreur: correspondance non trouvée avec l'assignation`);
        }

      } catch (error) {
        console.error(`❌ Erreur création correspondance test:`, error.message);
      }

      // 7. Re-tester les métriques après création
      console.log(`\n🔄 === RE-TEST MÉTRIQUES APRÈS CRÉATION ===`);
      try {
        const newMetrics = await DirectorDashboardService.getDirectorMetrics(
          sousDirecteur._id.toString(), 
          sousDirecteur.role
        );
        
        console.log(`📊 Nouvelles métriques:`);
        console.log(`  - Total assigné: ${newMetrics.totalAssigned}`);
        console.log(`  - En attente: ${newMetrics.pendingCorrespondances}`);
        console.log(`  - Correspondances récentes: ${newMetrics.recentCorrespondances.length}`);
        
        if (newMetrics.recentCorrespondances.length > 0) {
          console.log(`📄 Correspondances récentes:`);
          newMetrics.recentCorrespondances.forEach((corr, index) => {
            console.log(`  ${index + 1}. ${corr.subject} (${corr.status})`);
          });
        }
        
      } catch (error) {
        console.error(`❌ Erreur re-test métriques:`, error.message);
      }
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
debugDirectorCorrespondances().catch(console.error);
