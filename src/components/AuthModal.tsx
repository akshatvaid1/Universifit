import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  loginUserApi,
  signupUserApi,
  forgotPasswordApi,
  resetPasswordApi,
  verifyEmailApi,
  resendVerificationApi,
} from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onAuthSuccess?: (role: 'BUYER' | 'CREATOR') => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onAuthSuccess,
  onNavigateTerms,
  onNavigatePrivacy,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify'>(
    initialMode === 'register' ? 'register' : 'login'
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  // Recovery & Verification
  const [resetToken, setResetToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync mode with prop change & capture referral code
  React.useEffect(() => {
    setMode(initialMode === 'register' ? 'register' : 'login');
    setIsSuccess(false);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || sessionStorage.getItem('ascend_ref') || '';
      if (ref) {
        setReferralCode(ref.toUpperCase());
        sessionStorage.setItem('ascend_ref', ref.toUpperCase());
      }
    } catch (_e) {}
  }, [initialMode, isOpen]);

  // Cooldown countdown
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please provide both email and password.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await loginUserApi(email.trim(), password);
        if (res.success && res.user) {
          setIsSuccess(true);
          setTimeout(() => {
            onClose();
            setIsSuccess(false);
            if (onAuthSuccess) {
              onAuthSuccess(res.user.role === 'CREATOR' ? 'CREATOR' : 'BUYER');
            }
          }, 1000);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Authentication error occurred.');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Please provide your full legal name.');
        return;
      }
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please provide both email and password.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (!termsAccepted) {
        setErrorMessage('You must accept the Terms of Service and Privacy Policy to create an account.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await signupUserApi({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role: 'BUYER',
          referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
        });

        if (res.success && res.user) {
          setInfoMessage(`Verification code dispatched to ${email.trim()}.`);
          setMode('verify');
          setResendCooldown(60);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Registration failed.');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Please enter your registered email address.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await forgotPasswordApi(email.trim());
        setInfoMessage(res.message || 'Password reset link sent to your email.');
        if (res.resetToken) setResetToken(res.resetToken);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to send reset link.');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'reset') {
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await resetPasswordApi(resetToken || verificationCode, password);
        setInfoMessage(res.message || 'Password reset successfully! You can now log in.');
        setTimeout(() => setMode('login'), 1200);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to reset password.');
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'verify') {
      const codeToUse = verificationCode.trim() || resetToken;
      if (!codeToUse && !email.trim()) {
        setErrorMessage('Please enter the 6-digit verification code.');
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
          setIsSuccess(true);
          setTimeout(() => {
            onClose();
            setIsSuccess(false);
            if (onAuthSuccess) onAuthSuccess('BUYER');
          }, 1000);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Verification failed. Please check your code.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendCooldown > 0) return;
    try {
      setIsLoading(true);
      await resendVerificationApi(email.trim());
      setInfoMessage('New verification code sent to your email.');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = '/auth/google';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#16171A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Splash */}
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-[#6E8B6F]/20 text-[#6E8B6F] border border-[#6E8B6F]/40 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="font-display font-bold text-xl text-white">
                {mode === 'verify' ? 'Email Verified!' : 'Authentication Successful'}
              </h3>
              <p className="text-xs text-neutral-400">Redirecting to your Universifit Space...</p>
            </motion.div>
          ) : (
            <div>
              {/* Header */}
              <div className="text-center space-y-1 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#B8703F] text-white font-display font-black text-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  U
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  {mode === 'login' && 'Sign In to Universifit'}
                  {mode === 'register' && 'Create Your Account'}
                  {mode === 'forgot' && 'Reset Password'}
                  {mode === 'reset' && 'Set New Password'}
                  {mode === 'verify' && 'Verify Your Email'}
                </h2>
                <p className="text-xs text-neutral-400">
                  {mode === 'login' && 'Welcome back! Enter your details to continue.'}
                  {mode === 'register' && 'Join the world-class coaching & physical mastery ecosystem.'}
                  {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
                  {mode === 'reset' && 'Create a strong, new password.'}
                  {mode === 'verify' && `We sent a code to ${email || 'your email'}.`}
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Info Message */}
              {infoMessage && (
                <div className="mb-4 p-3 rounded-xl bg-[#6E8B6F]/15 border border-[#6E8B6F]/30 text-xs text-[#6E8B6F] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#6E8B6F]" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="text"
                        placeholder="Alex Morgan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#1e1e22] rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 border border-white/[0.08] focus:border-[#B8703F] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="email"
                        placeholder="alex@universifit.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#1e1e22] rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 border border-white/[0.08] focus:border-[#B8703F] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-300">
                        {mode === 'reset' ? 'New Password' : 'Password'}
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage('');
                            setInfoMessage('');
                            setMode('forgot');
                          }}
                          className="text-[11px] font-semibold text-[#B8703F] hover:underline cursor-pointer"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="password"
                        placeholder="•••••••••••• (min. 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#1e1e22] rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 border border-white/[0.08] focus:border-[#B8703F] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {(mode === 'register' || mode === 'reset') && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#1e1e22] rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 border border-white/[0.08] focus:border-[#B8703F] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                {mode === 'verify' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-300">6-Digit Code</label>
                    <input
                      required
                      type="text"
                      placeholder="481920"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-[#1e1e22] rounded-full py-2.5 px-4 text-center text-lg font-mono tracking-widest text-white border border-white/[0.08] focus:border-[#B8703F] focus:outline-none"
                    />
                  </div>
                )}

                {/* Optional Referral Code field on signup */}
                {mode === 'register' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-300">
                        Referral / Partner Code <span className="text-neutral-500 font-normal">(Optional)</span>
                      </label>
                      {referralCode && (
                        <span className="text-[10px] text-[#6E8B6F] font-bold">✓ Referral Tagged</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. MARCUS-UNIVERSIFIT"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full bg-[#1e1e22] rounded-full py-2.5 px-4 text-sm font-mono uppercase tracking-wider text-white border border-white/[0.08] focus:border-[#B8703F] focus:outline-none placeholder:text-neutral-600"
                    />
                  </div>
                )}

                {/* Terms of Service Checkbox (Signup Mode) */}
                {mode === 'register' && (
                  <div className="pt-1">
                    <label className="flex items-start gap-2 text-xs text-neutral-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#B8703F] accent-[#B8703F] cursor-pointer"
                        required
                      />
                      <span className="leading-tight text-[11px]">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onNavigateTerms) onNavigateTerms();
                            else window.open('/#terms', '_blank');
                          }}
                          className="text-[#B8703F] underline font-semibold"
                        >
                          Terms
                        </button>{' '}
                        &{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onNavigatePrivacy) onNavigatePrivacy();
                            else window.open('/#privacy', '_blank');
                          }}
                          className="text-[#B8703F] underline font-semibold"
                        >
                          Privacy
                        </button>
                        .
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-2 rounded-full bg-[#B8703F] text-white font-bold text-sm hover:bg-[#a56437] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Sign In'}
                        {mode === 'register' && 'Create Account'}
                        {mode === 'forgot' && 'Send Reset Link'}
                        {mode === 'reset' && 'Update Password'}
                        {mode === 'verify' && 'Verify Email'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend Verification Link in Verify Mode */}
              {mode === 'verify' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-xs text-[#B8703F] hover:underline font-semibold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </span>
                  </button>
                </div>
              )}

              {/* Social Login Options */}
              {(mode === 'login' || mode === 'register') && (
                <div className="mt-4 pt-4 border-t border-white/[0.08] text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

              {/* Mode switch */}
              <div className="mt-4 text-center text-xs text-neutral-400">
                {mode === 'login' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setInfoMessage('');
                        setMode('register');
                      }}
                      className="text-[#B8703F] font-bold hover:underline ml-1 cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    {mode === 'register' ? 'Already have an account?' : 'Back to'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setInfoMessage('');
                        setMode('login');
                      }}
                      className="text-[#B8703F] font-bold hover:underline ml-1 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
