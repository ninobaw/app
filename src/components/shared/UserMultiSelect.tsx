import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { Badge } from '@/components/ui/badge';

interface UserMultiSelectProps {
  selectedUserIds: string[];
  onUserIdsChange: (userIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const UserMultiSelect: React.FC<UserMultiSelectProps> = ({
  selectedUserIds,
  onUserIdsChange,
  placeholder = "Sélectionner des utilisateurs...",
  disabled = false,
}) => {
  const { users, isLoading: isLoadingUsers } = useUsers();
  const [open, setOpen] = useState(false);

  const toggleUser = (userId: string) => {
    const newSelectedUserIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];
    onUserIdsChange(newSelectedUserIds);
  };

  const getSelectedUserNames = () => {
    if (selectedUserIds.length === 0) {
      return placeholder;
    }
    // Map selected IDs to full user objects, then to JSX elements
    const selectedUsers = selectedUserIds
      .map((id) => users.find((user) => user.id === id))
      .filter(Boolean); // Filter out any null/undefined if user not found
    
    return (
      <div className="flex flex-wrap gap-1">
        {selectedUsers.map((user) => (
          <Badge key={user!.id} variant="secondary" className="flex items-center">
            {user!.firstName} {user!.lastName}
            <X className="ml-1 h-3 w-3 cursor-pointer" onClick={(e) => {
              e.stopPropagation(); // Empêche la fermeture du popover lors du clic sur le 'X'
              toggleUser(user!.id); // Pass the actual user ID
            }} />
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] flex-wrap"
          disabled={disabled || isLoadingUsers}
        >
          {getSelectedUserNames()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un utilisateur..." />
          <CommandList>
            {isLoadingUsers ? (
              <CommandEmpty>Chargement des utilisateurs...</CommandEmpty>
            ) : users.length === 0 ? (
              <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
            ) : (
              <CommandGroup>
                {users.filter(user => user.isActive).map((user) => {
                  return (
                    <CommandItem
                      key={user.id}
                      value={`${user.firstName} ${user.lastName} ${user.email}`}
                      onSelect={() => {
                        toggleUser(user.id);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation();
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {user.firstName} {user.lastName} ({user.email})
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};