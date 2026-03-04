const mongoose = require('mongoose');
require('dotenv').config();

async function deepDatabaseDiagnostic() {
  try {
    // Connexion à MongoDB
    console.log('🔌 Tentative de connexion à MongoDB...');
    console.log(`📍 URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc'}`);
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc');
    console.log('✅ Connexion à MongoDB établie');

    // Informations sur la base de données
    const dbName = mongoose.connection.db.databaseName;
    console.log(`🗄️  Base de données: ${dbName}`);

    console.log('\n📊 DIAGNOSTIC APPROFONDI DE LA BASE');
    console.log('=' .repeat(60));

    // 1. Lister TOUTES les collections
    console.log('\n1️⃣  COLLECTIONS DISPONIBLES:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Total collections: ${collections.length}`);
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   • ${collection.name}: ${count} documents`);
    }

    // 2. Recherche spécifique de correspondances avec différents noms
    console.log('\n2️⃣  RECHERCHE CORRESPONDANCES (différents noms):');
    
    const possibleNames = ['correspondances', 'correspondance', 'correspondence', 'correspondences', 'emails', 'messages'];
    
    for (const name of possibleNames) {
      try {
        const count = await mongoose.connection.db.collection(name).countDocuments();
        if (count > 0) {
          console.log(`✅ Collection "${name}": ${count} documents`);
          
          // Afficher un échantillon
          const sample = await mongoose.connection.db.collection(name).findOne();
          console.log(`   📄 Échantillon:`, JSON.stringify(sample, null, 2).substring(0, 200) + '...');
        }
      } catch (error) {
        // Collection n'existe pas, ignorer
      }
    }

    // 3. Test direct avec le modèle Correspondance
    console.log('\n3️⃣  TEST MODÈLE CORRESPONDANCE:');
    try {
      const Correspondance = require('../models/Correspondance');
      console.log(`📝 Nom de collection du modèle: ${Correspondance.collection.name}`);
      
      const countViaModel = await Correspondance.countDocuments();
      console.log(`📊 Count via modèle: ${countViaModel}`);
      
      if (countViaModel > 0) {
        const sampleViaModel = await Correspondance.findOne();
        console.log(`📄 Échantillon via modèle:`, {
          id: sampleViaModel._id,
          subject: sampleViaModel.subject,
          from: sampleViaModel.from_address,
          to: sampleViaModel.to_address,
          tags: sampleViaModel.tags
        });
      }
    } catch (error) {
      console.error(`❌ Erreur avec le modèle Correspondance:`, error.message);
    }

    // 4. Test direct avec la collection la plus probable
    console.log('\n4️⃣  TEST COLLECTION DIRECTE:');
    const probableCollection = collections.find(c => 
      c.name.toLowerCase().includes('correspond') || 
      c.name.toLowerCase().includes('email') ||
      c.name.toLowerCase().includes('message')
    );
    
    if (probableCollection) {
      console.log(`🎯 Collection probable: ${probableCollection.name}`);
      const directCount = await mongoose.connection.db.collection(probableCollection.name).countDocuments();
      console.log(`📊 Count direct: ${directCount}`);
      
      if (directCount > 0) {
        const directSample = await mongoose.connection.db.collection(probableCollection.name).findOne();
        console.log(`📄 Échantillon direct:`, JSON.stringify(directSample, null, 2).substring(0, 300) + '...');
      }
    }

    // 5. Vérifier les tags aussi
    console.log('\n5️⃣  VÉRIFICATION TAGS:');
    try {
      const Tag = require('../models/Tag');
      console.log(`🏷️  Nom de collection des tags: ${Tag.collection.name}`);
      
      const tagCount = await Tag.countDocuments();
      console.log(`📊 Count tags via modèle: ${tagCount}`);
      
      if (tagCount > 0) {
        const tags = await Tag.find({});
        console.log(`🏷️  Tags trouvés:`);
        tags.forEach((tag, index) => {
          console.log(`   ${index + 1}. "${tag.name}" (${tag.color})`);
        });
      }
    } catch (error) {
      console.error(`❌ Erreur avec le modèle Tag:`, error.message);
    }

    // 6. Informations de connexion
    console.log('\n6️⃣  INFORMATIONS CONNEXION:');
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    console.log(`🔢 Port: ${mongoose.connection.port}`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    console.log(`📊 ReadyState: ${mongoose.connection.readyState} (1=connected)`);

    console.log('\n💡 DIAGNOSTIC TERMINÉ');
    console.log('Si vous voyez 55 correspondances dans une collection mais 0 via le modèle,');
    console.log('il y a probablement un problème de nom de collection ou de schéma.');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Exécuter le diagnostic
console.log('🔍 DIAGNOSTIC APPROFONDI DE LA BASE DE DONNÉES\n');
deepDatabaseDiagnostic();
