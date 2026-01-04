
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { CandleData, Stats } from './types';
import Candle from './components/Candle';
import SummaryCard from './components/SummaryCard';
import { 
  TrendingUp, 
  BarChart3, 
  RefreshCcw, 
  Activity, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CircleSlash,
  Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [stats, setStats] = useState<Stats>({
    total: 0,
    green: 0,
    red: 0,
    doji: 0,
    winRate: '0%'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: candles, error } = await supabase
        .from('eurusd_otc_completo')
        .select('datetime_mao, cor')
        .order('datetime_mao', { ascending: false })
        .limit(300);

      if (error) throw error;

      if (candles) {
        setData(candles);
        
        // Calculate Statistics
        const total = candles.length;
        const green = candles.filter(c => c.cor.toUpperCase().includes('VERDE')).length;
        const red = candles.filter(c => c.cor.toUpperCase().includes('VERMELHO')).length;
        const doji = total - (green + red);
        const winRate = total > 0 ? ((green / total) * 100).toFixed(1) + '%' : '0%';

        setStats({ total, green, red, doji, winRate });
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold tracking-tighter text-sm uppercase">
            <Activity size={16} />
            Real-time Feed
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">EUR/USD <span className="text-slate-500">OTC</span></h1>
          <p className="text-slate-400 text-sm">Monitoramento profissional de fluxo de candles para opções binárias.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Última Atualização</p>
            <p className="text-slate-300 font-mono text-sm">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className={`
              flex items-center gap-2 bg-slate-800 hover:bg-slate-700 
              text-white px-4 py-2.5 rounded-xl border border-slate-700 
              transition-all active:scale-95 disabled:opacity-50
              ${loading ? 'animate-pulse' : ''}
            `}
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="font-medium">Atualizar</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard 
          label="Amostra" 
          value={stats.total} 
          icon={<BarChart3 size={20} />} 
          colorClass="bg-blue-500/20 text-blue-400"
        />
        <SummaryCard 
          label="Assertividade" 
          value={stats.winRate} 
          icon={<TrendingUp size={20} />} 
          colorClass="bg-emerald-500/20 text-emerald-400"
        />
        <SummaryCard 
          label="Verdes" 
          value={stats.green} 
          icon={<ArrowUpCircle size={20} />} 
          colorClass="bg-emerald-500/20 text-emerald-400"
        />
        <SummaryCard 
          label="Vermelhos" 
          value={stats.red} 
          icon={<ArrowDownCircle size={20} />} 
          colorClass="bg-rose-500/20 text-rose-400"
        />
        <SummaryCard 
          label="Dojis" 
          value={stats.doji} 
          icon={<CircleSlash size={20} />} 
          colorClass="bg-slate-500/20 text-slate-400"
        />
      </div>

      {/* Main Cataloging Section */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Catalogador de Fluxo</h2>
              <p className="text-slate-400 text-xs">Exibindo histórico por horário (HH:mm)</p>
            </div>
          </div>
          <div className="flex gap-4 text-[11px] uppercase font-bold tracking-widest text-slate-500">
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Call
             </div>
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Put
             </div>
             <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Doji
             </div>
          </div>
        </div>

        <div className="p-6">
          {loading && data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium animate-pulse">Sincronizando com o banco de dados...</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
              {data.map((candle, idx) => (
                <Candle 
                  key={`${candle.datetime_mao}-${idx}`} 
                  time={candle.datetime_mao} 
                  color={candle.cor} 
                />
              ))}
              
              {data.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-slate-500 text-lg">Nenhum dado encontrado na tabela eurusd_otc_completo.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="text-slate-500 italic">
              * Dados capturados diretamente do servidor de cotações OTC.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-slate-300 font-medium">Sincronizado com Supabase</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-8 pb-4 text-center">
        <p className="text-slate-600 text-[10px] uppercase font-black tracking-[0.3em]">
          Powered by Advanced Analytics Engine &bull; Enterprise Version 2.5
        </p>
      </footer>
    </div>
  );
};

export default App;
