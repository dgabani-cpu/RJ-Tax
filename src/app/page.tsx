'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  GitCompare,
  MessageSquare,
  KeyRound,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 text-white font-bold text-lg shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              TN
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                TaxNexus
                <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded bg-brand-950 text-brand-300 border border-brand-800">
                  PRACTICE SaaS
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">CA Practice Management</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#reconciliation" className="hover:text-white transition-colors">13-Rule Recon</a>
            <a href="#automation" className="hover:text-white transition-colors">GST Automation</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 hover:text-white transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/login?tab=signup"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow-md shadow-brand-600/30 hover:scale-102 transition-all"
            >
              <span>Create Practice Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950 border border-brand-800 text-brand-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          <span>Next-Generation Practice Platform for Chartered Accountants</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none max-w-4xl mx-auto">
          The All-in-One <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400">Practice SaaS & GST Automation</span> Platform
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Manage clients 360°, automate GSTR-2B downloads via compliant connectors, execute AI-assisted 13-category reconciliation, and dispatch scheduled WhatsApp compliance notices.
        </p>

        {/* Hero CTA Buttons - Compulsory Sign In / Sign Up */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/30 transition-all"
          >
            <span>Sign In to Practice</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login?tab=signup"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Create CA Practice Account</span>
          </Link>
        </div>

        {/* Hero Trust Badges */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Section 16(2)(aa) 2B Matching
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-brand-400" /> AES-256 Encrypted GST Vault
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-purple-400" /> WhatsApp Business Cloud API
          </span>
          <span className="flex items-center gap-1.5">
            <Building className="h-4 w-4 text-blue-400" /> Multi-Staff Client Scoping
          </span>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Enterprise Practice Modules
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Engineered Specifically for Modern Tax Consultancy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-brand-500 transition-all space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <GitCompare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">13-Category AI Reconciliation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-extract invoices from Excel, CSV, or PDFs using OCR. Automatically categorizes records into 13 statutory discrepancy classes with AI explainer rationale.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-brand-500 transition-all space-y-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero-Bypass GST Vault</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Store GST portal credentials securely. Connect via official GSP APIs and assisted 2FA sessions without bypassing CAPTCHAs or OTP controls.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-brand-500 transition-all space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">WhatsApp & Email Reminders</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-dispatch recurring compliance reminders on 5th, 10th, 15th, and 18th of every month with dynamic client merge variables.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-brand-500 transition-all space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Client 360° Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete profile with 12 sub-modules: PAN, GSTIN, CIN, TAN, Udyam, Authorized Person, filing frequencies, and primary/secondary staff matrix.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-brand-500 transition-all space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Audit-Ready Summary Reports</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export professional PDF, Excel, and CSV schedules for Section 16(2)(aa) ITC claims and non-filing supplier intimations with CA verification blocks.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-brand-500 transition-all space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Tamper-Resistant Audit Trail</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every staff login, 2B download, reconciliation approval, and client edit is logged immutably with user, IP, and timestamp fingerprinting.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">TaxNexus</span>
            <span>• Enterprise Practice Management SaaS for Chartered Accountants</span>
          </div>
          <p>© 2026 TaxNexus. All rights reserved. Strictly complies with statutory GST portal regulations.</p>
        </div>
      </footer>
    </div>
  );
}
