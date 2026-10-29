import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery ready
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Your password has been updated securely');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-[#F5F5F5] p-6">
      <div className="w-full max-w-[420px] bg-[#121212] border border-[#242424] rounded-[14px] p-8 sm:p-10 shadow-2xl space-y-7">
        
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#FF4B16] text-[#111111] flex items-center justify-center font-bold shadow-md shadow-[#FF4B16]/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold text-[#F5F5F5]">playgrid</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#F5F5F5]">Set New Password</h2>
          <p className="text-xs text-[#A6A6AC] mt-1.5 leading-relaxed">
            Choose a strong password to protect your athlete account, bookings, and billing information.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={6}
                placeholder="Minimum 6 characters"
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
            Update & Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
