
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { CandleData, Stats } from './types';
import Candle from './components/Candle';
import { 
  BarChart3, 
  Activity, 
  Clock,
  Target,
  Zap,
  ChevronDown,
  Pin,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Hash
} from 'lucide-react';

interface PatternResult {
  time: string;
  type: 'AZUL' | 'ROSA';
  cor?: string;
}

const App: React.FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manausTime, setManausTime] = useState<string>('');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'error'>('online');
  const [selectedPatternTime, setSelectedPatternTime] = useState<string | null>(null);
  const isFetching = useRef(false);
  const pollTimer = useRef<number | null>(null);
  
  const [stats, setStats] = useState<Stats>({
    total: 0,
    green: 0,
    red: 0,
    doji: 0,
    winRate: '0%'
  });

  const getManausTime = useCallback(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Manaus',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
  }, []);

  const displayData = useMemo(() => data.slice(-120), [data]);

  const isGreen = (cor: string) => {
    const v = cor?.toUpperCase() || '';
    return v.includes('VERD') || v.includes('CALL') || v.includes('WIN') || v.includes('ALTA') || v.includes('BUY') || v.includes('COMPRA');
  };
  const isRed = (cor: string) => {
    const v = cor?.toUpperCase() || '';
    return v.includes('VERMELH') || v.includes('PUT') || v.includes('LOSS') || v.includes('BAIXA') || v.includes('SELL') || v.includes('VENDA');
  };
  const isDoji = (cor: string) => !isGreen(cor) && !isRed(cor);

  const fetchData = useCallback(async (showSkeleton = false) => {
    if (isFetching.current) return;
    if (showSkeleton) setLoading(true);
    isFetching.current = true;
    
    try {
      const { data: candles, error: supabaseError } = await supabase
        .from('eurusd_otc_completo')
        .select('datetime_mao, cor')
        .order('datetime_mao', { ascending: false })
        .limit(300);

      if (supabaseError) throw new Error(supabaseError.message);

      if (candles) {
        const chronologicalData = [...candles].reverse();
        setData(chronologicalData);

        const recent = chronologicalData.slice(-120);
        const total = recent.length;
        const green = recent.filter(c => isGreen(c.cor)).length;
        const red = recent.filter(c => isRed(c.cor)).length;
        const winRateNum = total > 0 ? (green / (green + red || 1)) * 100 : 0;
        
        setStats({ total, green, red, doji: total - (green + red), winRate: winRateNum.toFixed(1) + '%' });
        setError(null);
        setConnectionStatus('online');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    const runPoll = async () => {
      await fetchData(false);
      pollTimer.current = window.setTimeout(runPoll, 5000);
    };
    runPoll();
    const t = setInterval(() => setManausTime(getManausTime()), 1000);
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      clearInterval(t);
    };
  }, [fetchData, getManausTime]);

  const highlightedTimes = useMemo(() => {
    if (!selectedPatternTime || data.length === 0) return new Set<string>();
    
    const times = new Set<string>();
    const signalIdx = data.findIndex(c => c.datetime_mao === selectedPatternTime);
    
    if (signalIdx >= 3) {
      times.add(data[signalIdx].datetime_mao);
      times.add(data[signalIdx - 1].datetime_mao);
      times.add(data[signalIdx - 2].datetime_mao);
      times.add(data[signalIdx - 3].datetime_mao);
    }
    
    return times;
  }, [selectedPatternTime, data]);

  const handlePatternClick = (time: string) => {
    setSelectedPatternTime(prev => prev === time ? null : time);
  };

  const renderGrid = (items: any[], isPatternGrid = false) => {
    const isAnySelected = selectedPatternTime !== null;

    return (
      <div className={`grid gap-2 ${isPatternGrid 
        ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10' 
        : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 2xl:grid-cols-12'}`}>
        {items.map((item, idx) => {
          const itemTime = item.datetime_mao || item.time;
          const itemColor = item.type ? (item.type === 'AZUL' ? 'AZUL' : 'ROSA') : item.cor;
          const isHighlighted = !isPatternGrid && highlightedTimes.has(itemTime);
          
          return (
            <div key={`${itemTime}-${idx}`}>
              <Candle 
                time={itemTime} 
                color={itemColor}
                highlighted={isHighlighted}
                dimmed={!isPatternGrid && isAnySelected}
                onClick={isPatternGrid ? () => handlePatternClick(itemTime) : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const displayPatterns = useMemo(() => {
    const detected: PatternResult[] = [];
    if (data.length < 4) return detected;

    for (let i = data.length - 1; i >= 3; i--) {
      const signal = data[i];
      const mid2 = data[i - 1];
      const mid1 = data[i - 2];
      const base = data[i - 3];

      if (isDoji(base.cor) || isDoji(mid1.cor) || isDoji(mid2.cor) || isDoji(signal.cor)) continue;

      const midsMatch = isGreen(mid1.cor) === isGreen(mid2.cor);
      if (!midsMatch) continue;

      const baseDiffers = isGreen(base.cor) !== isGreen(mid1.cor);
      if (!baseDiffers) continue;

      const isContinuity = isGreen(signal.cor) === isGreen(mid1.cor);
      
      detected.push({ 
        time: signal.datetime_mao, 
        type: isContinuity ? 'AZUL' : 'ROSA' 
      });

      // NOVO LIMITE: 10
      if (detected.length >= 10) break;
    }

    return detected.reverse();
  }, [data]);

  const patternCounts = useMemo(() => {
    const total = displayPatterns.length;
    const azul = displayPatterns.filter(p => p.type === 'AZUL').length;
    const rosa = displayPatterns.filter(p => p.type === 'ROSA').length;
    
    return {
      total,
      azul,
      rosa,
      azulPct: total > 0 ? ((azul / total) * 100).toFixed(0) : '0',
      rosaPct: total > 0 ? ((rosa / total) * 100).toFixed(0) : '0'
    };
  }, [displayPatterns]);

  const flowPrevailingStyles = useMemo(() => {
    if (displayData.length === 0) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    const green = displayData.filter(c => isGreen(c.cor)).length;
    const red = displayData.filter(c => isRed(c.cor)).length;
    const total = displayData.length;
    const doji = total - green - red;

    const max = Math.max(green, red, doji);
    if (max === green && green >= red) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (max === red) return 'text-red-500 bg-red-500/10 border-red-500/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }, [displayData]);

  const patternPrevailingStyles = useMemo(() => {
    if (displayPatterns.length === 0) return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
    const azul = displayPatterns.filter(p => p.type === 'AZUL').length;
    const rosa = displayPatterns.filter(p => p.type === 'ROSA').length;

    if (azul > rosa) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
  }, [displayPatterns]);

  const flowPcts = useMemo(() => {
    const total = stats.total || 1;
    return {
      green: ((stats.green / total) * 100).toFixed(1),
      red: ((stats.red / total) * 100).toFixed(1),
      doji: ((stats.doji / total) * 100).toFixed(1)
    };
  }, [stats]);

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col animate-fade-in text-slate-300">
      {!isHeaderVisible && (
        <button onClick={() => setIsHeaderVisible(true)} className="fixed top-4 right-6 z-[100] w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-blue-400/50 hover:bg-blue-500 transition-all hover:scale-105">
          <ChevronDown size={20} />
        </button>
      )}

      <nav className={`h-16 border-b border-white/5 bg-[#0a0e1a] px-6 flex items-center justify-between sticky top-0 z-50 transition-all duration-500 ${!isHeaderVisible ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center"><BarChart3 size={18} className="text-black" /></div>
            <h1 className="text-white font-black tracking-tighter text-lg uppercase">Cataloger<span className="text-blue-500">Pro</span></h1>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{connectionStatus === 'online' ? 'Conectado' : 'Link Offline'}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white/[0.03] rounded-lg border border-white/5">
          <Clock size={14} className="text-blue-500" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[7px] font-black text-blue-500/70 uppercase tracking-widest mb-0.5">Manaus</span>
            <span className="text-sm font-mono font-black text-white tabular-nums tracking-tighter">
              {manausTime || '--:--:--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsHeaderVisible(false)} className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-blue-500 border border-white/10 transition-colors group">
            <Pin size={18} />
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full p-4 md:p-6 space-y-4">
        <div className={`dashboard-card rounded-xl p-4 flex flex-col xl:flex-row items-center gap-6 bg-white/[0.02] transition-all duration-500 origin-top ${!isHeaderVisible ? 'scale-y-0 h-0 p-0 m-0 opacity-0 overflow-hidden' : 'scale-y-100 opacity-100'}`}>
          <div className="flex flex-col min-w-[200px] border-r border-white/5 pr-6">
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1 flex items-center gap-2">— TERMINAL 2026 <Target size={10} className="text-blue-400" /></span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Fluxo EUR/USD</h2>
          </div>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase"><span className="text-slate-400">Amostra</span><span className="text-white font-mono">{stats.total} VELAS</span></div>
              <div className="progress-bar"><div className="progress-fill bg-blue-500/40" style={{ width: '100%' }}></div></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase"><span className="text-emerald-500">Assertividade</span><span className="text-white font-mono">{stats.winRate}</span></div>
              <div className="progress-bar"><div className="progress-fill bg-emerald-500" style={{ width: stats.winRate }}></div></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase"><span className="text-blue-400">Call</span><span className="text-white font-mono">{stats.green}</span></div>
              <div className="progress-bar"><div className="progress-fill bg-blue-400" style={{ width: `${(stats.green/stats.total)*100}%` }}></div></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase"><span className="text-slate-500">Put</span><span className="text-white font-mono">{stats.red}</span></div>
              <div className="progress-bar"><div className="progress-fill bg-slate-500" style={{ width: `${(stats.red/stats.total)*100}%` }}></div></div>
            </div>
          </div>
          <div className="flex items-center gap-4 pl-6 border-l border-white/5 opacity-50">
            <Target size={20} className="text-white/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
          <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden shadow-2xl h-full border-emerald-500/10 transition-all">
            <div className="px-6 py-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] gap-4">
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${flowPrevailingStyles}`}><Activity size={20}/></div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Catalogador de candles</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">SENTIDO DA DIREITA (INÍCIO TOP-LEFT)</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                <div className="flex items-center gap-2 px-2 border-r border-white/10 h-8">
                  <Hash size={12} className="text-blue-500" />
                  <span className="text-[11px] font-mono font-black text-white">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2 px-2 border-r border-white/10 h-8">
                  <TrendingUp size={12} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono font-black text-emerald-400 leading-none">{stats.green}</span>
                    <span className="text-[8px] font-mono text-emerald-500/60 leading-none mt-0.5">{flowPcts.green}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2 border-r border-white/10 h-8">
                  <TrendingDown size={12} className="text-red-500" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono font-black text-red-400 leading-none">{stats.red}</span>
                    <span className="text-[8px] font-mono text-red-500/60 leading-none mt-0.5">{flowPcts.red}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2 h-8">
                  <Minus size={12} className="text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono font-black text-slate-300 leading-none">{stats.doji}</span>
                    <span className="text-[8px] font-mono text-slate-500 leading-none mt-0.5">{flowPcts.doji}%</span>
                  </div>
                </div>
              </div>

              {selectedPatternTime && (
                <button 
                  onClick={() => setSelectedPatternTime(null)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 hover:text-white transition-colors animate-pulse"
                >
                  <XCircle size={14} /> Limpar Seleção
                </button>
              )}
            </div>
            <div className="p-6 flex-1 bg-[#090d16] overflow-y-auto scroll-smooth">
              {loading && data.length === 0 ? <div className="text-center p-20 text-[10px] uppercase font-black tracking-widest opacity-30 animate-pulse">Sincronizando...</div> : renderGrid(displayData)}
            </div>
          </div>

          <div className="flex flex-col gap-4 h-full">
            <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden border-pink-500/10 transition-all shrink-0">
              <div className="px-6 py-5 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${patternPrevailingStyles}`}><Zap size={20}/></div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">PADRÃO CONTINUO</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">RASTREAR NO GRID</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                  <div className="flex items-center gap-2 px-2 border-r border-white/10 h-8">
                    <Hash size={12} className="text-slate-400" />
                    <span className="text-[11px] font-mono font-black text-white">{patternCounts.total}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 border-r border-white/10 h-8">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono font-black text-blue-400 leading-none">{patternCounts.azul}</span>
                      <span className="text-[8px] font-mono text-blue-500/60 leading-none mt-0.5">{patternCounts.azulPct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 h-8">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono font-black text-pink-400 leading-none">{patternCounts.rosa}</span>
                      <span className="text-[8px] font-mono text-pink-500/60 leading-none mt-0.5">{patternCounts.rosaPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#090d16] p-6">
                {displayPatterns.length > 0 ? (
                  <div className="w-full">
                    {renderGrid(displayPatterns, true)}
                  </div>
                ) : (
                  <div className="w-full text-center py-4 text-[10px] uppercase font-black tracking-widest opacity-20">
                    Aguardando...
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-3 p-12 text-center group transition-all hover:bg-white/[0.02] hover:border-white/10">
              <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform">
                <BarChart3 size={20} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.3em]">Métricas Adicionais</p>
              <p className="text-[9px] font-bold text-slate-800 uppercase max-w-[200px] leading-relaxed">Em desenvolvimento para expansão estatística</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 px-6 border-t border-white/5 flex justify-between items-center bg-[#0a0e1a] mt-auto">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">CATALOGADOR DE FLUXO &copy; 2026</p>
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
           <a href="#" className="hover:text-blue-500 transition-colors">API STATUS</a><a href="#" className="hover:text-rose-500 transition-colors font-bold">VIP</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
