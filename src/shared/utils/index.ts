import { DocumentType, Priority, ActionStatus, UserRole, Airport } from '../types'; // Import Airport type
import { DOCUMENT_TYPES, PRIORITIES, ACTION_STATUS, USER_ROLES, DOCUMENT_HISTORY_ACTIONS, TASK_STATUS, USER_STATUS } from '../constants';
import { format, formatDistanceToNow, parseISO } from 'date-fns'; // Import date-fns functions
import { fr, enUS, ar } from 'date-fns/locale'; // Import all necessary locales

// Helper to get date-fns locale object
const getLocaleObject = (locale: string) => {
  switch (locale) {
    case 'fr': return fr;
    case 'en': return enUS;
    case 'ar': return ar;
    default: return fr; // Default to French
  }
};

export const formatDate = (date: Date | string, locale: string = 'fr'): string => {
  if (!date) return 'N/A'; // Gère les valeurs null, undefined ou chaînes vides
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isNaN(d.getTime())) { // Vérifie si l'objet Date est invalide (ex: new Date("chaîne invalide"))
    return 'Date invalide';
  }
  return format(d, 'P', { locale: getLocaleObject(locale) }); // 'P' is a short date format (e.g., 01/01/2023)
};

export const formatDateTime = (date: Date | string, locale: string = 'fr'): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isNaN(d.getTime())) {
    return 'Date invalide';
  }
  return format(d, 'Pp', { locale: getLocaleObject(locale) }); // 'Pp' is short date and time (e.g., 01/01/2023, 14:30)
};

export const formatTimeAgo = (date: Date | string, locale: string = 'fr'): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isNaN(d.getTime())) {
    return 'Date invalide';
  }
  return formatDistanceToNow(d, { addSuffix: true, locale: getLocaleObject(locale) });
};

export const generateQRCode = (documentId: string): string => {
  return `QR-${documentId}-${Date.now()}`;
};

export const generateReference = (type: DocumentType, airport: string): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const typeCode = type.substring(0, 3).toUpperCase();
  const airportCode = airport.substring(0, 3).toUpperCase();
  
  return `${typeCode}-${airportCode}-${year}${month}-${random}`;
};

export const getDocumentTypeLabel = (type: DocumentType): string => {
  return DOCUMENT_TYPES[type]?.label || type;
};

export const getDocumentTypeIcon = (type: DocumentType): string => {
  return DOCUMENT_TYPES[type]?.icon || 'FileText';
};

export const getDocumentTypeColor = (type: DocumentType): string => {
  return DOCUMENT_TYPES[type]?.color || 'gray';
};

export const getPriorityLabel = (priority: Priority): string => {
  return PRIORITIES[priority]?.label || priority;
};

export const getPriorityColor = (priority: Priority): string => {
  return PRIORITIES[priority]?.color || 'gray';
};

export const getStatusLabel = (status: ActionStatus): string => {
  return ACTION_STATUS[status]?.label || status;
};

export const getStatusColor = (status: ActionStatus): string => {
  return ACTION_STATUS[status]?.color || 'gray';
};

export const getTaskStatusLabel = (status: string): string => {
  return TASK_STATUS[status as keyof typeof TASK_STATUS]?.label || status;
};

export const getTaskStatusColor = (status: string): string => {
  return TASK_STATUS[status as keyof typeof TASK_STATUS]?.color || 'gray';
};

export const getUserRoleLabel = (role: UserRole): string => {
  return USER_ROLES[role]?.label || role;
};

export const getUserStatusLabel = (status: string): string => {
  return USER_STATUS[status as keyof typeof USER_STATUS]?.label || status;
};

export const getUserStatusColor = (status: string): string => {
  return USER_STATUS[status as keyof typeof USER_STATUS]?.color || 'gray';
};

export const getDocumentHistoryActionLabel = (action: string): string => {
  return DOCUMENT_HISTORY_ACTIONS[action as keyof typeof DOCUMENT_HISTORY_ACTIONS]?.label || action;
};

export const getDocumentHistoryActionColor = (action: string): string => {
  return DOCUMENT_HISTORY_ACTIONS[action as keyof typeof DOCUMENT_HISTORY_ACTIONS]?.color || 'gray';
};

