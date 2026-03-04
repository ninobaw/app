const { Router } = require('express');
const Document = require('../models/Document.js');
const Correspondance = require('../models/Correspondance.js');
const ProcesVerbal = require('../models/ProcesVerbal.js');
const User = require('../models/User.js');
const ActivityLog = require('../models/ActivityLog.js');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const router = Router();

// Configuration Microsoft Graph API
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5173/auth/microsoft/callback';

// Microsoft Graph API endpoints
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';
const GRAPH_API_BETA = 'https://graph.microsoft.com/beta';

// Helper function to get Microsoft Graph access token
const getMicrosoftAccessToken = async (authCode) => {
  try {
    const tokenResponse = await axios.post(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code: authCode,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code',
      scope: 'https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Error getting Microsoft access token:', error.response?.data || error.message);
    throw new Error('Failed to get Microsoft access token');
  }
};

// Helper function to refresh Microsoft access token
const refreshMicrosoftToken = async (refreshToken) => {
  try {
    const tokenResponse = await axios.post(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return tokenResponse.data;
  } catch (error) {
    console.error('Error refreshing Microsoft token:', error.response?.data || error.message);
    throw new Error('Failed to refresh Microsoft token');
  }
};

// Helper function to upload file to OneDrive
const uploadFileToOneDrive = async (accessToken, filePath, fileName) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const uploadUrl = `${GRAPH_API_BASE}/me/drive/root:/${fileName}:/content`;
    
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file to OneDrive:', error.response?.data || error.message);
    throw new Error('Failed to upload file to OneDrive');
  }
};

// Helper function to get Office 365 edit URL
const getOffice365EditUrl = (driveItem, accessToken) => {
  const fileExtension = path.extname(driveItem.name).toLowerCase();
  let baseUrl = '';
  
  switch (fileExtension) {
    case '.docx':
    case '.doc':
      baseUrl = 'https://office.com/launch/word';
      break;
    case '.xlsx':
    case '.xls':
      baseUrl = 'https://office.com/launch/excel';
      break;
    case '.pptx':
    case '.ppt':
      baseUrl = 'https://office.com/launch/powerpoint';
      break;
    default:
      return driveItem.webUrl; // Fallback to web view
  }
  
  return `${baseUrl}?auth=2&from=SGDO&file=${encodeURIComponent(driveItem.webUrl)}`;
};

// Route pour obtenir l'URL d'authentification Microsoft
router.get('/auth-url', (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
    `client_id=${MICROSOFT_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent('https://graph.microsoft.com/Files.ReadWrite.All https://graph.microsoft.com/Sites.ReadWrite.All')}&` +
    `response_mode=query`;
  
  res.json({ authUrl });
});

// Route pour gérer le callback d'authentification
router.post('/auth-callback', async (req, res) => {
  const { code, userId } = req.body;
  
  if (!code || !userId) {
    return res.status(400).json({ message: 'Code d\'autorisation et ID utilisateur requis' });
  }
  
  try {
    const accessToken = await getMicrosoftAccessToken(code);
    
    // Stocker le token dans la base de données utilisateur (vous devrez adapter selon votre modèle)
    await User.findByIdAndUpdate(userId, {
      microsoftAccessToken: accessToken,
      microsoftTokenUpdatedAt: new Date()
    });
    
    res.json({ success: true, message: 'Authentification Microsoft réussie' });
  } catch (error) {
    console.error('Error in Microsoft auth callback:', error);
    res.status(500).json({ message: 'Erreur lors de l\'authentification Microsoft' });
  }
});

