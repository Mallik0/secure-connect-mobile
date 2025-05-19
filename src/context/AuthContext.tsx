
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  supabase, 
  getCurrentUser, 
  signOut, 
  checkSessionValidity, 
  signUpWithEmail,
  signInWithEmail
} from '../lib/supabase';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialCheckDone = useRef(false);
  const processingAuthChange = useRef(false);

  // Initial auth check - only runs once
  useEffect(() => {
    const checkAuth = async () => {
      if (initialCheckDone.current) return;
      initialCheckDone.current = true;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if session is valid based on session expiry
        const isSessionValid = await checkSessionValidity();
        if (!isSessionValid) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Get current user
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Get additional user info from profiles
          const { data, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
            
          if (profileError || !data) {
            console.error('Error fetching user profile:', profileError);
            setUser(null);
          } else {
            setUser({
              id: currentUser.id,
              email: data.email || currentUser.email || '',
              firstName: data.first_name,
              lastName: data.last_name,
              phone: data.phone
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError('Authentication check failed');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Auth state changes subscription
  useEffect(() => {
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        // Avoid multiple rapid state changes
        if (processingAuthChange.current) {
          console.log('Already processing auth change, skipping duplicate event');
          return;
        }
        
        processingAuthChange.current = true;
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          processingAuthChange.current = false;
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          // Delay auth state update to prevent rapid successive updates
          setTimeout(async () => {
            try {
              // Only fetch profile if we need to (if user is null or id changed)
              if (!user || user.id !== session.user.id) {
                const { data, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single();

                if (profileError) {
                  console.error('Error fetching user profile:', profileError);
                  
                  // If profile not found, try to create it from user metadata
                  // This helps fix the phone login issue
                  if (profileError.code === 'PGRST116') {
                    const metadata = session.user.user_metadata;
                    const { error: createError } = await supabase
                      .from('user_profiles')
                      .insert({
                        user_id: session.user.id,
                        email: session.user.email || '',
                        first_name: metadata?.first_name || '',
                        last_name: metadata?.last_name || '',
                        phone: session.user.phone || metadata?.phone || '',
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString()
                      });
                      
                    if (createError) {
                      console.error('Error creating user profile:', createError);
                      setUser(null);
                    } else {
                      setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        firstName: metadata?.first_name || '',
                        lastName: metadata?.last_name || '',
                        phone: session.user.phone || metadata?.phone || ''
                      });
                    }
                  } else {
                    setUser(null);
                  }
                } else if (data) {
                  setUser({
                    id: session.user.id,
                    email: data.email || session.user.email || '',
                    firstName: data.first_name,
                    lastName: data.last_name,
                    phone: data.phone || session.user.phone || ''
                  });
                }
              }
            } catch (err) {
              console.error('Error updating user after sign in:', err);
            } finally {
              processingAuthChange.current = false;
            }
          }, 100);
        } else {
          processingAuthChange.current = false;
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [user]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await signUpWithEmail(email, password, firstName, lastName, phone);
      
      // After signup, we'll wait for the user to verify their email before logging them in
      // or directly sign them in if email verification is not required in your Supabase setup
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await signInWithEmail(email, password);
      
      // The auth state listener will update the user state
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
