import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  LogOut, LayoutDashboard, Users, CreditCard, 
  GraduationCap, Building, Calendar, Receipt, ClipboardCheck, 
  Dumbbell, Trophy, TrendingUp, Bell, PieChart, Menu, X, Activity, ChevronRight 
} from 'lucide-react';

export default function MainLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  // Structured navigation groups
  const navSections = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'coach', 'member'] },
      ]
    },
    {
      group: 'Club Operations',
      items: [
        { label: 'Members', path: '/members', icon: Users, roles: ['admin', 'coach'] },
        { label: 'Memberships', path: '/memberships', icon: CreditCard, roles: ['admin'] },
        { label: 'Coaches', path: '/coaches', icon: GraduationCap, roles: ['admin'] },
        { label: 'Facilities', path: '/facilities', icon: Building, roles: ['admin', 'coach'] },
      ]
    },
    {
      group: 'Activities & Training',
      items: [
        { label: 'Bookings', path: '/bookings', icon: Calendar, roles: ['admin', 'coach', 'member'] },
        { label: 'Attendance', path: '/attendance', icon: ClipboardCheck, roles: ['admin', 'coach', 'member'] },
        { label: 'Equipment', path: '/equipment', icon: Dumbbell, roles: ['admin', 'coach', 'member'] },
        { label: 'Tournaments', path: '/tournaments', icon: Trophy, roles: ['admin', 'coach', 'member'] },
        { label: 'Performance', path: '/performance', icon: TrendingUp, roles: ['admin', 'coach', 'member'] },
      ]
    },
    {
      group: 'Finance & Analytics',
      items: [
        { label: 'Payments', path: '/payments', icon: Receipt, roles: ['admin', 'coach', 'member'] },
        { label: 'Reports', path: '/reports', icon: PieChart, roles: ['admin'] },
        { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['admin', 'coach', 'member'] },
      ]
    }
  ];

  // Helper to find current active label
  const allNavItems = navSections.flatMap(s => s.items);
  const currentNavItem = allNavItems.find(item => 
    item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
  ) || { label: 'Dashboard' };

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden text-[#F5F5F5]">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-md transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[270px] bg-[#000000] border-r border-[#1E1E1E] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-[74px] flex items-center justify-between px-6 border-b border-[#1E1E1E] bg-[#000000]">
          <Link 
            to="/" 
            className="flex items-center gap-3 group" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-[#FF4B16] text-[#111111] flex items-center justify-center font-bold shadow-md shadow-[#FF4B16]/20 transition-transform duration-200 group-hover:scale-105">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[17px] tracking-tight text-[#F5F5F5] leading-none">Apex Sports</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A6A6AC] mt-1">Club Management</span>
            </div>
          </Link>
          <button 
            className="p-1.5 rounded-lg md:hidden text-[#A6A6AC] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar">
          {navSections.map((section) => {
            const visibleItems = section.items.filter(item => 
              profile?.role && item.roles.includes(profile.role)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.group} className="space-y-1">
                <div className="text-[10px] font-bold text-[#A6A6AC] uppercase tracking-wider px-3 mb-2">
                  {section.group}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-180 group
                        ${isActive 
                          ? 'bg-[#FF4B16] text-[#111111] shadow-md shadow-[#FF4B16]/20 font-bold' 
                          : 'text-[#A6A6AC] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]'}
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#111111] stroke-[2.2]' : 'text-[#A6A6AC] group-hover:text-[#F5F5F5]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-[#111111]/70 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* User Profile Section Footer */}
        <div className="p-4 border-t border-[#1E1E1E] bg-[#0A0A0A]">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-[#141414] border border-[#222222]">
            <div className="w-9 h-9 rounded-xl bg-[#5035E8] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#F5F5F5] truncate leading-tight">
                {profile?.full_name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#079C68]" />
                <p className="text-[11px] text-[#A6A6AC] capitalize font-medium truncate">
                  {profile?.role || 'Member'}
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-[#A6A6AC] hover:text-[#E63946] hover:bg-[#E63946]/10 border border-transparent hover:border-[#E63946]/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
        
        {/* Top Header */}
        <header className="h-[74px] flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0 bg-[#080808]/85 backdrop-blur-md border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-[#A6A6AC] hover:text-[#F5F5F5] rounded-xl hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-[#A6A6AC] hidden sm:inline">Portal /</span>
              <h2 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
                {currentNavItem.label}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/notifications" 
              className="relative p-2.5 text-[#A6A6AC] hover:text-[#F5F5F5] bg-[#141414] hover:bg-[#1F1F1F] rounded-xl transition-colors border border-[#242424] shadow-sm cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF4B16] rounded-full ring-2 ring-[#080808]"></span>
            </Link>
            
            <div className="flex items-center gap-2.5 bg-[#141414] pl-2 pr-3.5 py-1.5 rounded-xl border border-[#242424] shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[#5035E8]/20 border border-[#5035E8]/40 flex items-center justify-center text-[#A594FF] font-bold text-xs">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#F5F5F5] truncate max-w-[120px] leading-tight">
                  {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-[10px] text-[#A6A6AC] capitalize leading-none">
                  {profile?.role || 'Member'}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Main Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 custom-scrollbar">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
