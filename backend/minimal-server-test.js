const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Configuration MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/aerodoc';

const app = express();
app.use(cors());
app.use(express.json());

// Route de test simple
app.get('/test-workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    console.log(`🧪 Test workflow: ${workflowId}`);

    const db = mongoose.connection.db;
    const collection = db.collection('correspondenceworkflows');

    // Récupérer le workflow directement
    const workflow = await collection.findOne({ 
      _id: new mongoose.Types.ObjectId(workflowId) 
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow non trouvé'
      });
    }

    console.log(`✅ Workflow trouvé avec ${workflow.chatMessages?.length || 0} messages`);

    // Réponse simplifiée
    const response = {
      success: true,
      data: {
        workflowId: workflow._id,
        messagesCount: workflow.chatMessages?.length || 0,
        status: workflow.currentStatus,
        messages: workflow.chatMessages?.map((msg, index) => ({
          id: index,
          from: msg.from,
          to: msg.to,
          message: msg.message?.substring(0, 100),
          timestamp: msg.timestamp
        })) || []
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

async function startTestServer() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const PORT = 3002;
    app.listen(PORT, () => {
      console.log(`\n🚀 Serveur de test démarré sur http://localhost:${PORT}`);
      console.log('\n🧪 TESTS DISPONIBLES:');
      console.log(`   GET http://localhost:${PORT}/test-workflow/68e38183fe924f68937b23e7`);
      console.log('\n💡 Testez avec:');
      console.log(`   curl http://localhost:${PORT}/test-workflow/68e38183fe924f68937b23e7`);
      console.log('\n⏹️ Appuyez sur Ctrl+C pour arrêter');
    });

  } catch (error) {
    console.error('❌ Erreur démarrage:', error);
    process.exit(1);
  }
}

startTestServer();
