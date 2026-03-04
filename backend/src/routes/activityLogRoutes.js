const { Router } = require('express');
const ActivityLog = require('../models/ActivityLog.js'); // Changed to require with .js extension
const User = require('../models/User.js'); // Changed to require with .js extension
const { v4: uuidv4 } = require('uuid'); // uuid is a CommonJS module, no change needed here

const router = Router();

// GET /api/activity-logs
router.get('/', async (req, res) => {
  try {
    // Removed .limit(20) to fetch all logs for the audit page
    const logs = await ActivityLog.find({}).populate('userId', 'firstName lastName').sort({ timestamp: -1 });
    const formattedLogs = logs.map(log => ({
      ...log.toObject(),
      id: log._id,
      user: log.userId ? {
        first_name: log.userId.firstName,
        last_name: log.userId.lastName,
      } : null,
      timestamp: log.timestamp.toISOString(),
    }));
    res.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/activity-logs (for internal use, e.g., by other services/routes)
router.post('/', async (req, res) => {
  const { action, details, entityId, entityType, userId, ipAddress, userAgent } = req.body;

  if (!action || !details || !entityId || !entityType || !userId) {
    return res.status(400).json({ message: 'Missing required fields for activity log' });
  }

  try {
    const newLog = new ActivityLog({
      _id: uuidv4(),
      action,
      details,
      entityId,
      entityType,
      userId,
      ipAddress,
      userAgent,
    });

    await newLog.save();
    res.status(201).json({
      ...newLog.toObject(),
      id: newLog._id,
      timestamp: newLog.timestamp.toISOString(),
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;