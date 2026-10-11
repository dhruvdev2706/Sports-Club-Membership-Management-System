import { useAuth } from '../auth/AuthContext';
import AdminDashboard from './AdminDashboard';
import CoachDashboard from './CoachDashboard';
import MemberDashboard from './MemberDashboard';

export default function DashboardRouter() {
  const { profile, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[#A6A6AC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#FF4B16] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading club dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (profile?.role === 'admin') return <AdminDashboard />;
  if (profile?.role === 'coach') return <CoachDashboard />;
  return <MemberDashboard />;
}
