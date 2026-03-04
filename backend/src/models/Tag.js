const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
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
  description: {
    type: String,
    maxlength: 200,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
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
tagSchema.index({ name: 1 });
tagSchema.index({ isActive: 1 });

// Middleware pour mettre à jour updatedAt
tagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Méthode statique pour obtenir les tags actifs
tagSchema.statics.getActiveTags = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Méthode pour formater le tag pour l'affichage
tagSchema.methods.toDisplay = function() {
  return {
    id: this._id,
    name: this.name,
    color: this.color,
    description: this.description,
    isActive: this.isActive,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Tag = mongoose.model('Tag', tagSchema);

module.exports = Tag;
