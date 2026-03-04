const mongoose = require('mongoose');
const User = require('../models/User');

async function debugUserPermissions() {
  try {
    console.log('🔍 === DIAGNOSTIC PERMISSIONS UTILISATEUR ===\n');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aero-doc-flow');
    console.log('✅ Connexion MongoDB établie\n');

    // 1. Lister tous les utilisateurs avec leurs permissions
    console.log('👥 === LISTE DES UTILISATEURS ===');
    const users = await User.find({}).select('_id firstName lastName email role airport directorate isActive');
    
    console.log(`📊 Nombre total d'utilisateurs: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Rôle: ${user.role}`);
      console.log(`   🏛️ Aéroport: ${user.airport}`);
      console.log(`   🏢 Directorate: ${user.directorate || 'N/A'}`);
      console.log(`   ✅ Actif: ${user.isActive}`);
      console.log(`   🆔 ID: ${user._id}`);
      
      // Vérifier les permissions d'aéroport
      const canCreateForAllAirports = [
        'SUPER_ADMIN', 
        'ADMINISTRATOR', 
        'SUPERVISEUR_BUREAU_ORDRE',
        'DIRECTEUR_GENERAL', 
        'DIRECTEUR', 
        'SOUS_DIRECTEUR'
      ].includes(user.role);
      
      console.log(`   🔐 Peut créer pour tous aéroports: ${canCreateForAllAirports ? '✅ OUI' : '❌ NON'}`);
      
      if (!canCreateForAllAirports && user.role === 'AGENT_BUREAU_ORDRE') {
        console.log(`   📍 Limité à l'aéroport: ${user.airport}`);
      }
      
      console.log('');
    });

    // 2. Analyser les rôles par aéroport
    console.log('\n🏛️ === RÉPARTITION PAR AÉROPORT ===');
    const airportStats = {};
    
    users.forEach(user => {
      if (!airportStats[user.airport]) {
        airportStats[user.airport] = {};
      }
      if (!airportStats[user.airport][user.role]) {
        airportStats[user.airport][user.role] = 0;
      }
      airportStats[user.airport][user.role]++;
    });
    
    Object.entries(airportStats).forEach(([airport, roles]) => {
      console.log(`\n🏛️ Aéroport: ${airport}`);
      Object.entries(roles).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} utilisateur(s)`);
      });
    });

    // 3. Identifier les utilisateurs qui peuvent créer pour MONASTIR
    console.log('\n🎯 === UTILISATEURS AUTORISÉS POUR MONASTIR ===');
    
    const canCreateForMonastir = users.filter(user => {
      const hasPrivilegedRole = [
        'SUPER_ADMIN', 
        'ADMINISTRATOR', 
        'SUPERVISEUR_BUREAU_ORDRE',
        'DIRECTEUR_GENERAL', 
        'DIRECTEUR', 
        'SOUS_DIRECTEUR'
      ].includes(user.role);
      
      const isMonastirAgent = user.role === 'AGENT_BUREAU_ORDRE' && user.airport === 'MONASTIR';
      const isGeneralAgent = user.role === 'AGENT_BUREAU_ORDRE' && user.airport === 'GENERALE';
      
      return hasPrivilegedRole || isMonastirAgent || isGeneralAgent;
    });
    
    console.log(`📊 ${canCreateForMonastir.length} utilisateur(s) peuvent créer pour MONASTIR:`);
    
    canCreateForMonastir.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - ${user.airport}`);
    });

    // 4. Identifier les utilisateurs qui NE peuvent PAS créer pour MONASTIR
    console.log('\n❌ === UTILISATEURS NON AUTORISÉS POUR MONASTIR ===');
    
    const cannotCreateForMonastir = users.filter(user => {
      const hasPrivilegedRole = [
        'SUPER_ADMIN', 
        'ADMINISTRATOR', 
        'SUPERVISEUR_BUREAU_ORDRE',
        'DIRECTEUR_GENERAL', 
        'DIRECTEUR', 
        'SOUS_DIRECTEUR'
      ].includes(user.role);
      
      const isMonastirAgent = user.role === 'AGENT_BUREAU_ORDRE' && user.airport === 'MONASTIR';
      const isGeneralAgent = user.role === 'AGENT_BUREAU_ORDRE' && user.airport === 'GENERALE';
      
      return !(hasPrivilegedRole || isMonastirAgent || isGeneralAgent);
    });
    
    console.log(`📊 ${cannotCreateForMonastir.length} utilisateur(s) NE peuvent PAS créer pour MONASTIR:`);
    
    cannotCreateForMonastir.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.role}) - ${user.airport}`);
      console.log(`   💡 Raison: Agent bureau d'ordre limité à ${user.airport}`);
    });

    // 5. Recommandations
    console.log('\n💡 === RECOMMANDATIONS ===');
    
    if (cannotCreateForMonastir.length > 0) {
      console.log('🔧 Pour résoudre le problème 403:');
      console.log('1. Vérifier le rôle de l\'utilisateur connecté');
      console.log('2. Si c\'est un agent bureau d\'ordre ENFIDHA qui doit créer pour MONASTIR:');
      console.log('   - Option A: Changer son aéroport à "GENERALE"');
      console.log('   - Option B: Lui donner un rôle directeur');
      console.log('   - Option C: Créer un compte spécifique pour MONASTIR');
      console.log('3. Si c\'est un directeur, vérifier que le middleware est bien appliqué');
    }
    
    console.log('\n🎯 Middleware authorizeAirportAccess mis à jour pour:');
    console.log('✅ Super admins, administrateurs, superviseurs: accès libre');
    console.log('✅ Directeurs (tous types): accès libre');
    console.log('✅ Agents bureau d\'ordre: limités à leur aéroport');
    console.log('✅ Autres rôles: accès libre');

    console.log('\n🎉 === DIAGNOSTIC TERMINÉ ===');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
debugUserPermissions().catch(console.error);
