
import React from 'react';

interface CandleProps {
  time: string;
  color: string;
}

const Candle: React.FC<CandleProps> = ({ time, color }) => {
  const getColorStyles = (c: string) => {
    if (!c) return 'bg-slate-500/10 text-slate-400 border-slate-700';
    const normalized = c.toUpperCase().trim();
    
    // Suporte para variações de Verde (Verde, Verda)
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
    
    // Suporte para variações de Vermelho (Vermelho, Vermelha)
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

  const formatTimeHoursMinutes = (t: string) => {
    if (!t) return '--:--';
    try {
      const match = t.match(/(\d{2}):(\d{2})/);
      return match ? `${match[1]}:${match[2]}` : '--:--';
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div 
      className={`
        tag-pill border py-1.5 px-3 flex items-center justify-center 
        transition-all duration-200 hover:brightness-125
        ${getColorStyles(color)}
      `}
    >
      <span className="font-mono text-[11px] font-black tabular-nums">
        {formatTimeHoursMinutes(time)}
      </span>
    </div>
  );
};

export default Candle;
