const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Embedded schema for ActionDecidee
// Schéma pour les réponses aux correspondances
const ReplySchema = new Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  reference: { type: String },
  fileUrl: { type: String },
  sentBy: { type: String, ref: 'User', required: true },
  sentAt: { type: Date, default: Date.now }
}, { _id: false });

// Schéma pour les actions décidées
const ActionDecideeSchema = new Schema({
  titre: { type: String, required: true },
  description: { type: String },
  responsable: [{ type: String, required: true }],
  echeance: { type: String, required: true },
  priorite: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  statut: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], 
    default: 'PENDING' 
  },
  collaborateurs: [{ type: String }],
  // Nouveaux champs pour l'amélioration du processus
  datePartage: { type: Date }, // Date de partage du plan d'action
  personnesConcernees: [{ type: String }], // Directeurs/sous-directeurs à notifier
  causesRacines: { type: String }, // Analyse des causes racines
  dateRealisation: { type: Date }, // Date de réalisation effective
  commentaires: { type: String } // Commentaires sur l'action
}, { _id: false });

const CorrespondanceSchema = new Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['INCOMING', 'OUTGOING'],
    required: true,
  },
  from_address: { type: String, required: true },
  to_address: { type: String, required: true },
  subject: { type: String, required: true },
  content: { 
    type: String, 
    required: false // Le contenu est optionnel si un fichier est joint
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'REPLIED', 'INFORMATIF', 'CLOTURER', 'DRAFT'], 
    default: 'PENDING' 
  },
  airport: { 
    type: String, 
    enum: ['ENFIDHA', 'MONASTIR', 'GENERALE'], 
  },
  tags: [{ type: String }],
  file_name: { type: String },
  
  // Champs pour le workflow de réponse et liaisons
  parentCorrespondanceId: {
    type: Schema.Types.ObjectId,
    ref: 'Correspondance'
  },
  assignedTo: {
    type: String,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  assignedBy: {
    type: String,
    ref: 'User'
  },
  responseReference: { type: String }, // Référence de la réponse
  responseDate: { type: Date },
  isResponse: { type: Boolean, default: false }, // Indique si c'est une réponse
  originalCorrespondanceId: {
    type: Schema.Types.ObjectId,
    ref: 'Correspondance'
  }, // Référence vers la correspondance originale
  directorConsignes: { type: String }, // Consignes du directeur général
  directorComments: { type: String }, // Commentaires du directeur sur les propositions
  directorNotes: { type: String }, // Notes privées du directeur
  responseProposal: { type: String }, // Proposition de réponse des parties concernées
  responseProposalBy: { type: String, ref: 'User' }, // Qui a proposé la réponse
  responseProposalDate: { type: Date }, // Date de la proposition
  directorValidation: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION'], 
    default: 'PENDING' 
  }, // Statut de validation du directeur
  directorValidationDate: { type: Date }, // Date de validation
  directorValidatedBy: { type: String, ref: 'User' }, // Directeur qui a validé
  dischargeDocument: { type: String }, // Chemin vers le document de décharge
  
  // Champs pour les dates et échéances
  date_correspondance: { type: Date, required: true, default: Date.now }, // Date de la correspondance officielle
  response_deadline: { type: Date }, // Date limite de réponse
  deadline_notification_sent: { type: Boolean, default: false }, // Notification d'échéance envoyée
  expiration_notification_sent: { type: Boolean, default: false }, // Notification d'expiration envoyée
  
  // Champs pour le suivi par l'agent superviseur
  remindersSent: [{ 
    date: { type: Date, default: Date.now },
    sentBy: { type: String, ref: 'User' },
    sentTo: [{ type: String, ref: 'User' }],
    type: { type: String, enum: ['DEADLINE_WARNING', 'OVERDUE', 'MANUAL_REMINDER'] }
  }], // Historique des rappels envoyés
  lastReminderDate: { type: Date }, // Date du dernier rappel
  isOverdue: { type: Boolean, default: false }, // Correspondance en retard
  overdueNotificationSent: { type: Boolean, default: false }, // Notification de retard envoyée
  
  // Champs pour les notifications et personnes concernées
  personnesConcernees: [{ type: String, ref: 'User' }], // Personnes à notifier
  informationTransmittedTo: { type: String },
  informationAcknowledged: { type: Boolean, default: false },
  informationActions: { type: String },
  
  // Champs pour le traitement par l'agent de bureau d'ordre
  deposantInfo: { type: String }, // Partie qui a déposé la correspondance
  importanceSubject: { type: String }, // Importance du sujet
  scannedDocumentPath: { type: String }, // Chemin du document scanné
  
  // Champs complémentaires conservés
  authorId: { type: String, ref: 'User', required: true },
  qrCode: { type: String, sparse: true }, // sparse permet les valeurs null multiples
  filePath: { type: String },
  fileType: { type: String },
  version: { type: Number, default: 1 },
  viewsCount: { type: Number, default: 0 },
  downloadsCount: { type: Number, default: 0 },
  attachments: [{ type: String }],
  actionsDecidees: [ActionDecideeSchema],
  readBy: [{ type: String, ref: 'User' }],
  replies: [ReplySchema],
  lastResponseAt: { type: Date },
  isUrgent: { type: Boolean, default: false },
  isConfidential: { type: Boolean, default: false },
  relatedDocuments: [{ 
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['DOCUMENT', 'IMAGE', 'OTHER'], default: 'DOCUMENT' }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Code de correspondance - saisie libre
  code: { type: String, unique: true, sparse: true }, // sparse permet les valeurs null multiples
  
  // New codification fields
  company_code: { type: String },
  scope_code: { type: String },
  department_code: { type: String },
  sub_department_code: { type: String },
  language_code: { type: String },
  sequence_number: { type: Number },
  departementsResponsables: [{ type: String }], // Champ pour les départements responsables
  
  // Champs pour le workflow de réponse
  workflowStatus: {
    type: String,
    enum: [
      'PENDING', 'ASSIGNED_TO_DIRECTOR', 'DIRECTOR_DRAFT', 'DG_REVIEW',
      'DG_FEEDBACK', 'DIRECTOR_REVISION', 'DG_APPROVED', 'SUPERVISOR_NOTIFIED',
      'RESPONSE_PREPARED', 'RESPONSE_SENT'
    ],
    default: 'PENDING'
  },
  
  // Propositions de réponse des directeurs
  responseDrafts: [{
    directorId: { type: String, ref: 'User', required: true },
    directorName: { type: String, required: true },
    directorate: { type: String },
    responseContent: { type: String, required: true },
    attachments: [{ type: String }],
    comments: { type: String },
    isUrgent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'PENDING_DG_REVIEW', 'REVISION_REQUESTED', 'REVISED', 'APPROVED', 'REJECTED'],
      default: 'DRAFT'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    
    // Feedbacks du Directeur Général
    dgFeedbacks: [{
      dgId: { type: String, ref: 'User', required: true },
      dgName: { type: String, required: true },
      action: {
        type: String,
        enum: ['APPROVE', 'REQUEST_REVISION', 'REJECT'],
        required: true
      },
      feedback: { type: String },
      revisionRequests: [{ type: String }],
      isApproved: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    
    // Historique des révisions
    revisionHistory: [{
      revisionDate: { type: Date, default: Date.now },
      revisionComments: { type: String },
      previousContent: { type: String }
    }]
  }],
  
  // Réponse finale (par le superviseur bureau d'ordre)
  finalResponse: {
    supervisorId: { type: String, ref: 'User' },
    supervisorName: { type: String },
    finalResponseContent: { type: String },
    attachments: [{ type: String }],
    sendMethod: {
      type: String,
      enum: ['EMAIL', 'POSTAL', 'FAX', 'HAND_DELIVERY'],
      default: 'EMAIL'
    },
    basedOnDraft: { type: Schema.Types.Mixed }, // Référence à la proposition approuvée
    sentAt: { type: Date },
    status: {
      type: String,
      enum: ['PREPARED', 'SENT', 'DELIVERED', 'ACKNOWLEDGED'],
      default: 'PREPARED'
    }
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }); // Ensure timestamps are handled

// Ajout d'index pour optimiser les performances
CorrespondanceSchema.index({ status: 1 });
CorrespondanceSchema.index({ authorId: 1 });
CorrespondanceSchema.index({ toAddress: 1 });
CorrespondanceSchema.index({ fromAddress: 1 });
CorrespondanceSchema.index({ createdAt: -1 });
CorrespondanceSchema.index({ updatedAt: -1 });
CorrespondanceSchema.index({ code: 1 }); // Index pour le code de correspondance
CorrespondanceSchema.index({ 'actionsDecidees.statut': 1 });
CorrespondanceSchema.index({ 'actionsDecidees.responsable': 1 });
CorrespondanceSchema.index({ 'actionsDecidees.personnesConcernees': 1 });
CorrespondanceSchema.index({ departementsresponsables: 1 }); // Index pour les départements responsables
// Index pour le workflow
CorrespondanceSchema.index({ workflowStatus: 1 });
CorrespondanceSchema.index({ 'responseDrafts.directorId': 1 });
CorrespondanceSchema.index({ 'responseDrafts.status': 1 });
CorrespondanceSchema.index({ 'finalResponse.supervisorId': 1 });
// Index pour les champs de codification
CorrespondanceSchema.index({ company_code: 1 });
CorrespondanceSchema.index({ scope_code: 1 });
CorrespondanceSchema.index({ department_code: 1 });
CorrespondanceSchema.index({ sub_department_code: 1 });
CorrespondanceSchema.index({ language_code: 1 });
CorrespondanceSchema.index({ sequence_number: 1 });
// Middleware pour mettre à jour automatiquement le champ updatedAt
CorrespondanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ✅ NOUVEAU : Middleware pour créer automatiquement un workflow
CorrespondanceSchema.post('save', async function(doc) {
  try {
    // Vérifier si c'est une nouvelle correspondance (pas une mise à jour)
    if (this.isNew) {
      console.log(`🔄 [Middleware] Création workflow pour correspondance: ${doc._id}`);
      
      const CorrespondenceWorkflow = require('./CorrespondenceWorkflow');
      const User = require('./User');
      
      // Vérifier si un workflow existe déjà
      const existingWorkflow = await CorrespondenceWorkflow.findOne({ 
        correspondanceId: doc._id 
      });
      
      if (existingWorkflow) {
        console.log(`⚠️ [Middleware] Workflow existe déjà pour: ${doc._id}`);
        return;
      }
      
      // Trouver le DG
      const dg = await User.findOne({ role: 'DIRECTEUR_GENERAL' });
      if (!dg) {
        console.log(`❌ [Middleware] DG non trouvé`);
        return;
      }
      
      // Déterminer le directeur assigné
      let assignedDirector = null;
      
      if (doc.assignedTo) {
        // Vérifier si assignedTo est un directeur
        const assignedUser = await User.findById(doc.assignedTo);
        if (assignedUser && ['DIRECTEUR', 'SOUS_DIRECTEUR'].includes(assignedUser.role)) {
          assignedDirector = assignedUser;
        }
      }
      
      if (!assignedDirector && doc.personnesConcernees && doc.personnesConcernees.length > 0) {
        // Chercher un directeur dans personnesConcernees
        for (const personId of doc.personnesConcernees) {
          const person = await User.findById(personId);
          if (person && ['DIRECTEUR', 'SOUS_DIRECTEUR'].includes(person.role)) {
            assignedDirector = person;
            break;
          }
        }
      }
      
      if (!assignedDirector) {
        // Assigner le premier directeur disponible
        assignedDirector = await User.findOne({ 
          role: { $in: ['DIRECTEUR', 'SOUS_DIRECTEUR'] } 
        });
      }
      
      if (!assignedDirector) {
        console.log(`❌ [Middleware] Aucun directeur disponible`);
        return;
      }
      
      // Créer le workflow
      const newWorkflow = new CorrespondenceWorkflow({
        correspondanceId: doc._id,
        currentStatus: 'ASSIGNED_TO_DIRECTOR',
        assignedDirector: assignedDirector._id,
        directeurGeneral: dg._id,
        responseDrafts: [],
        chatMessages: []
      });
      
      await newWorkflow.save();
      
      // Mettre à jour la correspondance avec le bon statut
      await this.constructor.updateOne(
        { _id: doc._id },
        {
          $set: {
            workflowStatus: 'ASSIGNED_TO_DIRECTOR',
            assignedTo: assignedDirector._id,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ [Middleware] Workflow créé pour: ${doc._id} -> Directeur: ${assignedDirector.firstName} ${assignedDirector.lastName}`);
      
    }
  } catch (error) {
    console.error(`❌ [Middleware] Erreur création workflow:`, error);
  }
});

// Méthode utilitaire pour obtenir les correspondances en retard
CorrespondanceSchema.statics.findOverdue = function() {
  return this.find({
    $or: [
      { responseDeadline: { $lt: new Date() }, status: { $ne: 'CLOTURER' } },
      { 'actionsDecidees.echeance': { $lt: new Date().toISOString().split('T')[0] }, 'actionsDecidees.statut': { $ne: 'COMPLETED' } }
    ]
  });
};

const Correspondance = model('Correspondance', CorrespondanceSchema);
module.exports = Correspondance;