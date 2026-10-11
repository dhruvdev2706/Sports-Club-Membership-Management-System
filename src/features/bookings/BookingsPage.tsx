import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  XCircle, 
  Building2, 
  CalendarDays
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function BookingsPage() {
  const { profile, session } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const queryClient = useQueryClient();
  
  // Format current date in YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string; startTimeFormatted: string; endTimeFormatted: string } | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('facilities').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    }
  });

  // Auto-select first facility if not set
  useMemo(() => {
    if (facilities && facilities.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0].id);
    }
  }, [facilities, selectedFacility]);

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', isAdmin ? 'all' : profile?.id],
    queryFn: async () => {
      let query = supabase.from('bookings').select('*, facilities(name, location), members(profiles(full_name))').order('start_time', { ascending: false });
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

  const currentFacility = facilities?.find(f => f.id === selectedFacility);

  // Compute standard available time slots for the selected day
  const timeSlots = useMemo(() => {
    if (!currentFacility || !selectedDate) return [];

    const duration = currentFacility.booking_duration_minutes || 60;
    const slots = [];
    
    // Facility operates from 06:00 to 22:00
    const startHour = 6;
    const endHour = 22;

    const baseDate = new Date(`${selectedDate}T00:00:00`);
    const nowTime = Date.now();

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += duration) {
        const slotStart = new Date(baseDate);
        slotStart.setHours(hour, min, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);
        if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) {
          break;
        }

        const isPast = slotStart.getTime() < nowTime;
        
        // Check collision with confirmed or pending bookings
        const isBooked = facilityBookings?.some((b: any) => {
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          startTimeFormatted: slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          endTimeFormatted: slotEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          isPast,
          isBooked: !!isBooked,
        });
      }
    }

    return slots;
  }, [currentFacility, selectedDate, facilityBookings]);

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
      toast.success(data.message || 'Facility reserved successfully');
      setSelectedSlot(null);
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
      toast.success('Booking cancelled successfully');
      setCancellingBookingId(null);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['facility_bookings'] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Court & Facility Bookings" 
        description="Select a venue, check live slot availability, and reserve practice or match times."
      />

      {/* Main Booking Interface Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Side: Venue & Date Selector & Time Slots (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121212] border border-[#242424] rounded-[26px] p-6 sm:p-7 shadow-sm">
            <h3 className="font-bold text-lg text-[#F5F5F5] mb-5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF4B16]" /> Select Facility & Date
            </h3>

            {/* Facility Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 custom-scrollbar">
              {facilities?.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFacility(f.id);
                    setSelectedSlot(null);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    selectedFacility === f.id
                      ? 'bg-[#FF4B16] text-[#111111] font-bold shadow-md shadow-[#FF4B16]/20'
                      : 'bg-[#181818] text-[#A6A6AC] border border-[#262626] hover:text-[#F5F5F5] hover:bg-[#202020]'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Date Picker Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#181818] border border-[#262626] mb-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-[#5035E8]" />
                <div>
                  <span className="text-xs uppercase font-bold text-[#A6A6AC]">Reservation Date</span>
                  <p className="text-sm font-semibold text-[#F5F5F5]">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <input 
                type="date"
                min={todayDateStr}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0A0A0A] border border-[#2E2E2E] text-xs font-semibold text-[#F5F5F5] focus:outline-none focus:border-[#FF4B16] cursor-pointer"
              />
            </div>

            {/* Slots Legend */}
            <div className="flex items-center gap-4 text-[11px] font-semibold text-[#A6A6AC] mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#181818] border border-[#333333]" /> Available
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#FF4B16]" /> Selected
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#0A0A0A] border border-[#202020] opacity-40" /> Reserved / Past
              </div>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto custom-scrollbar p-1">
              {timeSlots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start;
                const isDisabled = slot.isPast || slot.isBooked;

                return (
                  <button
                    key={index}
                    disabled={isDisabled}
                    onClick={() => setSelectedSlot(slot)}
                    className={`
                      p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none
                      ${isSelected
                        ? 'bg-[#FF4B16] text-[#111111] font-bold shadow-md shadow-[#FF4B16]/25 scale-[1.02]'
                        : isDisabled
                        ? 'bg-[#0E0E0E] text-[#444444] border border-[#1A1A1A] cursor-not-allowed opacity-50'
                        : 'bg-[#181818] text-[#F5F5F5] border border-[#282828] hover:border-[#FF4B16]/60 hover:bg-[#202020]'}
                    `}
                  >
                    <span className="text-xs font-bold font-mono">
                      {slot.startTimeFormatted}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#111111]/80' : 'text-[#777777]'}`}>
                      {slot.isBooked ? 'Booked' : slot.isPast ? 'Passed' : 'Available'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Slot Confirmation Bar */}
            {selectedSlot && (
              <div className="mt-6 p-4 rounded-2xl bg-[#FF4B16]/10 border border-[#FF4B16]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div>
                  <span className="text-xs font-bold text-[#FF4B16] uppercase tracking-wider">Ready to reserve</span>
                  <p className="text-sm font-bold text-[#F5F5F5]">
                    {currentFacility?.name}: {selectedSlot.startTimeFormatted} - {selectedSlot.endTimeFormatted}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={bookMutation.isPending}
                  onClick={() => bookMutation.mutate(selectedSlot)}
                >
                  Confirm Reservation
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Reservations List (5 Cols) */}
        <div className="lg:col-span-5 bg-[#121212] border border-[#242424] rounded-[26px] p-6 sm:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-[#F5F5F5] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5035E8]" /> 
                {isAdmin ? 'All Club Reservations' : 'Your Reserved Slots'}
              </h3>
              <Badge variant="neutral" size="sm">
                {bookings?.length ?? 0} Total
              </Badge>
            </div>

            {isLoadingBookings ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#A6A6AC]">
                <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs">Loading reservations...</span>
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                {bookings.map((b: any) => {
                  const startTime = new Date(b.start_time);
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <div 
                      key={b.id} 
                      className="p-4 rounded-2xl bg-[#181818] border border-[#262626] flex items-start justify-between gap-3 hover:border-[#383838] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#F5F5F5] truncate">{b.facilities?.name}</h4>
                          <Badge 
                            variant={isConfirmed ? 'green' : isCancelled ? 'danger' : 'orange'} 
                            size="sm"
                          >
                            {b.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#A6A6AC] mt-1">
                          {startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                          {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {isAdmin && b.members?.profiles?.full_name && (
                          <p className="text-[11px] text-[#A6A6AC] font-medium mt-1">
                            Booked by: <span className="text-[#F5F5F5]">{b.members.profiles.full_name}</span>
                          </p>
                        )}
                      </div>

                      {isConfirmed && (
                        <button
                          onClick={() => setCancellingBookingId(b.id)}
                          className="p-1.5 rounded-lg text-[#A6A6AC] hover:text-[#E63946] hover:bg-[#E63946]/10 transition-colors shrink-0 cursor-pointer"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-[#282828] rounded-2xl bg-[#161616]/50">
                <CalendarIcon className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#F5F5F5]">No bookings found</p>
                <p className="text-xs text-[#A6A6AC] mt-1">Select a venue and available time slot on the left to make a reservation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingBookingId}
        onClose={() => setCancellingBookingId(null)}
        title="Cancel Court Reservation"
        description="Are you sure you wish to cancel this booking? This will release the court time slot back to other club members."
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            variant="secondary"
            onClick={() => setCancellingBookingId(null)}
          >
            Keep Reservation
          </Button>
          <Button 
            variant="destructive"
            isLoading={cancelMutation.isPending}
            onClick={() => cancellingBookingId && cancelMutation.mutate({ id: cancellingBookingId, status: 'cancelled' })}
          >
            Yes, Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  );
}
