const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { auth: authenticate } = require('../middleware/auth');

// Middleware pour vérifier les permissions
const checkDocumentPermission = (requiredPermission = 'view') => {
  return async (req, res, next) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ 
          success: false,
          error: 'Document non trouvé' 
        });
      }
      req.document = document;
      next();
    } catch (error) {
      console.error('Erreur de vérification des permissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// Créer un nouveau document
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      title, 
      type, 
      content, 
      status = 'DRAFT', 
      airport, 
      metadata = {},
      author_id, // Support frontend format
      // Support codification fields directly
      company_code,
      scope_code,
      department_code,
      sub_department_code,
      document_type_code,
      language_code
    } = req.body;
    
    // Map frontend data to backend schema
    const authorId = author_id || req.user.id;
    
    // Prepare metadata with proper field mapping
    const documentMetadata = {
      ...metadata,
      // Map snake_case to camelCase for backend
      companyCode: metadata.company_code || company_code,
      scopeCode: metadata.scope_code || scope_code,
      departmentCode: metadata.department_code || department_code,
      subDepartmentCode: metadata.sub_department_code || sub_department_code,
      documentTypeCode: metadata.document_type_code || document_type_code,
      languageCode: metadata.language_code || language_code
    };
    
    const document = new Document({
      title,
      type,
      content: content || '',
      status,
      airport,
      metadata: documentMetadata,
      author: authorId,
      createdBy: authorId,
      updatedBy: authorId
    });

    await document.save();

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer tous les documents
router.get('/', authenticate, async (req, res) => {
  try {
    const documents = await Document.find({})
      .populate('author', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
      
    res.json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer un document par ID
router.get('/:id', authenticate, checkDocumentPermission(), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('author', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
      
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mettre à jour un document
router.put('/:id', authenticate, checkDocumentPermission('edit'), async (req, res) => {
  try {
    const { title, type, content, status, airport, metadata, versionComment } = req.body;
    const document = req.document;

    // Sauvegarder l'état actuel avant modification pour le versioning
    const hasContentChanged = content && content !== document.content;
    const hasSignificantChanges = hasContentChanged || 
      (title && title !== document.title) || 
      (type && type !== document.type) ||
      (status && status !== document.status);

    // Créer une nouvelle version si le contenu ou des champs importants ont changé
    if (hasSignificantChanges) {
      // Ajouter la version actuelle à l'historique avant modification
      document.versions.push({
        number: document.currentVersion,
        content: document.content,
        title: document.title,
        status: document.status,
        comment: versionComment || 'Mise à jour automatique',
        updatedBy: document.updatedBy,
        updatedAt: document.updatedAt || document.createdAt
      });

      // Incrémenter le numéro de version
      document.currentVersion += 1;
    }

    // Mise à jour des champs
    if (title !== undefined) document.title = title;
    if (type !== undefined) document.type = type;
    if (content !== undefined) document.content = content;
    if (status !== undefined) document.status = status;
    if (airport !== undefined) document.airport = airport;
    
    // Mise à jour des métadonnées avec fusion intelligente
    if (metadata) {
      document.metadata = {
        ...document.metadata,
        ...metadata,
        // Mettre à jour automatiquement la date de révision si le contenu a changé
        ...(hasContentChanged && {
          lastRevisionDate: new Date(),
          revisionNumber: (document.metadata.revisionNumber || 0) + 1
        })
      };
    }
    
    // Mise à jour des champs système
    document.updatedBy = req.user.id;
    document.updatedAt = new Date();

    // Sauvegarder le document
    await document.save();

    // Populer les références pour la réponse
    await document.populate([
      { path: 'author', select: 'firstName lastName email' },
      { path: 'updatedBy', select: 'firstName lastName email' }
    ]);

    // Log de l'activité
    try {
      await ActivityLog.create({
        user: req.user.id,
        action: hasSignificantChanges ? 'DOCUMENT_VERSION_UPDATED' : 'DOCUMENT_UPDATED',
        resource: 'Document',
        resourceId: document._id,
        details: {
          documentTitle: document.title,
          version: document.currentVersion,
          hasContentChanged,
          fieldsUpdated: Object.keys(req.body).filter(key => key !== 'versionComment')
        },
        airport: document.airport
      });
    } catch (logError) {
      console.warn('Erreur lors de l\'enregistrement du log d\'activité:', logError);
    }

    res.json({
      success: true,
      data: {
        ...document.toObject(),
        versionIncremented: hasSignificantChanges,
        previousVersion: hasSignificantChanges ? document.currentVersion - 1 : null
      },
      message: hasSignificantChanges 
        ? `Document mis à jour avec succès. Nouvelle version: ${document.currentVersion}`
        : 'Document mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer l'historique des versions d'un document
router.get('/:id/versions', authenticate, checkDocumentPermission('view'), async (req, res) => {
  try {
    const document = req.document;
    const versions = document.getVersionHistory();

    res.json({
      success: true,
      data: {
        currentVersion: document.currentVersion,
        totalVersions: versions.length + 1, // +1 pour la version actuelle
        versions: versions
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des versions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des versions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Restaurer une version spécifique d'un document
router.post('/:id/versions/:versionNumber/restore', authenticate, checkDocumentPermission('edit'), async (req, res) => {
  try {
    const { versionNumber } = req.params;
    const { comment } = req.body;
    const document = req.document;

    // Restaurer la version
    document.revertToVersion(parseInt(versionNumber));
    document.updatedBy = req.user.id;
    document.updatedAt = new Date();

    // Ajouter un commentaire personnalisé si fourni
    if (comment && document.versions.length > 0) {
      document.versions[document.versions.length - 1].comment = comment;
    }

    await document.save();

    // Log de l'activité
    try {
      await ActivityLog.create({
        user: req.user.id,
        action: 'DOCUMENT_VERSION_RESTORED',
        resource: 'Document',
        resourceId: document._id,
        details: {
          documentTitle: document.title,
          restoredToVersion: parseInt(versionNumber),
          newVersion: document.currentVersion,
          comment: comment || `Restauration vers version ${versionNumber}`
        },
        airport: document.airport
      });
    } catch (logError) {
      console.warn('Erreur lors de l\'enregistrement du log d\'activité:', logError);
    }

    res.json({
      success: true,
      data: document,
      message: `Document restauré vers la version ${versionNumber}. Nouvelle version: ${document.currentVersion}`
    });
  } catch (error) {
    console.error('Erreur lors de la restauration de version:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la restauration de version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Comparer deux versions d'un document
router.get('/:id/versions/:version1/compare/:version2', authenticate, checkDocumentPermission('view'), async (req, res) => {
  try {
    const { version1, version2 } = req.params;
    const document = req.document;
    
    const v1 = parseInt(version1);
    const v2 = parseInt(version2);
    
    let versionData1, versionData2;
    
    // Récupérer les données de la première version
    if (v1 === document.currentVersion) {
      versionData1 = {
        number: document.currentVersion,
        content: document.content,
        title: document.title,
        status: document.status,
        updatedAt: document.updatedAt
      };
    } else {
      versionData1 = document.versions.find(v => v.number === v1);
    }
    
    // Récupérer les données de la deuxième version
    if (v2 === document.currentVersion) {
      versionData2 = {
        number: document.currentVersion,
        content: document.content,
        title: document.title,
        status: document.status,
        updatedAt: document.updatedAt
      };
    } else {
      versionData2 = document.versions.find(v => v.number === v2);
    }
    
    if (!versionData1 || !versionData2) {
      return res.status(404).json({
        success: false,
        error: 'Une ou plusieurs versions introuvables'
      });
    }

    res.json({
      success: true,
      data: {
        version1: versionData1,
        version2: versionData2,
        comparison: {
          titleChanged: versionData1.title !== versionData2.title,
          contentChanged: versionData1.content !== versionData2.content,
          statusChanged: versionData1.status !== versionData2.status
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la comparaison des versions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la comparaison des versions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Supprimer un document
router.delete('/:id', authenticate, checkDocumentPermission('own'), async (req, res) => {
  try {
    await req.document.remove();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
