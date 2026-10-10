import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, MapPin, DollarSign, Clock, XCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function BookingsPage() {
  const { profile, session } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { data: facilities, isLoading: isLoadingFacilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('facilities').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', isAdmin ? 'all' : profile?.id],
    queryFn: async () => {
      let query = supabase.from('bookings').select('*, facilities(name), members(profiles(full_name))').order('start_time', { ascending: false });
      if (!isAdmin) {
        query = query.eq('member_id', profile?.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: facilityBookings } = useQuery({
    queryKey: ['facility_bookings', selectedFacility, selectedDate],
    queryFn: async () => {
      if (!selectedFacility || !selectedDate) return [];
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('facility_id', selectedFacility)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .in('status', ['confirmed', 'pending']);
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFacility && !!selectedDate
  });

  const bookMutation = useMutation({
    mutationFn: async (slot: { start: string, end: string }) => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          facility_id: selectedFacility,
          start_time: slot.start,
          end_time: slot.end
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['facility_bookings'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      if (isAdmin) {
        const res = await fetch(`/api/bookings/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ status, admin_reason: 'Admin cancelled' })
        });
        if (!res.ok) throw new Error('Failed to cancel');
      } else {
        const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['facility_bookings'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Generate time slots (simplified 9 AM to 9 PM)
  const timeSlots = useMemo(() => {
    if (!selectedFacility || !selectedDate) return [];
    const facility = facilities?.find(f => f.id === selectedFacility);
    if (!facility) return [];

    const durationMs = facility.booking_duration_minutes * 60 * 1000;
    const slots = [];
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(21, 0, 0, 0); // 9 PM

    let current = startOfDay.getTime();
    while (current + durationMs <= endOfDay.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current + durationMs);
      
      // Check if past
      const isPast = slotStart.getTime() < new Date().getTime();
      
      // Check if overlapping with existing bookings
      const isBooked = facilityBookings?.some((b: any) => {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return (current < bEnd && current + durationMs > bStart);
      });

      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        startLabel: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endLabel: slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBooked,
        isPast,
        price: facility.hourly_rate * (facility.booking_duration_minutes / 60)
      });
      
      current += durationMs;
    }
    return slots;
  }, [selectedFacility, selectedDate, facilities, facilityBookings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{isAdmin ? 'All Bookings' : 'My Bookings'}</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Manage all facility reservations.' : 'Schedule and manage your facility reservations.'}
          </p>
        </div>
      </div>
      
      {!isAdmin && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <h2 className="text-xl font-bold text-foreground mb-6 relative z-10">Book a Facility</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Facility
              </label>
              <div className="relative">
                <select 
                  className="w-full pl-3 pr-10 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors appearance-none cursor-pointer disabled:opacity-50"
                  value={selectedFacility}
                  disabled={isLoadingFacilities}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                >
                  <option value="">-- Select a facility --</option>
                  {facilities?.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (${f.hourly_rate}/hr)</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Date
              </label>
              <input 
                type="date" 
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {selectedFacility && selectedDate && (
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Available Time Slots</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-background border border-border"></span> Available</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-muted border border-border"></span> Unavailable</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {timeSlots.map((slot, i) => {
                  const isDisabled = slot.isBooked || slot.isPast || bookMutation.isPending;
                  
                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => {
                        if (confirm(`Book this facility for $${slot.price.toFixed(2)}?`)) {
                          bookMutation.mutate(slot);
                        }
                      }}
                      className={`
                        relative flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all duration-200
                        ${slot.isBooked 
                          ? 'bg-muted/50 border-transparent text-muted-foreground cursor-not-allowed' 
                          : slot.isPast 
                            ? 'bg-muted/30 border-transparent text-muted-foreground/50 cursor-not-allowed'
                            : 'bg-background border-border hover:border-primary hover:shadow-sm cursor-pointer hover:-translate-y-0.5'
                        }
                      `}
                    >
                      <span className={`font-semibold ${!isDisabled ? 'text-foreground' : ''}`}>
                        {slot.startLabel}
                      </span>
                      <span className={`text-xs mt-1 font-medium ${!isDisabled ? 'text-primary' : ''}`}>
                        ${slot.price.toFixed(2)}
                      </span>
                      
                      {slot.isBooked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[1px] rounded-lg border border-border">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Booked</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <h2 className="font-semibold text-foreground">Recent Reservations</h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                {isAdmin && <th className="px-6 py-4 font-medium">Member</th>}
                <th className="px-6 py-4 font-medium">Facility</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Fee</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingBookings ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span>Loading bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings?.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CalendarIcon className="w-8 h-8 opacity-20" />
                      <span>No bookings found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings?.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                    {isAdmin && (
                      <td className="px-6 py-4 font-medium text-foreground">
                        {booking.members?.profiles?.full_name}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{booking.facilities?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(booking.start_time).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        {booking.fee}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${booking.status === 'confirmed' ? 'bg-success/10 text-success border-success/20' : 
                          booking.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                          'bg-destructive/10 text-destructive border-destructive/20'}`}>
                        {booking.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                        {booking.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1.5" />}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              cancelMutation.mutate({ id: booking.id, status: 'cancelled' })
                            }
                          }}
                          disabled={cancelMutation.isPending}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
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
  );
}
