# 🔧 DIAGNOSTIC - Problème Chat DG et Attachements

## ✅ **Ce qui fonctionne (Backend):**
- ✅ Routes workflow-chat créées et enregistrées
- ✅ Messages de chat persistés en base de données  
- ✅ Workflows existants avec DG assigné
- ✅ Dossiers d'attachements créés
- ✅ Méthode `addChatMessage()` fonctionnelle

## ❌ **Problèmes persistants:**
1. **DG ne voit pas le chat du workflow**
2. **Erreurs 404 sur les attachements**

## 🔍 **Diagnostic Frontend - Étapes à suivre:**

### **1. Vérifier l'accès DG au dashboard**
```bash
# Dans la console du navigateur, vérifier:
console.log('User role:', user?.role);
console.log('User ID:', user?.id);
```

### **2. Vérifier le composant ResponseConversationDialog**
- Le DG accède-t-il bien au `ResponseConversationDialog` ?
- L'onglet "Chat Workflow" est-il visible ?
- L'ID du workflow est-il récupéré ?

### **3. Tester les appels API**
Dans la console du navigateur:
```javascript
// Test de récupération du workflow
fetch('/api/workflow-chat/by-correspondance/CORRESPONDANCE_ID', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log);

// Test de récupération des messages
fetch('/api/workflow-chat/WORKFLOW_ID/messages', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log);
```

### **4. Vérifier les erreurs dans la console**
- Erreurs de compilation TypeScript ?
- Erreurs de réseau ?
- Erreurs d'authentification ?

## 🎯 **Solutions possibles:**

### **Solution 1: Problème d'import du WorkflowChatPanel**
```typescript
// Vérifier dans ResponseConversationDialog.tsx
import WorkflowChatPanel from '../workflow/WorkflowChatPanel';
```

### **Solution 2: Problème de récupération de l'ID workflow**
```typescript
// Ajouter des logs dans useEffect
useEffect(() => {
  const fetchWorkflowId = async () => {
    try {
      console.log('🔍 Fetching workflow for correspondance:', correspondanceId);
      const response = await api.get(`/api/workflow-chat/by-correspondance/${correspondanceId}`);
      console.log('📡 Workflow response:', response.data);
      if (response.data.success && response.data.data) {
        setWorkflowId(response.data.data._id);
        console.log('✅ Workflow ID set:', response.data.data._id);
      }
    } catch (error) {
      console.error('❌ Error fetching workflow:', error);
    }
  };
  // ...
}, [correspondanceId, isOpen]);
```

### **Solution 3: Problème d'authentification**
Vérifier que le token JWT est valide et que l'utilisateur a les bons droits.

### **Solution 4: Problème d'attachements**
```typescript
// Dans WorkflowChatPanel.tsx, modifier downloadAttachment:
const downloadAttachment = async (filename: string, originalName: string) => {
  try {
    console.log('📥 Downloading:', filename);
    const response = await api.get(`/api/workflow-chat/attachment/${filename}`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    console.log('✅ Download response:', response);
    // ... rest of the function
  } catch (error) {
    console.error('❌ Download error:', error.response?.data || error.message);
  }
};
```

## 🧪 **Tests à effectuer:**

### **Test 1: Connexion DG**
1. Se connecter en tant que DG
2. Aller au dashboard DG
3. Vérifier que le composant `DirectorGeneralDashboard` se charge
4. Vérifier que `DGResponseReviewPanel` affiche des correspondances

### **Test 2: Ouverture du dialogue**
1. Cliquer sur une correspondance dans le panel DG
2. Vérifier que `ResponseConversationDialog` s'ouvre
3. Vérifier que les onglets sont visibles
4. Cliquer sur l'onglet "Chat Workflow"

### **Test 3: Chargement du chat**
1. Vérifier que `workflowId` est défini
2. Vérifier que `WorkflowChatPanel` se charge
3. Vérifier que les messages apparaissent

### **Test 4: Attachements**
1. Essayer de télécharger un attachement
2. Vérifier l'URL de téléchargement
3. Vérifier les headers de la requête

## 📋 **Données de test disponibles:**
- ✅ Workflows avec DG assigné
- ✅ Messages de chat existants  
- ✅ Fichiers d'attachement créés
- ✅ Routes backend fonctionnelles

## 🚀 **Prochaines étapes:**
1. **Ouvrir la console du navigateur**
2. **Se connecter en tant que DG**
3. **Suivre les étapes de diagnostic**
4. **Identifier l'erreur exacte**
5. **Appliquer la solution correspondante**

---

**💡 Conseil:** Commencer par vérifier les logs dans la console du navigateur pour identifier l'erreur exacte.
