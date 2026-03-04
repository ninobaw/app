const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getFinalTargetDir, ensureDirectoryExists } = require('../utils/fileUtils.js'); // Import from new utility
const { auth } = require('../middleware/auth');

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
ensureDirectoryExists(uploadsDir);

// Define a temporary directory for initial Multer uploads
const tempUploadsDir = path.join(uploadsDir, 'temp');
ensureDirectoryExists(tempUploadsDir);

// Multer storage configuration for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Always save to the temporary directory first
    cb(null, tempUploadsDir);
  },
  filename: (req, file, cb) => {
    const { preserveOriginalName } = req.body;
    
    if (preserveOriginalName === 'true') {
      // Préserver le nom original sans modification
      cb(null, file.originalname);
    } else {
      // Comportement par défaut avec suffixe unique
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalNameWithoutExt = path.parse(file.originalname).name;
      const extension = path.extname(file.originalname);
      const newFileName = `${originalNameWithoutExt}-${uniqueSuffix}${extension}`;
      cb(null, newFileName);
    }
  }
});

const upload = multer({ storage: storage });

// POST /api/uploads/file - Upload a single file and move it to final destination
router.post('/file', upload.single('file'), (req, res) => {
  console.log('🔥 === REQUÊTE UPLOAD REÇUE ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('req.file (after multer processing):', req.file);
  console.log('req.body (after multer processing):', req.body);
  console.log('req.headers:', req.headers);
  
  try {

  const { documentType, scopeCode, departmentCode, correspondenceType, correspondanceId, type } = req.body;

  console.log('DEBUG PARAMS: documentType:', documentType);
  console.log('DEBUG PARAMS: scopeCode:', scopeCode);
  console.log('DEBUG PARAMS: correspondanceId:', correspondanceId);
  console.log('DEBUG PARAMS: type:', type);

  if (!req.file) {
    console.error('Aucun fichier uploadé.');
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const originalTempPath = req.file.path;
  const fileName = req.file.filename;

  // ✅ CORRECTION : Gérer différents types d'upload
  let finalTargetDir;
  
  if (type === 'response' && correspondanceId) {
    // Upload pour attachement de réponse/draft
    finalTargetDir = path.join(uploadsDir, 'drafts', correspondanceId);
    console.log('📎 Upload pour draft/réponse, dossier:', finalTargetDir);
  } else if (documentType === 'profiles') {
    // Upload pour photos de profil
    finalTargetDir = path.join(uploadsDir, 'profiles');
    console.log('👤 Upload pour photo de profil, dossier:', finalTargetDir);
  } else if (documentType && scopeCode && correspondenceType) {
    // Upload pour correspondance générale
    finalTargetDir = getFinalTargetDir(uploadsDir, documentType, scopeCode, departmentCode, correspondenceType);
    console.log('📧 Upload pour correspondance, dossier:', finalTargetDir);
  } else {
    // Dossier par défaut
    finalTargetDir = path.join(uploadsDir, 'general');
    console.log('📁 Upload général, dossier:', finalTargetDir);
  }

  // Ensure the final target directory exists
  ensureDirectoryExists(finalTargetDir);
  console.log(`Dossier cible final créé ou vérifié: ${finalTargetDir}`);

  const finalFilePath = path.join(finalTargetDir, fileName);

  // Move the file from temporary to final destination
  fs.rename(originalTempPath, finalFilePath, (err) => {
    if (err) {
      console.error('Erreur lors du déplacement du fichier:', err);
      return res.status(500).json({ message: 'Failed to move file to final destination.' });
    }

    const relativePath = path.relative(uploadsDir, finalFilePath).replace(/\\/g, '/'); // Convertir les backslashes en slashes pour les URLs
    console.log(`Fichier déplacé vers: ${relativePath}`);
    res.status(200).json({
      message: 'File uploaded and moved successfully',
      fileName: fileName, // Send back new unique filename
      filePath: relativePath, // e.g., 'correspondances/MONASTIR/Arrivee/rapport-12345.pdf'
      fileUrl: `/uploads/${relativePath}` // URL to access file
    });
  });
  
  } catch (error) {
    console.error('❌ [Upload] Erreur dans la route upload:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'upload',
      error: error.message
    });
  }
});

// POST /api/uploads/template - Upload a template file
router.post('/template', upload.single('templateFile'), (req, res) => {
  console.log('Requête POST /api/uploads/template reçue.');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);

  if (!req.file) {
    console.error('Aucun fichier modèle uploadé.');
    return res.status(400).json({ message: 'No template file uploaded.' });
  }
  // Templates are always stored directly under 'uploads/templates'
  const finalTargetDir = getFinalTargetDir(uploadsDir, 'templates', null, null, null);
  ensureDirectoryExists(finalTargetDir); // Ensure templates folder exists

  const originalTempPath = req.file.path;
  const fileName = req.file.filename;
  const finalFilePath = path.join(finalTargetDir, fileName);

  fs.rename(originalTempPath, finalFilePath, (err) => {
    if (err) {
      console.error('Erreur lors du déplacement du fichier modèle:', err);
      return res.status(500).json({ message: 'Failed to move template file.' });
    }
    const relativePath = path.relative(uploadsDir, finalFilePath).replace(/\\/g, '/'); // Convertir les backslashes en slashes pour les URLs
    console.log(`Fichier modèle déplacé vers: ${relativePath}`);
    res.status(200).json({
      message: 'Template uploaded successfully',
      fileName: fileName,
      filePath: relativePath,
      fileUrl: `/uploads/${relativePath}`
    });
  });
});

