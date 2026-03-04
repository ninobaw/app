import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  Key, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  Terminal,
  Database
} from 'lucide-react';

export const CreateAdminGuide: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const createUserScript = `// Script pour créer un utilisateur administrateur
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/aerodoc');

// Schéma utilisateur (simplifié)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
  permissions: [String]
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@aerodoc.com' });
    if (existingAdmin) {
      console.log('Administrateur existe déjà !');
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer l'utilisateur admin
    const admin = new User({
      email: 'admin@aerodoc.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await admin.save();
    console.log('Administrateur créé avec succès !');
    console.log('Email: admin@aerodoc.com');
    console.log('Mot de passe: admin123');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();`;

  return (
    <div className="space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Solution :</strong> Si aucun utilisateur n'existe dans la base de données, 
          créez un administrateur avec ce guide étape par étape.
        </AlertDescription>
      </Alert>

      {/* Méthode 1: Script Node.js */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Méthode 1: Script Node.js (Recommandé)
            </CardTitle>
            <Badge className="bg-blue-100 text-blue-800">FACILE</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Créez un script pour ajouter automatiquement un utilisateur administrateur.
          </p>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">1. Créer le fichier createAdmin.js :</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span>// createAdmin.js</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(createUserScript)}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <pre className="whitespace-pre-wrap">{createUserScript}</pre>
            </div>

            <h4 className="font-medium text-sm">2. Exécuter le script :</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span># Dans le dossier backend</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard('cd backend && node createAdmin.js')}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div>cd backend && node createAdmin.js</div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Identifiants créés :</strong>
              <br />• Email : <code>admin@aerodoc.com</code>
              <br />• Mot de passe : <code>admin123</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Méthode 2: MongoDB Direct */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Méthode 2: Commandes MongoDB directes
            </CardTitle>
            <Badge className="bg-purple-100 text-purple-800">AVANCÉ</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Insérez directement l'utilisateur dans MongoDB (mot de passe pré-hashé).
          </p>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Commandes MongoDB :</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span># Se connecter à MongoDB</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard('mongo')}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div>mongo</div>
              
              <div className="mt-4 flex items-center justify-between">
                <span># Utiliser la base aerodoc</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard('use aerodoc')}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div>use aerodoc</div>

              <div className="mt-4 flex items-center justify-between">
                <span># Insérer l'admin</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(`db.users.insertOne({
  email: "admin@aerodoc.com",
  password: "$2a$10$rOzJqKqKqKqKqKqKqKqOzJqKqKqKqKqKqKqKqKqK",
  firstName: "Admin",
  lastName: "System",
  role: "admin",
  isActive: true,
  permissions: ["view_documents", "create_documents", "edit_documents", "delete_documents", "view_correspondances", "create_correspondances", "edit_correspondances", "delete_correspondances", "view_users", "create_users", "edit_users", "delete_users", "manage_settings", "manage_forms", "manage_templates", "view_reports"],
  createdAt: new Date(),
  updatedAt: new Date()
})`)}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs break-all">
                db.users.insertOne(&#123;<br />
                &nbsp;&nbsp;email: "admin@aerodoc.com",<br />
                &nbsp;&nbsp;password: "$2a$10$...", // Hash de "admin123"<br />
                &nbsp;&nbsp;firstName: "Admin",<br />
                &nbsp;&nbsp;lastName: "System",<br />
                &nbsp;&nbsp;role: "admin",<br />
                &nbsp;&nbsp;isActive: true,<br />
                &nbsp;&nbsp;permissions: [...],<br />
                &nbsp;&nbsp;createdAt: new Date(),<br />
                &nbsp;&nbsp;updatedAt: new Date()<br />
                &#125;)
              </div>
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Note :</strong> Le hash du mot de passe est complexe. 
              Utilisez plutôt la Méthode 1 qui gère automatiquement le hashage.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Méthode 3: Interface d'administration */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Méthode 3: Endpoint de création d'admin
            </CardTitle>
            <Badge className="bg-green-100 text-green-800">SÉCURISÉ</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Créez un endpoint temporaire pour initialiser le premier administrateur.
          </p>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">Test avec curl :</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span># Créer admin via API</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard('curl -X POST http://[IP_SERVEUR]:5000/api/auth/create-admin -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@aerodoc.com\\",\\"password\\":\\"admin123\\",\\"firstName\\":\\"Admin\\",\\"lastName\\":\\"System\\"}"')}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="break-all">
                curl -X POST http://[IP_SERVEUR]:5000/api/auth/create-admin \<br />
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                &nbsp;&nbsp;-d '&#123;"email":"admin@aerodoc.com","password":"admin123","firstName":"Admin","lastName":"System"&#125;'
              </div>
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Sécurité :</strong> Cet endpoint doit être supprimé après création du premier admin 
              ou protégé par une clé secrète.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Test final */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-indigo-600" />
            Test de connexion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Une fois l'administrateur créé, testez la connexion :
          </p>

          <div className="bg-green-100 p-4 rounded-lg">
            <h5 className="font-medium text-green-800 text-sm mb-2">✅ Identifiants de test :</h5>
            <div className="text-green-700 text-sm space-y-1">
              <div><strong>Email :</strong> admin@aerodoc.com</div>
              <div><strong>Mot de passe :</strong> admin123</div>
            </div>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Succès :</strong> Si la connexion fonctionne, le problème était l'absence d'utilisateurs !
              Vous pouvez maintenant créer d'autres utilisateurs via l'interface d'administration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
