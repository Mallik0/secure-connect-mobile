
import { supabase } from './client';

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
