const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerodoc';

const sampleCorrespondances = [
  {
    _id: uuidv4(),
    title: 'Procédures de sécurité - Mise à jour',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-001`,
    filePath: '/uploads/correspondances/securite_procedures.pdf',
    fileType: 'pdf',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'INCOMING',
    code: 'CORR-2024-001',
    fromAddress: 'securite@dgac.tn',
    toAddress: 'abdallah.benkhalifa@tav.aero',
    subject: 'Mise à jour des procédures de sécurité aéroportuaire',
    content: 'Nous vous transmettons les nouvelles procédures de sécurité qui entreront en vigueur le mois prochain. Merci de les diffuser à vos équipes.',
    priority: 'HIGH',
    status: 'PENDING',
    airport: 'ENFIDHA',
    attachments: ['securite_procedures.pdf'],
    actionsDecidees: [],
    tags: ['sécurité', 'procédures', 'dgac'],
    responseReference: '',
    responseDate: null,
    informationTransmittedTo: '',
    informationAcknowledged: false,
    informationActions: '',
    readBy: [],
    replies: [],
    lastResponseAt: null,
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    isUrgent: false,
    isConfidential: false,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'SEC',
    department_code: 'OPS',
    sub_department_code: 'ENFIDHA',
    language_code: 'FR',
    sequence_number: 1
  },
  {
    _id: uuidv4(),
    title: 'Rapport mensuel maintenance - Janvier 2024',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-002`,
    filePath: '/uploads/correspondances/rapport_maintenance_jan2024.xlsx',
    fileType: 'xlsx',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'OUTGOING',
    code: 'CORR-2024-002',
    fromAddress: 'abdallah.benkhalifa@tav.aero',
    toAddress: 'maintenance@tav.aero',
    subject: 'Rapport mensuel maintenance - Janvier 2024',
    content: 'Veuillez trouver ci-joint le rapport mensuel de maintenance pour le mois de janvier 2024.',
    priority: 'MEDIUM',
    status: 'REPLIED',
    airport: 'MONASTIR',
    attachments: ['rapport_maintenance_jan2024.xlsx'],
    actionsDecidees: [],
    tags: ['maintenance', 'rapport', 'mensuel'],
    responseReference: 'REP-2024-002',
    responseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
    informationTransmittedTo: 'maintenance@tav.aero',
    informationAcknowledged: true,
    informationActions: 'Rapport reçu et analysé',
    readBy: [],
    replies: [],
    lastResponseAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    responseDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
    isUrgent: false,
    isConfidential: false,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'MAINT',
    department_code: 'OPS',
    sub_department_code: 'MONASTIR',
    language_code: 'FR',
    sequence_number: 2
  },
  {
    _id: uuidv4(),
    title: 'FYI: Nouvelle réglementation OACI',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-003`,
    filePath: '/uploads/correspondances/oaci_regulation_2024.pdf',
    fileType: 'pdf',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'INCOMING',
    code: 'CORR-2024-003',
    fromAddress: 'regulation@oaci.int',
    toAddress: 'abdallah.benkhalifa@tav.aero;team@tav.aero',
    subject: 'FYI: Nouvelle réglementation OACI - Sécurité des pistes',
    content: 'Information concernant les nouvelles réglementations OACI relatives à la sécurité des pistes qui entreront en vigueur en mars 2024.',
    priority: 'MEDIUM',
    status: 'INFORMATIF',
    airport: 'GENERALE',
    attachments: ['oaci_regulation_2024.pdf'],
    actionsDecidees: [],
    tags: ['oaci', 'réglementation', 'sécurité', 'pistes'],
    responseReference: '',
    responseDate: null,
    informationTransmittedTo: 'team@tav.aero',
    informationAcknowledged: true,
    informationActions: 'Information diffusée à toutes les équipes opérationnelles',
    readBy: [],
    replies: [],
    lastResponseAt: null,
    responseDeadline: null,
    isUrgent: false,
    isConfidential: false,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'REG',
    department_code: 'ADMIN',
    sub_department_code: 'GENERALE',
    language_code: 'FR',
    sequence_number: 3
  },
  {
    _id: uuidv4(),
    title: 'URGENT: Intervention piste principale',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-004`,
    filePath: '/uploads/correspondances/intervention_urgente.docx',
    fileType: 'docx',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'OUTGOING',
    code: 'CORR-2024-004',
    fromAddress: 'abdallah.benkhalifa@tav.aero',
    toAddress: 'operations@tav.aero',
    subject: 'URGENT: Intervention requise piste principale NBE',
    content: 'Intervention urgente requise sur la piste principale suite à détection d\'un défaut lors de l\'inspection matinale.',
    priority: 'URGENT',
    status: 'REPLIED',
    airport: 'ENFIDHA',
    attachments: ['intervention_urgente.docx'],
    actionsDecidees: [],
    tags: ['urgent', 'piste', 'maintenance', 'intervention'],
    responseReference: 'REP-2024-004',
    responseDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // Il y a 6 heures
    informationTransmittedTo: 'operations@tav.aero',
    informationAcknowledged: true,
    informationActions: 'Intervention réalisée - piste opérationnelle',
    readBy: [],
    replies: [],
    lastResponseAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    responseDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 heures
    isUrgent: true,
    isConfidential: false,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Il y a 12 heures
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'OPS',
    department_code: 'MAINT',
    sub_department_code: 'ENFIDHA',
    language_code: 'FR',
    sequence_number: 4
  },
  {
    _id: uuidv4(),
    title: 'Demande de certification - Nouveau équipement',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-005`,
    filePath: '/uploads/correspondances/certification_equipement.zip',
    fileType: 'zip',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'INCOMING',
    code: 'CORR-2024-005',
    fromAddress: 'certification@dgac.tn',
    toAddress: 'abdallah.benkhalifa@tav.aero',
    subject: 'Demande de certification - Nouveau équipement de sécurité',
    content: 'Demande de certification pour le nouveau système de détection installé dans le terminal.',
    priority: 'MEDIUM',
    status: 'PENDING',
    airport: 'GENERALE',
    attachments: ['certification_equipement.zip'],
    actionsDecidees: [],
    tags: ['certification', 'équipement', 'sécurité'],
    responseReference: '',
    responseDate: null,
    informationTransmittedTo: '',
    informationAcknowledged: false,
    informationActions: '',
    readBy: [],
    replies: [],
    lastResponseAt: null,
    responseDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
    isUrgent: false,
    isConfidential: true,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'CERT',
    department_code: 'ADMIN',
    sub_department_code: 'GENERALE',
    language_code: 'FR',
    sequence_number: 5
  },
  // Correspondances du mois dernier pour tester les progressions
  {
    _id: uuidv4(),
    title: 'Rapport sécurité - Décembre 2023',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-006`,
    filePath: '/uploads/correspondances/rapport_securite_dec2023.pdf',
    fileType: 'pdf',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'OUTGOING',
    code: 'CORR-2023-006',
    fromAddress: 'abdallah.benkhalifa@tav.aero',
    toAddress: 'securite@dgac.tn',
    subject: 'Rapport mensuel sécurité - Décembre 2023',
    content: 'Rapport mensuel des incidents et mesures de sécurité pour décembre 2023.',
    priority: 'MEDIUM',
    status: 'REPLIED',
    airport: 'ENFIDHA',
    attachments: ['rapport_securite_dec2023.pdf'],
    actionsDecidees: [],
    tags: ['sécurité', 'rapport', 'mensuel'],
    responseReference: 'REP-2023-006',
    responseDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    informationTransmittedTo: 'securite@dgac.tn',
    informationAcknowledged: true,
    informationActions: 'Rapport approuvé',
    readBy: [],
    replies: [],
    lastResponseAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    responseDeadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    isUrgent: false,
    isConfidential: false,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // Il y a 40 jours (mois dernier)
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'SEC',
    department_code: 'OPS',
    sub_department_code: 'ENFIDHA',
    language_code: 'FR',
    sequence_number: 6
  },
  {
    _id: uuidv4(),
    title: 'Information météo - Décembre 2023',
    authorId: 'user-admin-001',
    qrCode: `QR-${Date.now()}-007`,
    filePath: '/uploads/correspondances/meteo_dec2023.pdf',
    fileType: 'pdf',
    version: 1,
    viewsCount: 0,
    downloadsCount: 0,
    type: 'INCOMING',
    code: 'CORR-2023-007',
    fromAddress: 'meteo@onm.tn',
    toAddress: 'abdallah.benkhalifa@tav.aero',
    subject: 'FYI: Prévisions météorologiques - Conditions hivernales',
    content: 'Information concernant les conditions météorologiques prévues pour la période hivernale.',
    priority: 'LOW',
    status: 'INFORMATIF',
    airport: 'MONASTIR',
    attachments: ['meteo_dec2023.pdf'],
    actionsDecidees: [],
    tags: ['météo', 'prévisions', 'hiver'],
    responseReference: '',
    responseDate: null,
    informationTransmittedTo: 'operations@tav.aero',
    informationAcknowledged: true,
    informationActions: 'Information transmise aux équipes opérationnelles',
    readBy: [],
    replies: [],
    lastResponseAt: null,
    responseDeadline: null,
    isUrgent: false,
    isConfidential: false,
    relatedDocuments: [],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // Il y a 45 jours (mois dernier)
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    company_code: 'TAV',
    scope_code: 'MET',
    department_code: 'OPS',
    sub_department_code: 'MONASTIR',
    language_code: 'FR',
    sequence_number: 7
  }
];

async function addSampleCorrespondances() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connexion à MongoDB réussie');
    
    const db = client.db();
    const collection = db.collection('correspondances');
    
    // Supprimer les correspondances existantes (optionnel)
    await collection.deleteMany({});
    console.log('Correspondances existantes supprimées');
    
    // Insérer les nouvelles correspondances
    const result = await collection.insertMany(sampleCorrespondances);
    console.log(`${result.insertedCount} correspondances ajoutées avec succès`);
    
    // Afficher un résumé
    const stats = await collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\nRésumé des correspondances ajoutées:');
    stats.forEach(stat => {
      console.log(`- ${stat._id}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout des correspondances:', error);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

// Exécuter le script
addSampleCorrespondances();
