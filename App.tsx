
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
  LayoutDashboard,
  FileText,
  RefreshCw,
  Trophy,
  Calendar,
  Settings,
  Bell,
  Sun,
  LogOut
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
        const total = candles.length;
        const green = candles.filter(c => {
          if (!c.cor) return false;
          const v = c.cor.toUpperCase();
          return v.includes('VERDE') || v.includes('CALL') || v.includes('WIN') || v.includes('ALTA') || v.includes('BUY') || v.includes('COMPRA');
        }).length;
        const red = candles.filter(c => {
          if (!c.cor) return false;
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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      setManausTime(getManausTime());
      if (seconds === 2 && lastSyncSecond.current !== 2) {
        fetchData(false);
      }
      lastSyncSecond.current = seconds;
    }, 1000);
    return () => clearInterval(timer);
  }, [getManausTime, fetchData]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col animate-fade-in">
      {/* Navbar Superior (Estilo Finanza Pro) */}
      <nav className="h-16 border-b border-white/5 bg-[#0a0e1a] px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <BarChart3 size={18} className="text-black" />
            </div>
            <h1 className="text-white font-black tracking-tighter text-lg">CATALOGER<span className="text-blue-500">PRO</span></h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <a href="#" className="nav-item-active text-xs font-bold flex items-center gap-2 uppercase tracking-widest"><FileText size={14}/> Registro</a>
            <a href="#" className="text-slate-500 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest"><RefreshCw size={14}/> Fluxo</a>
            <a href="#" className="text-slate-500 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest"><LayoutDashboard size={14}/> Dashboard</a>
            <a href="#" className="text-slate-500 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest"><Trophy size={14}/> Conquistas</a>
            <a href="#" className="text-slate-500 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest"><Calendar size={14}/> Mensal</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Sincronizando...</span>
          </div>
          <button className="text-slate-500 hover:text-white p-2"><Bell size={18}/></button>
          <button className="text-slate-500 hover:text-white p-2"><Sun size={18}/></button>
          <button className="text-rose-500 hover:text-rose-400 p-2"><LogOut size={18}/></button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 space-y-8">
        {/* Header de Ativo */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">— ATIVOS 2026</p>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">TERMINAL DE FLUXO PATRIMONIAL</h2>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">PATRIMÔNIO ATIVO</p>
                 <p className="text-xl font-black text-white">EUR/USD <span className="text-slate-500">OTC</span></p>
              </div>
              <div className="h-10 w-[1px] bg-white/10"></div>
              <div className="text-right">
                 <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">MANAUS (AM)</p>
                 <p className="text-xl font-mono font-black text-white tabular-nums tracking-tighter">{manausTime || '--:--:--'}</p>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SummaryCard 
            label="Amostra Analisada" 
            value={stats.total} 
            icon={<Activity size={18} />} 
            colorClass="bg-blue-500"
            subtitle="TOTAL"
          />
          <SummaryCard 
            label="Qualidade (WinRate)" 
            value={stats.winRate} 
            icon={<TrendingUp size={18} />} 
            colorClass="bg-emerald-500"
            subtitle="META"
          />
          <SummaryCard 
            label="Fluxo Essencial (Compra)" 
            value={stats.green} 
            icon={<ArrowUpCircle size={18} />} 
            colorClass="bg-emerald-500"
            subtitle="CALL"
          />
          <SummaryCard 
            label="Fluxo Passivo (Venda)" 
            value={stats.red} 
            icon={<ArrowDownCircle size={18} />} 
            colorClass="bg-red-500"
            subtitle="PUT"
          />
        </div>

        {/* Catalog History Container */}
        <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden min-h-[500px]">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Activity size={16}/>
               </div>
               <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Inventário de Ciclos</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">M1 TIMEFRAME &bull; EUR/USD LIVE</p>
               </div>
            </div>
            
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Compra</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Venda</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Doji</span>
               </div>
            </div>
          </div>

          <div className="p-8 flex-1">
            {loading && data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
                <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Acessando Database...</p>
              </div>
            ) : (
              <div 
                className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-4"
                dir="rtl"
              >
                {data.map((candle, idx) => (
                  <div key={`${candle.datetime_mao}-${idx}`} dir="ltr" className="animate-fade-in" style={{animationDelay: `${idx * 0.01}s`}}>
                    <Candle 
                      time={candle.datetime_mao} 
                      color={candle.cor} 
                    />
                  </div>
                ))}
                
                {data.length === 0 && !loading && (
                  <div className="col-span-full py-32 text-center" dir="ltr">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">Nenhum dado detectado no ciclo atual</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Terminal ID: 2026-OTC-EURUSD</span>
              <span className="h-3 w-[1px] bg-white/5"></span>
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Ponta-a-Ponta</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Registros Totais: <span className="text-white">{data.length} VELAS</span>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 px-6 mt-auto border-t border-white/5 flex justify-between items-center text-slate-600">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">FINANZA PRO CATALOGER &copy; 2026</p>
        <div className="flex gap-6 text-[9px] font-bold uppercase tracking-widest">
           <a href="#" className="hover:text-white transition-colors">Termos</a>
           <a href="#" className="hover:text-white transition-colors">API Status</a>
           <a href="#" className="hover:text-white transition-colors">Suporte</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
