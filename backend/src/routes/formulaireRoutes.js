const { Router } = require('express');
const Document = require('../models/Document.js'); // Changed to .js extension
const User = require('../models/User.js'); // Changed to .js extension
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET /api/formulaires - Fetch all documents of type FORMULAIRE_DOC
router.get('/', async (req, res) => {
  try {
    const formulaires = await Document.find({ type: 'FORMULAIRE_DOC' }).populate('authorId', 'firstName lastName');
    const formattedFormulaires = formulaires.map(doc => ({
      ...doc.toObject(),
      id: doc._id,
      author: doc.authorId ? {
        first_name: doc.authorId.firstName,
        last_name: doc.authorId.lastName,
      } : null,
    }));
    res.json(formattedFormulaires);
  } catch (error) {
    console.error('Error fetching formulaires:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/formulaires - Create a new document of type FORMULAIRE_DOC
router.post('/', async (req, res) => {
  const { title, content, code, airport, category, description, instructions, author_id } = req.body;

  if (!title || !airport || !author_id) {
    return res.status(400).json({ message: 'Missing required fields: title, airport, author_id' });
  }

  try {
    const newFormulaire = new Document({
      _id: uuidv4(),
      title,
      type: 'FORMULAIRE_DOC',
      content: JSON.stringify({ code, category, description, instructions }), // Store specific formulaire data in content
      authorId: author_id,
      airport,
      qrCode: `QR-${uuidv4()}`,
      version: 1,
      status: 'DRAFT',
      viewsCount: 0,
      downloadsCount: 0,
    });

    await newFormulaire.save();
    
    const populatedFormulaire = await newFormulaire.populate('authorId', 'firstName lastName');
    const formattedFormulaire = {
      ...populatedFormulaire.toObject(),
      id: populatedFormulaire._id,
      author: populatedFormulaire.authorId ? {
        first_name: populatedFormulaire.authorId.firstName,
        last_name: populatedFormulaire.authorId.lastName,
      } : null,
    };
    res.status(201).json(formattedFormulaire);
  } catch (error) {
    console.error('Error creating formulaire:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/formulaires/:id - Delete a document of type FORMULAIRE_DOC
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const formulaire = await Document.findOneAndDelete({ _id: id, type: 'FORMULAIRE_DOC' });
    if (!formulaire) {
      return res.status(404).json({ message: 'Formulaire not found or not of type FORMULAIRE_DOC' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting formulaire:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;