const { Router } = require('express');
const DocumentCodeConfig = require('../models/DocumentCodeConfig.js'); // Changed to require with .js extension
const { v4: uuidv4 } = require('uuid'); // uuid is a CommonJS module, no change needed here

const router = Router();

// GET /api/document-code-config
router.get('/', async (req, res) => {
  try {
    let config = await DocumentCodeConfig.findOne({});

    if (!config) {
      // If no config exists, create a default one
      const defaultId = uuidv4();
      config = new DocumentCodeConfig({
        _id: defaultId,
        documentTypes: [
          { code: 'FM', label: 'Formulaire' },
          { code: 'CR', label: 'Correspondance' },
          { code: 'PV', label: 'Procès-Verbal' },
          { code: 'PQ', label: 'Procédure Qualité' },
          { code: 'MN', label: 'Manuel' },
          { code: 'RG', label: 'Règlement' },
        ],
        departments: [
          { code: 'QMS', label: 'Qualité' },
          { code: 'OPS', label: 'Opérations' },
          { code: 'SEC', label: 'Sécurité' },
          { code: 'RH', label: 'Ressources Humaines' },
          { code: 'FIN', label: 'Finance' },
        ],
        subDepartments: [
          { code: 'CR', label: 'Relations Clientèle' },
          { code: 'MAINT', label: 'Maintenance' },
          { code: 'ENV', label: 'Environnement' },
          { code: 'IT', label: 'Informatique' },
        ],
        languages: [
          { code: 'AR', label: 'Arabe' },
          { code: 'FR', label: 'Français' },
          { code: 'EN', label: 'Anglais' },
        ],
        scopes: [
          { code: 'GEN', label: 'Général' },
          { code: 'NBE', label: 'Enfidha' },
          { code: 'MIR', label: 'Monastir' },
        ],
        sequenceCounters: new Map(),
      });
      await config.save();
    }

    res.json({
      ...config.toObject(),
      id: config._id,
    });
  } catch (error) {
    console.error('Error fetching document code config:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/document-code-config (for updating the single config document)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const config = await DocumentCodeConfig.findByIdAndUpdate(id, updates, { new: true });
    if (!config) {
      return res.status(404).json({ message: 'Document code config not found' });
    }
    res.json({
      ...config.toObject(),
      id: config._id,
    });
  } catch (error) {
    console.error('Error updating document code config:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;