import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Clock, CreditCard, X, CheckCircle2, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration_months: z.number().min(1, 'Duration must be at least 1 month'),
  fee: z.number().min(0, 'Fee cannot be negative'),
  is_active: z.boolean()
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function MembershipPlans() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['membershipPlans'],
    queryFn: async () => {
      const { data, error } = await supabase.from('membership_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { is_active: true, duration_months: 1, fee: 0 }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PlanFormValues) => {
      if (editingId) {
        const { error } = await supabase.from('membership_plans').update(values).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('membership_plans').insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPlans'] });
      toast.success(editingId ? 'Plan updated successfully' : 'Plan created successfully');
      closeForm();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const openForm = (plan?: any) => {
    if (plan) {
      setEditingId(plan.id);
      reset({
        name: plan.name,
        description: plan.description || '',
        duration_months: plan.duration_months,
        fee: Number(plan.fee),
        is_active: plan.is_active
      });
    } else {
      setEditingId(null);
      reset({ is_active: true, duration_months: 1, fee: 0, name: '', description: '' });
    }
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Membership Tiers" 
        description="Configure subscription plans, billing durations, access privileges, and pricing tiers."
        actions={
          !isFormOpen && (
            <Button 
              variant="primary"
              onClick={() => openForm()}
              icon={<Plus className="w-4 h-4" />}
            >
              Add New Plan
            </Button>
          )
        }
      />

      {/* Create / Edit Plan Drawer Form */}
      {isFormOpen && (
        <div className="bg-[#121212] rounded-[13px] border border-[#242424] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 mb-8">
          <div className="px-7 py-5 border-b border-[#1E1E1E] bg-[#161616] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF4B16]/15 border border-[#FF4B16]/30 flex items-center justify-center text-[#FF4B16]">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">
                {editingId ? 'Edit Membership Tier' : 'Create New Membership Tier'}
              </h2>
            </div>
            <button 
              onClick={closeForm} 
              className="p-2 rounded-xl text-[#A6A6AC] hover:text-[#F5F5F5] hover:bg-[#242424] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Plan Name *</label>
                <input 
                  {...register('name')} 
                  placeholder="e.g. VIP Gold Annual, Student Monthly"
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all placeholder:text-[#555555]" 
                />
                {errors.name && <p className="text-[#E63946] text-xs mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF4B16]" /> Duration (Months) *
                </label>
                <input 
                  type="number" 
                  {...register('duration_months', { valueAsNumber: true })} 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all" 
                />
                {errors.duration_months && <p className="text-[#E63946] text-xs mt-1">{errors.duration_months.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#079C68]" /> Price Fee ($) *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('fee', { valueAsNumber: true })} 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all" 
                />
                {errors.fee && <p className="text-[#E63946] text-xs mt-1">{errors.fee.message}</p>}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Tier Privileges & Benefits</label>
                <textarea 
                  {...register('description')} 
                  placeholder="Outline facility access, guest passes, discounts, and training hours included in this tier..."
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all h-24 resize-none placeholder:text-[#555555]" 
                />
              </div>
              
              <div className="md:col-span-2 flex items-center p-4 bg-[#181818] border border-[#262626] rounded-2xl">
                <input 
                  type="checkbox" 
                  {...register('is_active')} 
                  id="is_active" 
                  className="w-4 h-4 rounded border-[#333333] accent-[#FF4B16] cursor-pointer" 
                />
                <div className="ml-3 cursor-pointer" onClick={() => {}}>
                  <label htmlFor="is_active" className="text-sm font-bold text-[#F5F5F5] cursor-pointer">Active Tier</label>
                  <p className="text-xs text-[#A6A6AC]">Active plans are visible to new signups and renewal workflows.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[#1E1E1E] flex justify-end gap-3">
              <Button 
                type="button" 
                variant="secondary"
                onClick={closeForm}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                isLoading={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Tier' : 'Create Tier'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#A6A6AC]">
          <div className="w-9 h-9 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading membership plans...</p>
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`
                relative flex flex-col p-7 bg-[#121212] rounded-[13px] border shadow-sm transition-all duration-200 hover:border-[#383838] hover:-translate-y-1
                ${plan.is_active ? 'border-[#242424]' : 'border-[#1E1E1E] opacity-75'}
              `}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-extrabold text-xl text-[#F5F5F5] tracking-tight">{plan.name}</h3>
                  <span className="text-xs text-[#A6A6AC] mt-0.5 block">{plan.duration_months} Month Subscription</span>
                </div>
                <Badge variant={plan.is_active ? 'green' : 'neutral'}>
                  {plan.is_active ? 'Active' : 'Archived'}
                </Badge>
              </div>
              
              <div className="mb-6 p-4 rounded-2xl bg-[#181818] border border-[#262626]">
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-[#F5F5F5] tracking-tight">${plan.fee}</span>
                  <span className="text-xs text-[#A6A6AC] font-semibold ml-1.5">
                    / {plan.duration_months > 1 ? `${plan.duration_months} months` : 'month'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4 mb-8">
                <p className="text-xs text-[#A6A6AC] leading-relaxed min-h-[40px]">
                  {plan.description || "Full club privileges and facilities reservation access."}
                </p>
                
                <div className="space-y-2.5 pt-4 border-t border-[#1E1E1E]">
                  <div className="flex items-center text-xs text-[#F5F5F5] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#079C68] mr-2.5 shrink-0" />
                    Valid for {plan.duration_months} continuous month(s)
                  </div>
                  <div className="flex items-center text-xs text-[#F5F5F5] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#079C68] mr-2.5 shrink-0" />
                    Priority court and lane reservations
                  </div>
                  <div className="flex items-center text-xs text-[#F5F5F5] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#079C68] mr-2.5 shrink-0" />
                    Member pricing on tournament entries
                  </div>
                </div>
              </div>
              
              <Button 
                variant="secondary"
                className="w-full"
                onClick={() => openForm(plan)}
                icon={<Edit3 className="w-4 h-4" />}
              >
                Edit Tier Settings
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<CreditCard className="w-8 h-8" />}
          title="No Membership Plans"
          description="Create your first subscription tier to enable new member registrations and fee billing."
          action={
            <Button 
              variant="primary" 
              onClick={() => openForm()}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Membership Tier
            </Button>
          }
        />
      )}
    </div>
  );
}
