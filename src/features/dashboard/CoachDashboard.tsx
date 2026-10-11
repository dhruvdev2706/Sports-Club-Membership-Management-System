import { useAuth } from '../auth/AuthContext';
import { Calendar, Users, ClipboardCheck, ArrowRight, Activity, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CoachDashboard() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Coach Portal" 
        description={`Welcome back, Coach ${profile?.full_name || ''}. Here is your training schedule and batch management overview.`}
        actions={
          <div className="flex items-center gap-3">
            <Link 
              to="/attendance" 
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#242424] text-[#F5F5F5] border border-[#333333] hover:bg-[#2C2C2C] transition-colors"
            >
              Take Attendance
            </Link>
            <Link 
              to="/performance" 
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4B16] text-[#111111] hover:bg-[#E03E0E] transition-colors shadow-sm shadow-[#FF4B16]/20"
            >
              + Add Evaluation
            </Link>
          </div>
        }
      />
      
      {/* Varied Bold Statistic Cards */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <StatCard 
          label="Upcoming Sessions" 
          value="Today" 
          icon={<Calendar className="w-5 h-5 text-white" />} 
          variant="purple"
          description="Check schedule & facilities"
        />

        <StatCard 
          label="Active Training Batches" 
          value="Assigned" 
          icon={<Users className="w-5 h-5 text-[#111111]" />} 
          variant="orange"
          description="Athletes in training roster"
        />

        <StatCard 
          label="Athlete Evaluations" 
          value="Active" 
          icon={<ClipboardCheck className="w-5 h-5 text-white" />} 
          variant="green"
          description="Skill assessments on track"
        />
      </div>

      {/* Quick Action Editorial Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[13px] border border-[#242424] bg-[#121212] p-7 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#5035E8]/15 border border-[#5035E8]/30 flex items-center justify-center text-[#A594FF] mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-2 tracking-tight">Record Session Attendance</h3>
            <p className="text-sm text-[#A6A6AC] leading-relaxed mb-6">
              Track athlete presence, marked absences, and participation time across all scheduled training batches.
            </p>
          </div>
          <Link 
            to="/attendance" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4B16] hover:text-[#E03E0E] group transition-colors"
          >
            Open Attendance Tracker <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="rounded-[13px] border border-[#242424] bg-[#121212] p-7 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#079C68]/15 border border-[#079C68]/30 flex items-center justify-center text-[#4CD9A0] mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-2 tracking-tight">Evaluate Player Performance</h3>
            <p className="text-sm text-[#A6A6AC] leading-relaxed mb-6">
              Review athlete scoring, assess skill progression, and provide detailed coaching notes to help members improve.
            </p>
          </div>
          <Link 
            to="/performance" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4B16] hover:text-[#E03E0E] group transition-colors"
          >
            Review Evaluations <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
