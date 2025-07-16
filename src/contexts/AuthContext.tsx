
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";
import { mockUsers, setCurrentUserByRole } from "@/lib/mock-data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  setTestUser: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Get user profile data from our profiles table
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();
                
              if (error) {
                console.error("Error fetching user profile:", error);
                return;
              }
              
              if (data) {
                const userData: User = {
                  id: currentSession.user.id,
                  email: currentSession.user.email || '',
                  firstName: data.first_name,
                  lastName: data.last_name,
                  role: data.role as UserRole,
                  avatar: data.avatar
                };
                
                setUser(userData);
                console.log("User profile loaded:", userData);
              }
            } catch (error) {
              console.error("Failed to fetch profile:", error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
            
          if (data) {
            const userData: User = {
              id: initialSession.user.id,
              email: initialSession.user.email || '',
              firstName: data.first_name,
              lastName: data.last_name,
              role: data.role as UserRole,
              avatar: data.avatar
            };
            
            setUser(userData);
            console.log("Initial user profile loaded:", userData);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      console.log("Refreshing profile for user:", session.user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.error("Error refreshing profile:", error);
        return;
      }
      
      if (data) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role as UserRole,
          avatar: data.avatar
        };
        
        setUser(userData);
        console.log("Profile refreshed:", userData);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code === 'PGRST116') {
        // No record found - user needs onboarding
        return false;
      } else if (data) {
        // User record exists - already onboarded
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  };
  
  // Then modify your login function in AuthContext.tsx to include onboarding check
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log("Signing in with:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        
        // Handle specific errors
        if (error.message.includes("Email not confirmed")) {
          toast("Email not verified", {
            description: "Please check your email and verify your account before logging in.",
          });
        } else {
          toast("Login failed", {
            description: error.message,
          });
        }
        return false;
      }
      
      toast("Login successful", {
        description: "Welcome back!",
      });
      
      // Check if the user needs to complete onboarding
      if (data.user) {
        const isOnboarded = await checkOnboardingStatus(data.user.id);
        if (!isOnboarded) {
          // Store a flag in sessionStorage to redirect after auth state changes
          sessionStorage.setItem('needsOnboarding', 'true');
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Unexpected login error:", error);
      toast("Login failed", {
        description: "An error occurred during login. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    role: UserRole
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log("Registering with:", email, firstName, lastName, role);
      
      // Register the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
            role,
          },
          emailRedirectTo: window.location.origin + '/auth/login?emailVerified=true'
        }
      });
      
      if (error) {
        console.error("Registration error:", error);
        toast("Registration failed", {
          description: error.message,
        });
        return false;
      }
      
      // Show verification email notification
      toast("Registration successful", {
        description: "A verification email has been sent to your inbox. Please verify your email to continue.",
      });
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast("Registration failed", {
        description: "An error occurred during registration. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast("Logged out", {
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast("Logout failed", {
        description: "An error occurred during logout. Please try again.",
      });
    }
  };

  // Helper function for testing different user roles
  const setTestUser = (role: UserRole) => {
    const testUser = setCurrentUserByRole(role);
    if (testUser) {
      setUser(testUser);
      toast("Test user set", {
        description: `Now viewing as ${role}: ${testUser.firstName} ${testUser.lastName}`,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setTestUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
