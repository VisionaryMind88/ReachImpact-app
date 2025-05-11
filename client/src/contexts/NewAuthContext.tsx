import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authAPI, userAPI } from "../lib/api-adapter";
import { queryClient } from "../lib/queryClient";
import { User } from "../../shared/schema";
import { useToast } from "../hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: {
    email: string;
    password: string;
    fullName: string;
    companyName?: string;
    role?: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Get current user data
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        return await authAPI.getCurrentUser();
      } catch (err) {
        return null;
      }
    },
  });
  
  // Update authentication state when user data changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (userData) => {
      // Update user data in query cache
      queryClient.setQueryData(['/api/user'], userData);
      
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    },
    onError: (error: any) => {
      // Show error message
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (userData) => {
      // Update user data in query cache
      queryClient.setQueryData(['/api/user'], userData);
      
      // Show success message
      toast({
        title: "Registration successful",
        description: `Welcome to ReachImpact, ${userData.fullName}!`,
      });
    },
    onError: (error: any) => {
      // Show error message
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Unable to create account",
        variant: "destructive",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      // Clear user data in query cache
      queryClient.setQueryData(['/api/user'], null);
      
      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: any) => {
      // Show error message
      toast({
        title: "Logout failed",
        description: error.response?.data?.message || "Unable to log out",
        variant: "destructive",
      });
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (userData) => {
      // Update user data in query cache
      queryClient.setQueryData(['/api/user'], userData);
      
      // Show success message
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error: any) => {
      // Show error message
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Unable to update profile",
        variant: "destructive",
      });
    },
  });
  
  // Authentication methods
  const login = async (email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  };
  
  const register = async (userData: {
    email: string;
    password: string;
    fullName: string;
    companyName?: string;
    role?: string;
    phone?: string;
  }) => {
    return registerMutation.mutateAsync(userData);
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const updateProfile = async (profileData: Partial<User>) => {
    return updateProfileMutation.mutateAsync(profileData);
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;