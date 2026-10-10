import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { Receipt, Download, Plus, DollarSign, User, FileText, CheckCircle2, Clock, AlertCircle, X, Loader2 } from 'lucide-react';

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
      if (!res.ok) throw new Error(data.error);
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
    toast.info(`Downloading receipt for ${payment.transaction_ref} (Demo)`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{isAdmin ? 'All Payments' : 'My Payments'}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'View and manage all transaction records.' : 'View your billing history and receipts.'}
          </p>
        </div>
        {isAdmin && !isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        )}
      </div>

      {isFormOpen && isAdmin && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Record Manual Payment</h2>
            <button onClick={() => setIsFormOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Member
                </label>
                <div className="relative">
                  <select 
                    className="w-full pl-3 pr-10 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer" 
                    value={memberId} 
                    onChange={e => setMemberId(e.target.value)}
                  >
                    <option value="">Select Member...</option>
                    {members?.map((m: any) => <option key={m.id} value={m.id}>{m.profiles?.full_name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" /> Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" /> Purpose
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Membership Dues"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={purpose} 
                  onChange={e => setPurpose(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!memberId || !amount || manualPaymentMutation.isPending} 
                onClick={() => manualPaymentMutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {manualPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {manualPaymentMutation.isPending ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Tx Ref</th>
                {isAdmin && <th className="px-6 py-4 font-medium">Member</th>}
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Purpose</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading payments...</span>
                    </div>
                  </td>
                </tr>
              ) : payments?.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 opacity-20" />
                      <span>No payment records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                payments?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {payment.transaction_ref}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{payment.members?.profiles?.full_name}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-foreground">
                      {new Date(payment.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {payment.purpose}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      ${Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${payment.status === 'success' || payment.status === 'completed' ? 'bg-success/10 text-success border-success/20' : 
                          payment.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                          'bg-destructive/10 text-destructive border-destructive/20'}`}>
                        {payment.status === 'success' || payment.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : 
                         payment.status === 'pending' ? <Clock className="w-3 h-3 mr-1.5" /> : 
                         <AlertCircle className="w-3 h-3 mr-1.5" />}
                        <span className="capitalize">{payment.status === 'success' ? 'Completed' : payment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => downloadReceipt(payment)} 
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
