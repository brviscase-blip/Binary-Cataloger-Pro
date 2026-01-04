
import React from 'react';

interface CandleProps {
  time: string;
  color: string;
}

const Candle: React.FC<CandleProps> = ({ time, color }) => {
  // Normaliza a cor e mapeia para classes do Tailwind
  const getColorStyles = (c: string) => {
    const normalized = c.toUpperCase();
    if (normalized.includes('VERDE') || normalized.includes('CALL') || normalized.includes('WIN')) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
    }
    if (normalized.includes('VERMELHO') || normalized.includes('PUT') || normalized.includes('LOSS')) {
      return 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]';
    }
    // Padrão Doji (Cinza)
    return 'bg-slate-500/20 text-slate-400 border-slate-500/40 hover:bg-slate-500/30';
  };

  // Formata o tempo para HH:mm lidando com formatos ISO (T) ou Espaço
  const formatTimeHoursMinutes = (t: string) => {
    try {
      // Tenta extrair apenas o padrão HH:mm usando Regex para maior precisão
      const match = t.match(/(\d{2}):(\d{2})/);
      if (match) {
        return `${match[1]}:${match[2]}`;
      }
      
      // Fallback: tenta separar por T ou Espaço
      const timePart = t.includes('T') ? t.split('T')[1] : (t.includes(' ') ? t.split(' ')[1] : t);
      const [h, m] = timePart.split(':');
      
      if (!h || !m) return '--:--';
      
      return `${h.substring(0, 2).padStart(2, '0')}:${m.substring(0, 2).padStart(2, '0')}`;
    } catch (e) {
      return '--:--';
    }
  };

  return (
    <div 
      title={`Data completa: ${time} | Cor: ${color}`}
      className={`
        flex items-center justify-center 
        p-2.5 rounded-lg border transition-all duration-300 
        cursor-help select-none min-w-[64px]
        ${getColorStyles(color)}
      `}
    >
      <span className="font-mono text-sm font-bold tracking-wider">
        {formatTimeHoursMinutes(time)}
      </span>
    </div>
  );
};

export default Candle;
