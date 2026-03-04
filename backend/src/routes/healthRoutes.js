// Endpoint de health check pour vérifier si le serveur est en ligne
const express = require('express');
const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatusMap[dbState] || 'unknown',
        connected: dbState === 1
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        external: Math.round(process.memoryUsage().heapExternal / 1024 / 1024) // MB
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Si la base de données n'est pas connectée, retourner un statut d'erreur
    if (dbState !== 1) {
      healthStatus.status = 'error';
      healthStatus.database.status = 'disconnected';
      return res.status(503).json(healthStatus);
    }

    res.json(healthStatus);
  } catch (error) {
    console.error('❌ [Health] Erreur lors du health check:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/ping - Ping simple (très léger)
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'pong'
  });
});

module.exports = router;
