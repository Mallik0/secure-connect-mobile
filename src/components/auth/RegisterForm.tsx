
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';

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
      await signUp(email, password, firstName, lastName, phone);
      toast({
        title: "Success",
        description: "Registration successful! Please check your email for verification.",
      });
      // Switch to login form after successful registration
      onToggleForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up",
        variant: "destructive",
      });
    }
  };

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
          disabled={loading}
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
