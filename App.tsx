
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  TrendingUp,
  Clock,
  Target,
  Zap
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
  const [manausTime, setManausTime] = useState<string>('');
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
        .limit(100); 

      if (error) throw error;

      if (candles) {
        setData(candles);
        const total = candles.length;
        const green = candles.filter(c => isGreen(c.cor)).length;
        const red = candles.filter(c => isRed(c.cor)).length;
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
      fetchData(false);
    }, 1000);
    return () => clearInterval(timer);
  }, [getManausTime, fetchData]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

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

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
        
        <div className="dashboard-card rounded-xl p-4 flex flex-col xl:flex-row items-center gap-6 bg-white/[0.02] guide-pink">
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

        <div className="w-full animate-fade-in">
          <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden min-h-[450px]">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] guide-pink">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20">
                    <Zap size={20}/>
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Padrão Contínuo</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                      <Zap size={10} className="text-pink-500" /> CATALOGAÇÃO DE CICLOS AZUL & ROSA
                    </p>
                 </div>
              </div>
              
              <div className="flex gap-8">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Continuidade (Azul)</span>
                    <span className="text-sm font-black text-blue-400 tabular-nums">{azulCount} OCORRÊNCIAS</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Reversão (Rosa)</span>
                    <span className="text-sm font-black text-pink-500 tabular-nums">{rosaCount} OCORRÊNCIAS</span>
                 </div>
              </div>
            </div>

            <div className="p-0 flex-1 bg-[#090d16] overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0d121f] z-10 border-b border-white/10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] w-1/5">Horário de Fluxo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] w-1/5">Identificação</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] w-1/5">Matriz de Ciclo</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] w-1/5">Ação Terminal</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] w-1/5">Confiança Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((p, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03] transition-all duration-150">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-black text-white tracking-widest tabular-nums">{p.time.split(' ')[1] || p.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{p.scenario}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${p.type === 'AZUL' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${p.type === 'AZUL' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                          Ciclo {p.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                           <div className={`w-2.5 h-2.5 rounded-sm rotate-45 ${p.direction === 'CALL' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`}></div>
                           <span className="text-[11px] font-black text-white uppercase tracking-tighter">{p.direction} NO FLUXO</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`text-xs font-black uppercase ${p.type === 'AZUL' ? 'text-blue-400' : 'text-slate-500'}`}>
                             {p.type === 'AZUL' ? '70%' : '30%'}
                           </span>
                           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${p.type === 'AZUL' ? 'bg-blue-500' : 'bg-pink-500'}`} style={{width: p.type === 'AZUL' ? '70%' : '30%'}}></div>
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {patterns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-40">
                           <RefreshCw size={32} className="text-slate-500 animate-spin-slow" />
                           <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">Aguardando convergência de padrões M1...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-card rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Activity size={20}/>
               </div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Inventário de Ciclos</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-2">
                    <Target size={10} /> M1 TIMEFRAME • EUR/USD LIVE OTC
                  </p>
               </div>
            </div>
            
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Compra</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Venda</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Doji</span>
               </div>
            </div>
          </div>

          <div className="p-6 flex-1 bg-[#090d16]">
            {loading && data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Fluxo Temporal...</p>
              </div>
            ) : (
              <div 
                className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4"
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
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">ID TERMINAL: 2026-OTC-EURUSD-M1</span>
              <div className="h-4 w-[1px] bg-white/10"></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <TrendingUp size={10}/> CONECTADO VIA SUPABASE CLOUD
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
              REGISTROS EM BUFFER: <span className="text-white tabular-nums">{stats.total} VELAS</span>
            </p>
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
