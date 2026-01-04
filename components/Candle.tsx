
import React from 'react';

interface CandleProps {
  time: string;
  color: string;
  highlighted?: boolean;
  onClick?: () => void;
}

const Candle: React.FC<CandleProps> = ({ time, color, highlighted, onClick }) => {
  const getColorStyles = (c: string) => {
    if (!c) return 'bg-slate-500/10 text-slate-400 border-slate-700';
    const normalized = c.toUpperCase().trim();
    
    if (normalized.includes('AZUL') || normalized.includes('CONTINUIDADE')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]';
    }

    if (normalized.includes('ROSA') || normalized.includes('REVERSAO')) {
      return 'bg-pink-500/10 text-pink-400 border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.1)]';
    }

    if (
      normalized.includes('VERD') || 
      normalized.includes('CALL') || 
      normalized.includes('WIN') || 
      normalized.includes('ALTA') || 
      normalized.includes('BUY') || 
      normalized.includes('COMPRA')
    ) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    
    if (
      normalized.includes('VERMELH') || 
      normalized.includes('PUT') || 
      normalized.includes('LOSS') || 
      normalized.includes('BAIXA') || 
      normalized.includes('SELL') || 
      normalized.includes('VENDA')
    ) {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    
    return 'bg-slate-500/10 text-slate-400 border-slate-700/50';
  };

  const formatTimeHHMM = (t: string) => {
    if (!t) return '--:--';
    try {
      const timePart = t.includes(' ') ? t.split(' ')[1] : t;
      const parts = timePart.split(':');
      
      if (parts.length >= 2) {
        const hh = parts[0].slice(-2).padStart(2, '0');
        const mm = parts[1].slice(0, 2).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return '--:--';
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`tag-pill border py-1.5 px-3 flex items-center justify-center transition-all duration-300 cursor-pointer relative
        ${getColorStyles(color)} 
        ${highlighted ? 'scale-110 !border-white !bg-white/20 z-10 ring-2 ring-white/50' : 'hover:brightness-125 opacity-100'}
        ${onClick ? 'active:scale-95' : ''}
      `}
    >
      <span className="font-mono text-[11px] font-black tabular-nums tracking-tighter">
        {formatTimeHHMM(time)}
      </span>
      {highlighted && (
        <div className="absolute -inset-1 border border-white/30 rounded-md animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default Candle;
