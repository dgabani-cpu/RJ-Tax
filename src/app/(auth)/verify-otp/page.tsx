'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldCheck, Lock, ArrowRight, RotateCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp, isLoading, tempUserEmail, otpChannel } = useAuth();

  const [otpDigits, setOtpDigits] = useState(['8', '4', '2', '9', '1', '5']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(180); // 3 minutes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const pasted = val.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((ch, idx) => {
        if (idx < 6) newDigits[idx] = ch;
      });
      setOtpDigits(newDigits);
      if (inputRefs.current[5]) inputRefs.current[5]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    const res = await verifyOtp(fullOtp);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } else {
      setErrorMessage(res.error || 'Verification failed. Incorrect OTP.');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-xl font-extrabold text-white tracking-tight">
          Two-Factor Authentication
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enter the 6-digit OTP sent to{' '}
          <span className="font-semibold text-slate-200">{tempUserEmail || 'admin@taxnexus.io'}</span>
        </p>

        {/* Dev OTP Helper Banner */}
        <div className="mt-3 mx-4 sm:mx-0 p-2.5 rounded-xl bg-brand-950/80 border border-brand-800 text-center">
          <span className="text-[11px] text-brand-300 flex items-center justify-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            Dev OTP for instant login: <strong className="font-mono text-white bg-brand-900/80 px-2 py-0.5 rounded">842915</strong>
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 rounded-xl bg-emerald-950/60 border border-emerald-800 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>OTP verified successfully! Redirecting to Dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6-Digit OTP Inputs */}
            <div className="flex justify-between gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-mono font-bold rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              ))}
            </div>

            {/* Countdown & Resend */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Code expires in: <strong className="text-white font-mono">{formatTime(countdown)}</strong></span>
              <button
                type="button"
                onClick={() => setCountdown(180)}
                className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold"
              >
                <RotateCw className="h-3 w-3" /> Resend OTP
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Token...</span>
              ) : (
                <>
                  <span>Verify OTP & Enter TaxNexus</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Change login credentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
