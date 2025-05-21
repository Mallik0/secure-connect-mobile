import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../ui/use-toast';
import PhoneVerificationForm from './PhoneVerificationForm';
import SignUpForm from './SignUpForm';
import usePhoneValidation from './PhoneValidator';

type RegisterFormProps = {
  onToggleForm: () => void;
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone verification state
  const {
    phone,
    setPhone,
    phoneVerified,
    setPhoneVerified,
    handlePhoneChange,
    validatePhoneWithFeedback
  } = usePhoneValidation();
  
  // Phone verification UI state
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  
  // Auth context
  const { signUp, loading } = useAuth();

  const handleVerifyPhone = () => {
    if (validatePhoneWithFeedback()) {
      setIsVerifyingPhone(true);
    }
  };

  const handlePhoneVerificationSuccess = () => {
    setPhoneVerified(true);
    setIsVerifyingPhone(false);
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

    try {
      // Now pass the verified phone number to signUp
      await signUp(email, password, firstName, lastName, phone);
      toast({
        title: "Success",
        description: "Registration successful! Please check your email for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up",
        variant: "destructive",
      });
    }
  };

  // If verifying phone, show phone verification UI
  if (isVerifyingPhone) {
    return (
      <div className="auth-card">
        <h2 className="auth-title">Verify Your Phone Number</h2>
        <PhoneVerificationForm 
          phone={phone}
          onVerificationSuccess={handlePhoneVerificationSuccess}
          onCancel={() => setIsVerifyingPhone(false)}
        />
      </div>
    );
  }

  // Otherwise, show the main registration form
  return (
    <SignUpForm 
      loading={loading}
      firstName={firstName}
      setFirstName={setFirstName}
      lastName={lastName}
      setLastName={setLastName}
      email={email}
      setEmail={setEmail}
      phone={phone}
      setPhone={setPhone}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      handlePhoneChange={handlePhoneChange}
      phoneVerified={phoneVerified}
      onVerifyPhone={handleVerifyPhone}
      onSubmit={handleSubmit}
      onToggleForm={onToggleForm}
    />
  );
};

export default RegisterForm;
