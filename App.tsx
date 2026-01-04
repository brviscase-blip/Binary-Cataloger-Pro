
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
  AlertCircle,
  WifiOff
} from 'lucide-react';

interface PatternResult {
  time: string;
  type: 'AZUL' | 'ROSA';
  direction: 'CALL' | 'PUT';
  result: 'WIN' | 'LOSS' | 'PENDING';
  scenario: string;
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

  const fetchData = useCallback(async (showSkeleton = false) => {
    if (isFetching.current) return;
    if (showSkeleton) setLoading(true);
    isFetching.current = true;
    
    try {
      const { data: candles, error: supabaseError } = await supabase
        .from('eurusd_otc_completo')
        .select('datetime_mao, cor')
        .order('datetime_mao', { ascending: false })
        .limit(100); 

      if (supabaseError) {
        // Se houver um erro retornado pelo Supabase, lançamos ele com detalhes
        const detailedError = new Error(supabaseError.message || 'Erro Desconhecido na API');
        (detailedError as any).details = supabaseError.details;
        (detailedError as any).hint = supabaseError.hint;
        (detailedError as any).code = supabaseError.code;
        throw detailedError;
      }

      if (candles) {
        setData(candles);
        const total = candles.length;
        const green = candles.filter(c => isGreen(c.cor)).length;
        const red = candles.filter(c => isRed(c.cor)).length;
        const doji = total - (green + red);
        const winRateNum = total > 0 ? (green / (green + red || 1)) * 100 : 0;
        setStats({ total, green, red, doji, winRate: winRateNum.toFixed(1) + '%' });
        
        setError(null);
        setConnectionStatus('online');
      }
    } catch (err: any) {
      // Extração de mensagem de erro amigável e log detalhado
      const msg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error('Sync Error Trace:', {
        message: msg,
        details: err.details,
        code: err.code,
        hint: err.hint,
        stack: err.stack
      });
      
      setConnectionStatus('error');
      
      if (msg.includes('fetch') || err.name === 'TypeError') {
        setError('Falha Crítica de Rede: O navegador não conseguiu alcançar o banco de dados. Verifique sua internet ou VPN.');
      } else if (err.code === '42P01') {
        setError('Tabela não encontrada no banco de dados.');
      } else {
        setError(`Erro de Sincronização: ${msg}`);
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    const runPoll = async () => {
      await fetchData(false);
      pollTimer.current = window.setTimeout(runPoll, 3000);
    };

    runPoll();
    
    const timeInterval = setInterval(() => {
      setManausTime(getManausTime());
    }, 1000);

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      clearInterval(timeInterval);
    };
  }, [fetchData, getManausTime]);

  const isGreen = (cor: string) => {
    const v = cor?.toUpperCase() || '';
    return v.includes('VERD') || v.includes('CALL') || v.includes('WIN') || v.includes('ALTA') || v.includes('BUY') || v.includes('COMPRA');
  };
  const isRed = (cor: string) => {
    const v = cor?.toUpperCase() || '';
    return v.includes('VERMELH') || v.includes('PUT') || v.includes('LOSS') || v.includes('BAIXA') || v.includes('SELL') || v.includes('VENDA');
  };

  const patterns = useMemo(() => {
    const detected: PatternResult[] = [];
    if (data.length < 4) return detected;

    for (let i = 0; i <= data.length - 4; i++) {
      const v3 = data[i + 3];
      const v2 = data[i + 2];
      const v1 = data[i + 1];
      const v0 = data[i];

      if (!isGreen(v3.cor) && isGreen(v2.cor) && isGreen(v1.cor)) {
        detected.push({
          time: v1.datetime_mao,
          type: isGreen(v0.cor) ? 'AZUL' : 'ROSA',
          direction: 'CALL',
          result: 'WIN',
          scenario: 'CENÁRIO 01'
        });
      }
      else if (!isRed(v3.cor) && isRed(v2.cor) && isRed(v1.cor)) {
        detected.push({
          time: v1.datetime_mao,
          type: isRed(v0.cor) ? 'AZUL' : 'ROSA',
          direction: 'PUT',
          result: 'WIN',
          scenario: 'CENÁRIO 02'
        });
      }
    }
    return detected;
  }, [data]);

  const azulCount = patterns.filter(p => p.type === 'AZUL').length;
  const rosaCount = patterns.filter(p => p.type === 'ROSA').length;

  const greenPercent = stats.total > 0 ? (stats.green / stats.total) * 100 : 0;
  const redPercent = stats.total > 0 ? (stats.red / stats.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col animate-fade-in text-slate-300">
      
      {!isHeaderVisible && (
        <button 
          onClick={() => setIsHeaderVisible(true)}
          className="fixed top-4 right-6 z-[100] w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xl shadow-blue-500/30 border border-blue-400/50 hover:bg-blue-500 transition-all hover:scale-105"
        >
          <ChevronDown size={20} />
        </button>
      )}

      <nav className={`h-16 border-b border-white/5 bg-[#0a0e1a] px-6 flex items-center justify-between sticky top-0 z-50 transition-all duration-500 ${!isHeaderVisible ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <BarChart3 size={18} className="text-black" />
            </div>
            <h1 className="text-white font-black tracking-tighter text-lg uppercase">Cataloger<span className="text-blue-500">Pro</span></h1>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>

          <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {connectionStatus === 'online' ? 'Conectado' : 'Link Interrompido'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchData(true)}
            className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg text-slate-400 border border-white/10 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizar</span>
          </button>
          
          <button 
            onClick={() => setIsHeaderVisible(false)}
            className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-blue-500 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <Pin size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest">{error}</p>
                <p className="text-[10px] text-red-400/60 uppercase mt-0.5 font-bold">Tentando reconectar automaticamente...</p>
              </div>
            </div>
            <button 
              onClick={() => fetchData(true)}
              className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
            >
              Forçar Recarregamento
            </button>
          </div>
        )}

        <div className={`dashboard-card rounded-xl p-4 flex flex-col xl:flex-row items-center gap-6 bg-white/[0.02] guide-pink transition-all duration-500 origin-top ${!isHeaderVisible ? 'scale-y-0 h-0 p-0 m-0 opacity-0 overflow-hidden' : 'scale-y-100 opacity-100'}`}>
          <div className="flex flex-col min-w-[200px] border-r border-white/5 pr-6">
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              — ATIVOS 2026 <Pin size={10} className="text-blue-400" fill="currentColor" />
            </span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight whitespace-nowrap">Terminal de Fluxo</h2>
          </div>

          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-slate-400">Amostra Analisada</span>
                <span className="text-white">{stats.total} TOTAL</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-blue-500/40" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-emerald-500">Qualidade (Winrate)</span>
                <span className="text-white">{stats.winRate} META</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-emerald-500" style={{ width: stats.winRate }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-blue-400">Fluxo Compra</span>
                <span className="text-white">{stats.green} CALL</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-blue-400" style={{ width: `${greenPercent}%` }}></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-slate-500">Fluxo Venda</span>
                <span className="text-white">{stats.red} PUT</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-slate-500" style={{ width: `${redPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 pl-6 border-l border-white/5 min-w-fit">
            <div className="text-right">
               <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Patrimônio Ativo</p>
               <p className="text-md font-black text-white">EUR/USD <span className="text-slate-500">OTC</span></p>
            </div>
            <div className="h-10 w-[1px] bg-white/10"></div>
            <div className="text-right">
               <p className="text-blue-500 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center justify-end gap-1"><Clock size={8}/> Manaus (AM)</p>
               <p className="text-xl font-mono font-black text-white tabular-nums tracking-tighter">{manausTime || '--:--:--'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden shadow-2xl h-full border-emerald-500/10 hover:border-emerald-500/30 transition-all">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Activity size={20}/>
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Inventário de Ciclos</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                      <Target size={10} /> M1 TIMEFRAME
                    </p>
                 </div>
              </div>
              
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[8px] font-black uppercase text-slate-400">WIN</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-[8px] font-black uppercase text-slate-400">LOSS</span>
                 </div>
              </div>
            </div>

            <div className="p-6 flex-1 bg-[#090d16] overflow-y-auto min-h-[400px] max-h-[600px]">
              {loading && data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4">
                  {connectionStatus === 'error' ? (
                    <>
                      <WifiOff size={40} className="text-slate-700" />
                      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[8px]">Sem Dados Disponíveis</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[8px]">Sincronizando...</p>
                    </>
                  )}
                </div>
              ) : (
                <div 
                  className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3"
                  dir="rtl"
                >
                  {data.slice(0, 48).map((candle, idx) => (
                    <div key={`${candle.datetime_mao}-${idx}`} dir="ltr" className="animate-fade-in" style={{animationDelay: `${idx * 0.01}s`}}>
                      <Candle 
                        time={candle.datetime_mao} 
                        color={candle.cor} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">EUR/USD M1</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                BUFFER: <span className="text-white tabular-nums">{stats.total} VELAS</span>
              </p>
            </div>
          </div>

          <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden h-full border-pink-500/10 hover:border-pink-500/30 transition-all">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] guide-pink">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                    <Zap size={20}/>
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Padrão Contínuo</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                      <Zap size={10} className="text-pink-500" /> GRADE DE RESULTADOS
                    </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Azul</span>
                    <span className="text-xs font-black text-blue-400 tabular-nums">{azulCount}</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Rosa</span>
                    <span className="text-xs font-black text-pink-500 tabular-nums">{rosaCount}</span>
                 </div>
              </div>
            </div>

            <div className="p-6 flex-1 bg-[#090d16] overflow-y-auto min-h-[400px] max-h-[600px]">
              {patterns.length > 0 ? (
                <div 
                  className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3"
                  dir="rtl"
                >
                  {patterns.map((p, idx) => (
                    <div key={`${p.time}-${idx}`} dir="ltr" className="animate-fade-in" style={{animationDelay: `${idx * 0.01}s`}}>
                      <Candle 
                        time={p.time} 
                        color={p.type === 'AZUL' ? 'AZUL' : 'ROSA'} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 opacity-40">
                  <RefreshCw size={32} className="text-slate-500 animate-spin-slow" />
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">Aguardando convergência...</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-black/40 border-t border-white/5">
               <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-[9px] font-black uppercase text-slate-500">AZUL</span>
                  <span className="w-2 h-2 rounded-full bg-pink-500 ml-2"></span>
                  <span className="text-[9px] font-black uppercase text-slate-500">ROSA</span>
               </div>
            </div>
          </div>
        </div>

      </main>

      <footer className="w-full py-10 px-6 mt-auto border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0a0e1a]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
            <BarChart3 size={20} className="text-slate-400" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white">FINANZA PRO CATALOGER</p>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">SISTEMA INTEGRADO DE MONITORAMENTO OTC &copy; 2026</p>
          </div>
        </div>
        
        <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
           <a href="#" className="hover:text-blue-500 transition-colors border-b border-transparent hover:border-blue-500/50 pb-1">Termos de Uso</a>
           <a href="#" className="hover:text-blue-500 transition-colors border-b border-transparent hover:border-blue-500/50 pb-1">Matriz de Dados</a>
           <a href="#" className="hover:text-rose-500 transition-colors border-b border-transparent hover:border-rose-500/50 pb-1">Suporte VIP</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
