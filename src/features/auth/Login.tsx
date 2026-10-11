import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back to Apex Sports');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080808] text-[#F5F5F5]">
      {/* Brand Showcase Panel - Left */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-[#000000] border-r border-[#1E1E1E] flex-col justify-between p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle decorative glow accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF4B16]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#5035E8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#FF4B16] text-[#111111] flex items-center justify-center font-extrabold shadow-lg shadow-[#FF4B16]/25">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#F5F5F5]">Apex Sports</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 tracking-tight text-[#F5F5F5]">
            The modern sports club platform.
          </h1>
          <p className="text-base text-[#A6A6AC] max-w-sm mb-10 leading-relaxed">
            Manage memberships, book courts, track athlete training progress, and coordinate tournaments all in one high-performance interface.
          </p>

          <div className="space-y-3.5 pt-4 border-t border-[#1E1E1E]">
            <div className="flex items-center gap-3 text-sm text-[#CCCCCC]">
              <CheckCircle2 className="w-4 h-4 text-[#079C68] shrink-0" />
              <span>Instant court & facility availability reservations</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#CCCCCC]">
              <CheckCircle2 className="w-4 h-4 text-[#079C68] shrink-0" />
              <span>Real-time subscription billing & receipt invoices</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#CCCCCC]">
              <CheckCircle2 className="w-4 h-4 text-[#079C68] shrink-0" />
              <span>Coach evaluations & training attendance logs</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-xs text-[#777777] font-medium pt-8">
          Apex Sports Club Membership Management Platform.
        </div>
      </div>

      {/* Form Panel - Right */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[420px] bg-[#121212] border border-[#242424] rounded-[28px] p-8 sm:p-10 shadow-2xl space-y-7">
          
          <div>
            <div className="md:hidden flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-[#FF4B16] text-[#111111] flex items-center justify-center font-bold">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-extrabold text-[#F5F5F5]">Apex Sports</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F5]">Welcome back</h2>
            <p className="text-xs text-[#A6A6AC] mt-1.5">Sign in to your account with your verified credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="athlete@apexclub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Password</label>
                <Link to="/auth/reset" className="text-xs font-semibold text-[#FF4B16] hover:text-[#E03E0E] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm placeholder:text-[#555555] focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 h-11"
              isLoading={loading}
            >
              Sign In to Account
            </Button>
          </form>

          <div className="pt-4 border-t border-[#1E1E1E] text-center">
            <p className="text-xs text-[#A6A6AC]">
              Don't have an athletic membership?{' '}
              <Link to="/auth/register" className="font-bold text-[#FF4B16] hover:text-[#E03E0E] transition-colors">
                Apply for Membership
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
