import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
        <ShieldX className="w-10 h-10 text-red-400" />
      </div>
      <h1 className="text-3xl font-bold text-surface-50 mb-2">Access Denied</h1>
      <p className="text-surface-400 mb-8">You don't have permission to view this page.</p>
      <Link to="/" className="btn-primary">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
