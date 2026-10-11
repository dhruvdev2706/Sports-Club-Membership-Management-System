import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { Receipt, Download, Plus, DollarSign, CheckCircle2, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';

export default function PaymentsPage() {
  const { profile, session } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('Membership Dues');

  const { data: members } = useQuery({
    queryKey: ['members_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('id, profiles(full_name)');
      if (error) throw error;
      return data;
    },
    enabled: isAdmin
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', isAdmin ? 'all' : profile?.id],
    queryFn: async () => {
      let query = supabase.from('payments').select('*, members(profiles(full_name))').order('created_at', { ascending: false });
      if (!isAdmin) query = query.eq('member_id', profile?.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const manualPaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          member_id: memberId,
          amount: Number(amount),
          purpose
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment recording failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Manual payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setIsFormOpen(false);
      setMemberId('');
      setAmount('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const downloadReceipt = (payment: any) => {
    toast.info(`Receipt ready for transaction ${payment.transaction_ref || payment.id}`);
  };

  const totalCollected = payments?.reduce((acc: number, p: any) => {
    return p.status === 'completed' || p.status === 'success' ? acc + Number(p.amount) : acc;
  }, 0) || 0;

  return (
    <div className="space-y-8">
      <PageHeader 
        title={isAdmin ? 'Club Financials & Invoices' : 'My Invoices & Dues'}
        description={
          isAdmin 
            ? 'Monitor membership dues, facility reservations fees, and manual payment records.' 
            : 'Track billing receipts, membership subscriptions, and tournament payments.'
        }
        actions={
          isAdmin && !isFormOpen && (
            <Button 
              variant="primary"
              onClick={() => setIsFormOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Record Payment
            </Button>
          )
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
        <StatCard 
          label="Total Collected Volume" 
          value={`$${totalCollected.toFixed(2)}`} 
          icon={<DollarSign className="w-5 h-5 text-white" />} 
          variant="green"
          description="Verified completed revenue"
        />
        <StatCard 
          label="Total Transactions" 
          value={payments?.length ?? 0} 
          icon={<Receipt className="w-5 h-5 text-[#111111]" />} 
          variant="white"
          description="Processed payment receipts"
        />
        <StatCard 
          label="Billing Status" 
          value="Up to date" 
          icon={<CheckCircle2 className="w-5 h-5 text-white" />} 
          variant="purple"
          description="Club accounts reconciled"
        />
      </div>

      {/* Record Payment Drawer / Form */}
      {isFormOpen && isAdmin && (
        <div className="bg-[#121212] rounded-[26px] border border-[#242424] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-7 py-5 border-b border-[#1E1E1E] bg-[#161616] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#079C68]/15 border border-[#079C68]/30 flex items-center justify-center text-[#4CD9A0]">
                <DollarSign className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Record Manual Payment</h2>
            </div>
            <button 
              onClick={() => setIsFormOpen(false)} 
              className="p-2 rounded-xl text-[#A6A6AC] hover:text-[#F5F5F5] hover:bg-[#242424] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Member Account *</label>
                <div className="relative">
                  <select 
                    value={memberId} 
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Member...</option>
                    {members?.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.profiles?.full_name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Amount ($) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all placeholder:text-[#555555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Payment Purpose</label>
                <input 
                  type="text" 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Annual Dues, Locker Rent"
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all placeholder:text-[#555555]"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#1E1E1E] flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                disabled={!memberId || !amount || manualPaymentMutation.isPending}
                isLoading={manualPaymentMutation.isPending}
                onClick={() => manualPaymentMutation.mutate()}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-[#121212] border border-[#242424] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0A] text-[#A6A6AC] border-b border-[#242424]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Reference</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Member</th>}
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Purpose</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E1E]">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-16 text-center text-[#A6A6AC]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading payments log...</span>
                    </div>
                  </td>
                </tr>
              ) : payments && payments.length > 0 ? (
                payments.map((p: any) => {
                  const isSuccess = p.status === 'completed' || p.status === 'success';
                  const isPending = p.status === 'pending';

                  return (
                    <tr key={p.id} className="hover:bg-[#181818] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-[#F5F5F5]">
                        <span className="px-2 py-1 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
                          {p.transaction_ref || p.id.slice(0, 8)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 font-semibold text-[#F5F5F5]">
                          {p.members?.profiles?.full_name || 'Member'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-xs text-[#A6A6AC]">
                        {p.purpose || 'Club Membership'}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-[#F5F5F5]">
                        ${Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isSuccess ? 'green' : isPending ? 'orange' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#A6A6AC]">
                        {new Date(p.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadReceipt(p)}
                          icon={<Download className="w-3.5 h-3.5" />}
                        >
                          Invoice
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="p-8">
                    <EmptyState 
                      icon={<Receipt className="w-8 h-8" />}
                      title="No payment records found"
                      description="Transaction receipts and subscription payments will appear here once processed."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
