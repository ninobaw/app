const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestion des Correspondances Aéroportuaires',
      version: '1.0.0',
      description: 'API pour la gestion des correspondances et du suivi des réponses dans un environnement aéroportuaire',
      contact: {
        name: 'Équipe Support',
        email: 'support@aeroport-enfidha.tn'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.aeroport-enfidha.tn',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Correspondance: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            authorId: { type: 'string' },
            qrCode: { type: 'string' },
            type: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
            code: { type: 'string' },
            fromAddress: { type: 'string' },
            toAddress: { type: 'string' },
            subject: { type: 'string' },
            content: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'REPLIED', 'INFORMATIF', 'CLOTURER', 'DRAFT'],
              default: 'DRAFT'
            },
            airport: { 
              type: 'string', 
              enum: ['ENFIDHA', 'MONASTIR', 'GENERALE'] 
            },
            responseReference: { type: 'string' },
            responseDate: { type: 'string', format: 'date-time' },
            informationAcknowledged: { type: 'boolean', default: false },
            informationActions: { type: 'string' },
            readBy: { 
              type: 'array',
              items: { type: 'string' }
            },
            replies: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Reply'
              }
            },
            actionsDecidees: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ActionDecidee'
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Reply: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            reference: { type: 'string' },
            fileUrl: { type: 'string' },
            sentBy: { type: 'string' },
            sentAt: { type: 'string', format: 'date-time' }
          }
        },
        ActionDecidee: {
          type: 'object',
          properties: {
            titre: { type: 'string' },
            description: { type: 'string' },
            responsable: { 
              type: 'array',
              items: { type: 'string' }
            },
            echeance: { type: 'string' },
            priorite: { 
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
            },
            statut: { 
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
            },
            collaborateurs: { 
              type: 'array',
              items: { type: 'string' }
            },
            datePartage: { type: 'string', format: 'date-time' },
            personnesConcernees: { 
              type: 'array',
              items: { type: 'string' }
            },
            causesRacines: { type: 'string' },
            dateRealisation: { type: 'string', format: 'date' },
            commentaires: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        },
        Statistics: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            byStatus: { 
              type: 'object',
              additionalProperties: { type: 'integer' }
            },
            byType: {
              type: 'object',
              additionalProperties: { type: 'integer' }
            },
            byPriority: {
              type: 'object',
              additionalProperties: { type: 'integer' }
            },
            byAirport: {
              type: 'object',
              additionalProperties: { type: 'integer' }
            },
            pendingActions: { type: 'integer' },
            responseRate: { type: 'number' },
            averageResponseTime: { type: 'number' },
            responseTimeUnit: { type: 'string' },
            overdueCorrespondences: { type: 'integer' },
            overdueDetails: {
              type: 'object',
              properties: {
                byDeadline: { type: 'integer' },
                byActions: { type: 'integer' },
                totalUnique: { type: 'integer' }
              }
            },
            lastUpdated: { type: 'string', format: 'date-time' },
            timeRange: {
              type: 'object',
              properties: {
                start: { type: 'string', format: 'date-time', nullable: true },
                end: { type: 'string', format: 'date-time', nullable: true }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
