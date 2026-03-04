const { Router } = require('express');
const Notification = require('../models/Notification.js');
const { sendSms } = require('../utils/smsSender.js'); // Import the new SMS sender utility
const { sendEmail } = require('../utils/emailSender.js'); // Import the new EMAIL sender utility
const User = require('../models/User.js'); // Import User model
const AppSettings = require('../models/AppSettings.js'); // Import AppSettings model for global config
const { v4: uuidv4 } = require('uuid');

const router = Router();

// Helper function to create a notification (now also attempts to send SMS and Email)
const createNotification = async (userId, title, message, type = 'info', entityId = null, entityType = null) => {
  try {
    const recipientUser = await User.findById(userId);
    if (!recipientUser) {
      console.warn(`[NotificationService] Utilisateur destinataire ${userId} non trouvé pour la notification.`);
      return;
    }

    const newNotification = new Notification({
      _id: uuidv4(),
      userId,
      title,
      message,
      type,
      isRead: false,
      entityId, // Save entityId
      entityType, // Save entityType
    });
    await newNotification.save();
    console.log(`Notification created for user ${userId}: ${title}`);

    // Check user's personal SMS notification preference
    if (recipientUser.smsNotifications && (type === 'warning' || type === 'error')) {
      await sendSms(userId, `SGDO Alerte: ${title} - ${message}`);
    }

    // Check user's personal Email notification preference
    if (recipientUser.emailNotifications) {
      await sendEmail(userId, `SGDO Notification: ${title}`, message, `<p>${message}</p>`);
    }

  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// GET /api/notifications - Récupérer les notifications d'un utilisateur
router.get('/', async (req, res) => {
  try {
    const { userId, unreadOnly = false } = req.query;
    
    // Vérifier si l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non authentifié' 
      });
    }
    
    // Utiliser l'ID de l'utilisateur authentifié ou celui fourni en paramètre
    const targetUserId = userId || req.user.id;
    
    let filter = { userId: targetUserId };
    
    // Filtrer seulement les non lues si demandé
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 });
      
    const formattedNotifications = notifications.map(notif => ({
      ...notif.toObject(),
      id: notif._id,
      is_read: notif.isRead,
      entity_id: notif.entityId,
      entity_type: notif.entityType,
      created_at: notif.createdAt.toISOString(),
      updated_at: notif.updatedAt.toISOString(),
    }));
    
    res.json({
      success: true,
      data: formattedNotifications,
      count: formattedNotifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message 
    });
  }
});

// POST /api/notifications (for internal use, e.g., by other services/routes)
router.post('/', async (req, res) => {
  const { userId, title, message, type, isRead, entityId, entityType } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  try {
    const recipientUser = await User.findById(userId);
    if (!recipientUser) {
      return res.status(404).json({ message: `User ${userId} not found.` });
    }

    const newNotification = new Notification({
      _id: uuidv4(),
      userId,
      title,
      message,
      type: type || 'info',
      isRead: isRead || false,
      entityId, // Save entityId
      entityType, // Save entityType
    });

    await newNotification.save();

    // Check user's personal SMS notification preference
    if (recipientUser.smsNotifications && (type === 'warning' || type === 'error')) {
      await sendSms(userId, `SGDO Alerte: ${title} - ${message}`);
    }

    // Check user's personal Email notification preference
    if (recipientUser.emailNotifications) {
      await sendEmail(userId, `SGDO Notification: ${title}`, message, `<p>${message}</p>`);
    }

    res.status(201).json({
      ...newNotification.toObject(),
      id: newNotification._id,
      is_read: newNotification.isRead,
      entity_id: newNotification.entityId, // Map entityId
      entity_type: newNotification.entityType, // Map entityType
      created_at: newNotification.createdAt.toISOString(),
      updated_at: newNotification.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/mark-all-read (Mark all as read for a user) - MUST BE BEFORE /:id
router.put('/mark-all-read', async (req, res) => {
  const { userId } = req.body; // Expecting userId from frontend (or auth middleware)
  console.log(`[Backend] mark-all-read: Received request for userId: ${userId}`); // Add this log

  if (!userId) {
    console.error('[Backend] mark-all-read: userId is missing.'); // Add this log
    return res.status(400).json({ message: 'User ID is required to mark all as read' });
  }

  try {
    const result = await Notification.updateMany( // Capture result
      { userId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    console.log(`[Backend] mark-all-read: updateMany result: ${JSON.stringify(result)}`); // Log result
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[Backend] mark-all-read: Error marking all notifications as read:', error); // Log full error
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/:id (Mark as read)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { is_read } = req.body; // Expecting is_read from frontend
  console.log(`[Backend] markAsRead (single): Received request for id: ${id}, is_read: ${is_read}`); // Add this log

  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: is_read },
      { new: true }
    );
    if (!notification) {
      console.warn(`[Backend] markAsRead (single): Notification with id ${id} not found.`); // Add this log
      return res.status(404).json({ message: 'Notification not found' });
    }
    console.log(`[Backend] markAsRead (single): Notification ${id} updated successfully.`); // Add this log
    res.json({
      ...notification.toObject(),
      id: notification._id,
      is_read: notification.isRead,
      entity_id: notification.entityId, // Map entityId
      entity_type: notification.entityType, // Map entityType
      created_at: notification.createdAt.toISOString(),
      updated_at: notification.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error(`[Backend] markAsRead (single): Error updating notification ${id}:`, error); // Log full error
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/correspondance/:correspondanceId - Notifications pour une correspondance spécifique
router.get('/correspondance/:correspondanceId', async (req, res) => {
  try {
    const { correspondanceId } = req.params;
    
    const notifications = await Notification.find({ 
      correspondanceId: correspondanceId 
    })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications de correspondance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message 
    });
  }
});

module.exports = { router, createNotification }; // Export both router and createNotification