export const getDocumentHistoryActionIcon = (action: string): string => {
  return DOCUMENT_HISTORY_ACTIONS[action as keyof typeof DOCUMENT_HISTORY_ACTIONS]?.icon || 'Clock';
};

export const calculateProgress = (totalTasks: number, completedTasks: number): number => {
  if (totalTasks === 0) return 0;
  return Math.round((completedTasks / totalTasks) * 100);
};

export const calculateActionProgress = (tasks: Array<{ completed: boolean }>): number => {
  const completedTasks = tasks.filter(task => task.completed).length;
  return calculateProgress(tasks.length, completedTasks);
};

export const isActionOverdue = (dueDate: Date): boolean => {
  return new Date(dueDate) < new Date();
};

export const isActionDueSoon = (dueDate: Date, daysThreshold: number = 3): boolean => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffInMs = due.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  
  return diffInDays <= daysThreshold && diffInDays >= 0;
};

export const getDaysUntilDue = (dueDate: Date): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffInMs = due.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return allowedTypes.includes(extension);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const initials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const getAvatarUrl = (userId: string): string => {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${userId}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const sortByDate = <T>(array: T[], dateKey: keyof T, order: 'asc' | 'desc' = 'desc'): T[] => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey] as any).getTime();
    const dateB = new Date(b[dateKey] as any).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const groupByDate = <T>(array: T[], dateKey: keyof T): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const date = formatDate(item[dateKey] as any);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const filterBySearchTerm = <T>(
  array: T[],
  searchTerm: string,
  searchKeys: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return array;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  return array.filter(item =>
    searchKeys.some(key => {
      const value = item[key];
      return typeof value === 'string' && value.toLowerCase().includes(lowercaseSearch);
    })
  );
};

export const generateDocumentCodePreview = (
  company_code?: string,
  scope_code?: string,
  department_code?: string,
  sub_department_code?: string,
  document_type_code?: string,
  language_code?: string,
  sequence_number?: string // Added sequence_number for preview
): string => {
  const parts = [
    company_code || 'COMP',
    scope_code || 'SCOPE',
    department_code || 'DEPT',
    sub_department_code || null, // Use null to filter out if not present
    document_type_code || 'TYPE',
    sequence_number || '001', // Use provided sequence_number or placeholder
    language_code || 'LANG'
  ].filter(Boolean); // Filter out null/undefined values

  return parts.join('-');
};

export const mapDocumentTypeCodeToDocumentTypeEnum = (code: string): DocumentType => {
  switch (code) {
    case 'FM': return DocumentType.FORMULAIRE_DOC;
    // case 'CR': return DocumentType.CORRESPONDANCE; // Removed as it's not a DocumentType
    // case 'PV': return DocumentType.PROCES_VERBAL; // Removed as it's not a DocumentType
    case 'PQ': return DocumentType.QUALITE_DOC;
    case 'ND': return DocumentType.NOUVEAU_DOC;
    case 'MN': return DocumentType.GENERAL; 
    case 'RG': return DocumentType.GENERAL;
    default: return DocumentType.GENERAL; // Fallback
  }
};

// New utility function to map scope codes to Airport enum values
export const mapScopeCodeToAirportEnum = (scopeCode: string): Airport => {
  switch (scopeCode) {
    case 'NBE': return 'ENFIDHA';
    case 'MIR': return 'MONASTIR';
    case 'GEN': return 'GENERALE';
    default: return 'ENFIDHA'; // Default to Enfidha or handle as an error
  }
};

// New utility function to get absolute file path
export const getAbsoluteFilePath = (relativePath: string): string => {
  // Ensure VITE_API_BASE_URL is defined in your .env file (e.g., VITE_API_BASE_URL=http://localhost:5000)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  // Utiliser la route statique (sans authentification) pour les téléchargements
  return `${baseUrl}/uploads/${encodeURIComponent(relativePath)}`;
};

// New utility function for QR code image generation
export const generateQRCodeImage = (qrCodeValue: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeValue)}`;
};