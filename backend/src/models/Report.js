const { Schema, model } = require('mongoose');

const ReportSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  content: { type: Schema.Types.Mixed },
  status: { type: String, default: 'PENDING' },
  frequency: { type: String },
  lastGenerated: { type: Date },
  createdBy: { type: String, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const Report = model('Report', ReportSchema);
module.exports = Report;