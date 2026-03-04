const { Router } = require('express');
const Document = require('../models/Document.js'); // Import Document model
const Correspondance = require('../models/Correspondance.js'); // Import Correspondance model
const ProcesVerbal = require('../models/ProcesVerbal.js'); // Import ProcesVerbal model
const User = require('../models/User.js'); // Import User model
const ActivityLog = require('../models/ActivityLog.js'); // Import ActivityLog model
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Import axios for file download
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const router = Router();

// Configuration de base pour OnlyOffice Document Server
const ONLYOFFICE_DOC_SERVER_URL = process.env.ONLYOFFICE_DOC_SERVER_URL || 'http://localhost:8000';
const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || ''; // Your JWT secret

// Helper function to map file extension to OnlyOffice document type
const getOnlyOfficeDocumentType = (fileExtension) => {
  switch (fileExtension) {
    case 'docx':
    case 'doc':
    case 'odt':
    case 'rtf':
      return 'word';
    case 'xlsx':
    case 'xls':
    case 'ods':
    case 'csv':
      return 'cell';
    case 'pptx':
    case 'ppt':
    case 'odp':
      return 'slide';
    default:
      return null; // Or handle unsupported types
  }
};

// Middleware to verify JWT from OnlyOffice callbacks
const verifyOnlyOfficeJwt = (req, res, next) => {
  if (!ONLYOFFICE_JWT_SECRET) {
    console.warn('OnlyOffice JWT secret is not configured. Skipping JWT verification for callback.');
    return next();
  }

  const token = req.headers['authorization']?.split(' ')[1] || req.body.token; // Token can be in header or body
  if (!token) {
    console.error('OnlyOffice Callback: No JWT token provided.');
    return res.status(403).json({ error: 1, message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, ONLYOFFICE_JWT_SECRET);
    req.jwtPayload = decoded; // Store payload for later use
    next();
  } catch (err) {
    console.error('OnlyOffice Callback: JWT verification failed:', err.message);
    return res.status(403).json({ error: 1, message: 'Unauthorized: Invalid token' });
  }
};

// Endpoint pour obtenir la configuration de l'éditeur
router.post('/editor', async (req, res) => {
  const { entityId, entityType, userId, userName, userEmail } = req.body;

  if (!entityId || !entityType || !userId || !userName || !userEmail) {
    return res.status(400).json({ message: 'Missing required parameters for editor configuration.' });
  }

  let entity;
  let model;
  let redirectPath;

  switch (entityType) {
    case 'document':
      model = Document;
      redirectPath = '/documents';
      break;
    case 'correspondance':
      model = Correspondance;
      redirectPath = '/correspondances';
      break;
    case 'proces-verbal':
      model = ProcesVerbal;
      redirectPath = '/proces-verbaux';
      break;
    default:
      return res.status(400).json({ message: 'Invalid entity type provided.' });
  }

  try {
    entity = await model.findById(entityId);
    if (!entity) {
      return res.status(404).json({ message: `${entityType} not found.` });
    }

    // Check for file path using either file_path or filePath property
    const filePath = entity.file_path || entity.filePath;
    if (!filePath) {
      return res.status(400).json({ message: `${entityType} has no associated file for editing.` });
    }

    const documentFileUrl = `${process.env.FRONTEND_BASE_URL}/uploads/${filePath.replace(/\\/g, '/')}`;
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);
    const onlyOfficeDocType = getOnlyOfficeDocumentType(fileExtension);

    if (!onlyOfficeDocType) {
      return res.status(400).json({ message: `Unsupported file type for OnlyOffice editor: ${fileExtension}` });
    }

    // Construct a unique key that includes entityType and entityId
    const documentKey = `${entityType}-${entity.id}-${new Date(entity.updatedAt).getTime()}`;

    const editorConfig = {
      documentType: onlyOfficeDocType,
      document: {
        fileType: fileExtension,
        key: documentKey,
        title: entity.title || entity.subject || 'Document sans titre', // Use title for Document/ProcesVerbal, subject for Correspondance
        url: documentFileUrl,
        permissions: {
          edit: true,
          download: true,
          print: true,
          fillForms: true,
          review: true,
          comment: true,
        },
      },
      editorConfig: {
        callbackUrl: `${process.env.FRONTEND_BASE_URL}/api/onlyoffice/track`,
        lang: 'fr',
        mode: 'edit',
        user: {
          id: userId,
          name: userName,
          email: userEmail,
        },
        customization: {
          chat: false,
          autosave: true,
        },
      },
      apiScriptUrl: `${ONLYOFFICE_DOC_SERVER_URL}/web-apps/apps/api/documents/api.js`,
      editorUrl: ONLYOFFICE_DOC_SERVER_URL,
    };

    if (ONLYOFFICE_JWT_SECRET) {
      const token = jwt.sign(editorConfig, ONLYOFFICE_JWT_SECRET);
      res.json({ config: editorConfig, token: token });
    } else {
      res.json({ config: editorConfig });
    }

  } catch (error) {
    console.error('Error generating OnlyOffice editor config:', error);
    res.status(500).json({ message: 'Server error generating editor configuration.' });
  }
});

