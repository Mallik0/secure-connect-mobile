
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/use-toast';
import { Eye, EyeOff, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

type LoginFormProps = {
  onToggleForm: () => void;
  onPhoneLogin: () => void;
};

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onPhoneLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
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
      console.error("Login error:", error);
      
      // Check for specific errors
      if (error.message.includes("Invalid login credentials")) {
        setLoginError("The email or password you entered is incorrect. If you haven't registered yet, please create an account.");
      } else if (error.message.includes("Email not confirmed")) {
        setLoginError("Please check your email inbox and confirm your email address before signing in.");
      } else {
        setLoginError(error.message || "An error occurred during sign in. Please try again.");
      }
      
      toast({
        title: "Sign In Failed",
        description: "Please check your credentials or create an account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">Sign In</h2>
      
      {loginError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      
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
