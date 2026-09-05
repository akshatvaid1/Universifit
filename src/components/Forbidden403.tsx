import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Card, Button, Badge } from './ui';

interface Forbidden403Props {
  requiredRole?: 'CREATOR' | 'ADMIN' | 'BUYER';
  userRole?: string;
  onBackHome: () => void;
  onLoginDifferent: () => void;
}

export const Forbidden403: React.FC<Forbidden403Props> = ({
  requiredRole = 'CREATOR',
  userRole = 'BUYER',
  onBackHome,
  onLoginDifferent,
}) => {
  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'CREATOR':
        return 'Verified Creator / Coach';
      case 'ADMIN':
        return 'Platform Administrator';
      case 'BUYER':
        return 'Enrolled Athlete / Client';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <Card
        variant="charcoal"
        className="w-full max-w-lg p-8 sm:p-10 bg-[#16171A] border-white/[0.1] shadow-2xl text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="neutral" size="sm" className="font-mono text-amber-400 border-amber-500/30">
              HTTP 403 FORBIDDEN
            </Badge>
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-tight">
            Restricted Area Access
          </h2>
          <p className="text-xs sm:text-sm text-[#F7F4EF]/70 leading-relaxed max-w-md mx-auto">
            This module is reserved exclusively for{' '}
            <strong className="text-[#B8703F]">{getRoleTitle(requiredRole)}</strong> accounts.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs space-y-2 text-left font-mono">
          <div className="flex items-center justify-between text-white/50">
            <span>Your Current Role:</span>
            <span className="text-white font-bold">{getRoleTitle(userRole)}</span>
          </div>
          <div className="flex items-center justify-between text-white/50">
            <span>Required Privilege:</span>
            <span className="text-[#B8703F] font-bold">{getRoleTitle(requiredRole)}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="w-full sm:flex-1"
            onClick={onBackHome}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Home
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full sm:flex-1"
            onClick={onLoginDifferent}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Switch Account
          </Button>
        </div>
      </Card>
    </div>
  );
};
