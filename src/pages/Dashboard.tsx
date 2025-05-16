
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-auth-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-auth-text mb-4">Welcome, {user.firstName}!</h1>
          <p className="text-auth-muted mb-6">You're logged into your secure account.</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-auth-text mb-2">Profile Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-auth-muted">Name:</span> {user.firstName} {user.lastName}</p>
                <p><span className="text-auth-muted">Email:</span> {user.email}</p>
                <p><span className="text-auth-muted">Phone:</span> {user.phone}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-auth-text mb-2">Account Security</h3>
              <p className="text-sm text-auth-muted mb-3">Your session will automatically expire after 7 days of inactivity.</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLogout}
                disabled={loading}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
