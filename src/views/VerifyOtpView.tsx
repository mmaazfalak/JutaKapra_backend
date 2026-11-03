import React, { useState, useEffect } from 'react';
import { KeyRound, AlertCircle, ArrowRight, ArrowLeft, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';

export const VerifyOtpView: React.FC = () => {
  const {
    navigateTo,
    otpResetEmail,
    verifyOtpCode,
    resendOtpCode,
    setVerifiedResetOtp,
  } = useStore();

  const [email, setEmail] = useState(otpResetEmail || '');
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 mins in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sync state if store email updates
  useEffect(() => {
    if (otpResetEmail) {
      setEmail(otpResetEmail);
    }
  }, [otpResetEmail]);

  // 15-minute countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setError('Please provide the registered email address.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOtpCode(email.trim(), otp.trim());
      if (result.success) {
        setVerifiedResetOtp(otp.trim());
        navigateTo('reset-password');
      } else {
        setError(result.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setIsResending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await resendOtpCode(email.trim());
      if (res.success) {
        setTimeLeft(15 * 60);
        setOtp('');
        setInfoMessage('A new 6-digit OTP code has been dispatched to your email.');
      } else {
        setError(res.message || 'Failed to resend OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans bg-[#fafafa]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full mx-auto space-y-6"
      >
        <button
          onClick={() => navigateTo('forgot-password')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-neutral-500 hover:text-[#0a0a0a] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Email Address</span>
        </button>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xl text-[#0a0a0a]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-[#0a0a0a] mb-3">
              <KeyRound className="w-6 h-6 text-[#e5341f]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
              Enter 6-Digit OTP
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Please enter the 6-digit verification code sent to{' '}
              <strong className="text-[#0a0a0a]">{email || 'your email'}</strong>
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2"
            >
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} noValidate className="space-y-4">
            {/* 6-Digit Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="otp-input"
                  className="text-xs font-semibold text-neutral-800"
                >
                  Verification Code
                </label>
                <span
                  className={`text-xs font-mono font-semibold ${
                    timeLeft < 120 ? 'text-red-600 animate-pulse' : 'text-neutral-500'
                  }`}
                >
                  Expires in {formatTimer(timeLeft)}
                </span>
              </div>

              <input
                id="otp-input"
                name="otp"
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (error) setError(null);
                }}
                className="w-full py-3.5 text-center tracking-[0.35em] text-2xl font-mono font-bold bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0a0a0a] rounded-xl text-[#0a0a0a] placeholder:text-neutral-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neutral-100 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6 || timeLeft <= 0}
              className="w-full mt-2 py-3 bg-[#e5341f] hover:bg-[#c42912] active:bg-[#a6220e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend Action */}
          <div className="mt-5 pt-4 text-center border-t border-neutral-100 space-y-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-600 hover:text-[#e5341f] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>{isResending ? 'Sending new OTP...' : 'Resend 6-Digit OTP Code'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
