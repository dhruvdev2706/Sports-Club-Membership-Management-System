import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
      toast.success('Recovery link sent to your email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-[#F5F5F5] p-6">
      <div className="w-full max-w-[420px] bg-[#121212] border border-[#242424] rounded-[28px] p-8 sm:p-10 shadow-2xl space-y-7">
        
        <div>
          <Link 
            to="/auth/login" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A6A6AC] hover:text-[#F5F5F5] transition-colors mb-6 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Sign In
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#FF4B16] text-[#111111] flex items-center justify-center font-bold shadow-md shadow-[#FF4B16]/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-lg font-extrabold text-[#F5F5F5]">Apex Sports</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-[#F5F5F5]">Reset Password</h2>
          <p className="text-xs text-[#A6A6AC] mt-1.5 leading-relaxed">
            Enter your account email and we'll send you a secure verification link to regain club portal access.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-[#079C68]/10 border border-[#079C68]/30 text-center space-y-3 animate-in fade-in">
            <MailCheck className="w-10 h-10 text-[#079C68] mx-auto" />
            <h3 className="text-base font-bold text-[#F5F5F5]">Check your inbox</h3>
            <p className="text-xs text-[#A6A6AC] leading-relaxed">
              We sent password recovery instructions to <strong className="text-[#F5F5F5]">{email}</strong>.
            </p>
            <Link 
              to="/auth/login" 
              className="inline-block text-xs font-bold text-[#FF4B16] hover:text-[#E03E0E] pt-2"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
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

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 h-11"
              isLoading={loading}
            >
              Send Recovery Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
