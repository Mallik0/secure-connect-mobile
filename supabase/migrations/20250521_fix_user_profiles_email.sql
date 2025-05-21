
-- Update the handle_new_user function to ensure email is never null
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
    COALESCE(NEW.email, ''), -- Ensure email is never null
    COALESCE((NEW.raw_user_meta_data->>'first_name'), ''),
    COALESCE((NEW.raw_user_meta_data->>'last_name'), ''),
    COALESCE((NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE((NEW.created_at), now()),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
