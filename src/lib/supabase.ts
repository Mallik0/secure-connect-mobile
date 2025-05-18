import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Use the actual Supabase project URL and key
const supabaseUrl = 'https://ntlrvofjorgmukdfhkah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bHJ2b2Zqb3JnbXVrZGZoa2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODY1MTAsImV4cCI6MjA2Mjk2MjUxMH0.qqThciE7l4XfX9yGBXSbBYe4natEEQGlIxL9YRcVa8g';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Set session expiration to 30 days (increased from 7 days)
export const sessionExpiryDays = 30;

// Custom user management functions
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  phone: string
) => {
  // Create the new user - we no longer need to check for existing users
  // as the trigger will handle profile creation
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        created_at: new Date().toISOString(),
      },
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    console.error('Error signing up:', error);
    throw error;
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw error;
  }

  // Update last login timestamp
  if (data && data.user) {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', data.user.id);

    if (updateError) {
      console.error('Error updating last login:', updateError);
      // Not throwing here as the login was successful
    }
  }

  return data;
};

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

// Phone authentication functions
export const signInWithPhone = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: 'sms',
      // Removed expiresIn parameter as it's not supported in this context
    }
  });

  if (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }

  return data;
};

export const verifyPhoneOTP = async (phone: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });

    if (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }

    // Update last login timestamp if verification successful
    if (data && data.user) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', data.user.id);

      if (updateError) {
        console.error('Error updating last login:', updateError);
        // Not throwing here as the login was successful
      }
    }

    return data;
  } catch (err) {
    console.error('Error verifying OTP:', err);
    throw err;
  }
};
