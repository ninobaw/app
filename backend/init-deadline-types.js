const mongoose = require('mongoose');
const DeadlineType = require('./src/models/DeadlineType');

async function initDefaultDeadlineTypes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    console.log('🔧 === INITIALISATION TYPES D\'ÉCHÉANCE ===\n');
    
    // Trouver un admin pour créer les types
    const db = mongoose.connection.db;
    const admin = await db.collection('users').findOne({ role: 'SUPER_ADMIN' });
    
    if (!admin) {
      console.log('❌ Aucun SUPER_ADMIN trouvé');
      process.exit(1);
    }
    
    console.log(`👤 Admin trouvé: ${admin.firstName} ${admin.lastName}`);
    
    // Définir les types d'échéance par défaut
    const defaultDeadlineTypes = [
      {
        name: 'URGENT',
        label: 'Urgent - 24h',
        color: '#DC2626', // Rouge
        days: 1,
        priority: 'URGENT',
        description: 'Traitement urgent dans les 24 heures',
        isDefault: false,
        order: 1
      },
      {
        name: 'PRIORITAIRE',
        label: 'Prioritaire - 3 jours',
        color: '#EA580C', // Orange
        days: 3,
        priority: 'HIGH',
        description: 'Traitement prioritaire sous 3 jours',
        isDefault: true, // Par défaut
        order: 2
      },
      {
        name: 'NORMAL',
        label: 'Normal - 5 jours',
        color: '#2563EB', // Bleu
        days: 5,
        priority: 'MEDIUM',
        description: 'Traitement normal sous 5 jours ouvrables',
        isDefault: false,
        order: 3
      },
      {
        name: 'STANDARD',
        label: 'Standard - 7 jours',
        color: '#059669', // Vert
        days: 7,
        priority: 'MEDIUM',
        description: 'Traitement standard sous une semaine',
        isDefault: false,
        order: 4
      },
      {
        name: 'PROLONGE',
        label: 'Prolongé - 15 jours',
        color: '#7C3AED', // Violet
        days: 15,
        priority: 'LOW',
        description: 'Traitement prolongé sous 15 jours',
        isDefault: false,
        order: 5
      }
    ];
    
    // Vérifier si des types existent déjà
    const existingCount = await DeadlineType.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️ ${existingCount} types d'échéance existent déjà`);
      console.log('Voulez-vous les remplacer ? (Ce script va les supprimer)');
      
      // Pour ce script, on va les supprimer et recréer
      await DeadlineType.deleteMany({});
      console.log('🗑️ Types existants supprimés');
    }
    
    // Créer les nouveaux types
    console.log(`📝 Création de ${defaultDeadlineTypes.length} types d'échéance...\n`);
    
    for (const typeData of defaultDeadlineTypes) {
      const deadlineType = new DeadlineType({
        ...typeData,
        createdBy: admin._id
      });
      
      await deadlineType.save();
      
      console.log(`✅ ${typeData.name}: ${typeData.label} (${typeData.days}j) - ${typeData.color}`);
      if (typeData.isDefault) {
        console.log('   🎯 Type par défaut');
      }
    }
    
    // Vérification finale
    const createdTypes = await DeadlineType.getActiveTypes();
    const defaultType = await DeadlineType.getDefaultType();
    
    console.log(`\n🔍 Vérification finale:`);
    console.log(`   - Types créés: ${createdTypes.length}`);
    console.log(`   - Type par défaut: ${defaultType?.name} (${defaultType?.days}j)`);
    
    console.log('\n📋 Types d\'échéance disponibles:');
    createdTypes.forEach(type => {
      const defaultMark = type.isDefault ? ' [DÉFAUT]' : '';
      console.log(`   ${type.order}. ${type.name}: ${type.label} - ${type.days}j - ${type.color}${defaultMark}`);
    });
    
    console.log('\n🎉 === INITIALISATION TERMINÉE ===');
    console.log('Les types d\'échéance sont maintenant configurés !');
    console.log('Ils seront disponibles dans le dialogue de création de correspondances.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initDefaultDeadlineTypes();
