const mongoose = require('mongoose');

async function fixSousDirecteurSupport() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔧 === CORRECTION SUPPORT SOUS_DIRECTEUR ===\n');
    
    // 1. Vérifier les utilisateurs DIRECTEUR et SOUS_DIRECTEUR
    const db = mongoose.connection.db;
    
    const directeurs = await db.collection('users').find({
      role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] }
    }).toArray();
    
    console.log(`👥 Directeurs trouvés: ${directeurs.length}`);
    directeurs.forEach(dir => {
      console.log(`   - ${dir.firstName} ${dir.lastName} (${dir.role}) - ${dir.email}`);
    });
    
    // 2. Vérifier le DG
    const dg = await db.collection('users').findOne({ role: 'DIRECTEUR_GENERAL' });
    console.log(`\n👑 DG: ${dg ? `${dg.firstName} ${dg.lastName}` : 'Non trouvé'}`);
    
    // 3. Vérifier les workflows existants
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`\n📋 Workflows existants: ${workflows.length}`);
    
    workflows.forEach(workflow => {
      console.log(`   - ${workflow._id}: Status ${workflow.currentStatus}`);
      console.log(`     Assigné à: ${workflow.assignedDirector}`);
      console.log(`     DG: ${workflow.directeurGeneral}`);
      console.log(`     Messages: ${workflow.chatMessages?.length || 0}`);
    });
    
    // 4. Vérifier les correspondances avec workflow
    const correspondances = await db.collection('correspondances').find({
      workflowStatus: { $exists: true }
    }).toArray();
    
    console.log(`\n📄 Correspondances avec workflow: ${correspondances.length}`);
    correspondances.forEach(corr => {
      console.log(`   - "${corr.objet || corr.subject}": ${corr.workflowStatus}`);
      console.log(`     Assignée à: ${corr.assignedTo}`);
    });
    
    console.log('\n🎯 === PROBLÈMES IDENTIFIÉS ===');
    console.log('1. Le système doit supporter DIRECTEUR ET SOUS_DIRECTEUR');
    console.log('2. Les routes et middlewares doivent accepter les deux rôles');
    console.log('3. Les services doivent traiter les deux rôles de la même manière');
    
    console.log('\n📝 === CORRECTIONS NÉCESSAIRES ===');
    console.log('1. Middleware requireDirector → accepter DIRECTEUR et SOUS_DIRECTEUR');
    console.log('2. Services workflow → traiter les deux rôles');
    console.log('3. Routes chat → autoriser les deux rôles');
    console.log('4. Frontend → afficher les bonnes interfaces pour les deux rôles');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixSousDirecteurSupport();
