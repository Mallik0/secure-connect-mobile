
import React, { useState, useEffect } from 'react';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { signInWithPhone, verifyPhoneOTP } from '../../lib/supabase';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from '../ui/input-otp';

type PhoneLoginFormProps = {
  onToggleForm: () => void;
};

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onToggleForm }) => {
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  // Handle the countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format seconds into mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validatePhone = (phoneNumber: string): boolean => {
    // Basic phone validation - should start with + and contain 10-15 digits
    const phoneRegex = /^\+[0-9]{10,15}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    
    if (!validatePhone(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number in format +1234567890",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      await signInWithPhone(phone);
      setIsOtpSent(true);
      setCountdown(600); // 10 minutes expiry
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
      setLoading(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    try {
      setResending(true);
      await signInWithPhone(phone);
      setCountdown(600); // 10 minutes expiry
      toast({
        title: "Success",
        description: "OTP sent to your phone",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpToken || otpToken.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid OTP",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      await verifyPhoneOTP(phone, otpToken);
      toast({
        title: "Success",
        description: "Phone number verified successfully",
      });
      // Successful verification will trigger auth state change
      // Auth context will handle redirect
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and + character
    const value = e.target.value;
    if (value === '' || value === '+' || /^\+[0-9]*$/.test(value)) {
      setPhone(value);
    }
  };
  
  const handleOtpChange = (value: string) => {
    setOtpToken(value);
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Sign In with Phone</h2>
      
      {!isOtpSent ? (
        <form onSubmit={handleSendOtp}>
          <div className="mb-6">
            <label htmlFor="phone" className="auth-label">Phone Number</label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+1234567890"
              className="auth-input"
              disabled={loading}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>
          
          <Button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
            ) : (
              <>Send OTP</>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="otp" className="auth-label">Verification Code (OTP)</label>
              {countdown > 0 && (
                <span className="text-sm text-muted-foreground">
                  Expires in {formatTime(countdown)}
                </span>
              )}
            </div>
            
            <InputOTP
              value={otpToken}
              onChange={handleOtpChange}
              maxLength={6}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <React.Fragment key={index}>
                      <InputOTPSlot index={index} className="w-10 h-10" />
                      {index !== slots.length - 1 && index % 3 === 2 && (
                        <InputOTPSeparator />
                      )}
                    </React.Fragment>
                  ))}
                </InputOTPGroup>
              )}
            />
            
            <div className="text-center mt-2">
              <p className="text-sm">
                {countdown === 0 ? (
                  <Button 
                    type="button" 
                    variant="link" 
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="p-0 h-auto"
                  >
                    {resending ? 'Resending...' : 'Resend OTP'}
                  </Button>
                ) : (
                  <span className="text-muted-foreground">OTP sent to {phone}</span>
                )}
              </p>
            </div>
          </div>
          
          <Button
            type="submit"
            className="auth-button"
            disabled={loading || otpToken.length !== 6}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
            ) : (
              <>Verify OTP</>
            )}
          </Button>
        </form>
      )}
      
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={onToggleForm}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Email Login
        </Button>
      </div>
    </div>
  );
};

export default PhoneLoginForm;
