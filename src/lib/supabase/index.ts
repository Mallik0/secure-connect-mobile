
// Re-export everything from the modules
export { supabase, sessionExpiryDays } from './client';
export { signUpWithEmail, signInWithEmail } from './emailAuth';
export { 
  signInWithPhone, 
  verifyPhoneOTP, 
  checkUserExistsByPhone,
  linkPhoneToUser
} from './phoneAuth';
export {
  signOut,
  getCurrentUser,
  checkSessionValidity
} from './session';
