const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const { auth } = require('../middleware/auth');

// GET /api/tags - Obtenir tous les tags actifs (accessible à tous les utilisateurs connectés)
router.get('/', auth, async (req, res) => {
  try {
    const tags = await Tag.getActiveTags();
    const formattedTags = tags.map(tag => tag.toDisplay());
    
    res.json({
      success: true,
      data: formattedTags
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tags:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tags'
    });
  }
});

// GET /api/tags/all - Obtenir tous les tags (actifs et inactifs) - SUPER_ADMIN uniquement
router.get('/all', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SUPER_ADMIN ou ADMINISTRATOR
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les super administrateurs et administrateurs peuvent voir tous les tags.'
      });
    }

    const tags = await Tag.find({})
      .populate('createdBy', 'firstName lastName email')
      .sort({ name: 1 });
    
    // Formater les tags pour inclure l'ID correct
    const formattedTags = tags.map(tag => ({
      id: tag._id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isActive: tag.isActive,
      createdBy: tag.createdBy,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    }));
    
    res.json({
      success: true,
      data: formattedTags
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les tags:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tags'
    });
  }
});

// POST /api/tags - Créer un nouveau tag - SUPER_ADMIN uniquement
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /api/tags - Données reçues:', req.body);
    console.log('POST /api/tags - Utilisateur:', req.user);
    
    // Vérifier que l'utilisateur est SUPER_ADMIN ou ADMINISTRATOR
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMINISTRATOR') {
      console.log('POST /api/tags - Accès refusé, rôle:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les super administrateurs et administrateurs peuvent créer des tags.'
      });
    }

    const { name, color, description } = req.body;

    // Validation des données
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du tag est requis'
      });
    }

    // Vérifier si le tag existe déjà
    const existingTag = await Tag.findOne({ name: name.trim() });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Un tag avec ce nom existe déjà'
      });
    }

    const newTag = new Tag({
      name: name.trim(),
      color: color || '#3B82F6',
      description: description?.trim() || '',
      createdBy: req.user.id
    });

    await newTag.save();
    
    // Populer les informations du créateur pour la réponse
    await newTag.populate('createdBy', 'firstName lastName email');

    // Formater la réponse avec l'ID correct
    const formattedTag = {
      id: newTag._id,
      name: newTag.name,
      color: newTag.color,
      description: newTag.description,
      isActive: newTag.isActive,
      createdBy: newTag.createdBy,
      createdAt: newTag.createdAt,
      updatedAt: newTag.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Tag créé avec succès',
      data: formattedTag
    });
  } catch (error) {
    console.error('Erreur lors de la création du tag:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un tag avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du tag'
    });
  }
});

// PUT /api/tags/:id - Modifier un tag - SUPER_ADMIN uniquement
router.put('/:id', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SUPER_ADMIN ou ADMINISTRATOR
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les super administrateurs et administrateurs peuvent modifier des tags.'
      });
    }

    const { name, color, description, isActive } = req.body;
    const tagId = req.params.id;

    const tag = await Tag.findOne({ _id: tagId });
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag non trouvé'
      });
    }

    // Vérifier si le nouveau nom existe déjà (si changé)
    if (name && name.trim() !== tag.name) {
      const existingTag = await Tag.findOne({ name: name.trim(), _id: { $ne: tagId } });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: 'Un tag avec ce nom existe déjà'
        });
      }
    }

    // Mettre à jour les champs
    if (name) tag.name = name.trim();
    if (color) tag.color = color;
    if (description !== undefined) tag.description = description.trim();
    if (isActive !== undefined) tag.isActive = isActive;

    await tag.save();
    await tag.populate('createdBy', 'firstName lastName email');

    // Formater la réponse avec l'ID correct
    const formattedTag = {
      id: tag._id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isActive: tag.isActive,
      createdBy: tag.createdBy,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    };

    res.json({
      success: true,
      message: 'Tag modifié avec succès',
      data: formattedTag
    });
  } catch (error) {
    console.error('Erreur lors de la modification du tag:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un tag avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du tag'
    });
  }
});

// DELETE /api/tags/:id - Supprimer un tag définitivement - SUPER_ADMIN uniquement
router.delete('/:id', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SUPER_ADMIN ou ADMINISTRATOR
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les super administrateurs et administrateurs peuvent supprimer des tags.'
      });
    }

    const tagId = req.params.id;
    const tag = await Tag.findOne({ _id: tagId });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag non trouvé'
      });
    }

    // Vérifier si le tag est utilisé dans des correspondances
    const Correspondance = require('../models/Correspondance');
    const usageCount = await Correspondance.countDocuments({ 
      tags: { $in: [tag.name] } 
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce tag. Il est utilisé dans ${usageCount} correspondance(s). Désactivez-le plutôt.`,
        usageCount
      });
    }

    // Supprimer définitivement le tag s'il n'est pas utilisé
    await Tag.deleteOne({ _id: tagId });

    res.json({
      success: true,
      message: 'Tag supprimé définitivement avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du tag:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du tag'
    });
  }
});

// PATCH /api/tags/:id/toggle - Activer/Désactiver un tag - SUPER_ADMIN uniquement
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est SUPER_ADMIN ou ADMINISTRATOR
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les super administrateurs et administrateurs peuvent modifier des tags.'
      });
    }

    const tagId = req.params.id;
    const tag = await Tag.findOne({ _id: tagId });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag non trouvé'
      });
    }

    // Basculer le statut actif/inactif
    tag.isActive = !tag.isActive;
    await tag.save();
    await tag.populate('createdBy', 'firstName lastName email');

    // Formater la réponse avec l'ID correct
    const formattedTag = {
      id: tag._id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isActive: tag.isActive,
      createdBy: tag.createdBy,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt
    };

    res.json({
      success: true,
      message: `Tag ${tag.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: formattedTag
    });
  } catch (error) {
    console.error('Erreur lors de la modification du statut du tag:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification du tag'
    });
  }
});

module.exports = router;
