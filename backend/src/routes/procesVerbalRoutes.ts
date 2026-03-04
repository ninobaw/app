import { Router } from 'express';
import { ProcesVerbal } from '../models/ProcesVerbal';
import { Document } from '../models/Document'; // To populate parent document details
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/proces-verbaux
router.get('/', async (req, res) => {
  try {
    const procesVerbaux = await ProcesVerbal.find({})
      .populate({
        path: 'documentId',
        select: 'title authorId',
        populate: {
          path: 'authorId',
          model: 'User',
          select: 'firstName lastName'
        }
      });
    const formattedProcesVerbaux = procesVerbaux.map(pv => ({
      ...pv.toObject(),
      id: pv._id,
      document: pv.documentId ? {
        title: (pv.documentId as any).title,
        author: (pv.documentId as any).authorId ? {
          first_name: ((pv.documentId as any).authorId as any).firstName,
          last_name: ((pv.documentId as any).authorId as any).lastName,
        } : null,
      } : null,
      actions_decidees: pv.actionsDecidees,
    }));
    res.json(formattedProcesVerbaux);
  } catch (error) {
    console.error('Error fetching proces verbaux:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/proces-verbaux
router.post('/', async (req, res) => {
  const { title, meeting_date, participants, agenda, decisions, location, meeting_type, airport, next_meeting_date, actions_decidees, author_id } = req.body;

  if (!title || !meeting_date || !participants || !agenda || !decisions || !location || !meeting_type || !airport || !author_id) {
    return res.status(400).json({ message: 'Missing required fields for proces verbal' });
  }

  try {
    // First, create the associated Document
    const newDocument = new Document({
      _id: uuidv4(),
      title,
      type: 'PROCES_VERBAL',
      content: agenda + '\n\nDécisions: ' + decisions,
      authorId: author_id,
      airport,
      qrCode: `QR-${uuidv4()}`,
      version: 1,
      status: 'DRAFT',
      viewsCount: 0,
      downloadsCount: 0,
    });
    await newDocument.save();

    const newProcesVerbal = new ProcesVerbal({
      _id: uuidv4(),
      documentId: newDocument._id,
      meetingDate: new Date(meeting_date),
      participants,
      agenda,
      decisions,
      location,
      meetingType: meeting_type,
      airport,
      nextMeetingDate: next_meeting_date ? new Date(next_meeting_date) : undefined,
      actionsDecidees: actions_decidees || [],
    });

    await newProcesVerbal.save();
    
    const populatedProcesVerbal = await newProcesVerbal
      .populate({
        path: 'documentId',
        select: 'title authorId',
        populate: {
          path: 'authorId',
          model: 'User',
          select: 'firstName lastName'
        }
      });

    const formattedProcesVerbal = {
      ...populatedProcesVerbal.toObject(),
      id: populatedProcesVerbal._id,
      document: populatedProcesVerbal.documentId ? {
        title: (populatedProcesVerbal.documentId as any).title,
        author: (populatedProcesVerbal.documentId as any).authorId ? {
          first_name: ((populatedProcesVerbal.documentId as any).authorId as any).firstName,
          last_name: ((populatedProcesVerbal.documentId as any).authorId as any).lastName,
        } : null,
      } : null,
      actions_decidees: populatedProcesVerbal.actionsDecidees,
    };
    res.status(201).json(formattedProcesVerbal);
  } catch (error) {
    console.error('Error creating proces verbal:', error);
    res.status(500).json({ message: 'Server error' });
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

  try {
    const procesVerbal = await ProcesVerbal.findByIdAndUpdate(id, updates, { new: true })
      .populate({
        path: 'documentId',
        select: 'title authorId',
        populate: {
          path: 'authorId',
          model: 'User',
          select: 'firstName lastName'
        }
      });
    if (!procesVerbal) {
      return res.status(404).json({ message: 'Proces Verbal not found' });
    }
    const formattedProcesVerbal = {
      ...procesVerbal.toObject(),
      id: procesVerbal._id,
      document: procesVerbal.documentId ? {
        title: (procesVerbal.documentId as any).title,
        author: (procesVerbal.documentId as any).authorId ? {
          first_name: ((procesVerbal.documentId as any).authorId as any).firstName,
          last_name: ((procesVerbal.documentId as any).authorId as any).lastName,
        } : null,
      } : null,
      actions_decidees: procesVerbal.actionsDecidees,
    };
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
    // Optionally delete the associated document as well
    await Document.findByIdAndDelete(procesVerbal.documentId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting proces verbal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;