// Route pour créer/éditer un document avec Office 365
router.post('/editor', async (req, res) => {
  const { entityId, entityType, userId } = req.body;
  
  if (!entityId || !entityType || !userId) {
    return res.status(400).json({ message: 'Paramètres requis manquants pour l\'éditeur' });
  }
  
  let entity;
  let model;
  
  switch (entityType) {
    case 'document':
      model = Document;
      break;
    case 'correspondance':
      model = Correspondance;
      break;
    case 'proces-verbal':
      model = ProcesVerbal;
      break;
    default:
      return res.status(400).json({ message: 'Type d\'entité invalide' });
  }
  
  try {
    entity = await model.findById(entityId);
    if (!entity) {
      return res.status(404).json({ message: `${entityType} non trouvé` });
    }
    
    const user = await User.findById(userId);
    if (!user || !user.microsoftAccessToken) {
      return res.status(401).json({ message: 'Authentification Microsoft requise' });
    }
    
    let editUrl;
    let driveItem;
    
    if (entity.microsoftDriveItemId) {
      // Le fichier existe déjà sur OneDrive
      try {
        const driveResponse = await axios.get(`${GRAPH_API_BASE}/me/drive/items/${entity.microsoftDriveItemId}`, {
          headers: {
            'Authorization': `Bearer ${user.microsoftAccessToken}`
          }
        });
        driveItem = driveResponse.data;
        editUrl = getOffice365EditUrl(driveItem, user.microsoftAccessToken);
      } catch (error) {
        console.error('Error getting drive item:', error.response?.data || error.message);
        return res.status(500).json({ message: 'Erreur lors de l\'accès au fichier OneDrive' });
      }
    } else {
      // Uploader le fichier vers OneDrive
      if (!entity.filePath) {
        return res.status(400).json({ message: `${entityType} n'a pas de fichier associé` });
      }
      
      const localFilePath = path.join(__dirname, '../../uploads', entity.filePath);
      const fileName = `${entity.title || entity.subject || 'Document'}_${entity.id}${path.extname(entity.filePath)}`;
      
      try {
        driveItem = await uploadFileToOneDrive(user.microsoftAccessToken, localFilePath, fileName);
        
        // Sauvegarder l'ID OneDrive dans l'entité
        await model.findByIdAndUpdate(entityId, {
          microsoftDriveItemId: driveItem.id,
          microsoftWebUrl: driveItem.webUrl
        });
        
        editUrl = getOffice365EditUrl(driveItem, user.microsoftAccessToken);
      } catch (error) {
        console.error('Error uploading to OneDrive:', error);
        return res.status(500).json({ message: 'Erreur lors de l\'upload vers OneDrive' });
      }
    }
    
    // Log de l'activité
    await ActivityLog.create({
      _id: uuidv4(),
      action: `${entityType.toUpperCase()}_OPENED_OFFICE365`,
      details: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${entity.title || entity.subject || entity.id}" ouvert dans Office 365`,
      entityId: entity._id,
      entityType: entityType.toUpperCase(),
      userId: userId,
      timestamp: new Date(),
    });
    
    res.json({
      editUrl,
      driveItem: {
        id: driveItem.id,
        name: driveItem.name,
        webUrl: driveItem.webUrl,
        lastModifiedDateTime: driveItem.lastModifiedDateTime
      }
    });
    
  } catch (error) {
    console.error('Error in Microsoft Office editor:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la configuration de l\'éditeur' });
  }
});

// Route pour synchroniser les modifications depuis OneDrive
router.post('/sync', async (req, res) => {
  const { entityId, entityType, userId } = req.body;
  
  if (!entityId || !entityType || !userId) {
    return res.status(400).json({ message: 'Paramètres requis manquants pour la synchronisation' });
  }
  
  let entity;
  let model;
  
  switch (entityType) {
    case 'document':
      model = Document;
      break;
    case 'correspondance':
      model = Correspondance;
      break;
    case 'proces-verbal':
      model = ProcesVerbal;
      break;
    default:
      return res.status(400).json({ message: 'Type d\'entité invalide' });
  }
  
  try {
    entity = await model.findById(entityId);
    if (!entity || !entity.microsoftDriveItemId) {
      return res.status(404).json({ message: 'Entité ou fichier OneDrive non trouvé' });
    }
    
    const user = await User.findById(userId);
    if (!user || !user.microsoftAccessToken) {
      return res.status(401).json({ message: 'Authentification Microsoft requise' });
    }
    
    // Télécharger le fichier depuis OneDrive
    const downloadResponse = await axios.get(`${GRAPH_API_BASE}/me/drive/items/${entity.microsoftDriveItemId}/content`, {
      headers: {
        'Authorization': `Bearer ${user.microsoftAccessToken}`
      },
      responseType: 'stream'
    });
    
    // Sauvegarder le fichier localement
    const localFilePath = path.join(__dirname, '../../uploads', entity.filePath);
    const writer = fs.createWriteStream(localFilePath);
    downloadResponse.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    // Mettre à jour l'entité
    const updatedEntity = await model.findByIdAndUpdate(entityId, {
      $inc: { version: 1 },
      updatedAt: new Date(),
      lastSyncedAt: new Date()
    }, { new: true });
    
    // Log de l'activité
    await ActivityLog.create({
      _id: uuidv4(),
      action: `${entityType.toUpperCase()}_SYNCED_OFFICE365`,
      details: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${entity.title || entity.subject || entity.id}" synchronisé depuis Office 365. Version: ${updatedEntity.version}`,
      entityId: entity._id,
      entityType: entityType.toUpperCase(),
      userId: userId,
      timestamp: new Date(),
    });
    
    res.json({
      success: true,
      version: updatedEntity.version,
      lastSyncedAt: updatedEntity.lastSyncedAt
    });
    
  } catch (error) {
    console.error('Error syncing from OneDrive:', error);
    res.status(500).json({ message: 'Erreur lors de la synchronisation depuis OneDrive' });
  }
});

// Route pour vérifier le statut de l'authentification Microsoft
router.get('/auth-status/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const isAuthenticated = !!(user.microsoftAccessToken && user.microsoftTokenUpdatedAt);
    
    res.json({
      isAuthenticated,
      lastAuthenticatedAt: user.microsoftTokenUpdatedAt
    });
    
  } catch (error) {
    console.error('Error checking Microsoft auth status:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification du statut d\'authentification' });
  }
});

module.exports = router;
