
import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import PhoneLoginForm from '../components/auth/PhoneLoginForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'phone';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-12 w-12 animate-spin text-auth-primary" />
          <p className="text-lg text-auth-text">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auth-container">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-auth-primary">Secure App</h1>
          <p className="mt-2 text-auth-muted">Your trusted authentication service</p>
        </div>

        {authMode === 'login' && (
          <LoginForm 
            onToggleForm={() => setAuthMode('register')} 
            onPhoneLogin={() => setAuthMode('phone')}
          />
        )}
        
        {authMode === 'register' && (
          <RegisterForm onToggleForm={() => setAuthMode('login')} />
        )}
        
        {authMode === 'phone' && (
          <PhoneLoginForm onToggleForm={() => setAuthMode('login')} />
        )}
      </div>
    </div>
  );
};

export default Auth;
