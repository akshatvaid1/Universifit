import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  Mail,
  Lock,
  User,
  Users,
  Compass,
  Check,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Input } from './ui';
import {
  loginUserApi,
  signupUserApi,
  forgotPasswordApi,
  resetPasswordApi,
  verifyEmailApi,
  resendVerificationApi,
} from '../services/api';
import { CreatorOnboardingWizard } from './CreatorOnboardingWizard';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'verify';

interface AuthPagesProps {
  initialMode?: 'login' | 'signup' | 'forgot' | 'reset' | 'verify';
  onAuthSuccess?: (role: 'BUYER' | 'CREATOR' | 'ADMIN') => void;
  onBack?: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  onAuthSuccess,
  onBack,
  onNavigateTerms,
  onNavigatePrivacy,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'CREATOR'>('BUYER');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Recovery & Verification State
  const [resetToken, setResetToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Creator Onboarding Step Trigger
  const [isEnteringCreatorOnboarding, setIsEnteringCreatorOnboarding] = useState(false);

  // Check URL hash for OAuth errors, reset tokens, or verify tokens
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('auth_error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const err = params.get('auth_error');
      if (err) setErrorMsg(decodeURIComponent(err));
    } else if (hash.includes('reset_token=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const tok = params.get('reset_token');
      if (tok) {
        setResetToken(tok);
        setMode('reset');
        setInfoMsg('Please set your new password.');
      }
    } else if (hash.includes('verify_token=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const tok = params.get('verify_token');
      if (tok) {
        setResetToken(tok);
        setMode('verify');
        setInfoMsg('Please confirm email verification.');
      }
    }
  }, []);

  // Cooldown timer for resend verification
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Quick Demo Auto-Fill Handlers
  const handleQuickDemoLogin = (role: 'BUYER' | 'CREATOR') => {
    if (role === 'CREATOR') {
      setEmail('marcus@universifit.com');
      setPassword('password123');
    } else {
      setEmail('akshat@universifit.com');
      setPassword('password123');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUserApi(email.trim(), password);
      if (res.success && res.user) {
        const role = res.user.role || 'BUYER';
        if (onAuthSuccess) onAuthSuccess(role);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please provide your full legal name.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Required Terms of Service Checkbox Verification
    if (!termsAccepted) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signupUserApi({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role: selectedRole,
      });

      if (res.success && res.user) {
        // Transition to Email Verification screen
        setInfoMsg(`Verification code dispatched to ${email.trim()}.`);
        setMode('verify');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPasswordApi(email.trim());
      setInfoMsg(res.message || 'Password reset link sent! Check your inbox.');
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const tokenToUse = resetToken || verificationCode;
    if (!tokenToUse) {
      setErrorMsg('Password reset token or code is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordApi(tokenToUse, password);
      setInfoMsg(res.message || 'Password reset successful! You can now log in.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMode('login');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const tokenOrCode = verificationCode.trim() || resetToken;
    if (!tokenOrCode && !email.trim()) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyEmailApi({
        token: resetToken || undefined,
        code: verificationCode.trim() || undefined,
        email: email.trim() || undefined,
      });

      if (res.success) {
        setInfoMsg('Email verified successfully! Welcome to Universifit.');
        setTimeout(() => {
          if (selectedRole === 'CREATOR') {
            setIsEnteringCreatorOnboarding(true);
          } else {
            if (onAuthSuccess) onAuthSuccess('BUYER');
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Check your code or request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setErrorMsg('Please specify your email address.');
      return;
    }
    if (resendCooldown > 0) return;

    try {
      setIsLoading(true);
      await resendVerificationApi(email.trim());
      setInfoMsg('New verification code dispatched to your email.');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // If Creator registered, enter the 4-step wizard
  if (isEnteringCreatorOnboarding) {
    return (
      <CreatorOnboardingWizard
        initialName={fullName || 'Coach Partner'}
        initialEmail={email}
        onComplete={() => {
          if (onAuthSuccess) onAuthSuccess('CREATOR');
        }}
        onBack={() => setIsEnteringCreatorOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#121315] text-[#F7F4EF] font-sans flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="border-b border-white/[0.08] bg-[#16171A] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#F7F4EF]/70 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#B8703F]" />
            <span>Back to Home</span>
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onBack) onBack();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-[#B8703F] text-white font-display font-black text-sm flex items-center justify-center shadow-md">
              U
            </div>
            <span className="font-display font-bold text-base text-white tracking-tight">
              Universifit
            </span>
          </a>

          <div className="w-20" />
        </div>
      </div>

      {/* Main Auth Form Container */}
      <div className="max-w-md w-full mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-[#F7F4EF] tracking-tight">
              {mode === 'login' && 'Welcome Back to Universifit'}
              {mode === 'signup' && 'Join the Elite Coaching Network'}
              {mode === 'forgot' && 'Reset Your Password'}
              {mode === 'reset' && 'Set New Password'}
              {mode === 'verify' && 'Verify Your Email'}
            </h1>
            <p className="text-xs sm:text-sm text-[#F7F4EF]/60 font-normal">
              {mode === 'login' && 'Sign in to access your customized programs, bookings, and studio.'}
              {mode === 'signup' && 'Create your account to train with vetted practitioners or monetize your craft.'}
              {mode === 'forgot' && 'Enter your email address and we will send you a recovery link.'}
              {mode === 'reset' && 'Choose a secure password for your Universifit account.'}
              {mode === 'verify' && 'Enter the 6-digit confirmation code sent to your inbox.'}
            </p>
          </div>

          <Card variant="charcoal" className="p-6 sm:p-8 bg-[#16171A] border-white/[0.08] shadow-2xl space-y-6">
            
            {/* ========================================================================= */}
            {/* SIGNUP: ROLE SELECTION CARDS (BUYER VS CREATOR) */}
            {/* ========================================================================= */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#F7F4EF]/70 uppercase tracking-wider block">
                  Select Your Account Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Buyer / Member Role */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('BUYER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A] ${
                      selectedRole === 'BUYER'
                        ? 'bg-[#B8703F]/20 text-[#F7F4EF] border-[#B8703F] shadow-sm'
                        : 'bg-white/[0.02] text-[#F7F4EF]/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Compass className="w-5 h-5 text-[#B8703F]" />
                      {selectedRole === 'BUYER' && <Check className="w-4 h-4 text-[#B8703F]" />}
                    </div>
                    <div className="mt-3">
                      <span className="font-display font-bold text-xs block text-white">
                        I'm a Member
                      </span>
                      <span className="text-[10px] text-[#F7F4EF]/50 leading-tight block mt-0.5">
                        Train with vetted coaches
                      </span>
                    </div>
                  </button>

                  {/* Creator / Coach Role */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('CREATOR')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-[#6E8B6F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171A] ${
                      selectedRole === 'CREATOR'
                        ? 'bg-[#6E8B6F]/20 text-[#F7F4EF] border-[#6E8B6F] shadow-sm'
                        : 'bg-white/[0.02] text-[#F7F4EF]/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Users className="w-5 h-5 text-[#6E8B6F]" />
                      {selectedRole === 'CREATOR' && <Check className="w-4 h-4 text-[#6E8B6F]" />}
                    </div>
                    <div className="mt-3">
                      <span className="font-display font-bold text-xs block text-white">
                        I'm a Coach
                      </span>
                      <span className="text-[10px] text-[#F7F4EF]/50 leading-tight block mt-0.5">
                        Offer 1:1, courses & squad
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Info / Success Banner */}
            {infoMsg && (
              <div className="p-3.5 rounded-xl bg-[#6E8B6F]/15 border border-[#6E8B6F]/30 text-xs text-[#6E8B6F] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#6E8B6F]" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* MODE 1: LOGIN FORM */}
            {/* ========================================================================= */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#F7F4EF]/70">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setInfoMsg('');
                        setMode('forgot');
                      }}
                      className="text-[11px] text-[#B8703F] hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Universifit
                </Button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* MODE 2: SIGNUP FORM WITH MANDATORY TERMS CHECKBOX */}
            {/* ========================================================================= */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <Input
                  label="Full Legal Name"
                  placeholder="e.g. Akshat Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Create Password"
                  type="password"
                  placeholder="•••••••••••• (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                {/* Terms of Service & Privacy Acceptance Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-[#F7F4EF]/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#B8703F] focus:ring-[#B8703F] accent-[#B8703F] cursor-pointer"
                      required
                    />
                    <span className="leading-relaxed">
                      I agree to Universifit's{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onNavigateTerms) onNavigateTerms();
                          else window.open('/#terms', '_blank');
                        }}
                        className="text-[#B8703F] underline hover:text-[#c98352] font-semibold"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onNavigatePrivacy) onNavigatePrivacy();
                          else window.open('/#privacy', '_blank');
                        }}
                        className="text-[#B8703F] underline hover:text-[#c98352] font-semibold"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {selectedRole === 'CREATOR'
                    ? 'Continue to Coach Onboarding'
                    : 'Create Member Account'}
                </Button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* MODE 3: FORGOT PASSWORD FORM */}
            {/* ========================================================================= */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<KeyRound className="w-4 h-4" />}
                >
                  Send Recovery Link
                </Button>

                {resetToken && (
                  <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl text-center space-y-2">
                    <p className="text-[11px] text-[#F7F4EF]/70">
                      ⚡ Quick Link (Development Mode):
                    </p>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs text-[#B8703F] font-bold underline cursor-pointer"
                    >
                      Click here to Enter New Password &rarr;
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ========================================================================= */}
            {/* MODE 4: RESET PASSWORD FORM */}
            {/* ========================================================================= */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {!resetToken && (
                  <Input
                    label="Reset Code or Token"
                    placeholder="Enter code from email"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    required
                  />
                )}

                <Input
                  label="New Password"
                  type="password"
                  placeholder="•••••••••••• (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Update & Secure Password
                </Button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* MODE 5: EMAIL VERIFICATION FORM */}
            {/* ========================================================================= */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                <div className="text-center space-y-1 pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#B8703F]/15 border border-[#B8703F]/30 text-[#B8703F] mx-auto flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#F7F4EF]/70">
                    We sent a 6-digit confirmation code to:
                  </p>
                  <p className="text-xs font-mono font-bold text-white">
                    {email || 'your email address'}
                  </p>
                </div>

                <Input
                  label="6-Digit Verification Code"
                  placeholder="e.g. 481920"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center tracking-widest text-lg font-mono"
                  required
                />

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Verify Email & Continue
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0}
                    className="text-xs text-[#B8703F] hover:underline font-semibold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : 'Resend verification code'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Social Authentication (Shown on Login & Signup) */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="pt-2 border-t border-white/[0.08] text-center space-y-2">
                <span className="text-[11px] text-[#F7F4EF]/50">Or continue with</span>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/auth/google';
                  }}
                  className="w-full py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            {/* DEMO AUTO-FILL CHIPS (Login mode only) */}
            {mode === 'login' && (
              <div className="pt-2 border-t border-white/[0.08] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#F7F4EF]/40 tracking-wider block text-center">
                  Quick Demo Login
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('BUYER')}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-[#F7F4EF] font-semibold border border-white/10 transition-colors cursor-pointer"
                  >
                    Demo Member (Akshat)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('CREATOR')}
                    className="p-2 rounded-xl bg-[#B8703F]/15 hover:bg-[#B8703F]/25 text-[11px] text-[#B8703F] font-bold border border-[#B8703F]/30 transition-colors cursor-pointer"
                  >
                    Demo Coach (Marcus)
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Mode Footer */}
            <div className="pt-2 text-center text-xs text-[#F7F4EF]/60 font-medium">
              {mode === 'login' && (
                <p>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setInfoMsg('');
                      setMode('signup');
                    }}
                    className="text-[#B8703F] hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setInfoMsg('');
                      setMode('login');
                    }}
                    className="text-[#B8703F] hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              )}

              {(mode === 'forgot' || mode === 'reset' || mode === 'verify') && (
                <p>
                  Remembered your password or finished?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setInfoMsg('');
                      setMode('login');
                    }}
                    className="text-[#B8703F] hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              )}
            </div>

          </Card>
        </motion.div>
      </div>

      {/* Footer bar */}
      <div className="py-6 text-center text-xs text-[#F7F4EF]/40 font-mono border-t border-white/[0.06]">
        Universifit Coaching Ecosystem • 256-Bit SSL Secured
      </div>
    </div>
  );
};
