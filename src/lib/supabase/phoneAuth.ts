
import { supabase } from './client';

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

    // Now send the OTP via SMS
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms', // Using SMS instead of WhatsApp
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
