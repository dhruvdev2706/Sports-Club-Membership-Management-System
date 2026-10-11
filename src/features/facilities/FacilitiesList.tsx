import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2, MapPin, Plus, X, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

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
      <PageHeader 
        title="Club Facilities & Courts" 
        description="Browse courts, swimming lanes, fitness studios, and reserve training venues."
        actions={
          isAdmin && !isFormOpen && (
            <Button 
              variant="primary"
              onClick={() => openForm()}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Facility
            </Button>
          )
        }
      />

      {/* Admin Facility Drawer / Form */}
      {isFormOpen && isAdmin && (
        <div className="bg-[#121212] rounded-[26px] border border-[#242424] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 mb-8">
          <div className="px-7 py-5 border-b border-[#1E1E1E] bg-[#161616] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF4B16]/15 border border-[#FF4B16]/30 flex items-center justify-center text-[#FF4B16]">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">
                {editingId ? 'Edit Facility Details' : 'Register New Facility'}
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
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Facility Name *</label>
                <input 
                  {...register('name')} 
                  placeholder="e.g. Olympic Swimming Pool, Court 1" 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all placeholder:text-[#555555]"
                />
                {errors.name && <p className="text-[#E63946] text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Sport / Discipline</label>
                <div className="relative">
                  <select 
                    {...register('sport_id')} 
                    className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">General Facility (All sports)</option>
                    {sports?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
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
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Location / Section</label>
                <input 
                  {...register('location')} 
                  placeholder="e.g. East Wing, Outdoor Area B" 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all placeholder:text-[#555555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Capacity (Athletes)</label>
                <input 
                  type="number" 
                  {...register('capacity', { valueAsNumber: true })} 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all"
                />
                {errors.capacity && <p className="text-[#E63946] text-xs mt-1">{errors.capacity.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Hourly Rate ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  {...register('hourly_rate', { valueAsNumber: true })} 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Slot Duration (Minutes)</label>
                <input 
                  type="number" 
                  step="15" 
                  {...register('booking_duration_minutes', { valueAsNumber: true })} 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-[#A6A6AC] uppercase tracking-wider">Description & Rules</label>
                <textarea 
                  {...register('description')} 
                  placeholder="Facility specifications, flooring type, gear requirements..." 
                  className="w-full px-4 py-3 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all h-24 resize-none placeholder:text-[#555555]"
                />
              </div>

              <div className="md:col-span-2 flex items-center p-4 bg-[#181818] border border-[#262626] rounded-2xl">
                <input 
                  type="checkbox" 
                  {...register('is_active')} 
                  id="facility_is_active" 
                  className="w-4 h-4 rounded border-[#333333] accent-[#FF4B16] cursor-pointer"
                />
                <div className="ml-3">
                  <label htmlFor="facility_is_active" className="text-sm font-bold text-[#F5F5F5] cursor-pointer">Available for Booking</label>
                  <p className="text-xs text-[#A6A6AC]">Active facilities can be reserved by members and assigned to training batches.</p>
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
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Facility' : 'Create Facility'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Facilities Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#A6A6AC]">
          <div className="w-9 h-9 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading club facilities...</p>
        </div>
      ) : facilities && facilities.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <div 
              key={facility.id} 
              className="bg-[#121212] rounded-[26px] border border-[#242424] hover:border-[#383838] shadow-sm hover:-translate-y-1 transition-all overflow-hidden flex flex-col p-7"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-[#F5F5F5] tracking-tight">{facility.name}</h3>
                  {facility.location && (
                    <p className="text-xs text-[#A6A6AC] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF4B16]" /> {facility.location}
                    </p>
                  )}
                </div>
                <Badge variant={facility.is_active ? 'green' : 'neutral'} size="sm">
                  {facility.is_active ? 'Open' : 'Closed'}
                </Badge>
              </div>

              <div className="my-2">
                {facility.sports?.name ? (
                  <Badge variant="purple" size="sm">
                    {facility.sports.name}
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    Multi-sport
                  </Badge>
                )}
              </div>

              <p className="text-xs text-[#A6A6AC] leading-relaxed my-4 flex-1 line-clamp-2">
                {facility.description || 'Modern athletic facility maintained to competitive club standards.'}
              </p>

              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#181818] border border-[#262626] mb-5 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A6A6AC] block">Rate</span>
                  <span className="text-xs font-bold text-[#F5F5F5] mt-0.5 block">
                    {facility.hourly_rate > 0 ? `$${facility.hourly_rate}/hr` : 'Free'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A6A6AC] block">Capacity</span>
                  <span className="text-xs font-bold text-[#F5F5F5] mt-0.5 block">
                    {facility.capacity} pax
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#A6A6AC] block">Slot</span>
                  <span className="text-xs font-bold text-[#F5F5F5] mt-0.5 block">
                    {facility.booking_duration_minutes}m
                  </span>
                </div>
              </div>

              {isAdmin && (
                <Button 
                  variant="secondary"
                  size="sm"
                  className="w-full mt-auto"
                  onClick={() => openForm(facility)}
                  icon={<Edit3 className="w-4 h-4" />}
                >
                  Edit Facility Settings
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<Building2 className="w-8 h-8" />}
          title="No Facilities Registered"
          description="Register courts, rinks, gymnasiums, and sports fields for athlete booking."
          action={
            isAdmin && (
              <Button 
                variant="primary" 
                onClick={() => openForm()}
                icon={<Plus className="w-4 h-4" />}
              >
                Add First Facility
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
