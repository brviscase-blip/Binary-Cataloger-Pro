
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { CandleData, Stats } from './types';
import Candle from './components/Candle';
import { 
  BarChart3, 
  Activity, 
  LayoutDashboard,
  FileText,
  RefreshCw,
  Trophy,
  Calendar,
  Bell,
  Sun,
  LogOut,
  Pin,
  PinOff,
  LayoutGrid,
  Menu,
  TrendingUp
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [manausTime, setManausTime] = useState<string>('');
  const [showStats, setShowStats] = useState(true);
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
          return v.includes('VERD') || v.includes('CALL') || v.includes('WIN') || v.includes('ALTA') || v.includes('BUY') || v.includes('COMPRA');
        }).length;
        const red = candles.filter(c => {
          if (!c.cor) return false;
          const v = c.cor.toUpperCase();
          return v.includes('VERMELH') || v.includes('PUT') || v.includes('LOSS') || v.includes('BAIXA') || v.includes('SELL') || v.includes('VENDA');
        }).length;
        const doji = total - (green + red);
        const winRateNum = total > 0 ? (green / (green + red || 1)) * 100 : 0;
        setStats({ total, green, red, doji, winRate: winRateNum.toFixed(1) + '%' });
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setManausTime(getManausTime());
      // Sincronização em tempo real: atualização a cada 1 segundo
      fetchData(false);
    }, 1000);
    return () => clearInterval(timer);
  }, [getManausTime, fetchData]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#060912] flex flex-col animate-fade-in text-slate-300">
      {/* Navbar Superior */}
      <nav className="h-16 border-b border-white/5 bg-[#0a0e1a] px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <BarChart3 size={18} className="text-black" />
            </div>
            <h1 className="text-white font-black tracking-tighter text-lg uppercase">Cataloger<span className="text-blue-500">Pro</span></h1>
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
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Sincronizando...</span>
          </div>
          <button className="text-slate-500 hover:text-white p-2"><Bell size={18}/></button>
          <button className="text-slate-500 hover:text-white p-2"><Sun size={18}/></button>
          <button className="text-rose-500 hover:text-rose-400 p-2"><LogOut size={18}/></button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        
        {/* Nova Barra de Inventário Patrimonial (Ref. Imagem) */}
        <div className="dashboard-card rounded-xl p-4 flex flex-col xl:flex-row items-center gap-6 bg-white/[0.02]">
          {/* Título */}
          <div className="flex flex-col min-w-[200px] border-r border-white/5 pr-6">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">— ATIVOS 2026</span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight whitespace-nowrap">Inventário Patrimonial</h2>
          </div>

          {/* Progress Section */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {/* Essenciais */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-emerald-500">Essenciais</span>
                <span className="text-white">{stats.winRate}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-emerald-500" style={{ width: stats.winRate }}></div>
              </div>
            </div>
            {/* Qualidade de Vida */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-blue-500">Qualidade de Vida</span>
                <span className="text-white">8.7%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-blue-500" style={{ width: '8.7%' }}></div>
              </div>
            </div>
            {/* Futuro */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-rose-500">Futuro</span>
                <span className="text-white">0.0%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-rose-500" style={{ width: '0%' }}></div>
              </div>
            </div>
            {/* Dívidas */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
                <span className="text-purple-500">Dívidas</span>
                <span className="text-white">72.5%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-purple-500" style={{ width: '72.5%' }}></div>
              </div>
            </div>
          </div>

          {/* Visão / Patrimônio Section */}
          <div className="flex items-center gap-8 pl-6 border-l border-white/5 min-w-fit">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Visão</span>
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/5">
                <button className="p-1.5 bg-white/10 text-white rounded-md"><LayoutGrid size={14}/></button>
                <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Menu size={14}/></button>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <TrendingUp size={8}/> Patrimônio
              </span>
              <div className="text-xl font-black text-white whitespace-nowrap">
                R$ 3.893,<span className="text-sm">66</span>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
              <button className="px-3 py-1.5 bg-white text-black text-[9px] font-black rounded-lg uppercase">Aberto</button>
              <button className="px-3 py-1.5 text-slate-500 text-[9px] font-black hover:text-white uppercase transition-colors">Quitado</button>
              <button className="px-3 py-1.5 text-slate-500 text-[9px] font-black hover:text-white uppercase transition-colors">Cancelado</button>
            </div>
          </div>
        </div>

        {/* Cabeçalho Secundário */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-2">
           <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Terminal de Fluxo Patrimonial</h2>
                <button 
                  onClick={() => setShowStats(!showStats)}
                  className={`p-1.5 rounded-md transition-all duration-300 ${showStats ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                  title={showStats ? "Ocultar Estatísticas" : "Mostrar Estatísticas"}
                >
                  {showStats ? <Pin size={16} fill="currentColor" /> : <PinOff size={16} />}
                </button>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">PATRIMÔNIO ATIVO</p>
                 <p className="text-md font-black text-white">EUR/USD <span className="text-slate-500">OTC</span></p>
              </div>
              <div className="h-8 w-[1px] bg-white/10"></div>
              <div className="text-right">
                 <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">MANAUS (AM)</p>
                 <p className="text-md font-mono font-black text-white tabular-nums tracking-tighter">{manausTime || '--:--:--'}</p>
              </div>
           </div>
        </div>

        {/* Stats Section */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showStats ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Redesigned Summary Mini-Cards */}
             <div className="dashboard-card rounded-xl p-4 flex justify-between items-center group">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Amostra Analisada</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{stats.total}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">TOTAL</span>
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:text-blue-400 transition-colors">
                  <Activity size={18}/>
                </div>
             </div>

             <div className="dashboard-card rounded-xl p-4 flex justify-between items-center group">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Qualidade (WinRate)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-500">{stats.winRate}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">META</span>
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:text-emerald-500 transition-colors">
                  <TrendingUp size={18}/>
                </div>
             </div>

             <div className="dashboard-card rounded-xl p-4 flex justify-between items-center group">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fluxo Essencial (Compra)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{stats.green}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">CALL</span>
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:text-blue-500 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
             </div>

             <div className="dashboard-card rounded-xl p-4 flex justify-between items-center group">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fluxo Passivo (Venda)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white">{stats.red}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">PUT</span>
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg text-slate-500 group-hover:text-rose-500 transition-colors">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                </div>
             </div>
          </div>
        </div>

        {/* Catalog History */}
        <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden min-h-[500px]">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Activity size={16}/>
               </div>
               <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Inventário de Ciclos</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">M1 TIMEFRAME &bull; EUR/USD LIVE</p>
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

          <div className="p-6 flex-1 bg-black/40">
            {loading && data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
                <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Acessando Database...</p>
              </div>
            ) : (
              <div 
                className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3"
                dir="rtl"
              >
                {data.map((candle, idx) => (
                  <div key={`${candle.datetime_mao}-${idx}`} dir="ltr" className="animate-fade-in" style={{animationDelay: `${idx * 0.005}s`}}>
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

      <footer className="w-full py-6 px-6 mt-auto border-t border-white/5 flex justify-between items-center text-slate-600">
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Finanza Pro Cataloger &copy; 2026</p>
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
