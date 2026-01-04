
import React from 'react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, colorClass }) => (
  <div className={`
    bg-slate-800/20 border border-slate-700/30 rounded-2xl p-5 
    flex flex-col gap-3 transition-all hover:border-slate-600
    backdrop-blur-sm shadow-xl
  `}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
      {icon}
    </div>
    <div className="space-y-0.5">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    </div>
  </div>
);

export default SummaryCard;
