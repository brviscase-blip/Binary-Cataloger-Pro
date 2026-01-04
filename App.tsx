
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { CandleData, Stats } from './types';
import Candle from './components/Candle';
import { 
  BarChart3, 
  Activity, 
  RefreshCw,
  Pin,
  Clock,
  Target,
  Zap,
  ChevronDown,
  AlertCircle
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

  // Dados filtrados para exibição (Máximo 120 itens - FIFO)
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
        .limit(200); // Pegamos um pouco mais para garantir que achamos 10 padrões

      if (supabaseError) throw new Error(supabaseError.message);

      if (candles) {
        // Cronologia: Antigo -> Novo
        const chronologicalData = [...candles].reverse();
        setData(chronologicalData);

        // Estatísticas baseadas nos 120 candles visíveis
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

  /**
   * RENDER GRID: Sistema de 10 colunas fixas.
   */
  const renderGrid = (items: any[]) => {
    return (
      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3">
        {items.map((item, idx) => (
          <div key={`${item.datetime_mao || item.time}-${idx}`}>
            <Candle 
              time={item.datetime_mao || item.time} 
              color={item.type ? (item.type === 'AZUL' ? 'AZUL' : 'ROSA') : item.cor} 
            />
          </div>
        ))}
      </div>
    );
  };

  /**
   * Catalogação de trás para frente (Padrão Contínuo):
   * Sequência (2) + Correção (1) + Confirmação (1) = Entrada (1)
   */
  const displayPatterns = useMemo(() => {
    const detected: PatternResult[] = [];
    if (data.length < 5) return detected;

    // Iteramos de trás para frente
    for (let i = data.length - 1; i >= 4; i--) {
      const c5_entrada = data[i];
      const c4_confirma = data[i - 1];
      const c3_correcao = data[i - 2];
      const c2_seq2 = data[i - 3];
      const c1_seq1 = data[i - 4];

      // Ignora se houver dojis no meio do padrão base (opcional, mas comum)
      if (isDoji(c1_seq1.cor) || isDoji(c2_seq2.cor) || isDoji(c3_correcao.cor) || isDoji(c4_confirma.cor)) continue;

      // 1. Sequência de 2 (C1 e C2 iguais)
      const seqValida = (isGreen(c1_seq1.cor) && isGreen(c2_seq2.cor)) || (isRed(c1_seq1.cor) && isRed(c2_seq2.cor));
      if (!seqValida) continue;

      // 2. Correção de 1 (C3 diferente da sequência)
      const correcValida = isGreen(c3_correcao.cor) !== isGreen(c2_seq2.cor);
      if (!correcValida) continue;

      // 3. Confirmação de 1 (C4 igual à correção)
      const confirmValida = isGreen(c4_confirma.cor) === isGreen(c3_correcao.cor);
      if (!confirmValida) continue;

      // Se chegamos aqui, o padrão existiu. C5 é o resultado da entrada.
      // Se C5 seguiu a cor de C4 (Confirmação), é AZUL (Contínuo)
      // Se C5 voltou para a cor da sequência (C1/C2), é ROSA (Reversão)
      const isContinuo = isGreen(c5_entrada.cor) === isGreen(c4_confirma.cor);
      
      detected.push({ 
        time: c5_entrada.datetime_mao, 
        type: isContinuo ? 'AZUL' : 'ROSA' 
      });

      // Limite de 10 resultados
      if (detected.length >= 10) break;
    }

    // Como buscamos de trás pra frente, o array está do mais novo pro mais antigo.
    // Vamos reverter para que no grid o "mais novo" fique no final ou conforme a ordem de leitura.
    return detected.reverse();
  }, [data]);

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

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col animate-fade-in text-slate-300">
      {!isHeaderVisible && (
        <button onClick={() => setIsHeaderVisible(true)} className="fixed top-4 right-6 z-[100] w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-blue-400/50 hover:bg-blue-500 transition-all hover:scale-105"><ChevronDown size={20} /></button>
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
        <div className="flex items-center gap-4">
          <button onClick={() => fetchData(true)} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg text-slate-400 border border-white/10 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span className="text-[10px] font-black uppercase tracking-widest">Atualizar</span>
          </button>
          <button onClick={() => setIsHeaderVisible(false)} className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-blue-500 border border-white/10 transition-colors group"><Pin size={18} /></button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
        <div className={`dashboard-card rounded-xl p-4 flex flex-col xl:flex-row items-center gap-6 bg-white/[0.02] guide-pink transition-all duration-500 origin-top ${!isHeaderVisible ? 'scale-y-0 h-0 p-0 m-0 opacity-0 overflow-hidden' : 'scale-y-100 opacity-100'}`}>
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
          <div className="flex items-center gap-8 pl-6 border-l border-white/5">
            <div className="text-right"><p className="text-blue-500 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center justify-end gap-1"><Clock size={8}/> Manaus</p><p className="text-xl font-mono font-black text-white tabular-nums tracking-tighter">{manausTime || '--:--:--'}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden shadow-2xl h-full border-emerald-500/10 transition-all">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${flowPrevailingStyles}`}><Activity size={20}/></div>
                 <div><h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Catalogador de candles</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">SENTIDO DA DIREITA (INÍCIO TOP-LEFT)</p></div>
              </div>
            </div>
            <div className="p-6 flex-1 bg-[#090d16] overflow-y-auto min-h-[400px] max-h-[600px]">
              {loading && data.length === 0 ? <div className="text-center p-20 text-[10px] uppercase font-black tracking-widest opacity-30 animate-pulse">Sincronizando...</div> : renderGrid(displayData)}
            </div>
            <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <span>ANTIGA: TOP-LEFT | RECENTE: BOTTOM-RIGHT</span>
              <span>10 COLUNAS FIXAS</span>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden h-full border-pink-500/10 transition-all">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] guide-pink">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${patternPrevailingStyles}`}><Zap size={20}/></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">PADRÃO CONTINUO</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">SENTIDO DA DIREITA</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 flex-1 bg-[#090d16] overflow-y-auto min-h-[400px] max-h-[600px]">
              {displayPatterns.length > 0 ? renderGrid(displayPatterns) : <div className="text-center p-20 text-[10px] uppercase font-black tracking-widest opacity-20">Aguardando Padrões...</div>}
            </div>
            <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-[9px] font-black uppercase text-slate-500">AZUL (P1)</span>
              <span className="w-2 h-2 rounded-full bg-pink-500 ml-2"></span><span className="text-[9px] font-black uppercase text-slate-500">ROSA (P2)</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 px-6 border-t border-white/5 flex justify-between items-center bg-[#0a0e1a]">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">CATALOGADOR DE FLUXO &copy; 2026</p>
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
           <a href="#" className="hover:text-blue-500 transition-colors">API STATUS</a><a href="#" className="hover:text-rose-500 transition-colors font-bold">VIP</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
