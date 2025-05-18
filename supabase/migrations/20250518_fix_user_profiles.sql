
-- First, create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    created_at, 
    last_login
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'first_name'), ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name'), ''),
    COALESCE((NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE((NEW.created_at), now()),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    -- Create a trigger to create a profile whenever a user signs up
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Enable RLS on the user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to read their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile" 
ON public.user_profiles 
FOR SELECT USING (auth.uid() = user_id);

-- Create a policy that allows the service role to update profiles
-- This is needed for the signUp function
CREATE POLICY IF NOT EXISTS "Service role can manage profiles" 
ON public.user_profiles 
USING (true);
