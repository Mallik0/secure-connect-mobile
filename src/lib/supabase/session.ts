
import { supabase } from './client';
import { sessionExpiryDays } from './client';

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
  
  return data?.user || null;
};

// Function to check session expiry
export const checkSessionValidity = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  
  // Get user profile to check last login
  const user = data.session.user;
  
  if (user) {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('last_login')
      .eq('user_id', user.id)
      .single();
      
    if (error || !profiles) {
      console.error('Error fetching user profile:', error);
      return false;
    }
    
    const lastLogin = new Date(profiles.last_login);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // If more than sessionExpiryDays days, sign out
    if (diffDays > sessionExpiryDays) {
      await signOut();
      return false;
    }
    
    return true;
  }
  
  return false;
};
