export interface DocumentTemplate {
  name: string;
  extension: string;
  description: string;
  category: 'PROCEDURE' | 'REGISTRE' | 'CORRESPONDANCE' | 'AUTRE';
  metadata: Record<string, any>;
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  PROCEDURE_STANDARD: {
    name: "Procédure Standard",
    extension: "docx",
    description: "Modèle pour les procédures opérationnelles standardisées",
    category: 'PROCEDURE',
    metadata: {
      requiredFields: ['titre', 'reference', 'version', 'dateCreation'],
      workflow: ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED'],
      retentionPeriod: '10y',
      accessLevel: 'DEPARTMENT'
    }
  },
  REGISTRE_CONTROLE: {
    name: "Registre de Contrôle",
    extension: "xlsx",
    description: "Modèle pour les registres de contrôle qualité",
    category: 'REGISTRE',
    metadata: {
      requiredFields: ['titre', 'responsable', 'periode'],
      workflow: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      retentionPeriod: '5y',
      accessLevel: 'QUALITY'
    }
  },
  CORRESPONDANCE_OFFICIELLE: {
    name: "Correspondance Officielle",
    extension: "docx",
    description: "Modèle pour les correspondances officielles",
    category: 'CORRESPONDANCE',
    metadata: {
      requiredFields: ['objet', 'reference', 'destinataire'],
      workflow: ['DRAFT', 'SENT', 'RECEIVED', 'ARCHIVED'],
      retentionPeriod: '7y',
      accessLevel: 'DEPARTMENT'
    }
  }
};

export const DOCUMENT_CATEGORIES = {
  PROCEDURE: 'Procédures',
  REGISTRE: 'Registres',
  CORRESPONDANCE: 'Correspondances',
  AUTRE: 'Autres Documents'
};
