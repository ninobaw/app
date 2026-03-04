const mongoose = require('mongoose');

const deadlineTypeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => require('crypto').randomUUID()
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6', // Bleu par défaut
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'La couleur doit être au format hexadécimal (#RRGGBB)'
    }
  },
  days: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v > 0;
      },
      message: 'Le nombre de jours doit être un entier positif'
    }
  },
  priority: {
    type: String,
    required: true,
    enum: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  _id: false
});

// Index pour optimiser les recherches
deadlineTypeSchema.index({ name: 1 });
deadlineTypeSchema.index({ isActive: 1 });
deadlineTypeSchema.index({ order: 1 });
deadlineTypeSchema.index({ priority: 1 });

// Middleware pour mettre à jour updatedAt
deadlineTypeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode statique pour obtenir les types d'échéance actifs
deadlineTypeSchema.statics.getActiveTypes = function() {
  return this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// Méthode statique pour obtenir le type par défaut
deadlineTypeSchema.statics.getDefaultType = function() {
  return this.findOne({ isActive: true, isDefault: true });
};

// Méthode pour formater le type d'échéance pour l'affichage
deadlineTypeSchema.methods.toDisplay = function() {
  return {
    id: this._id,
    name: this.name,
    label: this.label,
    color: this.color,
    days: this.days,
    priority: this.priority,
    description: this.description,
    isActive: this.isActive,
    isDefault: this.isDefault,
    order: this.order,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Méthode pour calculer la date d'échéance à partir d'une date de création
deadlineTypeSchema.methods.calculateDeadline = function(creationDate = new Date()) {
  const deadline = new Date(creationDate);
  deadline.setDate(deadline.getDate() + this.days);
  return deadline;
};

const DeadlineType = mongoose.model('DeadlineType', deadlineTypeSchema);

module.exports = DeadlineType;
