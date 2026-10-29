import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { session, profile: currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('');

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          profiles (full_name, email),
          membership_plans (name, fee, duration_months)
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: membershipsHistory } = useQuery({
    queryKey: ['membershipsHistory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('*, membership_plans(name)')
        .eq('member_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: plans } = useQuery({
    queryKey: ['activePlans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('membership_plans').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch(`/api/members/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Application approved successfully');
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      queryClient.invalidateQueries({ queryKey: ['membershipsHistory', id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/members/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Member marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['member', id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#A6A6AC]">
        <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading member profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center bg-[#121212] rounded-[12px] border border-[#242424] max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-[#FF4B16] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#F5F5F5] mb-2">Member Not Found</h2>
        <p className="text-sm text-[#A6A6AC] mb-6">The requested member record does not exist or has been removed.</p>
        <Link to="/members" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#242424] text-white text-sm font-semibold hover:bg-[#2C2C2C]">
          <ArrowLeft className="w-4 h-4" /> Return to Members Directory
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="green" size="lg">Active Member</Badge>;
      case 'pending':
        return <Badge variant="orange" size="lg">Pending Application</Badge>;
      case 'suspended':
        return <Badge variant="neutral" size="lg">Suspended</Badge>;
      case 'cancelled':
      case 'expired':
        return <Badge variant="danger" size="lg">{status.toUpperCase()}</Badge>;
      default:
        return <Badge variant="neutral" size="lg">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Navigation & Header */}
      <div>
        <Link 
          to="/members" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A6A6AC] hover:text-[#F5F5F5] transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Members Directory
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-[13px] bg-[#121212] border border-[#242424] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#5035E8]/20 border border-[#5035E8]/40 flex items-center justify-center text-[#A594FF] font-extrabold text-2xl shadow-inner shrink-0">
              {member.profiles?.full_name ? member.profiles.full_name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
                {member.profiles?.full_name || 'Member Details'}
              </h1>
              <p className="text-sm text-[#A6A6AC] mt-0.5">{member.profiles?.email}</p>
            </div>
          </div>

          <div className="flex items-start sm:items-end flex-col gap-2">
            {getStatusBadge(member.status)}
            {member.membership_number && (
              <span className="font-mono text-xs font-bold text-[#F5F5F5] bg-[#1A1A1A] border border-[#2A2A2A] px-2.5 py-1 rounded-lg">
                ID: {member.membership_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Plan Details & History */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Current Plan Card */}
        <div className="bg-[#121212] border border-[#242424] rounded-[13px] shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#FF4B16]/15 border border-[#FF4B16]/30 flex items-center justify-center text-[#FF4B16]">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] tracking-tight">Current Membership</h2>
                <p className="text-xs text-[#A6A6AC]">Active entitlement and subscription duration</p>
              </div>
            </div>
            
            {member.current_plan_id ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#262626] flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#A6A6AC] font-semibold">Tier Plan</span>
                  <span className="text-sm font-bold text-[#F5F5F5]">{member.membership_plans?.name}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#262626] flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#A6A6AC] font-semibold">Start Date</span>
                  <span className="text-sm font-medium text-[#F5F5F5]">{member.plan_start_date || 'N/A'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#181818] border border-[#262626] flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#A6A6AC] font-semibold">Expiry Date</span>
                  <span className="text-sm font-bold text-[#FF4B16]">{member.plan_expiry_date || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-[#282828] rounded-2xl bg-[#161616]/50 text-xs text-[#A6A6AC]">
                No active subscription plan assigned to this member account.
              </div>
            )}
          </div>

          {/* Admin Management Section */}
          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-[#1E1E1E]">
              {member.status === 'pending' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#A6A6AC] block">
                    Select Plan & Approve
                  </label>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <select 
                        className="w-full p-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-xs focus:outline-none focus:border-[#FF4B16] appearance-none"
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                      >
                        <option value="">Select a tier...</option>
                        {plans?.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (${p.fee} / {p.duration_months}mo)
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => selectedPlan && approveMutation.mutate(selectedPlan)}
                      disabled={!selectedPlan || approveMutation.isPending}
                    >
                      {approveMutation.isPending ? 'Approving...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              )}

              {member.status === 'active' && (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="flex-1 hover:border-[#F59E0B] hover:text-[#F59E0B]"
                    onClick={() => updateStatusMutation.mutate('suspended')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Suspend Member
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatusMutation.mutate('cancelled')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Cancel Membership
                  </Button>
                </div>
              )}

              {member.status === 'suspended' && (
                <Button 
                  variant="primary"
                  className="w-full bg-[#079C68] hover:bg-[#068659] text-white"
                  onClick={() => updateStatusMutation.mutate('active')}
                  disabled={updateStatusMutation.isPending}
                >
                  Restore Active Membership
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Membership History Card */}
        <div className="bg-[#121212] border border-[#242424] rounded-[13px] shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#5035E8]/15 border border-[#5035E8]/30 flex items-center justify-center text-[#A594FF]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F5] tracking-tight">Subscription History</h2>
                <p className="text-xs text-[#A6A6AC]">Previous enrollments and plan changes</p>
              </div>
            </div>

            {membershipsHistory && membershipsHistory.length > 0 ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {membershipsHistory.map((history: any) => (
                  <div key={history.id} className="p-4 border border-[#242424] rounded-2xl bg-[#161616] hover:border-[#333333] transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-sm text-[#F5F5F5]">{history.membership_plans?.name || 'Membership'}</span>
                      <Badge variant={history.status === 'active' ? 'green' : 'neutral'} size="sm">
                        {history.status}
                      </Badge>
                    </div>
                    <div className="text-[#A6A6AC] text-xs flex justify-between font-mono mt-1">
                      <span>{history.start_date || 'N/A'}</span>
                      <span>to {history.end_date || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-[#282828] rounded-2xl bg-[#161616]/50 text-xs text-[#A6A6AC]">
                No historical membership logs found.
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-5 border-t border-[#1E1E1E]">
            <p className="text-[11px] text-[#777777] text-center">
              All status changes and billing terms are cryptographically stored in the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
