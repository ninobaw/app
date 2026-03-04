import { useState, useEffect } from 'react';
import { tagDialogStore } from '@/stores/tagDialogStore';

export const useTagDialogStore = () => {
  const [isOpen, setIsOpen] = useState(tagDialogStore.getState());

  useEffect(() => {
    const unsubscribe = tagDialogStore.subscribe(() => {
      setIsOpen(tagDialogStore.getState());
    });

    return unsubscribe;
  }, []);

  return {
    isOpen,
    open: tagDialogStore.open,
    close: tagDialogStore.close
  };
};
