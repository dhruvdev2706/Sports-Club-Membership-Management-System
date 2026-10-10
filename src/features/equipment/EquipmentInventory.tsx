import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Dumbbell, 
  RotateCcw, 
  User, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  X,
  History
} from 'lucide-react';

export default function EquipmentInventory() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  const [issueEqId, setIssueEqId] = useState<string | null>(null);
  const [issueQty, setIssueQty] = useState(1);
  const [issueMemberId, setIssueMemberId] = useState('');
  
  const [returnTxId, setReturnTxId] = useState<string | null>(null);
  const [returnCondition, setReturnCondition] = useState('good');

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: members } = useQuery({
    queryKey: ['members_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('members').select('id, profiles(full_name)');
      if (error) throw error;
      return data;
    }
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['equipment_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_transactions')
        .select('*, equipment(name), members(profiles(full_name))')
        .order('issue_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const issueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/equipment/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          equipment_id: issueEqId,
          quantity: issueQty,
          member_id: issueMemberId || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Equipment issued successfully');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment_transactions'] });
      setIssueEqId(null);
      setIssueQty(1);
      setIssueMemberId('');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const returnMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/equipment/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          transaction_id: returnTxId,
          condition: returnCondition
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Equipment returned successfully');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment_transactions'] });
      setReturnTxId(null);
      setReturnCondition('good');
    },
    onError: (err: any) => toast.error(err.message)
  });

  const selectedEquipment = equipment?.find((e: any) => e.id === issueEqId);
  const selectedTx = transactions?.find((tx: any) => tx.id === returnTxId);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Equipment Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage club equipment, issue items, and track returns.</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Loading inventory...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {equipment?.map((item: any) => {
              const outOfStock = item.available_quantity === 0;
              const lowStock = !outOfStock && item.available_quantity <= Math.ceil(item.total_quantity * 0.2);
              
              return (
                <div key={item.id} className="relative flex flex-col p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    {outOfStock ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        Out of Stock
                      </span>
                    ) : lowStock ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        In Stock
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg text-foreground line-clamp-1" title={item.name}>{item.name}</h3>
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-1">
                    {item.category} {item.identifier ? `• ID: ${item.identifier}` : ''}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-6 mt-auto">
                    <div className="flex flex-col p-2 bg-muted/40 rounded-lg border border-border/50 text-center">
                      <span className="text-xs font-medium text-muted-foreground mb-0.5">Available</span>
                      <span className={`text-lg font-bold ${outOfStock ? 'text-destructive' : 'text-foreground'}`}>
                        {item.available_quantity}
                      </span>
                    </div>
                    <div className="flex flex-col p-2 bg-muted/40 rounded-lg border border-border/50 text-center">
                      <span className="text-xs font-medium text-muted-foreground mb-0.5">Total</span>
                      <span className="text-lg font-bold text-foreground">{item.total_quantity}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIssueEqId(item.id);
                      setReturnTxId(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={outOfStock}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-primary/10"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Issue Item
                  </button>
                </div>
              );
            })}
            
            {equipment?.length === 0 && (
              <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No equipment found</h3>
                <p className="text-muted-foreground">Add items to your inventory to start tracking.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {issueEqId && selectedEquipment && (
        <div className="bg-card rounded-xl border border-primary/30 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
          <div className="px-6 py-4 border-b border-border bg-primary/5 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Issue: {selectedEquipment.name}
            </h2>
            <button onClick={() => setIssueEqId(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quantity to Issue</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedEquipment.available_quantity}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                  value={issueQty} 
                  onChange={e => setIssueQty(Number(e.target.value))} 
                />
                <p className="text-xs text-muted-foreground">Max available: {selectedEquipment.available_quantity}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Member (Optional)
                </label>
                <select 
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none" 
                  value={issueMemberId} 
                  onChange={e => setIssueMemberId(e.target.value)}
                >
                  <option value="">No member / Coach use</option>
                  {members?.map((m: any) => <option key={m.id} value={m.id}>{m.profiles?.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setIssueEqId(null)} className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => issueMutation.mutate()} 
                disabled={issueMutation.isPending || issueQty < 1 || issueQty > selectedEquipment.available_quantity} 
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {issueMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {issueMutation.isPending ? 'Processing...' : 'Confirm Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {returnTxId && selectedTx && (
        <div className="bg-card rounded-xl border border-warning/50 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
          <div className="px-6 py-4 border-b border-border bg-warning/10 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-warning" /> Return: {selectedTx.equipment?.name}
            </h2>
            <button onClick={() => setReturnTxId(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-border mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground block text-xs">Borrower</span><span className="font-medium text-foreground">{selectedTx.members?.profiles?.full_name || 'Coach'}</span></div>
                <div><span className="text-muted-foreground block text-xs">Quantity</span><span className="font-medium text-foreground">{selectedTx.quantity}</span></div>
                <div><span className="text-muted-foreground block text-xs">Issue Date</span><span className="font-medium text-foreground">{new Date(selectedTx.issue_date).toLocaleDateString()}</span></div>
              </div>
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-2">Condition at Return</label>
              <select 
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none" 
                value={returnCondition} 
                onChange={e => setReturnCondition(e.target.value)}
              >
                <option value="good">Good (No new damage)</option>
                <option value="fair">Fair (Normal Wear & Tear)</option>
                <option value="damaged">Damaged (Requires Repair)</option>
                <option value="lost">Lost / Not Returned</option>
              </select>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setReturnTxId(null)} className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => returnMutation.mutate()} 
                disabled={returnMutation.isPending} 
                className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {returnMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {returnMutation.isPending ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">Transaction History</h2>
        </div>
        
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Item</th>
                  <th className="px-6 py-4 font-medium">Borrower</th>
                  <th className="px-6 py-4 font-medium">Qty</th>
                  <th className="px-6 py-4 font-medium">Issue Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {txLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No transaction history found.
                    </td>
                  </tr>
                ) : (
                  transactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{tx.equipment?.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{tx.members?.profiles?.full_name || 'Coach'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{tx.quantity}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(tx.issue_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                          ${tx.status === 'returned' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                          {tx.status === 'returned' ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : <AlertTriangle className="w-3 h-3 mr-1.5" />}
                          <span className="capitalize">{tx.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === 'issued' ? (
                          <button 
                            onClick={() => {
                              setReturnTxId(tx.id);
                              setIssueEqId(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Return
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Returned</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
