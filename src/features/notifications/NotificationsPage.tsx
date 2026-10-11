import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { 
  Bell, 
  CheckCircle2, 
  CheckCheck, 
  Clock, 
  Info 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile?.id).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    }
  });

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader 
        title="Club Notifications" 
        description="Live updates on court reservations, tournament invites, and account alerts."
        badge={
          unreadCount > 0 ? (
            <Badge variant="orange" size="md">
              {unreadCount} Unread
            </Badge>
          ) : (
            <Badge variant="green" size="md">
              All Caught Up
            </Badge>
          )
        }
        actions={
          unreadCount > 0 && (
            <Button 
              variant="secondary"
              size="sm"
              isLoading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              icon={<CheckCheck className="w-4 h-4" />}
            >
              Mark All as Read
            </Button>
          )
        }
      />

      <div className="bg-[#121212] border border-[#242424] rounded-[26px] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#A6A6AC]">
            <div className="w-8 h-8 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">Loading notifications...</span>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-[#1E1E1E]">
            {notifications.map((n: any) => {
              const isUnread = !n.is_read;

              return (
                <div 
                  key={n.id} 
                  className={`p-6 transition-all duration-200 relative flex items-start justify-between gap-4 ${
                    isUnread ? 'bg-[#181818]/90 hover:bg-[#1C1C1C]' : 'bg-[#121212] hover:bg-[#161616]'
                  }`}
                >
                  {isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF4B16]" />
                  )}
                  
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUnread 
                        ? 'bg-[#FF4B16]/15 border border-[#FF4B16]/30 text-[#FF4B16]' 
                        : 'bg-[#1E1E1E] text-[#A6A6AC] border border-[#282828]'
                    }`}>
                      <Info className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-base font-bold truncate ${isUnread ? 'text-[#F5F5F5]' : 'text-[#CCCCCC]'}`}>
                          {n.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#FF4B16] shrink-0" />
                        )}
                      </div>

                      <p className={`text-xs mt-1 leading-relaxed ${isUnread ? 'text-[#F5F5F5]/90 font-medium' : 'text-[#A6A6AC]'}`}>
                        {n.message}
                      </p>

                      <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-[#777777]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(n.created_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })} at {new Date(n.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button 
                      onClick={() => markReadMutation.mutate(n.id)}
                      disabled={markReadMutation.isPending}
                      className="p-2 rounded-xl text-[#A6A6AC] hover:text-[#079C68] hover:bg-[#079C68]/10 border border-transparent hover:border-[#079C68]/20 transition-all shrink-0 cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={<Bell className="w-8 h-8" />}
            title="You're All Caught Up"
            description="You have no notifications or alerts at the moment. We'll alert you here when new events occur."
          />
        )}
      </div>
    </div>
  );
}
