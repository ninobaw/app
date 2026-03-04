const mongoose = require('mongoose');

async function checkReponcesTable() {
  try {
    await mongoose.connect('mongodb://localhost:27017/aerodoc');
    console.log('✅ Connecté à la base aerodoc\n');
    
    const db = mongoose.connection.db;
    
    console.log('📋 === ANALYSE TABLE RESPONSES ===\n');
    
    // 1. Vérifier si la collection existe
    const collections = await db.listCollections().toArray();
    const responsesCollection = collections.find(col => 
      col.name === 'responses'
    );
    
    if (!responsesCollection) {
      console.log('❌ Collection "responses" non trouvée');
      console.log('\n📋 Collections disponibles:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
      process.exit(1);
    }
    
    console.log(`📁 Collection trouvée: ${responsesCollection.name}`);
    
    // 2. Compter les documents
    const count = await db.collection(responsesCollection.name).countDocuments();
    console.log(`📊 Nombre d'enregistrements: ${count}\n`);
    
    // 3. Récupérer tous les documents
    const responses = await db.collection(responsesCollection.name).find({}).toArray();
    
    console.log('📄 === DÉTAILS DES ENREGISTREMENTS ===\n');
    
    responses.forEach((response, index) => {
      console.log(`🔍 Enregistrement ${index + 1}:`);
      console.log(`   - ID: ${response._id}`);
      
      // Afficher tous les champs disponibles
      Object.keys(response).forEach(key => {
        if (key !== '_id') {
          let value = response[key];
          
          // Formater l'affichage selon le type
          if (value instanceof Date) {
            value = value.toISOString();
          } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              value = `[Array: ${value.length} éléments]`;
            } else {
              value = `[Object: ${Object.keys(value).length} propriétés]`;
            }
          } else if (typeof value === 'string' && value.length > 100) {
            value = value.substring(0, 100) + '...';
          }
          
          console.log(`   - ${key}: ${value}`);
        }
      });
      
      console.log(''); // Ligne vide entre les enregistrements
    });
    
    // 4. Analyser la structure
    if (responses.length > 0) {
      console.log('🔧 === STRUCTURE DE LA TABLE ===\n');
      
      const firstRecord = responses[0];
      const fields = Object.keys(firstRecord);
      
      console.log(`📋 Champs disponibles (${fields.length}):`);
      fields.forEach(field => {
        const value = firstRecord[field];
        let type = typeof value;
        
        if (value instanceof Date) {
          type = 'Date';
        } else if (Array.isArray(value)) {
          type = `Array[${value.length}]`;
        } else if (value === null) {
          type = 'null';
        } else if (typeof value === 'object') {
          type = 'Object';
        }
        
        console.log(`   - ${field}: ${type}`);
      });
    }
    
    // 5. Rechercher des relations avec d'autres collections
    console.log('\n🔗 === RECHERCHE DE RELATIONS ===\n');
    
    // Vérifier si il y a des références vers correspondances
    const correspondances = await db.collection('correspondances').find({}).toArray();
    console.log(`📄 Correspondances dans la base: ${correspondances.length}`);
    
    // Vérifier si il y a des références vers workflows
    const workflows = await db.collection('correspondenceworkflows').find({}).toArray();
    console.log(`🔄 Workflows dans la base: ${workflows.length}`);
    
    // Vérifier si il y a des références vers users
    const users = await db.collection('users').find({}).toArray();
    console.log(`👥 Utilisateurs dans la base: ${users.length}`);
    
    console.log('\n🎯 === RÉSUMÉ ===');
    console.log(`📊 Table: ${responsesCollection.name}`);
    console.log(`📈 Enregistrements: ${count}`);
    console.log(`🔧 Champs: ${responses.length > 0 ? Object.keys(responses[0]).length : 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkReponcesTable();
