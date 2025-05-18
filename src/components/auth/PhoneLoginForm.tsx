
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { Phone, ArrowLeft } from 'lucide-react';
import { supabase, signInWithPhone, verifyPhoneOTP } from '../../lib/supabase';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../ui/input-otp";

type PhoneLoginFormProps = {
  onToggleForm: () => void;
};

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onToggleForm }) => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowResend, setAllowResend] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setAllowResend(false);
    setCountdown(60); // 60 seconds countdown
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setAllowResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    // Simple phone number validation
    const phonePattern = /^\+?[0-9]{10,15}$/;
    if (!phonePattern.test(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number (e.g., +1234567890)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await signInWithPhone(phone);
      setOtpSent(true);
      startCountdown();
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await verifyPhoneOTP(phone, otp);
      toast({
        title: "Success",
        description: "Phone number verified successfully!",
      });
      // Redirect will happen automatically via the Auth component
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!allowResend) return;
    
    try {
      setLoading(true);
      await signInWithPhone(phone);
      startCountdown();
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your phone.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Sign In with Phone</h2>
      
      {!otpSent ? (
        <form onSubmit={handleSendOTP}>
          <div className="mb-6">
            <label htmlFor="phone" className="auth-label">Phone Number</label>
            <div className="flex items-center">
              <Phone className="absolute ml-3 text-gray-400" size={18} />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="auth-input pl-10"
                disabled={loading}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Format: +[country code][phone number]
            </p>
          </div>
          
          <Button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Sending Code..." : "Send Verification Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-6">
            <label htmlFor="otp" className="auth-label">Verification Code</label>
            <div className="flex justify-center my-4">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            {countdown > 0 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Resend code in {countdown} seconds
              </p>
            )}
            
            {allowResend && (
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-center w-full text-sm text-auth-primary mt-2 hover:underline"
                disabled={loading}
              >
                Resend verification code
              </button>
            )}
          </div>
          
          <Button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
      )}
      
      <div className="mt-4 text-center">
        <button 
          onClick={otpSent ? () => setOtpSent(false) : onToggleForm} 
          className="flex items-center justify-center mx-auto text-auth-muted hover:text-auth-text"
          disabled={loading}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          {otpSent ? "Change Phone Number" : "Back to Email Sign In"}
        </button>
      </div>
    </div>
  );
};

export default PhoneLoginForm;
