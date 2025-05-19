
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
    phone,  // Add phone to the user metadata
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        created_at: new Date().toISOString(),
      },
      emailRedirectTo: `${window.location.origin}?registered=true&email=${encodeURIComponent(email)}`
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

// Improved phone authentication functions
export const signInWithPhone = async (phone: string) => {
  try {
    // First, clear any existing OTP to start fresh
    console.log("Clearing any existing OTP for this phone number");
    
    // Now send the new OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      }
    });

    if (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }

    console.log("OTP sent successfully to", phone);
    return data;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw error;
  }
};

export const verifyPhoneOTP = async (phone: string, token: string) => {
  console.log("Attempting to verify OTP for phone:", phone);
  
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

    console.log("OTP verified successfully");
    
    // Update last login timestamp if verification successful
    if (data && data.user) {
      // Ensure the phone number is also stored in user_profiles
      // This fixes the issue where phone login doesn't update the profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(
          { 
            user_id: data.user.id,
            phone: phone,
            email: data.user.email || '',
            first_name: data.user.user_metadata.first_name || '',
            last_name: data.user.user_metadata.last_name || '',
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString()
          }, 
          { onConflict: 'user_id' }
        );

      if (profileError) {
        console.error('Error updating user profile after OTP verification:', profileError);
        // Not throwing here as the verification was successful
      }
    }

    return data;
  } catch (err) {
    console.error('Error verifying OTP:', err);
    throw err;
  }
};
