
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { Eye, EyeOff, Phone } from 'lucide-react';
import { signInWithPhone, verifyPhoneOTP } from '../../lib/supabase';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Alert, AlertDescription } from '../ui/alert';

type RegisterFormProps = {
  onToggleForm: () => void;
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, loading } = useAuth();

  // Phone verification states
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  // Handle the countdown timer for OTP
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and + character
    const value = e.target.value;
    if (value === '' || value === '+' || /^\+[0-9]*$/.test(value)) {
      setPhone(value);
    }
  };

  const validatePhone = (phoneNumber: string): boolean => {
    // Basic phone validation - should start with + and contain 10-15 digits
    const phoneRegex = /^\+[0-9]{10,15}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendOtp = async () => {
    if (!validatePhone(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number in format +1234567890",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setVerifying(true);
      
      // For registration, we'll use a custom OTP approach since we're just verifying
      // not signing in
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
        }
      });
      
      if (error) {
        throw error;
      }
      
      setOtpSent(true);
      setCountdown(600); // 10 minutes expiry
      setOtpToken('');
      toast({
        title: "Success",
        description: "OTP sent to your phone",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      setVerifying(true);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
        }
      });
      
      if (error) {
        throw error;
      }
      
      setCountdown(600);
      setOtpToken('');
      toast({
        title: "Success",
        description: "OTP resent to your phone",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpToken || otpToken.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid OTP",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setVerifying(true);
      
      // For registration, we'll just verify the OTP but not complete the sign in
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otpToken,
        type: 'sms',
        options: {
          shouldCreateUser: false // Don't create user here, we'll do it in the signup step
        }
      });
      
      if (error) {
        throw error;
      }
      
      // If verification is successful but we don't want to complete sign-in yet
      // we'll just mark the phone as verified for registration
      setPhoneVerified(true);
      setIsVerifyingPhone(false);
      toast({
        title: "Success",
        description: "Phone number verified successfully",
      });
      
      // Sign out any temporary session created during phone verification
      await supabase.auth.signOut();
      
    } catch (error: any) {
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        toast({
          title: "Error",
          description: "Your verification code has expired or is invalid. Please request a new one.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to verify OTP",
          variant: "destructive",
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !phone || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!phoneVerified) {
      setIsVerifyingPhone(true);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Simple phone number validation
    const phonePattern = /^\+?[0-9]{10,15}$/;
    if (!phonePattern.test(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      // Now pass the verified phone number to signUp
      await signUp(email, password, firstName, lastName, phone);
      toast({
        title: "Success",
        description: "Registration successful! Please check your email for verification.",
      });
      // Show email verification alert without switching to login
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up",
        variant: "destructive",
      });
    }
  };

  // If verifying phone, show the phone verification UI
  if (isVerifyingPhone) {
    return (
      <div className="auth-card">
        <h2 className="auth-title">Verify Your Phone Number</h2>
        
        {!otpSent ? (
          <div>
            <p className="text-center mb-4 text-auth-muted">
              We'll send a verification code to {phone}
            </p>
            <Button
              onClick={handleSendOtp}
              className="auth-button mb-4"
              disabled={verifying}
            >
              {verifying ? "Sending..." : "Send Verification Code"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsVerifyingPhone(false)}
              disabled={verifying}
            >
              Back to Registration
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="auth-label">Verification Code (OTP)</label>
                {countdown > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              
              <InputOTP
                maxLength={6}
                value={otpToken}
                onChange={(value) => setOtpToken(value)}
                containerClassName="gap-2 justify-center"
                disabled={verifying}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="w-10 h-12 text-center" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              
              <div className="text-center mt-4">
                <p className="text-sm">
                  {countdown === 0 ? (
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={handleResendOtp}
                      disabled={verifying}
                      className="p-0 h-auto"
                    >
                      {verifying ? 'Resending...' : 'Resend OTP'}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">OTP sent to {phone}</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleVerifyOtp}
                className="flex-1"
                disabled={verifying || otpToken.length !== 6}
              >
                {verifying ? "Verifying..." : "Verify"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsVerifyingPhone(false)}
                disabled={verifying}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">Create an Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="firstName" className="auth-label">First Name</label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="auth-input"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="auth-label">Last Name</label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="auth-input"
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="auth-label">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="auth-input"
            disabled={loading}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="phone" className="auth-label">Phone Number</label>
          <div className="relative flex items-center">
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+1234567890"
              className="auth-input pl-8"
              disabled={loading || phoneVerified}
              required
            />
            <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {!phoneVerified && (
              <Button 
                type="button" 
                variant="outline" 
                className="ml-2 whitespace-nowrap"
                onClick={() => setIsVerifyingPhone(true)}
                disabled={loading || !phone}
              >
                Verify
              </Button>
            )}
            {phoneVerified && (
              <div className="ml-2 text-green-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-xs">Verified</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="registerPassword" className="auth-label">Password</label>
          <div className="relative">
            <Input
              id="registerPassword"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input pr-10"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="auth-input"
            disabled={loading}
            required
          />
        </div>
        
        <Button
          type="submit"
          className="auth-button"
          disabled={loading || !phoneVerified}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-auth-muted">
          Already have an account?{" "}
          <button onClick={onToggleForm} className="auth-link" disabled={loading}>
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
