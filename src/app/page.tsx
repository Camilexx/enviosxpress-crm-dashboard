'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Package, TrendingUp, Users, Clock, MessageSquare,
  MapPin, CheckCircle, XCircle, Search, Calendar, ChevronRight,
  BarChart3, Activity, Briefcase, Zap, ShieldCheck
} from 'lucide-react';

// --- TS Interfaces ---
interface Lead {
  phone: string;
  source: string;
  status: string;
  last_interaction: string;
}

interface ChatMessage {
  id: number;
  lead_phone: string;
  message_in: string;
  response_out: string;
  created_at: string;
}

export default function CRMDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enConversacion: 0,
    agendados: 0,
    descartados: 0
  });

  useEffect(() => {
    fetchLeads();

    // Subscribe to real-time changes
    const leadsChannel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, payload => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, []);

  async function fetchLeads() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('last_interaction', { ascending: false });

      if (error) throw error;

      if (data) {
        setLeads(data);
        setStats({
          total: data.length,
          enConversacion: data.filter(l => l.status === 'en_conversacion').length,
          agendados: data.filter(l => l.status === 'agendado').length,
          descartados: data.filter(l => l.status === 'descartado').length,
        });
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChatHistory(phone: string) {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('lead_phone', phone)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setChatHistory(data);
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  }

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    fetchChatHistory(lead.phone);
  };

  const updateLeadStatus = async (status: string) => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('phone', selectedLead.phone);

      if (error) throw error;

      setSelectedLead({ ...selectedLead, status });
      setLeads(leads.map(l => l.phone === selectedLead.phone ? { ...l, status } : l));

    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'all') return true;
    if (activeTab === 'operativo' && lead.source === 'meta_ads') return true; // Ejemplo
    if (activeTab === 'administrativo' && lead.source !== 'meta_ads') return true; // Ejemplo
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white flex font-sans selection:bg-[#8a1538] selection:text-white">

      {/* Sidebar Corporativo */}
      <aside className="w-20 lg:w-72 bg-[#0d141d] border-r border-[#1e293b] flex flex-col shadow-2xl relative z-20">
        <div className="h-20 border-b border-[#1e293b] flex items-center justify-center lg:justify-start lg:px-8 gap-4 bg-gradient-to-r from-[#0d141d] to-[#121b27]">
          <div className="bg-gradient-to-br from-[#8a1538] to-[#e41a54] p-2.5 rounded-xl shadow-[0_0_20px_rgba(138,21,56,0.3)]">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-xl tracking-wide text-white">Envios<span className="text-[#e41a54]">Xpress</span></h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">Centro de Comando</p>
          </div>
        </div>

        <nav className="flex-1 p-4 lg:p-6 space-y-2 mt-4">
          <button className="w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 rounded-xl bg-gradient-to-r from-[#8a1538]/10 to-transparent border border-[#8a1538]/30 text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden group">
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#e41a54] to-[#8a1538]"></div>
            <Activity className="w-5 h-5 text-[#e41a54] group-hover:scale-110 transition-transform" />
            <span className="hidden lg:block font-medium tracking-wide">Radar de Leads AI</span>
          </button>
          <button className="w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1e293b]/50 transition-all group border border-transparent hover:border-[#1e293b]">
            <BarChart3 className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
            <span className="hidden lg:block font-medium">Analítica Directiva</span>
          </button>
          <button className="w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1e293b]/50 transition-all group border border-transparent hover:border-[#1e293b]">
            <ShieldCheck className="w-5 h-5 group-hover:text-green-400 transition-colors" />
            <span className="hidden lg:block font-medium">Auditoría Operativa</span>
          </button>
        </nav>

        <div className="p-6 border-t border-[#1e293b] hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1e293b] flex items-center justify-center overflow-hidden">
              <span className="font-bold text-sm">DG</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Dirección General</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Sistema Activo
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070b10] relative">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#8a1538] rounded-full blur-[150px] opacity-[0.05] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px] opacity-[0.03] pointer-events-none"></div>

        {/* Cabecera & KPI Dashboard para el Jefe */}
        <header className="p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1 drop-shadow-sm">Panel Ejecutivo de Conversión</h1>
            <p className="text-[15px] text-gray-400 font-light flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Motor de inteligencia artificial <span className="text-white font-medium">Sophia v3</span> operando en vivo.
            </p>
          </div>

          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {/* Tarjeta KPI 1 */}
            <div className="bg-[#121a24]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#1e293b] flex items-center gap-5 min-w-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-gray-400 font-medium uppercase tracking-wider">Flujo Total</span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">{stats.total}</span>
              </div>
            </div>

            {/* Tarjeta KPI 2 (Atención) */}
            <div className="bg-gradient-to-br from-[#8a1538]/20 to-[#121a24] backdrop-blur-md px-6 py-4 rounded-2xl border border-[#8a1538]/30 flex items-center gap-5 min-w-[200px] shadow-[0_8px_30px_rgba(138,21,56,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#8a1538] blur-[40px] opacity-20 rounded-full"></div>
              <div className="p-3 bg-[#e41a54]/20 rounded-xl relative z-10 border border-[#e41a54]/30">
                <MessageSquare className="w-6 h-6 text-[#e41a54]" />
              </div>
              <div className="flex flex-col relative z-10">
                <span className="text-[13px] text-[#ff8fb0] font-medium uppercase tracking-wider">Pendientes</span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">{stats.enConversacion}</span>
              </div>
            </div>

            {/* Tarjeta KPI 3 (Cierre) */}
            <div className="bg-[#121a24]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#1e293b] flex items-center gap-5 min-w-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-gray-400 font-medium uppercase tracking-wider">Procesados</span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">{stats.agendados}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Layout Principal: Lista de Leads (Izquierda) | Detalle del Lead (Derecha) */}
        <div className="flex-1 flex overflow-hidden mx-6 lg:mx-8 mb-8 rounded-3xl border border-[#1e293b] bg-[#0d141d]/80 backdrop-blur-xl shadow-2xl relative z-10">

          {/* Columna Izquierda: Lista de Leads */}
          <section className="w-1/3 min-w-[350px] max-w-[450px] border-r border-[#1e293b] flex flex-col bg-[#0b1118]">

            {/* Buscador y Filtros Superiores */}
            <div className="p-5 border-b border-[#1e293b] space-y-5 bg-[#0d141d] z-10">
              <div className="relative group">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#e41a54] transition-colors" />
                <input
                  type="text"
                  placeholder="Localizar cliente o teléfono..."
                  className="w-full bg-[#16202e] border border-[#2a3a4f] rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-gray-200 focus:outline-none focus:border-[#e41a54] focus:ring-1 focus:ring-[#e41a54] transition-all placeholder:text-gray-500 shadow-inner"
                />
              </div>

              <div className="flex bg-[#16202e] rounded-xl p-1.5 shadow-inner border border-[#2a3a4f]/50">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-lg transition-all ${activeTab === 'all' ? 'bg-[#2a3a4f] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('operativo')}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-lg transition-all ${activeTab === 'operativo' ? 'bg-[#2a3a4f] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}
                >
                  Op. Masiva
                </button>
                <button
                  onClick={() => setActiveTab('administrativo')}
                  className={`flex-1 text-[13px] font-semibold py-2 rounded-lg transition-all ${activeTab === 'administrativo' ? 'bg-[#2a3a4f] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}
                >
                  Op. Express
                </button>
              </div>
            </div>

            {/* Lista de Clientes Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                  <div className="w-8 h-8 border-4 border-gray-700 border-t-[#e41a54] rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400 font-medium">Sincronizando satélites...</p>
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-800/30 rounded-full">
                    <Package className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No se detectaron prospectos en este filtro.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#1e293b]/50">
                  {filteredLeads.map((lead) => (
                    <li
                      key={lead.phone}
                      onClick={() => handleLeadSelect(lead)}
                      className={`p-5 cursor-pointer transition-all ${selectedLead?.phone === lead.phone ? 'bg-[#1a2535] border-l-4 border-l-[#e41a54]' : 'hover:bg-[#16202e] border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-gray-100 text-[15px] tracking-wide font-mono">{lead.phone}</span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border border-gray-700 bg-[#121a24] text-gray-400 shadow-sm">
                          {lead.source || 'Orgánico'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-[#0d141d] px-2.5 py-1 rounded-lg border border-[#1e293b]">
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${lead.status === 'en_conversacion' ? 'bg-amber-400 text-amber-400 animate-pulse' : lead.status === 'agendado' ? 'bg-emerald-400 text-emerald-400' : 'bg-red-500 text-red-500'}`}></div>
                          <span className="text-xs text-gray-300 font-medium capitalize">{lead.status.replace('_', ' ')}</span>
                        </div>
                        <span className="text-gray-500 text-xs flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {new Date(lead.last_interaction).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Columna Derecha: Vista Ejecutiva y Chat AI */}
          <section className="flex-1 flex flex-col relative bg-[#121a24] shadow-inner">
            {selectedLead ? (
              <>
                {/* Cabecera del Expediente */}
                <div className="p-6 lg:p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#16202e]/80 backdrop-blur-md z-10 sticky top-0">
                  <div>
                    <h2 className="text-2xl font-bold font-mono tracking-wider text-white flex items-center gap-3">
                      {selectedLead.phone}
                      {selectedLead.status === 'agendado' && <CheckCircle className="w-6 h-6 text-emerald-400" />}
                    </h2>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-2 font-medium">
                      <Calendar className="w-4 h-4 text-gray-500" /> Registro actualizado: {new Date(selectedLead.last_interaction).toLocaleString()}
                    </p>
                  </div>

                  {/* Botonera de Decisión Ejecutiva */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateLeadStatus('agendado')}
                      className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Finalizado
                    </button>
                    <button
                      onClick={() => updateLeadStatus('descartado')}
                      className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Descartar
                    </button>
                    <a
                      href={`https://wa.me/${selectedLead.phone.split('@')[0]}`}
                      target="_blank" rel="noreferrer"
                      className="ml-2 px-6 py-2.5 bg-gradient-to-r from-[#8a1538] to-[#e41a54] hover:from-[#6c102b] hover:to-[#b81543] border border-[#ff4d79]/50 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-[0_5px_20px_rgba(228,26,84,0.3)] hover:shadow-[0_5px_25px_rgba(228,26,84,0.5)] transform hover:-translate-y-0.5"
                    >
                      Intervención Humana <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Transcripción de la IA */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-7 custom-scrollbar scroll-smooth bg-circuit-pattern">
                  {/* Etiqueta de aviso */}
                  <div className="flex justify-center mb-8">
                    <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> Transcripción Segura AI
                    </span>
                  </div>

                  {chatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 mt-20">
                      <div className="animate-pulse opacity-50">
                        <MessageSquare className="w-16 h-16" />
                      </div>
                      <p className="font-medium text-[15px]">Esperando intercambio de datos...</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div key={idx} className="space-y-6 max-w-4xl mx-auto">

                        {/* Mensaje Cliente */}
                        <div className="flex justify-start items-end gap-3 translate-x-4">
                          <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center shadow-md">
                            <Users className="w-4 h-4 text-gray-300" />
                          </div>
                          <div className="bg-[#1e293b] text-gray-100 p-4.5 rounded-2xl rounded-bl-none shadow-md max-w-[80%] border border-[#2a3a4f]">
                            <p className="text-[15px] leading-relaxed font-medium">{msg.message_in}</p>
                            <span className="text-[11px] text-gray-400 mt-2 block font-medium">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Respuesta Sophia */}
                        {msg.response_out && (
                          <div className="flex justify-end items-end gap-3 -translate-x-4">
                            <div className="bg-gradient-to-br from-[#2a111a] to-[#3a1824] text-gray-100 p-4.5 rounded-2xl rounded-br-none shadow-lg max-w-[80%] border border-[#8a1538]/40">
                              <p className="text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.response_out.replace(/\n/g, '<br/>') }}></p>
                              <span className="text-[11px] text-[#ff8fb0] mt-3 flex items-center justify-end gap-2 font-bold tracking-wide">
                                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Sophia Intelligence
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8a1538] to-[#e41a54] flex items-center justify-center shadow-md shadow-[#8a1538]/50 border border-[#ff4d79]/30">
                              <span className="font-bold text-white text-xs">AI</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0d141d] opacity-50"></div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-[#16202e] flex items-center justify-center mb-8 shadow-2xl border border-[#2a3a4f] relative">
                    <div className="absolute inset-0 rounded-full border border-[var(--color-brand-primary)] opacity-20 animate-ping"></div>
                    <Briefcase className="w-12 h-12 text-[#475569]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Centro de Recepción Logística</h3>
                  <p className="text-[15px] mt-3 max-w-md text-center text-gray-400 font-medium leading-relaxed">
                    Seleccione un prospecto en la consola de la izquierda para intervenir en la negociación previamente calificada por inteligencia artificial.
                  </p>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Patrones de fondo en CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-circuit-pattern {
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a3a4f;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3a4f6c;
        }
      `}} />
    </div>
  );
}
