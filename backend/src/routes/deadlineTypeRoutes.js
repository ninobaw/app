const express = require('express');
const router = express.Router();
const DeadlineType = require('../models/DeadlineType');
const { auth, authorize } = require('../middleware/auth');

// GET /api/deadline-types - Obtenir tous les types d'échéance actifs
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 [DeadlineTypes] Récupération des types d\'échéance');
    
    const deadlineTypes = await DeadlineType.getActiveTypes();
    
    console.log(`✅ [DeadlineTypes] ${deadlineTypes.length} types d'échéance trouvés`);
    
    res.json({
      success: true,
      data: deadlineTypes.map(type => type.toDisplay())
    });
  } catch (error) {
    console.error('❌ [DeadlineTypes] Erreur récupération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des types d\'échéance',
      error: error.message
    });
  }
});

// GET /api/deadline-types/default - Obtenir le type d'échéance par défaut
router.get('/default', auth, async (req, res) => {
  try {
    console.log('🎯 [DeadlineTypes] Récupération du type par défaut');
    
    const defaultType = await DeadlineType.getDefaultType();
    
    if (!defaultType) {
      return res.status(404).json({
        success: false,
        message: 'Aucun type d\'échéance par défaut configuré'
      });
    }
    
    console.log(`✅ [DeadlineTypes] Type par défaut: ${defaultType.name}`);
    
    res.json({
      success: true,
      data: defaultType.toDisplay()
    });
  } catch (error) {
    console.error('❌ [DeadlineTypes] Erreur récupération type par défaut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du type par défaut',
      error: error.message
    });
  }
});

// POST /api/deadline-types - Créer un nouveau type d'échéance (Admin seulement)
router.post('/', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, label, color, days, priority, description, isDefault, order } = req.body;
    
    console.log('➕ [DeadlineTypes] Création nouveau type:', { name, label, days, priority });
    
    // Validation des données requises
    if (!name || !label || !days || !priority) {
      return res.status(400).json({
        success: false,
        message: 'Nom, libellé, nombre de jours et priorité sont requis'
      });
    }
    
    // Si ce type est défini comme défaut, retirer le défaut des autres
    if (isDefault) {
      await DeadlineType.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } }
      );
      console.log('🔄 [DeadlineTypes] Ancien type par défaut mis à jour');
    }
    
    const deadlineType = new DeadlineType({
      name: name.trim(),
      label: label.trim(),
      color: color || '#3B82F6',
      days: parseInt(days),
      priority,
      description: description?.trim(),
      isDefault: isDefault || false,
      order: order || 0,
      createdBy: req.user.id
    });
    
    await deadlineType.save();
    
    console.log(`✅ [DeadlineTypes] Type créé: ${deadlineType.name} (${deadlineType.days}j)`);
    
    res.status(201).json({
      success: true,
      message: 'Type d\'échéance créé avec succès',
      data: deadlineType.toDisplay()
    });
  } catch (error) {
    console.error('❌ [DeadlineTypes] Erreur création:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un type d\'échéance avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du type d\'échéance',
      error: error.message
    });
  }
});

// PUT /api/deadline-types/:id - Mettre à jour un type d'échéance (Admin seulement)
router.put('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, label, color, days, priority, description, isDefault, order, isActive } = req.body;
    
    console.log('📝 [DeadlineTypes] Mise à jour type:', id);
    
    const deadlineType = await DeadlineType.findById(id);
    if (!deadlineType) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'échéance non trouvé'
      });
    }
    
    // Si ce type est défini comme défaut, retirer le défaut des autres
    if (isDefault && !deadlineType.isDefault) {
      await DeadlineType.updateMany(
        { isDefault: true, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
      console.log('🔄 [DeadlineTypes] Ancien type par défaut mis à jour');
    }
    
    // Mise à jour des champs
    if (name !== undefined) deadlineType.name = name.trim();
    if (label !== undefined) deadlineType.label = label.trim();
    if (color !== undefined) deadlineType.color = color;
    if (days !== undefined) deadlineType.days = parseInt(days);
    if (priority !== undefined) deadlineType.priority = priority;
    if (description !== undefined) deadlineType.description = description?.trim();
    if (isDefault !== undefined) deadlineType.isDefault = isDefault;
    if (order !== undefined) deadlineType.order = order;
    if (isActive !== undefined) deadlineType.isActive = isActive;
    
    await deadlineType.save();
    
    console.log(`✅ [DeadlineTypes] Type mis à jour: ${deadlineType.name}`);
    
    res.json({
      success: true,
      message: 'Type d\'échéance mis à jour avec succès',
      data: deadlineType.toDisplay()
    });
  } catch (error) {
    console.error('❌ [DeadlineTypes] Erreur mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du type d\'échéance',
      error: error.message
    });
  }
});

// DELETE /api/deadline-types/:id - Supprimer un type d'échéance (Admin seulement)
router.delete('/:id', auth, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ [DeadlineTypes] Suppression type:', id);
    
    const deadlineType = await DeadlineType.findById(id);
    if (!deadlineType) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'échéance non trouvé'
      });
    }
    
    // Vérifier si ce type est utilisé dans des correspondances
    const Correspondance = require('../models/Correspondance');
    const usageCount = await Correspondance.countDocuments({ deadlineType: id });
    
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Ce type d'échéance est utilisé dans ${usageCount} correspondance(s) et ne peut pas être supprimé`
      });
    }
    
    await DeadlineType.findByIdAndDelete(id);
    
    console.log(`✅ [DeadlineTypes] Type supprimé: ${deadlineType.name}`);
    
    res.json({
      success: true,
      message: 'Type d\'échéance supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ [DeadlineTypes] Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du type d\'échéance',
      error: error.message
    });
  }
});

module.exports = router;
