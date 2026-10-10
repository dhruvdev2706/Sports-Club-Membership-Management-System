import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2, MapPin, Users, Clock, DollarSign, Plus, X, Loader2, Edit3, Target } from 'lucide-react';

const facilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sport_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().min(1),
  hourly_rate: z.number().min(0),
  booking_duration_minutes: z.number().min(15),
  is_active: z.boolean()
});

type FacilityForm = z.infer<typeof facilitySchema>;

export default function FacilitiesList() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: facilities, isLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('facilities').select('*, sports(name)').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sports').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FacilityForm>({
    resolver: zodResolver(facilitySchema),
    defaultValues: { is_active: true, capacity: 1, hourly_rate: 0, booking_duration_minutes: 60 }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FacilityForm) => {
      const dataToSave = {
        ...values,
        sport_id: values.sport_id === "" ? null : values.sport_id
      };
      
      if (editingId) {
        const { error } = await supabase.from('facilities').update(dataToSave).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('facilities').insert(dataToSave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success(editingId ? 'Facility updated successfully' : 'Facility created successfully');
      closeForm();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const openForm = (facility?: any) => {
    if (facility) {
      setEditingId(facility.id);
      reset({
        name: facility.name,
        sport_id: facility.sport_id,
        description: facility.description || '',
        location: facility.location || '',
        capacity: facility.capacity,
        hourly_rate: Number(facility.hourly_rate),
        booking_duration_minutes: facility.booking_duration_minutes,
        is_active: facility.is_active
      });
    } else {
      setEditingId(null);
      reset({ is_active: true, capacity: 1, hourly_rate: 0, booking_duration_minutes: 60, name: '', description: '', location: '', sport_id: null });
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Facilities</h1>
          <p className="text-muted-foreground mt-1">Manage club venues, courts, and fields available for booking.</p>
        </div>
        {isAdmin && !isFormOpen && (
          <button 
            onClick={() => openForm()} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Facility
          </button>
        )}
      </div>

      {isFormOpen && isAdmin && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">{editingId ? 'Edit Facility' : 'New Facility'}</h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Facility Name</label>
                <input 
                  {...register('name')} 
                  placeholder="e.g., Center Court"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sport (Optional)</label>
                <div className="relative">
                  <select 
                    {...register('sport_id')} 
                    className="w-full pl-3 pr-10 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">None / General</option>
                    {sports?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Location</label>
                <input 
                  {...register('location')} 
                  placeholder="e.g., Main Building, Floor 1"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" /> Capacity (People)
                </label>
                <input 
                  type="number" 
                  {...register('capacity', { valueAsNumber: true })} 
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" /> Hourly Rate ($)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('hourly_rate', { valueAsNumber: true })} 
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Booking Duration (Mins)
                </label>
                <input 
                  type="number" 
                  step="15" 
                  {...register('booking_duration_minutes', { valueAsNumber: true })} 
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors" 
                />
              </div>
              
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea 
                  {...register('description')} 
                  placeholder="Provide details about equipment, flooring, etc."
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors h-24 resize-none" 
                />
              </div>
              
              <div className="md:col-span-3 flex items-center p-4 bg-muted/30 border border-border/50 rounded-lg">
                <input 
                  type="checkbox" 
                  {...register('is_active')} 
                  id="is_active" 
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary accent-primary" 
                />
                <div className="ml-3">
                  <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Active Status</label>
                  <p className="text-xs text-muted-foreground">If active, members can book this facility.</p>
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
                {saveMutation.isPending ? 'Saving...' : 'Save Facility'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p>Loading facilities...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {facilities?.map((facility) => (
            <div 
              key={facility.id} 
              className={`
                relative flex flex-col p-6 bg-card rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md
                ${!facility.is_active ? 'opacity-75 grayscale-[0.2]' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-foreground flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" /> {facility.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>{facility.sports?.name || 'General Use'}</span>
                    {facility.location && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{facility.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0
                  ${facility.is_active ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'}`}>
                  {facility.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mb-5 flex items-end gap-1">
                <span className="text-3xl font-extrabold text-foreground">${facility.hourly_rate}</span>
                <span className="text-muted-foreground mb-1 font-medium">/ hour</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex flex-col p-3 bg-muted/40 rounded-lg border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Capacity
                  </span>
                  <span className="text-sm font-semibold text-foreground">{facility.capacity} people</span>
                </div>
                <div className="flex flex-col p-3 bg-muted/40 rounded-lg border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Slot length
                  </span>
                  <span className="text-sm font-semibold text-foreground">{facility.booking_duration_minutes} mins</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                {facility.description || "No specific details provided for this facility."}
              </p>
              
              {isAdmin && (
                <button 
                  onClick={() => openForm(facility)} 
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-border bg-muted/30 text-foreground rounded-lg font-medium text-sm hover:bg-muted hover:border-border/80 transition-colors mt-auto"
                >
                  <Edit3 className="w-4 h-4" /> Edit Facility
                </button>
              )}
            </div>
          ))}
          {facilities?.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-border rounded-xl bg-muted/10">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No facilities found</h3>
              <p className="text-muted-foreground mb-4">You haven't added any facilities yet.</p>
              {isAdmin && (
                <button 
                  onClick={() => openForm()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Facility
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
