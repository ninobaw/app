import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users as UsersIcon, Settings, Shield, Search, Eye, Edit, MoreHorizontal, Trash2, Power, KeyRound } from 'lucide-react'; // Import KeyRound icon
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { ViewUserDialog } from '@/components/users/ViewUserDialog';
import { ResetPasswordDialog } from '@/components/users/ResetPasswordDialog';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/shared/types';
import { getAbsoluteFilePath } from '@/shared/utils'; // Import getAbsoluteFilePath

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null); // State for user to delete
  
  const { users, isLoading, updateUser, deleteUser, isDeleting } = useUsers();
  const { user: currentUser, hasPermission } = useAuth();

  const handleToggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      updateUser({ id: userId, isActive: !user.isActive });
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDeleteId(userId);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDeleteId) {
      deleteUser(userToDeleteId);
      setUserToDeleteId(null); // Reset the state
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'SUPER_ADMIN': { label: 'Super Admin', color: 'bg-red-100 text-red-800' },
      'ADMINISTRATOR': { label: 'Administrateur', color: 'bg-blue-100 text-blue-800' },
      'AGENT': { label: 'Agent', color: 'bg-gray-100 text-gray-800' },
      'AGENT_BUREAU_ORDRE': { label: 'Agent Bureau d\'Ordre', color: 'bg-green-100 text-green-800' },
      'SUPERVISEUR_BUREAU_ORDRE': { label: 'Superviseur Bureau d\'Ordre', color: 'bg-purple-100 text-purple-800' },
      'DIRECTEUR_GENERAL': { label: 'Directeur Général', color: 'bg-indigo-100 text-indigo-800' },
      'DIRECTEUR': { label: 'Directeur', color: 'bg-blue-100 text-blue-800' },
      'SOUS_DIRECTEUR': { label: 'Sous-Directeur', color: 'bg-cyan-100 text-cyan-800' },
      // Anciens rôles pour compatibilité
      'APPROVER': { label: 'Approbateur', color: 'bg-green-100 text-green-800' },
      'USER': { label: 'Utilisateur', color: 'bg-gray-100 text-gray-800' },
      'VISITOR': { label: 'Visiteur', color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const email = user.email || '';
    const department = user.department || '';

    return (
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const canManageUsers = hasPermission('manage_users');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement des utilisateurs...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-500 mt-1">
              Gérez les utilisateurs et leurs permissions
            </p>
          </div>
          {canManageUsers && <CreateUserDialog />}
        </div>

        {/* Statistiques utilisateurs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: 'Total Utilisateurs', value: users.length, icon: UsersIcon, color: 'text-aviation-sky' },
            { title: 'Actifs', value: users.filter(u => u.isActive).length, icon: Shield, color: 'text-green-600' },
            { title: 'Enfidha', value: users.filter(u => u.airport === 'ENFIDHA').length, icon: Shield, color: 'text-blue-600' },
            { title: 'Monastir', value: users.filter(u => u.airport === 'MONASTIR').length, icon: Shield, color: 'text-purple-600' },
            { title: 'Général', value: users.filter(u => u.airport === 'GENERALE').length, icon: Shield, color: 'text-indigo-600' }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recherche */}
        <Card>
          <CardHeader>
            <CardTitle>Rechercher Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par nom, email ou département..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="w-5 h-5 mr-2 text-aviation-sky" />
              Utilisateurs ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Liste de tous les utilisateurs du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Aéroport</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profilePhoto ? getAbsoluteFilePath(user.profilePhoto) : undefined} /> {/* Use the constructed absolute URL */}
                          <AvatarFallback className="bg-aviation-sky text-white text-xs">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{user.department || 'Non défini'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.airport}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        onClick={() => canManageUsers && handleToggleUserStatus(user.id)}
                        style={{ cursor: canManageUsers ? 'pointer' : 'default' }}
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir profil
                          </DropdownMenuItem>
                          {canManageUsers && (
                            <>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleToggleUserStatus(user.id)}
                              >
                                <Power className="mr-2 h-4 w-4" /> {/* Changed icon to Power */}
                                {user.isActive ? 'Désactiver le compte' : 'Activer le compte'} {/* Changed text */}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleResetPassword(user)}
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Réinitialiser le mot de passe
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600"
                                onClick={() => handleDeleteClick(user.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer définitivement
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        {selectedUser && (
          <>
            <ViewUserDialog 
              user={selectedUser} 
              open={viewDialogOpen} 
              onOpenChange={setViewDialogOpen} 
            />
            <EditUserDialog 
              user={selectedUser} 
              open={editDialogOpen} 
              onOpenChange={setEditDialogOpen} 
            />
            <ResetPasswordDialog 
              user={selectedUser} 
              open={resetPasswordDialogOpen} 
              onOpenChange={setResetPasswordDialogOpen} 
            />
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDeleteId} onOpenChange={(open) => !open && setUserToDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement l'utilisateur et toutes les données associées de nos serveurs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Users;