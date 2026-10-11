import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
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
      toast.success('Welcome back to playgrid');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080808] text-[#F5F5F5]">
      {/* Brand Showcase Panel - Left */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-black border-r border-[#1E1E1E] flex-col justify-between p-8 lg:p-14 relative overflow-hidden group">
        {/* Hero Background Sports Image - Opaque */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/download%20(8).jpg"
            alt="playgrid Tennis Court"
            className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out select-none pointer-events-none"
          />
          {/* Subtle top & bottom gradient to maintain text legibility while keeping the court image vivid and open in the center */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Top: Headline */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            The modern sports club platform.
          </h1>
        </div>

        {/* Bottom: Description */}
        <div className="relative z-10 max-w-md">
          <p className="text-sm lg:text-lg text-white/95 leading-relaxed font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Manage memberships, book courts, track athlete training progress, and coordinate tournaments all in one high-performance interface.
          </p>
        </div>
      </div>

      {/* Form Panel - Right */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-10 lg:p-16">
        <div className="w-full max-w-[420px] bg-[#121212] border border-[#242424] rounded-none shadow-2xl overflow-hidden">
          {/* Top Image in Mobile View */}
          <div className="md:hidden relative h-48 w-full overflow-hidden">
            <img
              src="/download%20(8).jpg"
              alt="playgrid"
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/20 to-black/60 pointer-events-none" />
            <div className="absolute top-4 left-5">
              <span className="text-lg font-black tracking-tight text-white drop-shadow-md">playgrid</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6 sm:space-y-7">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F5]">Welcome back</h2>
              <p className="text-xs text-[#A6A6AC] mt-1.5">Sign in to your account with your verified credentials</p>
            </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="athlete@playgrid.com"
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
    </div>
  );
}
