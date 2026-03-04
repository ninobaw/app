const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const connectDB = require('./db.js');
const authRoutes = require('./routes/authRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const documentRoutes = require('./routes/documentRoutes.js');
const formulaireRoutes = require('./routes/formulaireRoutes.js');
const actionRoutes = require('./routes/actionRoutes.js');
const correspondanceRoutes = require('./routes/correspondanceRoutes.js');
const responseDraftRoutes = require('./routes/responseDraftRoutes.js');
const procesVerbalRoutes = require('./routes/procesVerbalRoutes.js');
const reportRoutes = require('./routes/reportRoutes.js');
const { router: notificationRouter } = require('./routes/notificationRoutes.js');
const { auth } = require('./middleware/auth.js');
const appSettingsRoutes = require('./routes/appSettingsRoutes.js');
const activityLogRoutes = require('./routes/activityLogRoutes.js');
const documentCodeConfigRoutes = require('./routes/documentCodeConfigRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const directorRoutes = require('./routes/directorRoutes.js'); // Routes spécialisées directeurs
const directorGeneralRoutes = require('./routes/directorGeneralRoutes.js'); // Routes spécialisées directeur général
const directorWorkflowRoutes = require('./routes/directorWorkflowRoutes.js'); // Nouveau workflow directeur
const correspondanceWorkflowRoutes = require('./routes/correspondanceWorkflowRoutes.js'); // Routes workflow correspondances
const supervisorRoutes = require('./routes/supervisorRoutes.js'); // Routes superviseur bureau d'ordre
const tagRoutes = require('./routes/tagRoutes.js'); // Routes pour les tags prédéfinis
const translationRoutes = require('./routes/translationRoutes.js'); // Routes pour la traduction Copilot
const temporaryAuthRoutes = require('./routes/temporaryAuthRoutes.js'); // Routes pour l'authentification temporaire
// OnlyOffice removed - using Collabora instead
const microsoftOfficeRoutes = require('./routes/microsoftOfficeRoutes.js');
const collaboraRoutes = require('./routes/collaboraRoutes.js');
const healthRoutes = require('./routes/healthRoutes.js'); // Import health routes
const fs = require('fs'); // Import fs to remove staging directory
const DeadlineScheduler = require('./jobs/deadlineScheduler'); // Import DeadlineScheduler

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json()); // Allows us to get data in req.body

// Configuration CORS universelle pour accepter tous les réseaux
const corsOptions = {
  origin: function (origin, callback) {
    // En développement, accepter toutes les origines sans restriction
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CORS] Accepting all origins in development: ${origin || 'no-origin'}`);
      return callback(null, true);
    }

    // En production, on vérifie les origines autorisées
    // On accepte les requêtes sans origine (applications mobiles, curl, etc.)
    if (!origin) {
      console.log('[CORS] Accepting request with no origin');
      return callback(null, true);
    }
    
    // Liste des origines autorisées pour la production
    const allowedOrigins = [
      // Localhost et 127.0.0.1
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      
      // Tous les réseaux privés (RFC 1918)
      /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,      // 192.168.0.0/16
      /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,       // 10.0.0.0/8
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/, // 172.16.0.0/12
      
      // Réseaux link-local
      /^https?:\/\/169\.254\.\d+\.\d+(:\d+)?$/,      // 169.254.0.0/16
      
      // Services de tunneling
      /\.ngrok\.io$/,
      /\.ngrok-free\.app$/,
      /\.localtunnel\.me$/,
      
      // Domaines de production (à personnaliser)
      /^https?:\/\/sgdo\.votredomaine\.com$/,
      /^https?:\/\/www\.sgdo\.votredomaine\.com$/
    ];

    // Vérifier si l'origine est autorisée
    const isAllowed = allowedOrigins.some(regex => origin.match(regex));
    
    if (isAllowed) {
      console.log(`[CORS] Allowed origin: ${origin}`);
      return callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'X-Auth-Token',
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Content-Range', 
    'X-Total-Count',
    'Content-Length',
    'ETag'
  ]
};

app.use(cors(corsOptions));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route de diagnostic pour les fichiers
app.get('/uploads/debug/:filename', async (req, res) => {
  const { filename } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`🔍 [Debug] Diagnostic pour: "${filename}"`);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const debugInfo = {
      filename: filename,
      searchPaths: [],
      foundFiles: [],
      similarFiles: []
    };
    
    // Fonction pour collecter les informations de debug
    const collectDebugInfo = (dir, level = 0) => {
      if (level > 4) return; // Limiter la profondeur
      
      try {
        debugInfo.searchPaths.push(dir);
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            collectDebugInfo(fullPath, level + 1);
          } else {
            // Vérifier correspondances exactes
            if (item === filename) {
              debugInfo.foundFiles.push({
                path: fullPath,
                match: 'exact',
                size: stat.size
              });
            }
            
            // Vérifier correspondances similaires
            if (item.includes(filename) || filename.includes(item)) {
              debugInfo.similarFiles.push({
                path: fullPath,
                filename: item,
                match: 'partial',
                size: stat.size
              });
            }
            
            // Même extension
            if (path.extname(item).toLowerCase() === path.extname(filename).toLowerCase() && path.extname(filename)) {
              debugInfo.similarFiles.push({
                path: fullPath,
                filename: item,
                match: 'extension',
                size: stat.size
              });
            }
          }
        });
      } catch (error) {
        console.log(`❌ [Debug] Erreur accès: ${dir}`);
      }
    };
    
    collectDebugInfo(uploadsDir);
    
    // Supprimer les doublons
    debugInfo.similarFiles = debugInfo.similarFiles.filter((file, index, self) => 
      index === self.findIndex(f => f.path === file.path)
    );
    
    console.log(`📊 [Debug] Résultats:`, {
      foundExact: debugInfo.foundFiles.length,
      foundSimilar: debugInfo.similarFiles.length,
      searchedPaths: debugInfo.searchPaths.length
    });
    
    res.json(debugInfo);
    
  } catch (error) {
    console.error('❌ [Debug] Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route spéciale pour les attachements de drafts/propositions
app.get('/uploads/drafts/:filename', async (req, res) => {
  const { filename } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`📎 [Draft Attachments] Recherche du fichier draft: "${filename}"`);
    
    // Chercher dans le dossier drafts
    const draftsDir = path.join(__dirname, '../uploads/drafts');
    let filePath = path.join(draftsDir, filename);
    
    // Si le fichier n'existe pas dans drafts, chercher dans uploads général
    if (!fs.existsSync(filePath)) {
      console.log(`🔍 [Draft Attachments] Fichier non trouvé dans drafts, recherche dans uploads...`);
      const uploadsDir = path.join(__dirname, '../uploads');
      filePath = path.join(uploadsDir, filename);
    }
    
    // Si toujours pas trouvé, utiliser la recherche récursive
    if (!fs.existsSync(filePath)) {
      console.log(`🔍 [Draft Attachments] Recherche récursive pour: "${filename}"`);
      
      const findFileRecursively = (dir, targetFilename) => {
        if (!fs.existsSync(dir)) return null;
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            const found = findFileRecursively(fullPath, targetFilename);
            if (found) return found;
          } else {
            if (item === targetFilename) {
              return fullPath;
            }
            
            // Correspondance partielle pour les noms de fichiers modifiés
            const cleanTarget = targetFilename.replace(/\s/g, '').toLowerCase();
            const cleanItem = item.replace(/\s/g, '').toLowerCase();
            if (cleanItem.includes(cleanTarget) || cleanTarget.includes(cleanItem)) {
              console.log(`🎯 [Draft Attachments] Correspondance partielle trouvée: ${item}`);
              return fullPath;
            }
          }
        }
        
        return null;
      };
      
      const uploadsDir = path.join(__dirname, '../uploads');
      filePath = findFileRecursively(uploadsDir, filename);
    }
    
    if (filePath && fs.existsSync(filePath)) {
      console.log(`✅ [Draft Attachments] Fichier trouvé: ${filePath}`);
      
      // Déterminer le type MIME
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.zip': 'application/zip'
      };
      
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      // Envoyer le fichier
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('X-File-Source', 'draft-attachments');
      res.sendFile(filePath);
    } else {
      console.log(`❌ [Draft Attachments] Fichier non trouvé: "${filename}"`);
      res.status(404).json({ 
        success: false, 
        message: `Fichier de proposition "${filename}" non trouvé`,
        searched_paths: [
          path.join(__dirname, '../uploads/drafts'),
          path.join(__dirname, '../uploads')
        ],
        suggestion: 'Le fichier pourrait avoir été supprimé ou renommé'
      });
    }
    
  } catch (error) {
    console.error('❌ [Draft Attachments] Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération du fichier de proposition' 
    });
  }
});

// Route spéciale pour résoudre les fichiers attachés des correspondances
app.get('/uploads/resolve/:filename', async (req, res) => {
  const { filename } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log(`🔍 [File Resolver] Recherche du fichier: "${filename}"`);
    
    // Fonction récursive pour chercher le fichier
    const findFileRecursively = (dir, targetFilename) => {
      if (!fs.existsSync(dir)) return null;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Recherche récursive dans les sous-dossiers
          const found = findFileRecursively(fullPath, targetFilename);
          if (found) return found;
        } else {
          // Vérifier si c'est le fichier recherché avec plusieurs stratégies
          
          // 1. Correspondance exacte
          if (item === targetFilename) {
            return fullPath;
          }
          
          // 2. Correspondance sans espaces
          const cleanTarget = targetFilename.replace(/\s/g, '');
          const cleanItem = item.replace(/\s/g, '');
          if (cleanItem === cleanTarget) {
            return fullPath;
          }
          
          // 3. Le fichier contient le nom recherché (pour les noms avec timestamp)
          if (item.includes(targetFilename)) {
            return fullPath;
          }
          
          // 4. Le nom recherché contient le nom du fichier (cas inverse)
          if (targetFilename.includes(item.replace(/\-\d+\-\d+\./g, '.'))) {
            return fullPath;
          }
          
          // 5. Correspondance par extension et partie du nom
          const targetExt = path.extname(targetFilename).toLowerCase();
          const itemExt = path.extname(item).toLowerCase();
          if (targetExt === itemExt && targetExt) {
            const targetBase = path.basename(targetFilename, targetExt);
            const itemBase = path.basename(item, itemExt);
            
            // Vérifier si les bases se ressemblent (sans les timestamps)
            const cleanTargetBase = targetBase.replace(/\-\d+\-\d+$/g, '').replace(/\s/g, '');
            const cleanItemBase = itemBase.replace(/\-\d+\-\d+$/g, '').replace(/\s/g, '');
            
            if (cleanItemBase.includes(cleanTargetBase) || cleanTargetBase.includes(cleanItemBase)) {
              return fullPath;
            }
            
            // 6. Correspondance approximative pour les noms longs (comme les IDs Facebook)
            if (targetBase.length > 15 && itemBase.length > 15) {
              // Extraire les parties numériques significatives
              const targetNumbers = targetBase.match(/\d{6,}/g) || [];
              const itemNumbers = itemBase.match(/\d{6,}/g) || [];
              
              // Si on trouve des correspondances dans les nombres longs
              for (const targetNum of targetNumbers) {
                for (const itemNum of itemNumbers) {
                  if (targetNum === itemNum || targetNum.includes(itemNum) || itemNum.includes(targetNum)) {
                    console.log(`🎯 [File Resolver] Correspondance numérique trouvée: ${targetNum} <-> ${itemNum}`);
                    return fullPath;
                  }
                }
              }
            }
          }
        }
      }
      
      return null;
    };
    
    // Chercher le fichier dans le dossier uploads
    const uploadsDir = path.join(__dirname, '../uploads');
    const foundPath = findFileRecursively(uploadsDir, filename);
    
    if (foundPath && fs.existsSync(foundPath)) {
      console.log(`✅ [File Resolver] Fichier trouvé: ${foundPath}`);
      
      // Déterminer le type MIME
      const ext = path.extname(foundPath).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
      
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      // Envoyer le fichier
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.sendFile(foundPath);
    } else {
      console.log(`❌ [File Resolver] Fichier non trouvé: "${filename}"`);
      
      // Essayer de trouver des fichiers similaires pour suggérer
      const similarFiles = [];
      const findSimilarFiles = (dir, level = 0) => {
        if (level > 3 || similarFiles.length >= 5) return;
        
        try {
          const items = fs.readdirSync(dir);
          items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              findSimilarFiles(fullPath, level + 1);
            } else {
              const targetExt = path.extname(filename).toLowerCase();
              const itemExt = path.extname(item).toLowerCase();
              
              if (targetExt === itemExt && targetExt) {
                // Recherche de correspondances partielles
                const targetBase = path.basename(filename, targetExt);
                const itemBase = path.basename(item, itemExt);
                
                if (targetBase.length > 10 && itemBase.length > 10) {
                  const targetNumbers = targetBase.match(/\d{6,}/g) || [];
                  const itemNumbers = itemBase.match(/\d{6,}/g) || [];
                  
                  for (const targetNum of targetNumbers) {
                    for (const itemNum of itemNumbers) {
                      if (targetNum.includes(itemNum) || itemNum.includes(targetNum)) {
                        similarFiles.push({
                          path: fullPath,
                          filename: item,
                          similarity: 'numeric_match'
                        });
                        return;
                      }
                    }
                  }
                }
              }
            }
          });
        } catch (error) {
          // Ignorer les erreurs d'accès
        }
      };
      
      findSimilarFiles(uploadsDir);
      
      // Si on trouve un fichier similaire, le servir à la place
      if (similarFiles.length > 0) {
        const bestMatch = similarFiles[0];
        console.log(`🔄 [File Resolver] Fichier similaire trouvé: ${bestMatch.filename}`);
        
        const ext = path.extname(bestMatch.path).toLowerCase();
        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        
        const mimeType = mimeTypes[ext] || 'application/octet-stream';
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('X-File-Resolved', bestMatch.filename);
        res.sendFile(bestMatch.path);
      } else {
        res.status(404).json({ 
          success: false, 
          message: `Fichier "${filename}" non trouvé`,
          searched_paths: uploadsDir,
          suggestion: 'Le fichier pourrait avoir été supprimé ou renommé'
        });
      }
    }
    
  } catch (error) {
    console.error('❌ [File Resolver] Erreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la résolution du fichier' 
    });
  }
});

// Configuration Swagger de base
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SGDO',
      version: '1.0.0',
      description: 'API pour la gestion des correspondances aéroportuaires',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Serveur local',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Route pour l'interface Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation - SGDO'
  })
);

console.log('Documentation Swagger disponible à /api-docs');

// Définition des routes API
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes); // Health check routes (pas d'authentification requise)
app.use('/api/temp-auth', temporaryAuthRoutes); // Routes pour l'authentification temporaire
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/formulaires', formulaireRoutes);
app.use('/api/correspondances', correspondanceRoutes);
app.use('/api/correspondances', responseDraftRoutes); // Routes pour les drafts de réponse
app.use('/api/correspondances/workflow', correspondanceWorkflowRoutes); // Routes workflow correspondances
app.use('/api/proces-verbaux', procesVerbalRoutes);
app.use('/api/activity-logs', activityLogRoutes);
// OnlyOffice routes removed - using Collabora instead
app.use('/api/microsoft-office', microsoftOfficeRoutes);
app.use('/api/collabora', collaboraRoutes);
app.use('/api/notifications', auth, notificationRouter);
app.use('/api/document-code-config', documentCodeConfigRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/directors', directorRoutes); // Routes spécialisées directeurs
app.use('/api/director-general', directorGeneralRoutes); // Routes spécialisées directeur général
app.use('/api/director-workflow', directorWorkflowRoutes); // Nouveau workflow directeur
app.use('/api/supervisor', supervisorRoutes); // Routes superviseur bureau d'ordre
app.use('/api/tags', tagRoutes); // Routes pour les tags prédéfinis
app.use('/api/deadline-types', require('./routes/deadlineTypeRoutes')); // Routes pour les types d'échéance
app.use('/api/translation', translationRoutes); // Routes pour la traduction Copilot
app.use('/api/settings', appSettingsRoutes);
app.use('/api/workflow', require('./routes/workflowRoutes')); // Routes workflow de correspondances
app.use('/api/enhanced-workflow', require('./routes/enhancedWorkflowRoutes')); // Routes workflow amélioré
app.use('/api/workflow-chat', require('./routes/workflowChatRoutes')); // Routes chat workflow
app.use('/api/reports', reportRoutes); // Routes pour les rapports

// Define a simple root route
app.get('/', (req, res) => {
  res.send('SGDO Backend API is running');
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Écouter sur toutes les interfaces réseau (IPv4 et IPv6)

// Démarrer le serveur
const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  const host = address.address === '::' ? 'localhost' : address.address;
  
  console.log('='.repeat(80));
  console.log(`Serveur démarré en mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`- API: http://${host}:${PORT}`);
  console.log(`- Documentation Swagger: http://${host}:${PORT}/api-docs`);
  console.log('='.repeat(80));
  
  // Démarrer le planificateur des échéances
  try {
    DeadlineScheduler.start();
    console.log(' [SERVER] Planificateur des échéances démarré');
  } catch (error) {
    console.error(' [SERVER] Erreur démarrage planificateur:', error);
  }
  
  // Afficher les informations de connexion réseau
  console.log('\nAccès réseau:');
  console.log(`- Depuis cette machine: http://localhost:${PORT}`);
  console.log(`- Depuis le réseau local: http://${getLocalIpAddress()}:${PORT}`);
  console.log('\nPour permettre aux autres appareils du réseau de se connecter:');
  console.log(`1. Assurez-vous que le pare-feu autorise les connexions entrantes sur le port ${PORT}`);
  console.log(`2. Donnez cette URL à vos collègues: http://${getLocalIpAddress()}:${PORT}`);
  console.log('\nAppuyez sur Ctrl+C pour arrêter le serveur\n');
});

