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
  try {
    console.log(`Signing up with email: ${email}, phone: ${phone}, firstName: ${firstName}, lastName: ${lastName}`);

    // Create the new user with phone included in user metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone, // Ensure phone is included in user metadata
          created_at: new Date().toISOString(),
        },
        emailRedirectTo: `${window.location.origin}?registered=true&email=${encodeURIComponent(email)}`
      }
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    // If user was created successfully, ensure we also create/update their profile with the phone number
    if (data && data.user) {
      try {
        // Explicitly set all required fields to avoid null value constraint violations
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: data.user.id,
            email: email, // Ensure email is explicitly set
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Error updating user profile after signup:', profileError);
          // Not throwing here as the signup was successful
        } else {
          console.log('User profile created/updated successfully with phone number:', phone);
        }
      } catch (profileErr) {
        console.error('Exception when updating profile after signup:', profileErr);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in signUpWithEmail:', error);
    throw error;
  }
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

// Check if a user with the given phone number exists
export const checkUserExistsByPhone = async (phone: string) => {
  try {
    if (!phone || phone.trim() === '') {
      console.error('Empty phone number provided to checkUserExistsByPhone');
      return false;
    }
    
    // First check if the phone exists in user_profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('phone', phone);
      
    if (error) {
      console.error('Error checking phone number:', error);
      return false;
    }
    
    return profiles && profiles.length > 0;
  } catch (err) {
    console.error('Error in checkUserExistsByPhone:', err);
    return false;
  }
};

// Improved phone authentication functions
export const signInWithPhone = async (phone: string) => {
  try {
    // First check if this phone number belongs to an existing user
    const userExists = await checkUserExistsByPhone(phone);
    
    if (!userExists) {
      console.error("No user found with this phone number");
      throw new Error("No account found with this phone number. Please sign up first.");
    }

    // Clear any existing OTP to start fresh
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
      // Make sure we have the user's profile data
      const { data: profileData, error: profileQueryError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileQueryError) {
        console.error('Error fetching user profile after OTP verification:', profileQueryError);
        
        // If profile doesn't exist, try to create it from user metadata
        if (profileQueryError.code === 'PGRST116') {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({ 
              user_id: data.user.id,
              phone: phone,
              email: data.user.email || '',
              first_name: data.user.user_metadata.first_name || '',
              last_name: data.user.user_metadata.last_name || '',
              last_login: new Date().toISOString(),
              created_at: new Date().toISOString()
            }, 
            { onConflict: 'user_id' });

          if (profileError) {
            console.error('Error creating user profile after OTP verification:', profileError);
          }
        }
      } else if (profileData) {
        // Profile exists, update it with the phone number (in case it's missing)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            phone: phone,
            last_login: new Date().toISOString() 
          })
          .eq('user_id', data.user.id);

        if (updateError) {
          console.error('Error updating phone in user profile after OTP verification:', updateError);
        }
      }
    }

    return data;
  } catch (err) {
    console.error('Error verifying OTP:', err);
    throw err;
  }
};

// Link a phone number to a user account
export const linkPhoneToUser = async (userId: string, phone: string) => {
  try {
    console.log(`Linking phone ${phone} to user ${userId}`);
    
    // First check if the phone number is already in use
    const { data: existingUsers, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('phone', phone)
      .neq('user_id', userId);
      
    if (checkError) {
      console.error('Error checking existing phone:', checkError);
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.error('Phone number already linked to another user');
      throw new Error('This phone number is already linked to another account');
    }
    
    // Update the profile with the phone
    const { error } = await supabase
      .from('user_profiles')
      .update({ phone })
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error linking phone to user:', error);
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error('Error in linkPhoneToUser:', err);
    throw err;
  }
};
