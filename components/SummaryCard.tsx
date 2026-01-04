
import React from 'react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  subtitle?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, colorClass, subtitle }) => (
  <div className="dashboard-card rounded-xl p-5 flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:border-white/10 group h-32">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
          {subtitle && <span className="text-[10px] font-bold text-slate-500">{subtitle}</span>}
        </div>
      </div>
      <div className={`p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 group-hover:text-white transition-colors`}>
        {icon}
      </div>
    </div>
    
    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-auto">
      <div className={`h-full ${colorClass.split(' ')[1] || 'bg-blue-500'} opacity-60 w-[70%]`}></div>
    </div>
  </div>
);

export default SummaryCard;
