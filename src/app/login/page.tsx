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
  CheckCircle2
} from 'lucide-react';

const LoginToothLogo = () => (
  <img 
    src="/favicon.png" 
    alt="AlignView 3D" 
    className="w-10 h-10 object-contain" 
  />
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    // Simulate instant authenticating
    setTimeout(() => {
      router.push('/studio');
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setEmail('doctor@alignview3d.com');
    setPassword('DentalStudio2026!');
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      router.push('/studio');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2F8] via-[#F4F6FA] to-white text-slate-900 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200/80 text-[11px] font-semibold text-slate-600 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Client-Side Sandboxed</span>
        </div>
      </header>

      {/* Main Form Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-md">
          
          {/* Main Glassmorphic Login Box */}
          <div className="rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-7 sm:p-10 space-y-7 relative">
            
            {/* Top Brand Logo & Title */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <img 
                  src="/main-logo.png" 
                  alt="AlignView 3D" 
                  className="h-12 sm:h-14 w-auto object-contain" 
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Clinician Portal Sign In
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Access your orthodontic 3D workspace, 32-stage aligner timeline, and diagnostic tool suite.
              </p>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.smith@dentalclinic.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your registered email.')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot Password?
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-75 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to 3D Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Access
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* One-Click Quick Demo Login Button */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200/80 shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>One-Click Clinician Demo Login</span>
            </button>

          </div>

          {/* Bottom Security Footer */}
          <div className="text-center mt-6 text-xs text-slate-500 space-y-1">
            <p className="flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted local session • Zero server storage</span>
            </p>
            <p>© {new Date().getFullYear()} AlignView 3D by Sonu Thomas. Proprietary.</p>
          </div>

        </div>
      </main>

      {/* Bottom Spacer */}
      <footer className="py-4"></footer>
    </div>
  );
}
