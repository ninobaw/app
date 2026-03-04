# Fix TagDialogProvider Structure

## Problème Identifié
```
Uncaught Error: useTagDialog must be used within a TagDialogProvider
```

## Cause
Le `TagDialogProvider` dans `SettingsPage.tsx` n'enveloppe que `CreateTagDialog` mais pas `TagManagementSection`.

## Structure Actuelle (INCORRECTE)
```tsx
return (
  <AppLayout>
    <div>
      {/* TagManagementSection est ici - SANS le provider */}
      <TagManagementSection />
    </div>
    
    <TagDialogProvider>
      <CreateTagDialog />  {/* Seulement ça est dans le provider */}
    </TagDialogProvider>
  </AppLayout>
);
```

## Structure Correcte (À APPLIQUER)
```tsx
return (
  <TagDialogProvider>  {/* Provider au niveau le plus haut */}
    <AppLayout>
      <div>
        {/* Maintenant TagManagementSection a accès au contexte */}
        <TagManagementSection />
      </div>
      
      <CreateTagDialog />
    </AppLayout>
  </TagDialogProvider>
);
```

## Instructions de Correction

1. Dans `src/pages/SettingsPage.tsx`, ligne ~329:

**REMPLACER:**
```tsx
return (
  <AppLayout>
```

**PAR:**
```tsx
return (
  <TagDialogProvider>
    <AppLayout>
```

2. À la fin du fichier, ligne ~440:

**REMPLACER:**
```tsx
      <TagDialogProvider>
        <CreateTagDialog />
      </TagDialogProvider>
    </AppLayout>
  );
```

**PAR:**
```tsx
      <CreateTagDialog />
    </AppLayout>
  </TagDialogProvider>
);
```

## Résultat Attendu
- Plus d'erreur `useTagDialog must be used within a TagDialogProvider`
- `TagManagementSection` peut utiliser `useTagDialog()`
- Le dialogue s'ouvre correctement
