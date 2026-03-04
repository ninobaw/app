import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { USER_ROLES, AIRPORTS } from '@/shared/constants';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { getAbsoluteFilePath } from '@/shared/utils';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (!user) return null;

  const roleLabel = USER_ROLES[user.role]?.label || user.role;
  const airportName = AIRPORTS[user.airport]?.name || user.airport;

  const avatarSrc = user.profilePhoto ? getAbsoluteFilePath(user.profilePhoto) : undefined;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* La zone de recherche a été supprimée ici */}
        <div className="flex-1"></div> {/* Ajout d'un div flex-1 vide pour pousser les éléments à droite */}

        <div className="flex items-center space-x-4">
          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-aviation-sky text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {roleLabel}
                    </Badge>
                    <span className="text-xs text-gray-500">{airportName}</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};