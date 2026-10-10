import { useAuth } from '../auth/AuthContext';
import AdminDashboard from './AdminDashboard';
import CoachDashboard from './CoachDashboard';
import MemberDashboard from './MemberDashboard';

export default function DashboardRouter() {
  const { profile, isLoading } = useAuth();
  
  if (isLoading) return <div className="p-6">Loading dashboard...</div>;
  
  if (profile?.role === 'admin') return <AdminDashboard />;
  if (profile?.role === 'coach') return <CoachDashboard />;
  return <MemberDashboard />;
}
