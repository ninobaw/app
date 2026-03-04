import React from 'react';
import { Button } from '@/components/ui/button';
import { Reply } from 'lucide-react';
import { CreateCorrespondanceDialog } from './CreateCorrespondanceDialog';

interface CorrespondanceReplyButtonProps {
  correspondance: {
    _id: string;
    subject: string;
    from_address: string;
  };
}

export const CorrespondanceReplyButton = ({ correspondance }: CorrespondanceReplyButtonProps) => {
  return (
    <CreateCorrespondanceDialog 
      parentCorrespondance={correspondance}
    />
  );
};
