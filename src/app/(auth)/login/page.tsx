'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Smartphone, KeyRound, Sparkles, Building } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { initiateLogin, isLoading, switchDemoRole } = useAuth();

  const [email, setEmail] = useState('admin@taxnexus.io');
  const [password, setPassword] = useState('••••••••••••');
  const [otpChannel, setOtpChannel] = useState<'EMAIL' | 'SMS' | 'AUTHENTICATOR'>('EMAIL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await initiateLogin(email, password, otpChannel);
    if (res.success) {
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
      router.push('/verify-otp');
    } else {
      setErrorMessage(res.error || 'Authentication failed.');
    }
  };

  const handleQuickDemo = (demoEmail: string, roleTitle: string) => {
    setEmail(demoEmail);
    setPassword('SecurePassword#2026');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 text-white font-bold text-xl shadow-lg shadow-brand-500/25">
              TN
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TaxNexus
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800">
                  SECURE PORTAL
                </span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Practice Management SaaS</span>
            </div>
          </Link>
        </div>

        <h2 className="mt-6 text-center text-xl font-extrabold text-white tracking-tight">
          Sign In to Your Practice Workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Encrypted 2-Factor Authentication with Role Scoping
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Prominent Login Credentials Banner */}
          <div className="mb-5 p-3.5 rounded-xl bg-brand-950/80 border border-brand-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-300 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-brand-400" />
                Demo Practice Credentials
              </span>
              <span className="text-[10px] font-mono font-bold bg-brand-900 text-brand-200 px-2 py-0.5 rounded">
                2FA PIN: 842915
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div><strong className="text-slate-400">Login ID:</strong> admin@taxnexus.io</div>
              <div><strong className="text-slate-400">Password:</strong> SecurePassword#2026</div>
              <div><strong className="text-slate-400">OTP PIN:</strong> 842915</div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-950/60 border border-red-800 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email / Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff / CA Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rjtax.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-brand-400 hover:text-brand-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* 2FA Delivery Channel */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2FA OTP Delivery Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOtpChannel('EMAIL')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    otpChannel === 'EMAIL'
                      ? 'border-brand-500 bg-brand-950/60 text-brand-300'
                      : 'border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 mb-1 text-brand-400" />
                  <span>Email OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpChannel('SMS')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    otpChannel === 'SMS'
                      ? 'border-brand-500 bg-brand-950/60 text-brand-300'
                      : 'border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 mb-1 text-brand-400" />
                  <span>SMS OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpChannel('AUTHENTICATOR')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-medium transition-all ${
                    otpChannel === 'AUTHENTICATOR'
                      ? 'border-brand-500 bg-brand-950/60 text-brand-300'
                      : 'border-slate-800 bg-slate-850 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5 mb-1 text-brand-400" />
                  <span>Auth App</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-lg shadow-brand-600/30 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Generate & Send OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Staff Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Role Tester
              </span>
              <span className="text-[10px] text-brand-400 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> 1-Click Fill
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleQuickDemo('admin@taxnexus.io', 'Super Admin')}
                className="text-left p-2 rounded-lg border border-slate-800 bg-slate-850 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-brand-400">Neel Gabani</div>
                <div className="text-[10px] text-slate-500">Super Admin (Managing Partner)</div>
              </button>

              <button
                onClick={() => handleQuickDemo('sneha.patel@taxnexus.io', 'Manager')}
                className="text-left p-2 rounded-lg border border-slate-800 bg-slate-850 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-emerald-400">Sneha Patel</div>
                <div className="text-[10px] text-slate-500">Manager (Tax Compliance)</div>
              </button>

              <button
                onClick={() => handleQuickDemo('amit.verma@taxnexus.io', 'Staff')}
                className="text-left p-2 rounded-lg border border-slate-800 bg-slate-850 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-blue-400">Amit Verma</div>
                <div className="text-[10px] text-slate-500">Senior GST Executive</div>
              </button>

              <button
                onClick={() => handleQuickDemo('pooja.shah@taxnexus.io', 'Accountant')}
                className="text-left p-2 rounded-lg border border-slate-800 bg-slate-850 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <div className="font-semibold text-purple-400">Pooja Shah</div>
                <div className="text-[10px] text-slate-500">Recon Accountant</div>
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-[10.5px] text-slate-500 pt-3 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              PBKDF2 Password Hashing
            </span>
            <span>Brute-force Protected</span>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Back to Public TaxNexus Website
          </Link>
        </div>
      </div>
    </div>
  );
}