// POST /api/uploads/copy-template - Copy a template file to a new document file
router.post('/copy-template', (req, res) => {
  const { templateFilePath, documentType, scopeCode, departmentCode } = req.body; // Added scopeCode, departmentCode
  console.log('Requête POST /api/uploads/copy-template reçue.');
  console.log('templateFilePath:', templateFilePath, 'documentType:', documentType, 'scopeCode:', scopeCode, 'departmentCode:', departmentCode);

  if (!templateFilePath || !documentType || !scopeCode || !departmentCode) {
    console.error('Chemin du fichier modèle, type de document, scope ou département manquant pour la copie.');
    return res.status(400).json({ message: 'Template file path, document type, scope, and department are required.' });
  }

  const sourcePath = path.join(uploadsDir, templateFilePath);
  // Determine target directory using the helper, assuming it's not a correspondence
  const targetDir = getFinalTargetDir(uploadsDir, documentType, scopeCode, departmentCode, null); // Pass null for correspondenceType

  if (!fs.existsSync(sourcePath)) {
    console.error(`Fichier modèle source non trouvé: ${sourcePath}`);
    return res.status(404).json({ message: 'Template file not found.' });
  }
  ensureDirectoryExists(targetDir); // Create recursively
  console.log(`Dossier cible pour la copie créé: ${targetDir}`);

  const fileName = path.basename(sourcePath);
  const newFileName = `${uuidv4()}-${fileName}`; // Ensure unique name for the copy
  const destinationPath = path.join(targetDir, newFileName);

  fs.copyFile(sourcePath, destinationPath, (err) => {
    if (err) {
      console.error('Erreur lors de la copie du fichier modèle:', err);
      return res.status(500).json({ message: 'Failed to copy template file.' });
    }
    const relativePath = path.relative(uploadsDir, destinationPath).replace(/\\/g, '/'); // Convertir les backslashes en slashes pour les URLs
    console.log(`Modèle copié vers: ${relativePath}`);
    res.status(200).json({
      message: 'Template copied successfully',
      filePath: relativePath,
      fileUrl: `/uploads/${relativePath}`
    });
  });
});

