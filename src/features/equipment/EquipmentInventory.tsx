import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Dumbbell, 
  RotateCcw, 
  ArrowRightLeft 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';

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
      if (!res.ok) throw new Error(data.error || 'Failed to checkout gear');
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
      if (!res.ok) throw new Error(data.error || 'Failed to return gear');
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

  const selectedEq = equipment?.find(e => e.id === issueEqId);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Equipment & Gear Inventory" 
        description="Track sports rackets, balls, protective gear, and monitor athlete loan checkouts."
      />

      {/* Equipment Items Grid */}
      <div>
        <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">
          Gear Stock Availability
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#A6A6AC]">
            <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading gear inventory...</span>
          </div>
        ) : equipment && equipment.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item: any) => {
              const available = item.available_quantity;
              const total = item.total_quantity;
              const pct = total > 0 ? (available / total) * 100 : 0;
              const isLow = available <= 2;

              return (
                <div 
                  key={item.id} 
                  className="bg-[#121212] rounded-[13px] border border-[#242424] hover:border-[#383838] p-6 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-[#F5F5F5]">{item.name}</h4>
                        <span className="text-xs text-[#A6A6AC] capitalize">{item.category || 'General Sports Gear'}</span>
                      </div>
                      <Badge variant={available > 0 ? (isLow ? 'orange' : 'green') : 'danger'}>
                        {available > 0 ? `${available} In Stock` : 'Out of Stock'}
                      </Badge>
                    </div>

                    {/* Stock Bar */}
                    <div className="my-4">
                      <div className="flex justify-between text-xs text-[#A6A6AC] mb-1.5 font-medium">
                        <span>Availability</span>
                        <span className="font-mono text-[#F5F5F5] font-bold">{available} / {total}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1F1F1F] overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            available === 0 ? 'bg-[#E63946]' : isLow ? 'bg-[#FF4B16]' : 'bg-[#079C68]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-[#A6A6AC] mb-6 flex items-center justify-between">
                      <span>Condition standard:</span>
                      <span className="capitalize font-semibold text-[#F5F5F5]">{item.condition || 'Good'}</span>
                    </div>
                  </div>

                  <Button 
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={available === 0}
                    onClick={() => {
                      setIssueEqId(item.id);
                      setIssueQty(1);
                    }}
                    icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                  >
                    Checkout Gear
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={<Dumbbell className="w-8 h-8" />}
            title="No Equipment Logged"
            description="Add athletic gear, balls, protective equipment, and scoreboards to track inventory."
          />
        )}
      </div>

      {/* Checkout Logs History Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#F5F5F5]">
          Active Loan & Checkout Logs
        </h3>

        <div className="bg-[#121212] border border-[#242424] rounded-[12px] shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0A0A0A] text-[#A6A6AC] border-b border-[#242424]">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Equipment Item</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Member / Borrower</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Checkout Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E]">
                {txLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#A6A6AC]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Loading transaction logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((tx: any) => {
                    const isReturned = !!tx.return_date;

                    return (
                      <tr key={tx.id} className="hover:bg-[#181818] transition-colors">
                        <td className="px-6 py-4 font-bold text-[#F5F5F5]">
                          {tx.equipment?.name || 'Equipment Item'}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#A6A6AC]">
                          {tx.members?.profiles?.full_name || 'Anonymous Club Loan'}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#F5F5F5]">
                          {tx.quantity} pcs
                        </td>
                        <td className="px-6 py-4 text-xs text-[#A6A6AC]">
                          {new Date(tx.issue_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={isReturned ? 'green' : 'orange'}>
                            {isReturned ? 'Returned' : 'Checked Out'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isReturned ? (
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => setReturnTxId(tx.id)}
                              icon={<RotateCcw className="w-3.5 h-3.5" />}
                            >
                              Return
                            </Button>
                          ) : (
                            <span className="text-xs text-[#555555]">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-[#A6A6AC]">
                      No active equipment checkout records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Checkout Issue Modal */}
      <Modal
        isOpen={!!issueEqId}
        onClose={() => setIssueEqId(null)}
        title={`Checkout: ${selectedEq?.name || 'Equipment'}`}
        description="Record gear loan to an active athlete or club member."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Member Account</label>
            <div className="relative">
              <select 
                value={issueMemberId}
                onChange={(e) => setIssueMemberId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] appearance-none"
              >
                <option value="">General Club Checkout (No Member Assigned)</option>
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
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">
              Quantity (Max: {selectedEq?.available_quantity || 1})
            </label>
            <input 
              type="number" 
              min={1} 
              max={selectedEq?.available_quantity || 1}
              value={issueQty}
              onChange={(e) => setIssueQty(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E1E1E]">
            <Button variant="secondary" onClick={() => setIssueEqId(null)}>Cancel</Button>
            <Button 
              variant="primary" 
              isLoading={issueMutation.isPending}
              onClick={() => issueMutation.mutate()}
            >
              Confirm Checkout
            </Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={!!returnTxId}
        onClose={() => setReturnTxId(null)}
        title="Process Equipment Return"
        description="Inspect returned condition and restore item quantity back to stock."
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Returned Condition</label>
            <div className="relative">
              <select 
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] appearance-none"
              >
                <option value="good">Good (Normal Condition)</option>
                <option value="fair">Fair (Minor Wear)</option>
                <option value="damaged">Damaged (Needs Repair)</option>
                <option value="lost">Lost / Unreturned</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E1E1E]">
            <Button variant="secondary" onClick={() => setReturnTxId(null)}>Cancel</Button>
            <Button 
              variant="primary" 
              isLoading={returnMutation.isPending}
              onClick={() => returnMutation.mutate()}
            >
              Verify & Return to Stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
