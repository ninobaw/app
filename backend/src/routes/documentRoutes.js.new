const { Router } = require('express');
const { Document } = require('../models/Document');
const { User } = require('../models/User');
const { ActivityLog } = require('../models/ActivityLog');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const router = Router();

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

      // L'auteur a tous les droits
      if (document.author.toString() === req.user.id) {
        req.document = document;
        return next();
      }

      // Vérifier les permissions explicites
      const userPermission = document.permissions.find(p => 
        p.user.toString() === req.user.id
      );

      if (!userPermission) {
        return res.status(403).json({ 
          success: false,
          error: 'Accès non autorisé' 
        });
      }

      // Vérifier le niveau d'accès requis
      const permissionLevels = {
        view: 1,
        edit: 2,
        own: 3
      };

      if (permissionLevels[userPermission.role] < permissionLevels[requiredPermission]) {
        return res.status(403).json({ 
          success: false,
          error: 'Droits insuffisants' 
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
      isPublic = false,
      template
    } = req.body;
    
    // Validation des données
    if (!title || !type || !airport) {
      return res.status(400).json({ 
        success: false,
        error: 'Titre, type et aéroport sont obligatoires' 
      });
    }

    // Création du document
    const document = new Document({
      title,
      type,
      content: content || '',
      status,
      airport,
      metadata,
      isPublic,
      author: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      permissions: [{
        user: req.user.id,
        role: 'owner'
      }],
      template: template || null
    });

    await document.save();

    // Journalisation de l'action
    await ActivityLog.create({
      action: 'create',
      entityType: 'document',
      entityId: document._id,
      userId: req.user.id,
      metadata: {
        title: document.title,
        type: document.type,
        status: document.status
      }
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erreur lors de la création du document:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer tous les documents (avec pagination et filtres)
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type, 
      status, 
      airport,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      $or: [
        { author: req.user.id },
        { 'permissions.user': req.user.id },
        { isPublic: true }
      ]
    };

    // Filtres de recherche
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'metadata.reference': { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (airport) query.airport = airport;

    // Tri
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 100), // Limite maximale de 100 documents par page
      sort,
      populate: [
        { path: 'author', select: 'firstName lastName email' },
        { path: 'updatedBy', select: 'firstName lastName email' },
        { path: 'approvedBy', select: 'firstName lastName email' }
      ]
    };

    const result = await Document.paginate(query, options);
    
    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        totalPages: result.totalPages,
        currentPage: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la récupération des documents',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer un document par ID
router.get('/:id', authenticate, checkDocumentPermission('view'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('author', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }
    
    // Incrémenter le compteur de vues
    document.viewsCount = (document.viewsCount || 0) + 1;
    await document.save();
    
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
    const { title, type, content, status, airport, metadata } = req.body;
    const document = req.document;

    // Mise à jour des champs
    document.title = title || document.title;
    document.type = type || document.type;
    document.content = content || document.content;
    document.status = status || document.status;
    document.airport = airport || document.airport;
    document.metadata = { ...document.metadata, ...metadata };
    document.updatedBy = req.user.id;
    document.updatedAt = new Date();

    // Sauvegarder la version actuelle avant la mise à jour
    if (content && content !== document.content) {
      document.versions.push({
        versionNumber: document.currentVersion,
        content: document.content,
        updatedBy: document.updatedBy,
        updatedAt: document.updatedAt,
        metadata: document.metadata
      });
      document.currentVersion += 1;
    }

    await document.save();

    // Journalisation de l'action
    await ActivityLog.create({
      action: 'update',
      entityType: 'document',
      entityId: document._id,
      userId: req.user.id,
      metadata: {
        title: document.title,
        type: document.type,
        status: document.status,
        version: document.currentVersion
      }
    });

    res.json({
      success: true,
      data: document
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

// Supprimer un document (soft delete)
router.delete('/:id', authenticate, checkDocumentPermission('own'), async (req, res) => {
  try {
    const document = req.document;
    
    // Vérifier si le document est déjà supprimé
    if (document.deletedAt) {
      return res.status(400).json({
        success: false,
        error: 'Ce document a déjà été supprimé'
      });
    }
    
    // Soft delete
    document.deletedAt = new Date();
    document.deletedBy = req.user.id;
    document.status = 'ARCHIVED';
    
    // Sauvegarder la version actuelle avant suppression
    const version = {
      versionNumber: document.currentVersion,
      content: document.content,
      updatedBy: document.updatedBy,
      updatedAt: document.updatedAt,
      metadata: document.metadata
    };
    
    document.versions.push(version);
    await document.save();
    
    // Journalisation de l'action
    await ActivityLog.create({
      action: 'delete',
      entityType: 'document',
      entityId: document._id,
      userId: req.user.id,
      metadata: {
        title: document.title,
        type: document.type,
        version: document.currentVersion
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Document archivé avec succès',
      deletedAt: document.deletedAt
    });
  } catch (error) {
    console.error('Erreur lors de l\'archivage du document:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'archivage du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Restaurer un document archivé
router.post('/:id/restore', authenticate, checkDocumentPermission('own'), async (req, res) => {
  try {
    const document = req.document;
    
    if (!document.deletedAt) {
      return res.status(400).json({
        success: false,
        error: 'Ce document n\'est pas archivé'
      });
    }
    
    // Restaurer le document
    document.deletedAt = null;
    document.deletedBy = null;
    document.status = 'DRAFT';
    
    await document.save();
    
    // Journalisation de l'action
    await ActivityLog.create({
      action: 'restore',
      entityType: 'document',
      entityId: document._id,
      userId: req.user.id,
      metadata: {
        title: document.title,
        type: document.type
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Document restauré avec succès',
      restoredAt: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la restauration du document:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la restauration du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Partager un document avec d'autres utilisateurs
router.post('/:id/share', authenticate, checkDocumentPermission('edit'), async (req, res) => {
  try {
    const { userId, role } = req.body;
    const document = req.document;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà des permissions sur ce document
    const existingPermission = document.permissions.find(
      p => p.user.toString() === userId
    );

    if (existingPermission) {
      // Mettre à jour le rôle existant
      existingPermission.role = role;
    } else {
      // Ajouter une nouvelle permission
      document.permissions.push({
        user: userId,
        role
      });
    }

    await document.save();

    // Journalisation de l'action
    await ActivityLog.create({
      action: 'share',
      entityType: 'document',
      entityId: document._id,
      userId: req.user.id,
      metadata: {
        title: document.title,
        sharedWith: userId,
        role: role
      }
    });

    res.json({
      success: true,
      message: 'Document partagé avec succès',
      data: document.permissions
    });
  } catch (error) {
    console.error('Erreur lors du partage du document:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du partage du document',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Récupérer l'historique des versions d'un document
router.get('/:id/versions', authenticate, checkDocumentPermission('view'), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .select('versions title')
      .populate('versions.updatedBy', 'firstName lastName email');
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: document.versions.sort((a, b) => b.versionNumber - a.versionNumber)
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

// Restaurer une version précédente d'un document
router.post('/:id/restore-version/:versionNumber', authenticate, checkDocumentPermission('edit'), async (req, res) => {
  try {
    const { versionNumber } = req.params;
    const document = req.document;
    
    // Trouver la version à restaurer
    const versionToRestore = document.versions.find(
      v => v.versionNumber === parseInt(versionNumber, 10)
    );
    
    if (!versionToRestore) {
      return res.status(404).json({
        success: false,
        error: 'Version non trouvée'
      });
    }
    
    // Sauvegarder la version actuelle avant la restauration
    document.versions.push({
      versionNumber: document.currentVersion,
      content: document.content,
      updatedBy: document.updatedBy,
      updatedAt: document.updatedAt,
      metadata: document.metadata
    });
    
    // Restaurer la version
    document.content = versionToRestore.content;
    document.metadata = versionToRestore.metadata;
    document.updatedBy = req.user.id;
    document.updatedAt = new Date();
    document.currentVersion += 1;
    
    await document.save();
    
    // Journalisation de l'action
    await ActivityLog.create({
      action: 'restore_version',
      entityType: 'document',
      entityId: document._id,
      userId: req.user.id,
      metadata: {
        title: document.title,
        version: versionToRestore.versionNumber,
        restoredToVersion: document.currentVersion
      }
    });
    
    res.json({
      success: true,
      message: `Version ${versionNumber} restaurée avec succès`,
      data: document
    });
  } catch (error) {
    console.error('Erreur lors de la restauration de la version:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la restauration de la version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Exporter le routeur
module.exports = router;
