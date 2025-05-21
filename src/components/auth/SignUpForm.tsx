
import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff, Phone } from 'lucide-react';
import { toast } from '../ui/use-toast';

type SignUpFormProps = {
  loading: boolean;
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  phoneVerified: boolean;
  onVerifyPhone: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleForm: () => void;
};

const SignUpForm: React.FC<SignUpFormProps> = ({
  loading,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  handlePhoneChange,
  phoneVerified,
  onVerifyPhone,
  onSubmit,
  onToggleForm
}) => {
  return (
    <div className="auth-card">
      <h2 className="auth-title">Create an Account</h2>
      <form onSubmit={onSubmit}>
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
                onClick={onVerifyPhone}
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

export default SignUpForm;
