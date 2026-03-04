require('dotenv').config();
const mongoose = require('mongoose');
const Correspondance = require('./src/models/Correspondance');

async function testCodeLibre() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sgdo');
    console.log('✅ Connecté à MongoDB');

    // Test de création avec code libre
    const testCorrespondance = new Correspondance({
      title: 'Test Code Libre',
      type: 'INCOMING',
      from_address: 'test@example.com',
      to_address: 'dest@example.com',
      subject: 'Test de code libre',
      content: 'Contenu de test',
      priority: 'MEDIUM',
      status: 'PENDING',
      airport: 'ENFIDHA',
      code: 'TEST-CODE-LIBRE-123', // Code libre
      authorId: '507f1f77bcf86cd799439011' // ID factice
    });

    const saved = await testCorrespondance.save();
    console.log('✅ Correspondance créée avec code libre:', saved.code);
    console.log('ID:', saved._id);

    // Nettoyer
    await Correspondance.deleteOne({ _id: saved._id });
    console.log('✅ Test nettoyé');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  }
}

testCodeLibre();
