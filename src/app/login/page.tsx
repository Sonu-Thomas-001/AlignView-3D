'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Stethoscope,
  Activity,
  Layers,
  Zap
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [demoSelected, setDemoSelected] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      router.push('/studio');
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setDemoSelected(true);
    setEmail('dr.mitchell@ortho-align.com');
    setPassword('ClinicianStudio2026!');
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      router.push('/studio');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Dynamic Ambient Mesh Glow Flares */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f015_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f015_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[480px] bg-gradient-to-b from-blue-500/12 via-sky-400/8 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between z-20">
        <Link 
          href="/" 
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-blue-600 transition-all shadow-2xs hover:shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-[11px] font-semibold text-slate-600 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>HIPAA Sandbox • 100% Client-Side</span>
        </div>
      </header>

      {/* Main Login Portal Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12 z-10">
        <div className="w-full max-w-lg">
          
          {/* Glassmorphic Luxury Card */}
          <div className="relative rounded-[2.5rem] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_70px_-15px_rgba(15,23,42,0.12)] p-7 sm:p-11 space-y-6 sm:space-y-7 overflow-hidden">
            
            {/* Top Glowing Gradient Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600" />

            {/* Brand Logo & Header */}
            <div className="text-center space-y-3 pt-1">
              <div className="flex justify-center mb-3">
                <Link href="/" className="inline-block group">
                  <img 
                    src="/main-logo.png" 
                    alt="AlignView 3D" 
                    className="h-12 sm:h-14 w-auto max-w-[240px] object-contain transition-transform group-hover:scale-105" 
                  />
                </Link>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-[-0.03em]">
                  Clinician Portal Sign In
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Access your 3D dental workspace, multi-stage aligner timeline, and diagnostic tool suite.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs font-semibold text-center animate-in fade-in duration-200 shadow-2xs">
                {errorMsg}
              </div>
            )}

            {/* Fast-Track Demo Access Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-indigo-50/80 border border-blue-100/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-extrabold text-blue-900 tracking-tight">Instant Demo Mode</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 border border-blue-600/20">
                  Pre-configured
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Test-drive the complete orthodontic studio with sample upper & lower aligner arches immediately.
              </p>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-blue-700 font-extrabold text-xs transition-all flex items-center justify-center gap-2 border border-blue-200/90 shadow-xs hover:shadow-sm cursor-pointer group"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:rotate-12" />
                <span>Launch Demo Clinician Session</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Standard Sign-In Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Or Sign In with Credentials
              </span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  Clinician Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.mitchell@ortho-align.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none transition-all shadow-2xs hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset instructions have been dispatched to your email.')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 outline-none transition-all shadow-2xs hover:border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember this workstation */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Trust & remember this clinical workstation</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 cursor-pointer mt-2 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Opening 3D Studio...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to 3D Dental Studio</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Highlights */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Cloud Storage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>WebGL 2.0 CAD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Multi-Stage Engine</span>
              </div>
            </div>

          </div>

          {/* Bottom Security & Copyright Footer */}
          <div className="text-center mt-6 text-xs text-slate-500 space-y-1.5">
            <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted local session • Zero server storage</span>
            </p>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} AlignView 3D. A product of MidCell Studios. All Rights Reserved.
            </p>
          </div>

        </div>
      </main>

      {/* Footer spacer */}
      <footer className="py-2"></footer>
    </div>
  );
}
