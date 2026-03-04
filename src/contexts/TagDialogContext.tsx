import React, { createContext, useContext, useState } from 'react';

interface TagDialogContextType {
  isCreateDialogOpen: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
}

const TagDialogContext = createContext<TagDialogContextType | undefined>(undefined);

export const TagDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  console.log('TagDialogProvider: Rendering with isCreateDialogOpen =', isCreateDialogOpen);

  const openCreateDialog = () => {
    console.log('TagDialogProvider: Opening create dialog');
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    console.log('TagDialogProvider: Closing create dialog');
    setIsCreateDialogOpen(false);
  };

  return (
    <TagDialogContext.Provider value={{
      isCreateDialogOpen,
      openCreateDialog,
      closeCreateDialog
    }}>
      {children}
    </TagDialogContext.Provider>
  );
};

export const useTagDialog = () => {
  const context = useContext(TagDialogContext);
  if (context === undefined) {
    throw new Error('useTagDialog must be used within a TagDialogProvider');
  }
  return context;
};
