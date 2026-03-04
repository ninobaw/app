const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Configuration Collabora Online
const COLLABORA_SERVER_URL = process.env.COLLABORA_SERVER_URL || 'https://collabora-online-demo.collaboraoffice.com';
const WOPI_SECRET = process.env.COLLABORA_WOPI_SECRET || 'demo-secret-key-2024';

/**
 * Génère un token WOPI sécurisé pour l'accès aux documents
 */
function generateWOPIToken(documentId, userId, permissions = 'edit') {
  const payload = {
    documentId,
    userId,
    permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 heures
  };
  
  return jwt.sign(payload, WOPI_SECRET);
}

/**
 * Vérifie et décode un token WOPI
 */
function verifyWOPIToken(token) {
  try {
    return jwt.verify(token, WOPI_SECRET);
  } catch (error) {
    throw new Error('Token WOPI invalide');
  }
}

/**
 * Détermine le type MIME basé sur l'extension du fichier
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
    '.doc': 'application/msword',
    '.xls': 'application/vnd.ms-excel',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pdf': 'application/pdf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Route pour obtenir l'URL d'édition Collabora Online
 * POST /api/collabora/edit/:documentId
 */
router.post('/editor', async (req, res) => {
  try {
    const { entityId: documentId, entityType, userId, userName, userEmail } = req.body;

    // Vérifier que le document existe
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Générer le token WOPI
    const wopiToken = generateWOPIToken(documentId, userId, 'edit');

    // Construire l'URL WOPI
    const wopiSrc = `${req.protocol}://${req.get('host')}/api/collabora/wopi/files/${documentId}`;
    
    // URL d'édition Collabora
    const collaboraUrl = `${COLLABORA_SERVER_URL}/browser/dist/loleaflet.html?WOPISrc=${encodeURIComponent(wopiSrc)}&access_token=${wopiToken}`;

    // Logger l'activité
    await ActivityLog.create({
      userId,
      action: 'DOCUMENT_OPENED_COLLABORA',
      details: {
        documentId,
        documentName: document.name,
        editor: 'Collabora Online'
      }
    });

    res.json({
      success: true,
      config: {
        documentType: 'word',
        document: {
          fileType: 'docx',
          key: document._id,
          title: document.title,
          url: wopiSrc
        },
        editorConfig: {
          mode: 'edit',
          user: {
            id: userId,
            name: userName || 'Utilisateur'
          }
        },
        wopiUrl: collaboraUrl,
        accessToken: wopiToken
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL Collabora:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * WOPI CheckFileInfo - Retourne les métadonnées du fichier
 * GET /api/collabora/wopi/files/:documentId
 */
router.get('/wopi/files/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { access_token } = req.query;

    // Vérifier le token WOPI
    const tokenData = verifyWOPIToken(access_token);
    
    if (tokenData.documentId !== documentId) {
      return res.status(403).json({ error: 'Token invalide pour ce document' });
    }

    // Récupérer le document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(tokenData.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier que le fichier existe
    const filePath = path.join(__dirname, '../../uploads', document.filePath);
    
    try {
      const stats = await fs.stat(filePath);
      
      // Réponse WOPI CheckFileInfo
      const checkFileInfo = {
        BaseFileName: document.name,
        Size: stats.size,
        UserId: user._id.toString(),
        UserFriendlyName: `${user.firstName} ${user.lastName}`,
        Version: document.version || '1.0',
        SupportsUpdate: true,
        SupportsLocks: true,
        UserCanWrite: tokenData.permissions === 'edit',
        UserCanNotWriteRelative: tokenData.permissions !== 'edit',
        OwnerId: document.uploadedBy?.toString() || user._id.toString(),
        LastModifiedTime: new Date(stats.mtime).toISOString(),
        SHA256: document.checksum || '',
        // Collabora Online specific properties
        EnableOwnerTermination: true,
        SupportsRename: false,
        SupportsUserInfo: true,
        PostMessageOrigin: req.get('origin') || '*'
      };

      res.json(checkFileInfo);

    } catch (fileError) {
      console.error('Erreur lors de l\'accès au fichier:', fileError);
      return res.status(404).json({ error: 'Fichier non trouvé sur le disque' });
    }

  } catch (error) {
    console.error('Erreur WOPI CheckFileInfo:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * WOPI GetFile - Retourne le contenu du fichier
 * GET /api/collabora/wopi/files/:documentId/contents
 */
router.get('/wopi/files/:documentId/contents', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { access_token } = req.query;

    // Vérifier le token WOPI
    const tokenData = verifyWOPIToken(access_token);
    
    if (tokenData.documentId !== documentId) {
      return res.status(403).json({ error: 'Token invalide pour ce document' });
    }

    // Récupérer le document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Chemin du fichier
    const filePath = path.join(__dirname, '../../uploads', document.filePath);

    try {
      const fileContent = await fs.readFile(filePath);
      
      // Définir les en-têtes appropriés
      res.setHeader('Content-Type', getMimeType(document.name));
      res.setHeader('Content-Length', fileContent.length);
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
      
      res.send(fileContent);

    } catch (fileError) {
      console.error('Erreur lors de la lecture du fichier:', fileError);
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

  } catch (error) {
    console.error('Erreur WOPI GetFile:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * WOPI PutFile - Sauvegarde le contenu du fichier modifié
 * POST /api/collabora/wopi/files/:documentId/contents
 */
router.post('/wopi/files/:documentId/contents', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { access_token } = req.query;

    // Vérifier le token WOPI
    const tokenData = verifyWOPIToken(access_token);
    
    if (tokenData.documentId !== documentId || tokenData.permissions !== 'edit') {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    // Récupérer le document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Chemin du fichier
    const filePath = path.join(__dirname, '../../uploads', document.filePath);

    try {
      // Sauvegarder le nouveau contenu
      await fs.writeFile(filePath, req.body);
      
      // Mettre à jour les métadonnées du document
      const stats = await fs.stat(filePath);
      await Document.findByIdAndUpdate(documentId, {
        size: stats.size,
        lastModified: new Date(),
        version: (parseFloat(document.version || '1.0') + 0.1).toFixed(1)
      });

      // Logger l'activité
      await ActivityLog.create({
        userId: tokenData.userId,
        action: 'DOCUMENT_SAVED_COLLABORA',
        details: {
          documentId,
          documentName: document.name,
          newSize: stats.size,
          editor: 'Collabora Online'
        }
      });

      res.json({ 
        success: true,
        message: 'Document sauvegardé avec succès',
        version: (parseFloat(document.version || '1.0') + 0.1).toFixed(1)
      });

    } catch (fileError) {
      console.error('Erreur lors de la sauvegarde:', fileError);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde du fichier' });
    }

  } catch (error) {
    console.error('Erreur WOPI PutFile:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * Route pour fermer une session d'édition
 * POST /api/collabora/close/:documentId
 */
router.post('/close/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { userId } = req.body;

    // Logger la fermeture
    await ActivityLog.create({
      userId,
      action: 'DOCUMENT_CLOSED_COLLABORA',
      details: {
        documentId,
        editor: 'Collabora Online'
      }
    });

    res.json({ success: true, message: 'Session fermée avec succès' });

  } catch (error) {
    console.error('Erreur lors de la fermeture:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * Route pour obtenir le statut du serveur Collabora Online
 * GET /api/collabora/status
 */
router.get('/status', async (req, res) => {
  try {
    const axios = require('axios');
    
    // Tester la connectivité avec Collabora Online
    const response = await axios.get(`${COLLABORA_SERVER_URL}/hosting/discovery`, {
      timeout: 5000
    });

    res.json({
      success: true,
      status: 'online',
      server: COLLABORA_SERVER_URL,
      discovery: response.status === 200
    });

  } catch (error) {
    console.error('Erreur de statut Collabora:', error);
    res.status(503).json({
      success: false,
      status: 'offline',
      server: COLLABORA_SERVER_URL,
      error: error.message
    });
  }
});

module.exports = router;
