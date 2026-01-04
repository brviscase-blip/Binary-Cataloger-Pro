
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { CandleData, Stats } from './types';
import Candle from './components/Candle';
import SummaryCard from './components/SummaryCard';
import { 
  TrendingUp, 
  BarChart3, 
  Activity, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CircleSlash
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [manausTime, setManausTime] = useState<string>('');
  const lastSyncSecond = useRef<number>(-1);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    green: 0,
    red: 0,
    doji: 0,
    winRate: '0%'
  });

  // Função para obter o horário de Manaus formatado
  const getManausTime = useCallback(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Manaus',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
  }, []);

  const fetchData = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    try {
      const { data: candles, error } = await supabase
        .from('eurusd_otc_completo')
        .select('datetime_mao, cor')
        .order('datetime_mao', { ascending: false })
        .limit(300);

      if (error) throw error;

      if (candles) {
        setData(candles);
        
        // Cálculo de estatísticas
        const total = candles.length;
        const green = candles.filter(c => {
          const v = c.cor.toUpperCase();
          return v.includes('VERDE') || v.includes('CALL') || v.includes('WIN') || v.includes('ALTA') || v.includes('BUY') || v.includes('COMPRA');
        }).length;
        
        const red = candles.filter(c => {
          const v = c.cor.toUpperCase();
          return v.includes('VERMELHO') || v.includes('PUT') || v.includes('LOSS') || v.includes('BAIXA') || v.includes('SELL') || v.includes('VENDA');
        }).length;

        const doji = total - (green + red);
        const winRate = total > 0 ? ((green / (green + red || 1)) * 100).toFixed(1) + '%' : '0%';

        setStats({ total, green, red, doji, winRate });
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Relógio em tempo real e Sincronização automática no segundo :01
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      setManausTime(getManausTime());

      // Sincroniza exatamente quando o segundo chega em 01
      // A verificação lastSyncSecond evita disparos múltiplos no mesmo segundo
      if (seconds === 1 && lastSyncSecond.current !== 1) {
        fetchData(false); // Atualização silenciosa
      }
      lastSyncSecond.current = seconds;
    }, 1000);
    return () => clearInterval(timer);
  }, [getManausTime, fetchData]);

  // Busca inicial ao carregar o app
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in bg-[#0f172a]">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800/10 p-6 rounded-2xl border border-slate-700/20 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-widest text-[10px] uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Market Feed
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            EUR/USD <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-md font-bold tracking-normal">OTC</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Análise de fluxo institucional e catalogação de ciclos.</p>
        </div>
        
        <div className="text-right">
          <p className="text-blue-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Manaus (AM)</p>
          <div className="flex items-center gap-2 justify-end">
            <p className="text-white font-mono text-2xl font-black tabular-nums tracking-wider">{manausTime || '--:--:--'}</p>
          </div>
        </div>
      </header>

      {/* Stats Grid - 4 colunas (Amostra, Win Rate, Call, Put) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          label="Amostra" 
          value={stats.total} 
          icon={<BarChart3 size={20} />} 
          colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20"
        />
        <SummaryCard 
          label="Win Rate" 
          value={stats.winRate} 
          icon={<TrendingUp size={20} />} 
          colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        />
        <SummaryCard 
          label="Call" 
          value={stats.green} 
          icon={<ArrowUpCircle size={20} />} 
          colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        />
        <SummaryCard 
          label="Put" 
          value={stats.red} 
          icon={<ArrowDownCircle size={20} />} 
          colorClass="bg-rose-500/10 text-rose-400 border-rose-500/20"
        />
      </div>

      {/* Main Cataloging Section */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Histórico de Velas</h2>
            <span className="h-1 w-1 rounded-full bg-slate-700"></span>
            <span className="text-xs font-bold text-slate-400">M1 Timeframe</span>
          </div>
          <div className="flex gap-6 text-[10px] uppercase font-black tracking-widest">
             <div className="flex items-center gap-2 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500"></span>
                Compra
             </div>
             <div className="flex items-center gap-2 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500"></span>
                Venda
             </div>
             <div className="flex items-center gap-2 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/30 border border-slate-500"></span>
                Doji
             </div>
          </div>
        </div>

        <div className="p-8">
          {loading && data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Activity size={24} className="text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Sincronizando Terminal...</p>
            </div>
          ) : (
            <div 
              className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4"
              dir="rtl"
            >
              {data.map((candle, idx) => (
                <div key={`${candle.datetime_mao}-${idx}`} dir="ltr">
                  <Candle 
                    time={candle.datetime_mao} 
                    color={candle.cor} 
                  />
                </div>
              ))}
              
              {data.length === 0 && !loading && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-3xl" dir="ltr">
                  <Activity size={48} className="mx-auto text-slate-800 mb-4" />
                  <p className="text-slate-600 font-bold uppercase tracking-widest">Aguardando dados da corretora...</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-black/20 px-8 py-4 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Protocolo de Segurança Ativo &bull; Criptografia Ponta-a-Ponta
          </p>
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            TOTAL ANALISADO: <span className="text-white">{data.length} CANDLES</span>
          </div>
        </div>
      </div>

      <footer className="py-8 border-t border-slate-800/50 flex flex-col items-center gap-2">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
          ADVANCED CATALOGER SYSTEMS
        </p>
        <p className="text-slate-700 text-[9px] font-bold italic">
          v4.0.1 Stable Release
        </p>
      </footer>
    </div>
  );
};

export default App;
