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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeView, setActiveView] = useState('radar'); // 'radar' | 'analytics' | 'audit'
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
    // Top tab filtering
    if (activeTab === 'operativo' && lead.source === 'meta_ads') return false;
    if (activeTab === 'administrativo' && lead.source !== 'meta_ads') return false;

    // Search query filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return lead.phone.toLowerCase().includes(query) ||
        (lead.source && lead.source.toLowerCase().includes(query));
    }

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
          <button
            onClick={() => setActiveView('radar')}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 rounded-xl transition-all group relative overflow-hidden ${activeView === 'radar' ? 'bg-gradient-to-r from-[#8a1538]/10 to-transparent border border-[#8a1538]/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]/50 border border-transparent hover:border-[#1e293b]'}`}
          >
            {activeView === 'radar' && <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#e41a54] to-[#8a1538]"></div>}
            <Activity className={`w-5 h-5 ${activeView === 'radar' ? 'text-[#e41a54] group-hover:scale-110' : 'group-hover:text-blue-400'} transition-all`} />
            <span className="hidden lg:block font-medium tracking-wide">Radar de Leads AI</span>
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 rounded-xl transition-all group relative overflow-hidden ${activeView === 'analytics' ? 'bg-gradient-to-r from-[#8a1538]/10 to-transparent border border-[#8a1538]/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]/50 border border-transparent hover:border-[#1e293b]'}`}
          >
            {activeView === 'analytics' && <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#e41a54] to-[#8a1538]"></div>}
            <BarChart3 className={`w-5 h-5 ${activeView === 'analytics' ? 'text-[#e41a54] group-hover:scale-110' : 'group-hover:text-amber-400'} transition-all`} />
            <span className="hidden lg:block font-medium">Analítica Directiva</span>
          </button>

          <button
            onClick={() => setActiveView('audit')}
            className={`w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 rounded-xl transition-all group relative overflow-hidden ${activeView === 'audit' ? 'bg-gradient-to-r from-[#8a1538]/10 to-transparent border border-[#8a1538]/30 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]/50 border border-transparent hover:border-[#1e293b]'}`}
          >
            {activeView === 'audit' && <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#e41a54] to-[#8a1538]"></div>}
            <ShieldCheck className={`w-5 h-5 ${activeView === 'audit' ? 'text-[#e41a54] group-hover:scale-110' : 'group-hover:text-emerald-400'} transition-all`} />
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
            <div className="bg-[#121a24]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#1e293b] flex items-center gap-5 min-w-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-blue-500/30 transition-colors">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-gray-400 font-medium uppercase tracking-wider">Flujo Total</span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">{stats.total}</span>
              </div>
            </div>

            {/* Tarjeta KPI 2 (Atención) */}
            <div className="bg-gradient-to-br from-[#8a1538]/20 to-[#121a24] backdrop-blur-md px-6 py-4 rounded-2xl border border-[#8a1538]/30 flex items-center gap-5 min-w-[200px] shadow-[0_8px_30px_rgba(138,21,56,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#8a1538] blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
              <div className="p-3 bg-[#e41a54]/20 rounded-xl relative z-10 border border-[#e41a54]/30">
                <MessageSquare className="w-6 h-6 text-[#e41a54]" />
              </div>
              <div className="flex flex-col relative z-10">
                <span className="text-[13px] text-[#ff8fb0] font-medium uppercase tracking-wider">Pendientes</span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">{stats.enConversacion}</span>
              </div>
            </div>

            {/* Tarjeta KPI 3 (Cierre) */}
            <div className="bg-[#121a24]/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-[#1e293b] flex items-center gap-5 min-w-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-emerald-500/30 transition-colors">
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

        {/* Dynamic View Rendering */}
        {activeView === 'radar' ? (
          <div className="flex-1 flex overflow-hidden mx-6 lg:mx-8 mb-8 rounded-3xl border border-[#1e293b] bg-[#0d141d]/80 backdrop-blur-xl shadow-2xl relative z-10">
            {/* Columna Izquierda: Lista de Leads */}
            <section className="w-1/3 min-w-[350px] max-w-[450px] border-r border-[#1e293b] flex flex-col bg-[#0b1118]">

              {/* Buscador y Filtros Superiores */}
              <div className="p-5 border-b border-[#1e293b] space-y-5 bg-[#0d141d] z-10">
                <div className="relative group">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#e41a54] transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

                  {/* Perfil Estratégico del Prospecto */}
                  <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar scroll-smooth bg-[#0d141d]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Tarjeta de Calificación AI */}
                      <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl rounded-full"></div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-400" /> Nivel de Interés (AI Score)
                        </h3>
                        <div className="flex items-end gap-3 mb-2">
                          <span className="text-4xl font-extrabold text-white tracking-tighter">
                            {selectedLead.status === 'agendado' ? '92' : selectedLead.status === 'en_conversacion' ? '75' : '30'}
                            <span className="text-lg text-gray-500 font-medium">/100</span>
                          </span>
                        </div>
                        <div className="w-full bg-[#1e293b] rounded-full h-2.5 mb-4">
                          <div className={`h-2.5 rounded-full ${selectedLead.status === 'agendado' ? 'bg-emerald-500 w-[92%]' : selectedLead.status === 'en_conversacion' ? 'bg-blue-500 w-[75%]' : 'bg-red-500 w-[30%]'}`}></div>
                        </div>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed">
                          {selectedLead.status === 'agendado' ? 'Alta probabilidad de cierre. Cliente requiere atención logística inmediata.' : selectedLead.status === 'en_conversacion' ? 'Prospecto explorando tarifas. Ideal para aplicar incentivo de envío.' : 'Prospecto descartado o frío por el momento.'}
                        </p>
                      </div>

                      {/* Extracción de Necesidad */}
                      <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg relative">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Package className="w-4 h-4 text-amber-400" /> Perfil de Demanda
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-[#16202e] p-3 rounded-lg border border-[#2a3a4f] flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold">Ruta Frecuente Detectada</p>
                              <p className="text-sm text-gray-200 font-medium">Principalmente Nacional / Evaluar chat</p>
                            </div>
                          </div>
                          <div className="bg-[#16202e] p-3 rounded-lg border border-[#2a3a4f] flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase font-bold">Volumen Estimado</p>
                              <p className="text-sm text-gray-200 font-medium">
                                {chatHistory.length > 0 && chatHistory.some(c => c.message_in.toLowerCase().includes('ecommerce') || c.message_in.toLowerCase().includes('tienda')) ? 'Alto (Comercio / Ecommerce)' : 'Bajo / Único'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features Avanzados: LTV & Cierre Flash */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* LTV & Cierre Predictivo */}
                      <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg relative overflow-hidden">
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                          <TrendingUp className="w-4 h-4 text-emerald-400" /> Valor Histórico Relevante (LTV a 6 meses)
                        </h3>
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="p-4 bg-[#16202e] rounded-xl border border-[#2a3a4f] shrink-0 shadow-inner">
                            <span className="text-2xl font-black font-mono text-emerald-400">
                              {chatHistory.some(c => c.message_in.toLowerCase().includes('ecommerce') || c.message_in.toLowerCase().includes('tienda') || c.message_in.toLowerCase().includes('frecuente')) ? '$1,450' : '$45'}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Estimación de retorno basada en el perfil de volumen detectado por Sophia AI.</p>
                            <span className="inline-block mt-2 px-2.5 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/20">Proyección Algorítmica</span>
                          </div>
                        </div>
                      </div>

                      {/* Generador de Oferta Flash */}
                      <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" /> Herramientas de Cierre Flash
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mb-3">Envía una promoción persuasiva por WhatsApp en 1-clic para forzar conversión.</p>
                        <div className="flex gap-2">
                          <a
                            href={`https://wa.me/${selectedLead.phone.split('@')[0]}?text=${encodeURIComponent('¡Hola! Soy el supervisor de envíos 📦. Por ser cliente de primera vez, te apruebo un 15% de descuento en tu primer despacho si lo enviamos HOY. ¿Te sirvo el cupón ENVIOX15?')}`}
                            target="_blank" rel="noreferrer"
                            className="flex-1 px-3 py-2.5 bg-[#16202e] hover:bg-[#1e293b] border border-[#2a3a4f] hover:border-yellow-500/30 text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm relative overflow-hidden group"
                          >
                            <div className="absolute top-0 right-0 w-8 h-full bg-yellow-500/10 skew-x-12 -translate-x-[300%] group-hover:translate-x-[300%] transition-transform duration-700"></div>
                            Cupón 15% OFF
                          </a>
                          <a
                            href={`https://wa.me/${selectedLead.phone.split('@')[0]}?text=${encodeURIComponent('¡Hola de nuevo! Te escribo desde jefatura operativa. ¿De casualidad aún necesitas enviar el paquete? Te puedo ofrecer recolección gratuita a tu domicilio HOY mismo. 🚚')}`}
                            target="_blank" rel="noreferrer"
                            className="flex-1 px-3 py-2.5 bg-[#16202e] hover:bg-[#1e293b] border border-[#2a3a4f] hover:border-emerald-500/30 text-gray-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            Pickup Gratis
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Plan de Acción Estratégico */}
                    <div className="bg-gradient-to-r from-[#8a1538]/10 to-transparent p-6 rounded-2xl border border-[#8a1538]/30 shadow-lg">
                      <h3 className="text-sm font-bold text-[#ff8fb0] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#e41a54]" /> Siguiente Acción Sugerida (AI)
                      </h3>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0d141d]/80 p-4 rounded-xl border border-[#1e293b]">
                        <p className="text-gray-300 text-sm font-medium">
                          {selectedLead.status === 'agendado' ? '✅ Enviar enlace de pago/facturación y programar recolección vehicular.' : '⚠️ Enviar tarifario exacto y ofrecer descuento de primera vez para forzar cierre.'}
                        </p>
                        <a
                          href={`https://wa.me/${selectedLead.phone.split('@')[0]}`}
                          target="_blank" rel="noreferrer"
                          className="shrink-0 px-4 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Ejecutar Acción
                        </a>
                      </div>
                    </div>

                    {/* Último Contexto (Mini Chat) */}
                    <div className="mt-8">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Última Interacción Relevante</h3>
                      {chatHistory.length === 0 ? (
                        <div className="text-center p-8 bg-[#121a24] rounded-xl border border-[#1e293b] text-gray-500 text-sm">No hay transcripción disponible.</div>
                      ) : (
                        <div className="bg-[#121a24] p-5 rounded-2xl border border-[#1e293b] shadow-inner space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                          {chatHistory.slice(-1).map((msg, idx) => (
                            <div key={idx} className="space-y-4">
                              <div className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1"><Users className="w-3 h-3 text-gray-300" /></div>
                                <div className="bg-[#1e293b] p-3 rounded-xl rounded-tl-none text-sm text-gray-200 border border-[#2a3a4f]">{msg.message_in}</div>
                              </div>
                              {msg.response_out && (
                                <div className="flex gap-3 items-start justify-end">
                                  <div className="bg-gradient-to-br from-[#2a111a] to-[#3a1824] p-3 rounded-xl rounded-tr-none text-sm text-gray-200 border border-[#8a1538]/40" dangerouslySetInnerHTML={{ __html: msg.response_out }}></div>
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8a1538] to-[#e41a54] flex items-center justify-center shrink-0 mt-1 text-[10px] font-bold text-white">AI</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

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
        ) : activeView === 'analytics' ? (
          <div className="flex-1 overflow-y-auto mb-8 mx-6 lg:mx-8 bg-[#0d141d]/80 backdrop-blur-xl rounded-3xl border border-[#1e293b] p-8 text-gray-400">
            <div className="flex items-center gap-4 mb-8 border-b border-[#1e293b] pb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <BarChart3 className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide font-mono">Reporte Ejecutivo de Rendimiento</h2>
                <p className="text-sm">Analítica en tiempo real del motor conversacional Sophia v3</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Tasa de Conversión AI</h3>
                <div className="text-4xl font-extrabold text-white font-mono">68.2%</div>
                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">+12.5% vs semana anterior</div>
              </div>
              <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Tiempo de Cierre Promedio</h3>
                <div className="text-4xl font-extrabold text-white font-mono">4m 12s</div>
                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">-45s eficiencia mejorada</div>
              </div>
              <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg">
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-2">Costo por Lead Adquisición</h3>
                <div className="text-4xl font-extrabold text-white font-mono">$1.05</div>
                <div className="mt-2 text-xs text-amber-400 flex items-center gap-1">Estable (Campañas activas)</div>
              </div>
            </div>

            <div className="bg-[#121a24] p-6 rounded-2xl border border-[#1e293b] shadow-lg flex items-center justify-center h-48 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#8a1538]/5 to-transparent"></div>
              <div className="text-center relative z-10">
                <Activity className="w-10 h-10 text-gray-600 mb-3 mx-auto opacity-50" />
                <p className="text-lg font-medium text-gray-300">Gráfico de flujos de interacción en desarrollo...</p>
                <p className="text-xs text-gray-500 mt-2">Módulo avanzado de gráficos D3.js se activará en la Fase 4.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mb-8 mx-6 lg:mx-8 bg-[#0d141d]/80 backdrop-blur-xl rounded-3xl border border-[#1e293b] p-8 text-gray-400">
            <div className="flex items-center gap-4 mb-8 border-b border-[#1e293b] pb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-900/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide font-mono">Auditoría de Control y Calidad</h2>
                <p className="text-sm">Registro inmutable de decisiones de la IA y eventos del sistema</p>
              </div>
            </div>

            <div className="bg-[#121a24] rounded-2xl border border-[#1e293b] overflow-hidden shadow-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#16202e] border-b border-[#1e293b] text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Evento</th>
                    <th className="px-6 py-4">Nivel</th>
                    <th className="px-6 py-4">Detalle / ID Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] font-mono text-gray-400">
                  <tr className="hover:bg-[#16202e]/50 transition-colors">
                    <td className="px-6 py-4">2026-03-09 12:45:11</td>
                    <td className="px-6 py-4 text-white">IA Respuesta Generada</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">INFO</span></td>
                    <td className="px-6 py-4 opacity-70">Sesgo usado: Efecto Halo (ID: L-09852)</td>
                  </tr>
                  <tr className="hover:bg-[#16202e]/50 transition-colors">
                    <td className="px-6 py-4">2026-03-09 12:30:45</td>
                    <td className="px-6 py-4 text-white">Intervención Humana</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">SECURE</span></td>
                    <td className="px-6 py-4 opacity-70">Director General tomó control chat asincrónico</td>
                  </tr>
                  <tr className="hover:bg-[#16202e]/50 transition-colors">
                    <td className="px-6 py-4">2026-03-09 11:15:00</td>
                    <td className="px-6 py-4 text-white">Rate Limit Activado</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">WARN</span></td>
                    <td className="px-6 py-4 opacity-70">Protección anti-spam activada (ID: L-19920)</td>
                  </tr>
                  <tr className="hover:bg-[#16202e]/50 transition-colors opacity-50">
                    <td className="px-6 py-4">2026-03-09 09:00:22</td>
                    <td className="px-6 py-4 text-white">Sistema Inicializado</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">INFO</span></td>
                    <td className="px-6 py-4 opacity-70">Boot sequence exitosa v3.0.5</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-4 border-t border-[#1e293b] text-center text-xs text-gray-500 flex justify-center items-center gap-2">
                <Briefcase className="w-4 h-4" /> Mostrando últimos 4 eventos (Nivel: Dirección)
              </div>
            </div>
          </div>
        )}
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
