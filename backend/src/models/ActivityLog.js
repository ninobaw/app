const { Schema, model } = require('mongoose');

const ActivityLogSchema = new Schema({
  _id: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  entityId: { type: String, required: true },
  entityType: { 
    type: String, 
    enum: ['USER', 'DOCUMENT', 'ACTION', 'TASK', 'CORRESPONDANCE', 'PROCES_VERBAL', 'REPORT', 'SETTINGS'], 
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, ref: 'User', required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
});

const ActivityLog = model('ActivityLog', ActivityLogSchema);
module.exports = ActivityLog;