const { Router } = require('express');
const Action = require('../models/Action.js');
const Document = require('../models/Document.js');
const { createNotification } = require('./notificationRoutes.js'); // Importation de la fonction centralisée
const User = require('../models/User.js'); // Importation de User pour les notifications
const { v4: uuidv4 } = require('uuid');

const router = Router();

// La fonction createNotification est maintenant importée depuis notificationRoutes.js
// Elle n'est plus définie ici pour éviter la duplication et assurer l'envoi d'emails.

// GET /api/actions
router.get('/', async (req, res) => {
  try {
    const actions = await Action.find({}).populate('parentDocumentId', 'title type');
    const formattedActions = actions.map(action => ({
      ...action.toObject(),
      id: action._id,
      document: action.parentDocumentId ? {
        title: action.parentDocumentId.title,
        type: action.parentDocumentId.type,
      } : null,
    }));
    res.json(formattedActions);
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/actions
router.post('/', async (req, res) => {
  const { title, description, assigned_to, due_date, priority, parent_document_id, estimated_hours, author_id } = req.body;

  if (!title || !due_date || !assigned_to || !author_id) {
    return res.status(400).json({ message: 'Missing required fields: title, due_date, assigned_to, author_id' });
  }

  try {
    const newAction = new Action({
      _id: uuidv4(),
      title,
      description,
      assignedTo: assigned_to,
      dueDate: new Date(due_date),
      priority,
      parentDocumentId: parent_document_id,
      progress: 0,
      estimatedHours: estimated_hours,
      status: 'PENDING',
      authorId: author_id,
    });

    await newAction.save();
    
    const populatedAction = await newAction.populate('parentDocumentId', 'title type');
    const formattedAction = {
      ...populatedAction.toObject(),
      id: populatedAction._id,
      document: populatedAction.parentDocumentId ? {
        title: populatedAction.parentDocumentId.title,
        type: populatedAction.parentDocumentId.type,
      } : null,
    };

    // Notifications pour la nouvelle action
    await createNotification(author_id, 'Nouvelle action créée', `L'action "${title}" a été créée.`, 'info', newAction._id, 'ACTION');
    if (assigned_to && assigned_to.length > 0) {
      for (const assigneeId of assigned_to) {
        await createNotification(assigneeId, 'Nouvelle action assignée', `Une nouvelle action "${title}" vous a été assignée.`, 'info', newAction._id, 'ACTION');
      }
    }

    res.status(201).json(formattedAction);
  } catch (error) {
    console.error('Error creating action:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/actions/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.due_date) { updates.dueDate = new Date(updates.due_date); delete updates.due_date; }
  if (updates.assigned_to) { updates.assignedTo = updates.assigned_to; delete updates.assigned_to; }
  if (updates.parent_document_id) { updates.parentDocumentId = updates.parent_document_id; delete updates.parent_document_id; }
  if (updates.estimated_hours) { updates.estimatedHours = updates.estimated_hours; delete updates.estimated_hours; }
  if (updates.actual_hours) { updates.actualHours = updates.actual_hours; delete updates.actual_hours; }
  if (updates.author_id) { updates.authorId = updates.author_id; delete updates.author_id; }

  try {
    const oldAction = await Action.findById(id);
    if (!oldAction) {
      return res.status(404).json({ message: 'Action not found' });
    }

    const action = await Action.findByIdAndUpdate(id, updates, { new: true }).populate('parentDocumentId', 'title type');
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    const formattedAction = {
      ...action.toObject(),
      id: action._id,
      document: action.parentDocumentId ? {
        title: action.parentDocumentId.title,
        type: action.parentDocumentId.type,
      } : null,
    };

    // Notifications pour l'action mise à jour
    const changedFields = Object.keys(updates).filter(key => 
      JSON.stringify(updates[key]) !== JSON.stringify(oldAction.toObject()[key])
    );

    if (changedFields.length > 0) {
      const oldAssignedTo = new Set(oldAction.assignedTo.map(String));
      const newAssignedTo = new Set(action.assignedTo.map(String));

      const addedAssignees = [...newAssignedTo].filter(id => !oldAssignedTo.has(id));
      const removedAssignees = [...oldAssignedTo].filter(id => !newAssignedTo.has(id));

      for (const assigneeId of addedAssignees) {
        await createNotification(assigneeId, 'Action assignée', `L'action "${action.title}" vous a été assignée.`, 'info', action._id, 'ACTION');
      }
      for (const assigneeId of removedAssignees) {
        await createNotification(assigneeId, 'Action désassignée', `L'action "${action.title}" vous a été désassignée.`, 'info', action._id, 'ACTION');
      }

      if (oldAction.status !== 'COMPLETED' && action.status === 'COMPLETED') {
        for (const assigneeId of action.assignedTo) {
          await createNotification(assigneeId, 'Action terminée', `L'action "${action.title}" a été marquée comme terminée.`, 'success', action._id, 'ACTION');
        }
      } else if (oldAction.status === 'COMPLETED' && action.status !== 'COMPLETED') {
        for (const assigneeId of action.assignedTo) {
          await createNotification(assigneeId, 'Action réouverte', `L'action "${action.title}" a été réouverte.`, 'warning', action._id, 'ACTION');
        }
      }
      // Send a general update notification to all assigned users if other fields changed
      if (changedFields.some(field => field !== 'status' && field !== 'assignedTo')) {
        for (const assigneeId of action.assignedTo) {
          await createNotification(assigneeId, 'Action mise à jour', `L'action "${action.title}" a été mise à jour. Champs modifiés: ${changedFields.join(', ')}.`, 'info', action._id, 'ACTION');
        }
      }
    }

    res.json(formattedAction);
  } catch (error) {
    console.error('Error updating action:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/actions/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const action = await Action.findByIdAndDelete(id);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting action:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;