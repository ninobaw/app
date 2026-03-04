import React, { createContext, useContext, useState, useEffect, useRef } from 'react'; // Import useRef
import { User, UserRole, Airport } from '@/shared/types';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import { USER_ROLES } from '@/shared/constants';
import { API_ENDPOINTS } from '@/config/api';
import { ForcePasswordChangeDialog } from '@/components/auth/ForcePasswordChangeDialog';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  refreshUser: () => Promise<void>;
  resetActivityTimer: () => void; // New: Function to reset the inactivity timer
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref to store the timer

  // Log the API endpoints when AuthProvider mounts
  useEffect(() => {
    console.log('AuthContext: Resolved API endpoints:', API_ENDPOINTS.auth);
  }, []);

  const fetchAndSetUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      const fetchedUser = response.data;
      const mappedUser: User = {
        id: fetchedUser.id,
        email: fetchedUser.email,
        firstName: fetchedUser.firstName,
        lastName: fetchedUser.lastName,
        role: fetchedUser.role as UserRole,
        profilePhoto: fetchedUser.profilePhoto,
        airport: fetchedUser.airport as Airport,
        createdAt: new Date(fetchedUser.createdAt),
        updatedAt: new Date(fetchedUser.updatedAt),
        lastLogin: fetchedUser.lastLogin ? new Date(fetchedUser.lastLogin) : undefined,
        isActive: fetchedUser.isActive,
        phone: fetchedUser.phone,
        department: fetchedUser.department,
        mustChangePassword: fetchedUser.mustChangePassword,
        sessionTimeout: fetchedUser.sessionTimeout,
        emailNotifications: fetchedUser.emailNotifications,
        smsNotifications: fetchedUser.smsNotifications,
        pushNotifications: fetchedUser.pushNotifications
      };
      setUser(mappedUser);
      return true;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setUser(null);
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      return false;
    }
  };

  const startActivityTimer = (timeoutMinutes: number) => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    const timeoutMs = timeoutMinutes * 60 * 1000;
    console.log(`AuthContext: Starting activity timer for ${timeoutMinutes} minutes (${timeoutMs}ms)`);
    activityTimerRef.current = setTimeout(() => {
      console.log('AuthContext: Activity timer expired, logging out user');
      logout(); // Call logout when timer expires
      toast({
        title: "Session expirée",
        description: "Vous avez été déconnecté en raison d'une inactivité prolongée.",
        variant: "info"
      });
    }, timeoutMs);
  };

  const resetActivityTimer = () => {
    if (user?.sessionTimeout) {
      startActivityTimer(user.sessionTimeout);
    } else {
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        console.log('AuthContext: Initial check - userId found in localStorage.');
        await fetchAndSetUser(storedUserId);
        // The timer will be started by the second useEffect reacting to `user` state change.
        // No need to call startActivityTimer here directly after fetchAndSetUser.
      } else {
        console.log('AuthContext: Initial check - No userId found in localStorage.');
      }
      setIsLoading(false);
    };

    checkUserSession();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userId' && event.newValue === null) {
        console.log('AuthContext: userId removed from localStorage by storage event');
        console.log('AuthContext: Storage event details:', {
          key: event.key,
          oldValue: event.oldValue,
          newValue: event.newValue,
          url: event.url,
          storageArea: event.storageArea
        });
        console.trace('AuthContext: Stack trace for userId removal');
        
        // Check if this is caused by HMR (Hot Module Replacement) during development
        const isHMREvent = event.url && event.url.includes('localhost') && 
                          window.location.href.includes('localhost');
        
        if (isHMREvent) {
          console.log('AuthContext: Ignoring storage event caused by HMR during development');
          return;
        }
        
        setUser(null);
        if (activityTimerRef.current) {
          clearTimeout(activityTimerRef.current);
        }
        toast({
          title: "Déconnexion",
          description: "Vous avez été déconnecté d'un autre onglet.",
        });
      } else if (event.key === 'userId' && event.newValue !== null && !user) {
        console.log('AuthContext: userId added to localStorage, attempting to log in this tab.');
        fetchAndSetUser(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current); // Clear timer on unmount
      }
    };
  }, []); // This useEffect runs only once on mount.

  useEffect(() => {
    // This useEffect is crucial for starting/restarting the timer when `user` or `user.sessionTimeout` changes.
    if (user?.sessionTimeout) {
      startActivityTimer(user.sessionTimeout);
    } else if (!user && activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null; // Clear ref
    }
  }, [user?.sessionTimeout, user]); // Depend on user.sessionTimeout and user object itself

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('AuthContext: Attempting login for:', email);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user: loggedInUser, token } = response.data;

      const mappedUser: User = {
        id: loggedInUser.id,
        email: loggedInUser.email,
        firstName: loggedInUser.firstName,
        lastName: loggedInUser.lastName,
        role: loggedInUser.role as UserRole,
        profilePhoto: loggedInUser.profilePhoto,
        airport: loggedInUser.airport as Airport,
        createdAt: new Date(loggedInUser.createdAt),
        updatedAt: new Date(loggedInUser.updatedAt),
        isActive: loggedInUser.isActive,
        phone: loggedInUser.phone,
        department: loggedInUser.department,
        mustChangePassword: loggedInUser.mustChangePassword,
        sessionTimeout: loggedInUser.sessionTimeout,
      };
      
      setUser(mappedUser);
      localStorage.setItem('userId', mappedUser.id);
      localStorage.setItem('token', token);
      
      console.log('AuthContext: Login successful, user set and userId stored in localStorage:', mappedUser);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
        variant: "success"
      });
      
      return true;
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error.response?.data?.message || error.message);
      
      // Gestion spécifique pour les comptes désactivés
      if (error.response?.data?.code === 'ACCOUNT_DISABLED') {
        toast({
          title: "Compte désactivé",
          description: error.response.data.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: error.response?.data?.message || "Email ou mot de passe incorrect.",
          variant: "destructive"
        });
      }
      
      // En cas d'erreur, on nettoie le stockage local
      localStorage.removeItem('userId');
      localStorage.removeItem('token');
      return false;
    } finally {
      setIsLoading(false);
      console.log('AuthContext: Login attempt finished, isLoading set to false.');
    }
  };

  const logout = () => {
    console.log('AuthContext: logout() called');
    console.trace('AuthContext: Stack trace for logout call');
    setUser(null);
    
    // Nettoyage complet et forcé du stockage local
    localStorage.clear();
    
    console.log('AuthContext: User logged out and all localStorage cleared');
    
    // Rediriger vers la page de connexion avec paramètre pour indiquer déconnexion
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?logout=true';
    }
    
    toast({
      title: "Déconnexion réussie",
      description: "Veuillez vous reconnecter pour obtenir un nouveau token.",
      variant: "success"
    });
  };

  const refreshUser = async (): Promise<void> => {
    let userIdToRefresh = user?.id;
    
    if (!userIdToRefresh) {
      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) return;
      userIdToRefresh = storedUserId;
    }
    
    try {
      setIsLoading(true);
      const success = await fetchAndSetUser(userIdToRefresh);
      
      if (!success) {
        // Si le rafraîchissement échoue, on déconnecte l'utilisateur
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const rolePermissions = USER_ROLES[user.role as keyof typeof USER_ROLES]?.permissions || [] as string[];

    return [...rolePermissions].includes('all' as any) || [...rolePermissions].includes(permission as any);
  };

  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'SUPER_ADMIN';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission, isSuperAdmin, refreshUser, resetActivityTimer }}>
      {user?.mustChangePassword && <ForcePasswordChangeDialog />}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};