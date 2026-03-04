export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMINISTRATOR = 'ADMINISTRATOR',
  APPROVER = 'APPROVER',
  USER = 'USER',
  VISITOR = 'VISITOR',
  AGENT_BUREAU_ORDRE = 'AGENT_BUREAU_ORDRE',
  SUPERVISEUR_BUREAU_ORDRE = 'SUPERVISEUR_BUREAU_ORDRE',
  DIRECTEUR_GENERAL = 'DIRECTEUR_GENERAL',
  DIRECTEUR = 'DIRECTEUR',
  SOUS_DIRECTEUR = 'SOUS_DIRECTEUR'
}

export enum ActionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DocumentType {
  FORMULAIRE_DOC = 'FORMULAIRE_DOC',
  // Removed CORRESPONDANCE and PROCES_VERBAL from DocumentType enum
  QUALITE_DOC = 'QUALITE_DOC',
  NOUVEAU_DOC = 'NOUVEAU_DOC',
  GENERAL = 'GENERAL'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Define Airport enum with GENERALE option
export type Airport = 'ENFIDHA' | 'MONASTIR' | 'GENERALE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePhoto?: string;
  airport: Airport; // Updated to use Airport type
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date; // Date de dernière connexion
  isActive: boolean;
  phone?: string;
  department?: string;
  mustChangePassword?: boolean; // User must change password on first login
  // New fields for user-specific notification preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  sessionTimeout?: number; // Session timeout is now global, but still passed with user for convenience
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType; // Now restricted to quality document types
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  qrCode: string; // This will now store the full generated code
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  actions: Action[]; // This might need to be re-evaluated if actions are linked to documents
  history: DocumentHistory[];
  filePath?: string;
  fileType?: string;
  airport: Airport; // Updated to use Airport type
  // New fields for document code components
  company_code?: string; // Added company_code
  scope_code?: string;
  department_code?: string;
  sub_department_code?: string;
  document_type_code?: string;
  language_code?: string;
  sequence_number?: number;
}

export interface FormulaireDoc {
  id: string;
  name: string;
  template: string;
  fields: FormField[];
  isDownloadable: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  fileType?: string;
}

export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: string;
}

export interface Correspondance {
  id: string;
  // Removed documentId, now standalone
  title: string; // Added directly
  authorId: string; // Added directly
  qrCode: string; // Added directly
  filePath?: string; // Added directly
  fileType?: string; // Added directly
  version: number; // Added directly
  viewsCount: number; // Added directly
  downloadsCount: number; // Added directly

  from: string;
  to: string;
  subject: string;
  content: string;
  attachments: string[];
  actions: Action[]; // This might need to be re-evaluated if actions are linked to correspondences
  createdAt: Date;
  priority: Priority;
  status: 'PENDING' | 'REPLIED' | 'INFORMATIF'; // Updated according to GM recommendations
  airport: Airport; // Updated to use Airport type
  type: 'INCOMING' | 'OUTGOING'; // New field for correspondence type
  code?: string; // New field for manual or generated code
  tags?: string[]; // New field for tags
  
  // New fields according to GM recommendations
  responseReference?: string; // Référence de la réponse
  responseDate?: Date; // Date de la réponse
  informationTransmittedTo?: string; // Pour les correspondances INFORMATIF - à qui l'info a été transmise
  informationAcknowledged?: boolean; // Pour les correspondances INFORMATIF - si l'info a été prise en compte
  informationActions?: string; // Pour les correspondances INFORMATIF - actions prises
}

export interface ProcesVerbal {
  id: string;
  // Removed documentId, now standalone
  title: string; // Added directly
  authorId: string; // Added directly
  qrCode: string; // Added directly
  filePath?: string; // Added directly
  fileType?: string; // Added directly
  version: number; // Added directly
  viewsCount: number; // Added directly
  downloadsCount: number; // Added directly

  meetingDate: Date;
  participants: string[];
  agenda: string;
  decisions: string;
  actions: Action[]; // This might need to be re-evaluated if actions are linked to PVs
  nextMeetingDate?: Date;
  location: string;
  meetingType: string;
  airport: Airport; // Updated to use Airport type
}

export interface Action {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  dueDate: Date;
  status: ActionStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  parentDocumentId: string; // This might need to be re-evaluated if actions are linked to documents/correspondences/PVs
  tasks: Task[];
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignedTo: string;
  completedAt?: Date;
  actionId: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'USER' | 'DOCUMENT' | 'ACTION' | 'TASK' | 'CORRESPONDANCE' | 'PROCES_VERBAL';
  entityId: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface DocumentHistory {
  id: string;
  documentId: string;
  action: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'DOWNLOADED' | 'VIEWED';
  userId: string;
  timestamp: Date;
  changes?: Record<string, any>;
  comment?: string;
  version: number;
}

export interface QRCodeData {
  id: string;
  documentId: string;
  qrCode: string;
  generatedAt: Date;
  downloadCount: number;
  lastAccessed?: Date;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'DOCUMENT_USAGE' | 'USER_ACTIVITY' | 'ACTION_STATUS' | 'PERFORMANCE' | 'CUSTOM';
  filters: Record<string, any>;
  schedule?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recipients: string[];
  createdBy: string;
  createdAt: Date;
}

// Updated AppSettings interface for global settings
export interface AppSettings {
  id: string;
  company_name: string;
  default_airport: Airport;
  language: string;
  theme: string;
  // Removed email_notifications, sms_notifications, push_notifications (now on User model)
  session_timeout: number;
  require_two_factor: boolean;
  password_expiry: number;
  document_retention: number;
  auto_archive: boolean;
  max_file_size: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  use_ssl: boolean;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  created_at?: string;
  updated_at?: string;
}

// New types for Document Code Configuration
export interface DocumentCodeComponent {
  code: string;
  label: string;
  description?: string;
}

export interface DocumentCodeConfig {
  id: string;
  documentTypes: DocumentCodeComponent[];
  departments: DocumentCodeComponent[];
  subDepartments: DocumentCodeComponent[];
  languages: DocumentCodeComponent[];
  scopes: DocumentCodeComponent[]; // For NBE, MIR, GEN
  sequenceCounters: Map<string, number>; // Key: 'SCOPE-DEPT-SUBDEPT-DOCTYPE-LANG', Value: current sequence number
  createdAt: Date;
  updatedAt: Date;
}