// Endpoint for document tracking (OnlyOffice Document Server sends updates here)
router.post('/track', verifyOnlyOfficeJwt, async (req, res) => {
  console.log('OnlyOffice: Track callback received.');
  console.log('OnlyOffice Callback Body:', JSON.stringify(req.body, null, 2));

  const { status, url, key, users } = req.body;

  if (status === 2 || status === 6) {
    console.log(`OnlyOffice: Processing status ${status} for document key: ${key}`);
    try {
      // Extract entityType and entityId from the key
      const keyParts = key.split('-');
      const entityType = keyParts[0]; // e.g., 'document', 'correspondance', 'proces-verbal'
      const entityId = keyParts.slice(1, keyParts.length - 1).join('-'); // Reconstruct UUID

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
          console.error(`OnlyOffice: Invalid entity type '${entityType}' extracted from key.`);
          return res.json({ error: 1, message: 'Invalid entity type' });
      }

      entity = await model.findById(entityId);

      if (!entity) {
        console.error(`OnlyOffice: Entity with ID ${entityId} and type ${entityType} not found for tracking.`);
        return res.json({ error: 1, message: 'Entity not found' });
      }

      if (!url) {
        console.error('OnlyOffice: No download URL provided in callback.');
        return res.json({ error: 1, message: 'No download URL' });
      }

      const uploadsDir = path.join(__dirname, '../../uploads');
      const filePath = entity.file_path || entity.filePath;
      const targetFilePath = path.join(uploadsDir, filePath);

      const targetDir = path.dirname(targetFilePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`OnlyOffice: Created target directory: ${targetDir}`);
      }

      console.log(`OnlyOffice: Attempting to download file from: ${url} to ${targetFilePath}`);
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: ONLYOFFICE_JWT_SECRET ? { 'Authorization': `Bearer ${jwt.sign({ fileKey: key }, ONLYOFFICE_JWT_SECRET)}` } : {}
      });

      const writer = fs.createWriteStream(targetFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`OnlyOffice: File successfully written to ${targetFilePath}`);
          resolve();
        });
        writer.on('error', (err) => {
          console.error(`OnlyOffice: Error writing file to ${targetFilePath}:`, err);
          reject(err);
        });
      });

      console.log(`OnlyOffice: Entity ${entity.title || entity.subject || entity.id} (ID: ${entityId}) saved to ${targetFilePath}`);

      const updates = {
        $inc: { version: 1 },
        updatedAt: new Date(),
      };

      // Only update status to ACTIVE if it's a Document and currently DRAFT
      if (entityType === 'document' && entity.status === 'DRAFT') {
        updates.status = 'ACTIVE';
        console.log(`OnlyOffice: Document status changed from DRAFT to ACTIVE for ${entity.title}`);
      }

      const updatedEntity = await model.findByIdAndUpdate(
        entityId,
        updates,
        { new: true }
      );

      if (updatedEntity) {
        console.log(`OnlyOffice: Entity DB entry updated. New version: ${updatedEntity.version}, New status: ${updatedEntity.status || 'N/A'}`);
      } else {
        console.error(`OnlyOffice: Failed to update entity DB entry for ID: ${entityId}`);
      }

      const editorUserId = users && users.length > 0 && users[0].id ? users[0].id : 'unknown_user';
      await ActivityLog.create({
        _id: uuidv4(),
        action: `${entityType.toUpperCase()}_UPDATED_ONLYOFFICE`,
        details: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${updatedEntity.title || updatedEntity.subject || updatedEntity.id}" (ID: ${updatedEntity.id}) modifié via OnlyOffice. Nouvelle version: ${updatedEntity.version}.`,
        entityId: updatedEntity._id,
        entityType: entityType.toUpperCase(),
        userId: editorUserId,
        timestamp: new Date(),
      });
      console.log('OnlyOffice: Activity log created.');

      res.json({ error: 0 });

    } catch (error) {
      console.error('OnlyOffice: Error processing track callback:', error);
      res.json({ error: 1, message: 'Internal server error during document save' });
    }
  } else {
    console.log(`OnlyOffice: Received status ${status} for document ${key}. No save action taken.`);
    res.json({ error: 0 });
  }
});

// Endpoint for document conversion (if you need to convert documents via OnlyOffice)
router.post('/convert', (req, res) => {
  console.log('OnlyOffice: Convert endpoint hit.');
  res.status(200).json({ message: 'OnlyOffice convert endpoint placeholder.' });
});

// Endpoint to get document info (used by OnlyOffice Document Server)
router.get('/document-info', (req, res) => {
  console.log('OnlyOffice: Document info endpoint hit.');
  res.status(200).json({ message: 'OnlyOffice document info endpoint placeholder.' });
});

module.exports = router;