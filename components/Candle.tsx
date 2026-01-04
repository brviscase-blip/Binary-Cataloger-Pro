
import React from 'react';

interface CandleProps {
  time: string;
  color: string;
  highlighted?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

const Candle: React.FC<CandleProps> = ({ time, color, highlighted, dimmed, onClick }) => {
  const getColorBase = (c: string) => {
    const normalized = c?.toUpperCase().trim() || '';
    if (normalized.includes('AZUL')) return { class: 'bg-blue-500/10 text-blue-400 border-blue-500/30', glow: 'rgba(59,130,246,0.5)' };
    if (normalized.includes('ROSA')) return { class: 'bg-pink-500/10 text-pink-400 border-pink-500/30', glow: 'rgba(236,72,153,0.5)' };
    if (normalized.includes('VERD') || normalized.includes('CALL') || normalized.includes('WIN')) 
      return { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', glow: 'rgba(16,185,129,0.5)' };
    if (normalized.includes('VERMELH') || normalized.includes('PUT') || normalized.includes('LOSS')) 
      return { class: 'bg-red-500/10 text-red-400 border-red-500/30', glow: 'rgba(239,68,68,0.5)' };
    return { class: 'bg-slate-500/10 text-slate-400 border-slate-700/50', glow: 'rgba(148,163,184,0.3)' };
  };

  const styleData = getColorBase(color);

  const formatTimeHHMM = (t: string) => {
    if (!t) return '--:--';
    try {
      const timePart = t.includes(' ') ? t.split(' ')[1] : t;
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        return `${parts[0].slice(-2).padStart(2, '0')}:${parts[1].slice(0, 2).padStart(2, '0')}`;
      }
      return '--:--';
    } catch (e) {
      return '--:--';
    }
  };

  // Estilos de destaque suavizados:
  // - Escala menor (1.15 em vez de 1.25)
  // - Borda branca semi-transparente em vez de sólida
  // - Sombra (glow) baseada na cor do candle
  const highlightStyles = highlighted 
    ? `z-30 scale-115 !opacity-100 !border-white/60 !bg-[#0d121f] shadow-[0_0_20px_${styleData.glow}] ring-1 ring-white/20` 
    : '';

  // Efeito embaçado mais sutil (opacidade 0.2 em vez de 0.1)
  const dimmedStyles = dimmed && !highlighted
    ? 'opacity-20 blur-[1px] grayscale-[0.5]'
    : 'opacity-100';

  return (
    <div 
      onClick={onClick}
      className={`tag-pill border py-1.5 px-3 flex items-center justify-center transition-all duration-300 cursor-pointer relative
        ${styleData.class} 
        ${highlightStyles}
        ${dimmedStyles}
        ${onClick ? 'active:scale-95' : ''}
      `}
    >
      <span className="font-mono text-[11px] font-black tabular-nums tracking-tighter">
        {formatTimeHHMM(time)}
      </span>
      
      {highlighted && (
        <div 
          className="absolute -inset-1.5 border border-white/10 rounded-lg animate-pulse pointer-events-none"
          style={{ boxShadow: `inset 0 0 8px ${styleData.glow}` }}
        ></div>
      )}
    </div>
  );
};

export default Candle;
