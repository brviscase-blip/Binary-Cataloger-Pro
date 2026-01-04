
import React from 'react';

interface CandleProps {
  time: string;
  color: string;
}

const Candle: React.FC<CandleProps> = ({ time, color }) => {
  // Mapeamento de cores robusto e profissional
  const getColorStyles = (c: string) => {
    const normalized = c.toUpperCase();
    
    // Verdes (Alta / Call)
    if (normalized.includes('VERDE') || normalized.includes('CALL') || normalized.includes('WIN') || normalized.includes('ALTA') || normalized.includes('BUY') || normalized.includes('COMPRA')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.05)]';
    }
    
    // Vermelhos (Baixa / Put)
    if (normalized.includes('VERMELHO') || normalized.includes('PUT') || normalized.includes('LOSS') || normalized.includes('BAIXA') || normalized.includes('SELL') || normalized.includes('VENDA')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.05)]';
    }
    
    // Doji / Empate (Cinza)
    return 'bg-slate-500/10 text-slate-400 border-slate-700 hover:bg-slate-500/20 hover:border-slate-500 shadow-none';
  };

  // Extração estrita de mm:ss conforme solicitado
  const formatTimeMinutesSeconds = (t: string) => {
    try {
      // Tenta extrair mm:ss do formato HH:mm:ss
      const parts = t.split(':');
      if (parts.length >= 3) {
        return `${parts[1]}:${parts[2]}`;
      }
      // Se tiver apenas HH:mm, retorna o que for possível ou mantém o padrão do catalogador
      const match = t.match(/(\d{2}):(\d{2})/);
      if (match) return `${match[1]}:${match[2]}`;
      return '--:--';
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div 
      className={`
        flex items-center justify-center 
        py-3 px-1 rounded-xl border transition-all duration-300 
        cursor-default select-none group
        ${getColorStyles(color)}
      `}
    >
      <span className="font-mono text-[13px] font-black tracking-tight group-hover:scale-110 transition-transform">
        {formatTimeMinutesSeconds(time)}
      </span>
    </div>
  );
};

export default Candle;
