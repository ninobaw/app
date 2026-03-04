const { Router } = require('express');
const ProcesVerbal = require('../models/ProcesVerbal.js'); // Changed to require with .js extension
const { createNotification } = require('./notificationRoutes.js'); // Importation de la fonction centralisée
const User = require('../models/User.js'); // Importation de User pour les notifications
const { generateCodeAndSequence, generateSimpleQRCode } = require('../utils/codeGenerator.js'); // Import new code generator
const { v4: uuidv4 } = require('uuid'); // uuid is a CommonJS module, no change needed here

const router = Router();

// La fonction createNotification est maintenant importée depuis notificationRoutes.js
// Elle n'est plus définie ici pour éviter la duplication et assurer l'envoi d'emails.

// GET /api/proces-verbaux
router.get('/', async (req, res) => {
  try {
    const procesVerbaux = await ProcesVerbal.find({})
      .populate('authorId', 'firstName lastName'); // Populate author details directly
    
    const formattedProcesVerbaux = procesVerbaux.map(pv => ({
      ...pv.toObject(),
      id: pv._id,
      author: pv.authorId ? { // Map authorId to author for frontend
        first_name: pv.authorId.firstName,
        last_name: pv.authorId.lastName,
      } : null,
      actions_decidees: pv.actionsDecidees,
      qr_code: pv.qrCode, // Include qr_code
      file_path: pv.filePath, // Include file_path
      file_type: pv.fileType, // Include file_type
      version: pv.version, // Include version
      views_count: pv.viewsCount, // Include views_count
      downloads_count: pv.downloadsCount, // Include downloads_count
    }));
    res.json(formattedProcesVerbaux);
  } catch (error) {
    console.error('Error fetching proces verbaux:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/proces-verbaux
router.post('/', async (req, res) => {
  const { 
    title, meeting_date, participants, agenda, decisions, location, meeting_type, airport, 
    next_meeting_date, actions_decidees, author_id, file_path, file_type,
    company_code, scope_code, department_code, sub_department_code, language_code
  } = req.body;

  if (!title || !meeting_date || !participants || !agenda || !decisions || !location || !meeting_type || !airport || !author_id) {
    return res.status(400).json({ message: 'Missing required fields for proces verbal' });
  }

  try {
    const newProcesVerbalId = uuidv4(); // Generate ID first to use in QR code URL

    let qrCodeValue;
    let sequence_number = null;

    // If codification fields are provided, generate a structured code and QR
    if (company_code && scope_code && department_code && language_code) {
      const { generatedCode: newGeneratedCode, sequence_number: newSequenceNumber } = await generateCodeAndSequence(
        'PROCES_VERBAL', // Entity type for PV
        company_code,
        scope_code,
        department_code,
        sub_department_code,
        null, // document_type_code is null for PVs
        'PV', // Use 'PV' as type code for PVs
        language_code
      );
      qrCodeValue = newGeneratedCode; // Use the structured code as part of the QR code URL
      sequence_number = newSequenceNumber;
    }
    
    qrCodeValue = generateSimpleQRCode('proces-verbal', newProcesVerbalId); // Always generate a URL for QR code

    const newProcesVerbal = new ProcesVerbal({
      _id: newProcesVerbalId,
      title, // Directly on ProcesVerbal
      authorId: author_id, // Directly on ProcesVerbal
      qrCode: qrCodeValue, // Use the generated QR code URL
      filePath: file_path, // Directly on ProcesVerbal
      fileType: file_type, // Directly on ProcesVerbal
      version: 1, // Directly on ProcesVerbal
      viewsCount: 0, // Directly on ProcesVerbal
      downloadsCount: 0, // Directly on ProcesVerbal

      meetingDate: new Date(meeting_date),
      participants,
      agenda,
      decisions,
      location,
      meetingType: meeting_type,
      airport,
      nextMeetingDate: next_meeting_date ? new Date(next_meeting_date) : undefined,
      actionsDecidees: actions_decidees || [],
      // Store codification fields if generated
      company_code, scope_code, department_code, sub_department_code, language_code, sequence_number
    });

    await newProcesVerbal.save();
    
    const populatedProcesVerbal = await newProcesVerbal
      .populate('authorId', 'firstName lastName');

    const formattedProcesVerbal = {
      ...populatedProcesVerbal.toObject(),
      id: populatedProcesVerbal._id,
      author: populatedProcesVerbal.authorId ? {
        first_name: populatedProcesVerbal.authorId.firstName,
        last_name: populatedProcesVerbal.authorId.lastName,
      } : null,
      actions_decidees: populatedProcesVerbal.actionsDecidees,
      qr_code: populatedProcesVerbal.qrCode,
      file_path: populatedProcesVerbal.filePath,
      file_type: populatedProcesVerbal.fileType,
      version: populatedProcesVerbal.version,
      views_count: populatedProcesVerbal.viewsCount,
      downloads_count: populatedProcesVerbal.downloadsCount,
    };

    // --- Notifications for new proces verbal ---
    await createNotification(author_id, 'Nouveau procès-verbal créé', `Le procès-verbal "${title}" a été créé.`, 'info', newProcesVerbal._id, 'PROCES_VERBAL');
    if (actions_decidees && actions_decidees.length > 0) {
      for (const action of actions_decidees) {
        if (Array.isArray(action.responsable) && action.responsable.length > 0) {
          await createNotification(action.responsable[0], 'Nouvelle action assignée', `Une action "${action.titre}" du procès-verbal "${title}" vous a été assignée.`, 'info', newProcesVerbal._id, 'PROCES_VERBAL');
        }
      }
    }
    // --- End Notifications ---

    res.status(201).json(formattedProcesVerbal);
  } catch (error) {
    console.error('Error creating proces verbal:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// PUT /api/proces-verbaux/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Map frontend field names to backend schema names and convert dates
  if (updates.meeting_date) { updates.meetingDate = new Date(updates.meeting_date); delete updates.meeting_date; }
  if (updates.next_meeting_date) { updates.nextMeetingDate = new Date(updates.next_meeting_date); delete updates.next_meeting_date; }
  if (updates.actions_decidees) { updates.actionsDecidees = updates.actions_decidees; delete updates.actions_decidees; }
  if (updates.file_path) { updates.filePath = updates.file_path; delete updates.file_path; }
  if (updates.file_type) { updates.fileType = updates.file_type; delete updates.file_type; }
  if (updates.views_count !== undefined) { updates.viewsCount = updates.views_count; delete updates.views_count; }
  if (updates.downloads_count !== undefined) { updates.downloadsCount = updates.downloads_count; delete updates.downloads_count; }
  if (updates.qr_code !== undefined) { updates.qrCode = updates.qr_code; delete updates.qr_code; }
  if (updates.version !== undefined) { updates.version = updates.version; delete updates.version; }
  if (updates.author_id !== undefined) { updates.authorId = updates.author_id; delete updates.author_id; }


  try {
    const oldProcesVerbal = await ProcesVerbal.findById(id);
    if (!oldProcesVerbal) {
      return res.status(404).json({ message: 'Proces Verbal not found' });
    }

    // Check if any codification fields are being updated to regenerate code/QR
    const codificationFieldsChanged = [
      'company_code', 'scope_code', 'department_code', 'sub_department_code',
      'language_code' // No specific type code for PVs in this context, just general codification
    ].some(field => updates[field] !== undefined && updates[field] !== oldProcesVerbal[field]);

    if (codificationFieldsChanged) {
      const { generatedCode, sequence_number } = await generateCodeAndSequence(
        'PROCES_VERBAL',
        updates.company_code || oldProcesVerbal.company_code,
        updates.scope_code || oldProcesVerbal.scope_code,
        updates.department_code || oldProcesVerbal.department_code,
        updates.sub_department_code || oldProcesVerbal.sub_department_code,
        null, // document_type_code is null for PVs
        'PV', // Use 'PV' as type code for PVs
        updates.language_code || oldProcesVerbal.language_code
      );
      updates.qrCode = generateSimpleQRCode('proces-verbal', id); // Update QR code with the new structured code URL
      updates.sequence_number = sequence_number;
    }

    const procesVerbal = await ProcesVerbal.findByIdAndUpdate(id, updates, { new: true })
      .populate('authorId', 'firstName lastName');
    if (!procesVerbal) {
      return res.status(404).json({ message: 'Proces Verbal not found' });
    }
    const formattedProcesVerbal = {
      ...procesVerbal.toObject(),
      id: procesVerbal._id,
      author: procesVerbal.authorId ? {
        first_name: procesVerbal.authorId.firstName,
        last_name: procesVerbal.authorId.lastName,
      } : null,
      actions_decidees: procesVerbal.actionsDecidees,
      qr_code: procesVerbal.qrCode,
      file_path: procesVerbal.filePath,
      file_type: procesVerbal.fileType,
      version: procesVerbal.version,
      views_count: procesVerbal.viewsCount,
      downloads_count: procesVerbal.downloadsCount,
    };

    // --- Notifications for updated proces verbal ---
    const changedFields = Object.keys(updates).filter(key =>
      JSON.stringify(updates[key]) !== JSON.stringify(oldProcesVerbal.toObject()[key])
    );

    if (changedFields.length > 0) {
      const authorId = procesVerbal.authorId;

      if (authorId) {
        await createNotification(authorId, 'Procès-verbal mis à jour', `Le procès-verbal "${procesVerbal.title}" a été mis à jour. Champs modifiés: ${changedFields.join(', ')}.`, 'info', procesVerbal._id, 'PROCES_VERBAL');
      }

      // Notify responsible parties if actions_decidees were changed
      const oldActionTitles = new Set(oldProcesVerbal.actionsDecidees.map(a => a.titre));
      const newActionTitles = new Set(procesVerbal.actionsDecidees.map(a => a.titre));

      const addedActions = procesVerbal.actionsDecidees.filter(action => !oldActionTitles.has(action.titre));
      const updatedActions = procesVerbal.actionsDecidees.filter(action => {
        const oldAction = oldProcesVerbal.actionsDecidees.find(oa => oa.titre === action.titre);
        return oldAction && JSON.stringify(oldAction) !== JSON.stringify(action);
      });

      for (const action of addedActions) {
        if (Array.isArray(action.responsable) && action.responsable.length > 0) {
          await createNotification(action.responsable[0], 'Nouvelle action assignée', `Une nouvelle action "${action.titre}" du procès-verbal "${procesVerbal.title}" vous a été assignée.`, 'info', procesVerbal._id, 'PROCES_VERBAL');
        }
      }
      for (const action of updatedActions) {
        if (Array.isArray(action.responsable) && action.responsable.length > 0) {
          await createNotification(action.responsable[0], 'Action mise à jour', `L'action "${action.titre}" du procès-verbal "${procesVerbal.title}" a été mise à jour.`, 'info', procesVerbal._id, 'PROCES_VERBAL');
        }
      }
    }
    // --- End Notifications ---

    res.json(formattedProcesVerbal);
  } catch (error) {
    console.error('Error updating proces verbal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/proces-verbaux/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const procesVerbal = await ProcesVerbal.findByIdAndDelete(id);
    if (!procesVerbal) {
      return res.status(404).json({ message: 'Proces Verbal not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting proces verbal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;