
import React, { useState, useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import PhoneLoginForm from '../components/auth/PhoneLoginForm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { X } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'phone';

const Auth: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { user, loading, verifyUserAccount } = useAuth();
  const navigate = useNavigate();
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showVerificationNeeded, setShowVerificationNeeded] = useState(false);
  
  // Check URL parameters for registration success indicator
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const registered = urlParams.get('registered');
    const email = urlParams.get('email');
    
    if (registered === 'true' && email) {
      setShowEmailAlert(true);
      setUserEmail(decodeURIComponent(email));
      // Clean URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  useEffect(() => {
    if (user) {
      // Check if user has completed all verification steps
      verifyUserAccount().then(isVerified => {
        if (isVerified) {
          navigate('/dashboard');
        } else {
          // User is logged in but not fully verified
          setShowVerificationNeeded(true);
        }
      });
    }
  }, [user, navigate, verifyUserAccount]);

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
      <div className="w-full max-w-md relative">
        {showEmailAlert && (
          <div className="absolute top-0 left-0 right-0 mb-4 z-10 transform -translate-y-full">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTitle className="flex justify-between items-center">
                <span>Email Verification Required</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setShowEmailAlert(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertTitle>
              <AlertDescription>
                <p>We've sent a verification link to <strong>{userEmail}</strong>.</p> 
                <p className="mt-1">Please check your email and verify your account before logging in.</p>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {showVerificationNeeded && user && (
          <div className="mb-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTitle className="flex justify-between items-center">
                <span>Account Verification Required</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setShowVerificationNeeded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertTitle>
              <AlertDescription>
                {!user.isEmailVerified && (
                  <p className="mb-2">Please check your email and verify your email address.</p>
                )}
                {!user.isPhoneVerified && (
                  <p>Please add and verify your phone number in your profile.</p>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
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
