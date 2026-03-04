import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, ArrowLeft, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CorrespondanceLinkButtonProps {
  correspondance: any;
  onNavigate?: (correspondanceId: string) => void;
}

export const CorrespondanceLinkButton: React.FC<CorrespondanceLinkButtonProps> = ({
  correspondance,
  onNavigate
}) => {
  const navigate = useNavigate();

  const handleLinkClick = (targetId: string, linkType: 'parent' | 'response') => {
    if (onNavigate) {
      onNavigate(targetId);
    } else {
      navigate(`/correspondances/${targetId}`);
    }
  };

  // Correspondance entrante avec réponse
  if (correspondance.type === 'INCOMING' && correspondance.outgoingCorrespondanceId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs bg-green-50 border-green-200 hover:bg-green-100"
              onClick={() => handleLinkClick(correspondance.outgoingCorrespondanceId, 'response')}
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              <span>Réponse</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voir la réponse envoyée</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Correspondance sortante (réponse) avec parent
  if (correspondance.type === 'OUTGOING' && correspondance.parentCorrespondanceId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
              onClick={() => handleLinkClick(correspondance.parentCorrespondanceId, 'parent')}
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              <span>Original</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voir la correspondance originale</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Correspondance avec liaison bidirectionnelle
  if (correspondance.responseToCorrespondanceId && correspondance.parentCorrespondanceId) {
    return (
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
                onClick={() => handleLinkClick(correspondance.parentCorrespondanceId, 'parent')}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span>Original</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voir la correspondance originale</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Badge variant="secondary" className="h-7 px-2 text-xs">
          <Link2 className="w-3 h-3 mr-1" />
          Liée
        </Badge>
      </div>
    );
  }

  // Aucune liaison
  return null;
};

export default CorrespondanceLinkButton;
