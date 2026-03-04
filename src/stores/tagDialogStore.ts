// Store simple pour le dialogue des tags
let isDialogOpen = false;
let listeners: (() => void)[] = [];

export const tagDialogStore = {
  // Obtenir l'état actuel
  getState: () => isDialogOpen,
  
  // Ouvrir le dialogue
  open: () => {
    console.log('tagDialogStore: Opening dialog');
    isDialogOpen = true;
    listeners.forEach(listener => listener());
  },
  
  // Fermer le dialogue
  close: () => {
    console.log('tagDialogStore: Closing dialog');
    isDialogOpen = false;
    listeners.forEach(listener => listener());
  },
  
  // S'abonner aux changements
  subscribe: (listener: () => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};