// Gestion des erreurs
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nErreur: Le port ${PORT} est déjà utilisé.`);
    console.log('Solutions possibles:');
    console.log(`1. Attendez que l'autre processus libère le port`);
    console.log(`2. Changez le port dans le fichier .env (variable PORT)`);
    console.log(`3. Tuez le processus qui utilise le port avec: npx kill-port ${PORT}\n`);
  } else {
    console.error('Erreur du serveur:', error);
  }
  process.exit(1);
});

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', () => {
  console.log('\n [SERVER] Arrêt du serveur en cours...');
  
  // Arrêter le planificateur des échéances
  try {
    DeadlineScheduler.stop();
    console.log(' [SERVER] Planificateur des échéances arrêté');
  } catch (error) {
    console.error(' [SERVER] Erreur arrêt planificateur:', error);
  }
  
  // Fermer le serveur
  server.close(() => {
    console.log(' [SERVER] Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n [SERVER] Signal SIGTERM reçu, arrêt en cours...');
  
  // Arrêter le planificateur des échéances
  try {
    DeadlineScheduler.stop();
    console.log(' [SERVER] Planificateur des échéances arrêté');
  } catch (error) {
    console.error(' [SERVER] Erreur arrêt planificateur:', error);
  }
  
  // Fermer le serveur
  server.close(() => {
    console.log(' [SERVER] Serveur arrêté proprement');
    process.exit(0);
  });
});

// Fonction utilitaire pour obtenir l'adresse IP locale
function getLocalIpAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      const { address, family, internal } = iface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return 'localhost';
}

// Optional: Clean up the batch_import_staging directory on server start if it exists
// This is not strictly necessary as the directory won't be used anymore,
// but it ensures a clean state if it was created previously.
const BATCH_IMPORT_STAGING_DIR = path.join(__dirname, '../../uploads/batch_import_staging');
if (fs.existsSync(BATCH_IMPORT_STAGING_DIR)) {
  fs.rm(BATCH_IMPORT_STAGING_DIR, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error(`Error removing old batch_import_staging directory: ${err}`);
    } else {
      console.log(`Cleaned up old batch_import_staging directory: ${BATCH_IMPORT_STAGING_DIR}`);
    }
  });
}