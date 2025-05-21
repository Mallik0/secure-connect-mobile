
import React, { useState } from 'react';
import { toast } from '../ui/use-toast';

export const validatePhone = (phoneNumber: string): boolean => {
  // Basic phone validation - should start with + and contain 10-15 digits
  const phoneRegex = /^\+[0-9]{10,15}$/;
  return phoneRegex.test(phoneNumber);
};

export const usePhoneValidation = () => {
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and + character
    const value = e.target.value;
    if (value === '' || value === '+' || /^\+[0-9]*$/.test(value)) {
      setPhone(value);
    }
  };
  
  const validatePhoneWithFeedback = (): boolean => {
    if (!validatePhone(phone)) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number in format +1234567890",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return {
    phone,
    setPhone,
    phoneVerified,
    setPhoneVerified,
    handlePhoneChange,
    validatePhoneWithFeedback
  };
};

export default usePhoneValidation;
