import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808] text-[#F5F5F5] p-6">
      <div className="text-center p-8 sm:p-12 bg-[#121212] border border-[#242424] rounded-[14px] shadow-2xl max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-[#E63946]/15 border border-[#E63946]/30 flex items-center justify-center text-[#E63946] mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-[#F5F5F5] tracking-tight mb-2">Access Restricted</h1>
        <p className="text-sm text-[#A6A6AC] mb-8 leading-relaxed">
          You do not have the required role or administrative permissions to access this club module.
        </p>

        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl bg-[#FF4B16] text-[#111111] font-bold text-sm hover:bg-[#E03E0E] transition-colors shadow-md shadow-[#FF4B16]/20 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
