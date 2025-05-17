
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { signInWithPhone, verifyPhoneOTP } from '../../lib/supabase';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Label } from '../ui/label';

type PhoneLoginFormProps = {
  onToggleForm: () => void;
};

const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onToggleForm }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSentTimestamp, setOtpSentTimestamp] = useState<Date | null>(null);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    // Simple phone number validation
    const phonePattern = /^\+?[0-9]{10,15}$/;
    if (!phonePattern.test(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number with country code (e.g., +1234567890)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await signInWithPhone(phone);
      setOtpSent(true);
      setOtpSentTimestamp(new Date()); // Record when OTP was sent
      toast({
        title: "Success",
        description: "OTP has been sent to your phone. Valid for 10 minutes.",
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await verifyPhoneOTP(phone, otp);
      toast({
        title: "Success",
        description: "Phone number verified successfully",
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      let errorMessage = "Failed to verify OTP";
      if (error.code === "otp_expired") {
        errorMessage = "OTP has expired. Please request a new one.";
        setOtpSent(false);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle resending of OTP
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await signInWithPhone(phone);
      setOtpSentTimestamp(new Date());
      toast({
        title: "Success",
        description: "New OTP has been sent to your phone",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Login with Phone</h2>
      
      {!otpSent ? (
        <form onSubmit={handleSendOTP}>
          <div className="mb-4">
            <label htmlFor="phone" className="auth-label">Phone Number</label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className="auth-input"
              disabled={loading}
              required
            />
            <p className="text-xs text-auth-muted mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>
          
          <Button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-6">
            <Label htmlFor="otp" className="auth-label mb-2 block">Enter OTP</Label>
            <div className="flex justify-center mb-2">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot 
                        key={index} 
                        index={index} 
                        className={slot.char ? "border-primary" : ""}
                      />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>
            <p className="text-xs text-auth-muted mt-1 text-center">
              Enter the 6-digit code sent to {phone}
            </p>
            {otpSentTimestamp && (
              <p className="text-xs text-auth-muted mt-1 text-center">
                OTP sent at {otpSentTimestamp.toLocaleTimeString()}, valid for 10 minutes
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOtpSent(false)}
                disabled={loading}
                className="w-full"
              >
                Change Number
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full"
              >
                Resend OTP
              </Button>
            </div>
          </div>
        </form>
      )}
      
      <div className="mt-4 text-center">
        <p className="text-auth-muted">
          Want to use email instead?{" "}
          <button onClick={onToggleForm} className="auth-link" disabled={loading}>
            Sign In with Email
          </button>
        </p>
      </div>
    </div>
  );
};

export default PhoneLoginForm;
