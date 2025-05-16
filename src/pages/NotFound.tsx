
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-background">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-auth-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-auth-text mb-4">Page Not Found</h2>
        <p className="text-auth-muted mb-8">The page you are looking for does not exist.</p>
        <Button asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
