
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { Eye, EyeOff, Phone } from 'lucide-react';

type LoginFormProps = {
  onToggleForm: () => void;
  onPhoneLogin: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onPhoneLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await signIn(email, password);
      // Successful login will redirect via useEffect in the Auth component
    } catch (error: any) {
      // Error is already handled in the AuthContext
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Sign In</h2>
      <form onSubmit={handleSubmit}>
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
        
        <div className="mb-6">
          <label htmlFor="password" className="auth-label">Password</label>
          <div className="relative">
            <Input
              id="password"
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
        
        <Button
          type="submit"
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
        
        <div className="mt-4">
          <Button
            type="button"
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={onPhoneLogin}
            disabled={loading}
          >
            <Phone className="mr-2 h-4 w-4" />
            Sign In with Phone
          </Button>
        </div>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-auth-muted">
          Don't have an account?{" "}
          <button onClick={onToggleForm} className="auth-link" disabled={loading}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
