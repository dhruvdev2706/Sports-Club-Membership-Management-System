import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Mail, 
  Phone, 
  Award, 
  ShieldCheck, 
  GraduationCap 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CoachesList() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: coaches, isLoading } = useQuery({
    queryKey: ['coaches_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'coach')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredCoaches = coaches?.filter(coach => 
    coach.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Coaching Staff" 
        description="Certified professional instructors, specialized training staff, and athletic batch mentors."
        badge={
          coaches && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#242424] text-[#F5F5F5] border border-[#333333]">
              {coaches.length} Coaches
            </span>
          )
        }
      />

      {/* Search Toolbar */}
      <div className="bg-[#121212] border border-[#242424] rounded-[20px] p-4 shadow-sm flex flex-col sm:flex-row gap-4">
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
              className="group flex flex-col bg-[#121212] rounded-[26px] border border-[#242424] hover:border-[#383838] shadow-sm hover:-translate-y-1 transition-all overflow-hidden p-6"
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
                  <Badge variant="purple" size="sm">
                    <Award className="w-3 h-3 mr-1" /> Head Coach
                  </Badge>
                </div>
              </div>
              
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
                    {coach.phone_number || 'No phone on record'}
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
    </div>
  );
}
