import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  Search, 
  Mail, 
  Phone, 
  Award, 
  ShieldCheck, 
  GraduationCap,
  Plus
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

const emptyCoachForm = {
  full_name: '',
  email: '',
  password: '',
  specialization: '',
  phone: '',
  bio: '',
};

export default function CoachesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(emptyCoachForm);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: coaches, isLoading } = useQuery({
    queryKey: ['coaches_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, coaches(specialization, bio, phone)')
        .eq('role', 'coach')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createCoach = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const response = await fetch('/api/coaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to add coach');
    },
    onSuccess: () => {
      toast.success('Coach account and profile created. Share the initial password securely.');
      queryClient.invalidateQueries({ queryKey: ['coaches_list'] });
      setFormData(emptyCoachForm);
      setIsFormOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredCoaches = coaches?.filter(coach => 
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.coaches?.[0]?.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Coaching Staff" 
        description="Certified professional instructors, specialized training staff, and athletic batch mentors."
        actions={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsFormOpen(true)}>
            Add Coach
          </Button>
        }
        badge={
          coaches && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#242424] text-[#F5F5F5] border border-[#333333]">
              {coaches.length} Coaches
            </span>
          )
        }
      />

      {/* Search Toolbar */}
      <div className="bg-[#121212] border border-[#242424] rounded-[10px] p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A6A6AC]" />
          <input 
            type="text" 
            placeholder="Search coaches by name, specialization, or email..." 
            className="w-full pl-10 pr-4 py-2.5 border border-[#242424] rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-sm focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 transition-all placeholder:text-[#555555]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#A6A6AC]">
          <div className="w-9 h-9 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading coaching staff...</p>
        </div>
      ) : filteredCoaches && filteredCoaches.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCoaches.map((coach: any) => (
            <div 
              key={coach.id} 
              className="group flex flex-col bg-[#121212] rounded-[13px] border border-[#242424] hover:border-[#383838] shadow-sm hover:-translate-y-1 transition-all overflow-hidden p-6"
            >
              <div className="flex flex-col items-center text-center pb-5">
                <div className="w-20 h-20 rounded-2xl bg-[#5035E8]/20 border border-[#5035E8]/35 flex items-center justify-center text-[#A594FF] text-2xl font-extrabold mb-4 shadow-inner relative group-hover:scale-105 transition-transform">
                  {coach.full_name?.charAt(0) || 'C'}
                  <div className="absolute -bottom-1.5 -right-1.5 bg-[#000000] rounded-xl p-1 border border-[#282828] text-[#079C68]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="font-extrabold text-lg text-[#F5F5F5] line-clamp-1">{coach.full_name}</h3>
                <div className="mt-2">
                  <Badge variant="neutral" size="sm">
                    <Award className="w-3 h-3 mr-1" /> {coach.coaches?.[0]?.specialization || 'Coach'}
                  </Badge>
                </div>
              </div>

              {coach.coaches?.[0]?.bio && (
                <p className="text-xs leading-relaxed text-[#A6A6AC] pb-4">{coach.coaches[0].bio}</p>
              )}
              
              <div className="space-y-2.5 pt-4 border-t border-[#1E1E1E] mt-auto">
                <div className="flex items-center gap-3 text-xs text-[#A6A6AC] bg-[#181818] p-2.5 rounded-xl border border-[#262626]">
                  <Mail className="w-4 h-4 shrink-0 text-[#FF4B16]" />
                  <span className="truncate" title={coach.email || 'N/A'}>
                    {coach.email || 'No email provided'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#A6A6AC] bg-[#181818] p-2.5 rounded-xl border border-[#262626]">
                  <Phone className="w-4 h-4 shrink-0 text-[#079C68]" />
                  <span className="truncate">
                    {coach.coaches?.[0]?.phone || 'No phone on record'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<GraduationCap className="w-8 h-8" />}
          title="No Coaches Found"
          description={searchTerm ? `No instructors matched "${searchTerm}".` : 'No coach profiles have been added to the system yet.'}
        />
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add Coach"
        description="Create a coach login and save their staff profile."
        maxWidth="lg"
      >
        <form onSubmit={(event) => createCoach.mutate(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full name"
              autoComplete="name"
              required
              value={formData.full_name}
              onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            />
            <Input
              label="Initial password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              helperText="At least 8 characters. Ask the coach to change it after signing in."
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
            />
            <Input
              label="Specialization"
              placeholder="Tennis, swimming, strength training"
              value={formData.specialization}
              onChange={(event) => setFormData({ ...formData, specialization: event.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
            />
          </div>
          <label className="flex w-full flex-col gap-1.5 text-xs font-medium text-[#A6A6AC]">
            Biography
            <textarea
              rows={3}
              maxLength={2000}
              value={formData.bio}
              onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
              className="w-full resize-y rounded-xl border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#555555] focus:border-[#FF4B16] focus:outline-none focus:ring-2 focus:ring-[#FF4B16]/20"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCoach.isPending}>
              Create Coach
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