// POST /api/uploads/copy-file - Copy an arbitrary file from one location to another within uploads
router.post('/copy-file', async (req, res) => {
  const { sourceFilePath, destinationDirectory } = req.body;
  console.log('Requête POST /api/uploads/copy-file reçue.');
  console.log('sourceFilePath:', sourceFilePath, 'destinationDirectory:', destinationDirectory);

  if (!sourceFilePath || !destinationDirectory) {
    console.error('Chemin du fichier source ou répertoire de destination manquant pour la copie.');
    return res.status(400).json({ message: 'Source file path and destination directory are required.' });
  }

  const fullSourcePath = path.join(uploadsDir, sourceFilePath);
  const fullDestinationDir = path.join(uploadsDir, destinationDirectory);

  if (!fs.existsSync(fullSourcePath)) {
    console.error(`Fichier source non trouvé: ${fullSourcePath}`);
    return res.status(404).json({ message: 'Source file not found.' });
  }

  try {
    ensureDirectoryExists(fullDestinationDir); // Ensure destination directory exists
    console.log(`Dossier de destination créé ou vérifié: ${fullDestinationDir}`);

    const fileName = path.basename(fullSourcePath);
    const newFileName = `${uuidv4()}-${fileName}`; // Generate a unique name for the copied file
    const finalDestinationPath = path.join(fullDestinationDir, newFileName);

    await fs.promises.copyFile(fullSourcePath, finalDestinationPath);
    const relativePath = path.relative(uploadsDir, finalDestinationPath);
    console.log(`Fichier copié vers: ${relativePath}`);

    res.status(200).json({
      message: 'File copied successfully',
      filePath: relativePath,
      fileUrl: `/uploads/${relativePath}`
    });
  } catch (err) {
    console.error('Erreur lors de la copie du fichier:', err);
    res.status(500).json({ message: 'Failed to copy file.' });
  }
});


// DELETE /api/uploads/file - Delete a file
router.delete('/file', (req, res) => {
  const { filePath } = req.body; // Expecting relative path, e.g., 'correspondances/MONASTIR/Arrivee/file-123.pdf'
  console.log('🗑️ [UploadRoutes] Requête DELETE /api/uploads/file reçue pour:', filePath);

  if (!filePath) {
    console.error('❌ [UploadRoutes] Chemin du fichier manquant pour la suppression.');
    return res.status(400).json({ message: 'File path is required.' });
  }

  const fullPath = path.join(uploadsDir, filePath);
  console.log('🗑️ [UploadRoutes] Chemin complet du fichier:', fullPath);
  console.log('🗑️ [UploadRoutes] Vérification de l\'existence du fichier...');

  // Vérifier si le fichier existe avant de tenter de le supprimer
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ [UploadRoutes] Fichier non trouvé pour suppression (peut-être déjà supprimé): ${fullPath}`);
    console.warn(`⚠️ [UploadRoutes] Contenu du dossier ${path.dirname(fullPath)}:`);
    try {
      const files = fs.readdirSync(path.dirname(fullPath));
      console.warn(`⚠️ [UploadRoutes] Fichiers trouvés:`, files);
    } catch (err) {
      console.warn(`⚠️ [UploadRoutes] Impossible de lire le dossier:`, err.message);
    }
    return res.status(404).json({ message: 'File not found.' });
  }

  console.log('✅ [UploadRoutes] Fichier trouvé, tentative de suppression...');

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error('❌ [UploadRoutes] Erreur lors de la suppression du fichier:', err);
      console.error('❌ [UploadRoutes] Code d\'erreur:', err.code);
      console.error('❌ [UploadRoutes] Message d\'erreur:', err.message);
      return res.status(500).json({ message: 'Failed to delete file.' });
    }
    console.log(`✅ [UploadRoutes] Fichier supprimé avec succès: ${fullPath}`);
    res.status(200).json({ message: 'File deleted successfully.' });
  });
});

// Route pour télécharger un fichier
router.get('/download/:filePath(*)', auth, (req, res) => {
  try {
    const filePath = decodeURIComponent(req.params.filePath);
    const fullPath = path.join(uploadsDir, filePath);
    
    console.log(`Tentative de téléchargement: ${fullPath}`);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(fullPath)) {
      console.log(`Fichier non trouvé: ${fullPath}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Fichier non trouvé' 
      });
    }
    
    // Vérifier que le chemin est dans le répertoire uploads (sécurité)
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.log(`Tentative d'accès non autorisé: ${resolvedPath}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }
    
    // Obtenir le nom du fichier pour l'en-tête
    const fileName = path.basename(fullPath);
    
    // Définir les en-têtes appropriés
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Envoyer le fichier
    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error(`Erreur lors de l'envoi du fichier: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du téléchargement' 
          });
        }
      } else {
        console.log(`Fichier téléchargé avec succès: ${fileName}`);
      }
    });
    
  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors du téléchargement' 
    });
  }
});

module.exports = router;