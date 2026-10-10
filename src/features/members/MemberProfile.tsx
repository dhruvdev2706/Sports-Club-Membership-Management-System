import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../auth/AuthContext';

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
        .single();
      if (error) throw error;
      return data;
    }
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
      toast.success(data.message);
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
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['member', id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) return <div className="p-6">Loading member profile...</div>;
  if (!member) return <div className="p-6">Member not found</div>;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <Link to="/members" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">&larr; Back to Directory</Link>
          <h1 className="text-3xl font-bold tracking-tight">{member.profiles?.full_name}</h1>
          <p className="text-muted-foreground">{member.profiles?.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider
            ${member.status === 'active' ? 'bg-green-100 text-green-800' : 
              member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'}`}>
            {member.status}
          </span>
          {member.membership_number && (
            <span className="font-mono bg-muted px-2 py-1 rounded text-sm border">
              {member.membership_number}
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Membership</h2>
          
          {member.current_plan_id ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{member.membership_plans?.name}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Start Date:</span>
                <span>{member.plan_start_date}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span>{member.plan_expiry_date}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active plan assigned.</p>
          )}

          {isAdmin && member.status === 'pending' && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-medium mb-3">Approve Application</h3>
              <div className="flex gap-2">
                <select 
                  className="flex-1 p-2 border rounded bg-background text-sm"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="">Select a plan...</option>
                  {plans?.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.fee} / {p.duration_months}mo)</option>
                  ))}
                </select>
                <button 
                  onClick={() => selectedPlan && approveMutation.mutate(selectedPlan)}
                  disabled={!selectedPlan || approveMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          )}

          {isAdmin && member.status === 'active' && (
            <div className="mt-6 pt-6 border-t border-border flex gap-2">
              <button 
                onClick={() => updateStatusMutation.mutate('suspended')}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded text-sm font-medium hover:bg-yellow-200"
              >
                Suspend Member
              </button>
              <button 
                onClick={() => updateStatusMutation.mutate('cancelled')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200"
              >
                Cancel Membership
              </button>
            </div>
          )}
          
          {isAdmin && member.status === 'suspended' && (
            <div className="mt-6 pt-6 border-t border-border">
              <button 
                onClick={() => updateStatusMutation.mutate('active')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded text-sm font-medium hover:bg-green-200"
              >
                Restore Membership
              </button>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Membership History</h2>
          {membershipsHistory && membershipsHistory.length > 0 ? (
            <div className="space-y-4">
              {membershipsHistory.map((history: any) => (
                <div key={history.id} className="p-3 border rounded-lg text-sm bg-muted/30">
                  <div className="flex justify-between font-medium mb-1">
                    <span>{history.membership_plans?.name}</span>
                    <span className={`text-xs px-2 rounded-full ${history.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {history.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs flex justify-between">
                    <span>{history.start_date} to {history.end_date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No historical records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
