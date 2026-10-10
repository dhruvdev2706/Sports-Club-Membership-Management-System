import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Clock, CreditCard, X, Loader2, CheckCircle2 } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Membership Plans</h1>
          <p className="text-muted-foreground mt-1">Create and manage subscription tiers for your members.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => openForm()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">{editingId ? 'Edit Membership Plan' : 'Create New Plan'}</h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Plan Name</label>
                <input 
                  {...register('name')} 
                  placeholder="e.g., Premium Annual, Basic Monthly"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Duration (Months)
                </label>
                <input 
                  type="number" 
                  {...register('duration_months', { valueAsNumber: true })} 
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
                {errors.duration_months && <p className="text-destructive text-sm mt-1">{errors.duration_months.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" /> Fee ($)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('fee', { valueAsNumber: true })} 
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
                {errors.fee && <p className="text-destructive text-sm mt-1">{errors.fee.message}</p>}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea 
                  {...register('description')} 
                  placeholder="Describe the benefits of this plan..."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors h-24 resize-none" 
                />
              </div>
              
              <div className="md:col-span-2 flex items-center p-4 bg-muted/30 border border-border/50 rounded-lg">
                <input 
                  type="checkbox" 
                  {...register('is_active')} 
                  id="is_active" 
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary accent-primary" 
                />
                <div className="ml-3">
                  <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Active Status</label>
                  <p className="text-xs text-muted-foreground">If active, this plan is available for new subscriptions.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border flex justify-end gap-3">
              <button 
                type="button" 
                onClick={closeForm} 
                className="px-4 py-2 border border-border bg-background text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saveMutation.isPending} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading plans...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <div 
              key={plan.id} 
              className={`
                relative flex flex-col p-6 bg-card rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md
                ${!plan.is_active ? 'opacity-75 grayscale-[0.2]' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl text-foreground">{plan.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                  ${plan.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-foreground">${plan.fee}</span>
                <span className="text-muted-foreground ml-1">/ {plan.duration_months > 1 ? `${plan.duration_months} mos` : 'mo'}</span>
              </div>
              
              <div className="flex-1 space-y-4 mb-8">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {plan.description || "No description provided."}
                </div>
                
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <div className="flex items-center text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                    Valid for {plan.duration_months} month(s)
                  </div>
                  <div className="flex items-center text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                    Access to club facilities
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => openForm(plan)}
                className="w-full py-2.5 border border-border bg-muted/30 text-foreground rounded-lg font-medium text-sm hover:bg-muted hover:border-border/80 transition-colors mt-auto"
              >
                Edit Plan
              </button>
            </div>
          ))}
          {plans?.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
              <CreditCard className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No plans available</h3>
              <p className="text-muted-foreground mb-4">Create your first membership plan to get started.</p>
              <button 
                onClick={() => openForm()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Plan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
