import React, { useState, useEffect, useRef } from "react";
import { 
  fetchLeads, 
  updateLeadStatus, 
  deleteLead, 
  DBLead,
  NotificationConfig,
  fetchNotificationConfig,
  saveNotificationConfig,
  changeAdminPassword
} from "../utils/leadsApi";
import { 
  Lock, 
  Trash2, 
  Download, 
  MessageSquare, 
  Search, 
  User, 
  Clock, 
  CarFront, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
  Sparkles,
  Bell
} from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<DBLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [adminPasscode, setAdminPasscode] = useState(""); // Stores successful passcode to auto-refetch

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
    discordEnabled: false,
    discordWebhookUrl: "",
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  // States for updating the admin password
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Store previous leads IDs in a ref to check for completely new items on poll
  const prevLeadsIdsRef = useRef<string[]>([]);

  // Gentle chime synthesizer using Web Audio API (to avoid external file request issues)
  const playAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Could not play sound preview:", e);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações de área de trabalho.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setBrowserNotificationsEnabled(true);
      new Notification("Notificações Ativas!", {
        body: "Você começará a receber avisos visuais aqui quando novos leads chegarem!",
        icon: "/app_icon_192.png"
      });
    } else {
      alert("Permissão de notificações recusada. Ative nas permissões do site para receber avisos.");
    }
  };

  const handleSaveNotifications = async () => {
    if (!adminPasscode) return;
    setIsSavingConfig(true);
    try {
      await saveNotificationConfig(notificationConfig, adminPasscode);
      alert("Configurações de robôs salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar configurações de notificação.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handlePasswordChangeSubmit = async () => {
    if (!newAdminPassword.trim()) {
      setPasswordChangeMessage("A nova senha não pode estar vazia.");
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordChangeMessage("As senhas digitadas não coincidem.");
      return;
    }
    if (newAdminPassword.length < 4) {
      setPasswordChangeMessage("A senha é muito curta. Use no mínimo 4 caracteres.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordChangeMessage("");

    try {
      await changeAdminPassword(newAdminPassword, adminPasscode);
      
      // Update our current session with the new password
      setAdminPasscode(newAdminPassword);
      setPassword(newAdminPassword);
      sessionStorage.setItem("admin_password", newAdminPassword);
      
      setPasswordChangeMessage("✓ Senha de administrador alterada com sucesso!");
      setNewAdminPassword("");
      setConfirmAdminPassword("");
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordChangeMessage("");
      }, 2000);
    } catch (err: any) {
      setPasswordChangeMessage(err.message || "Erro ao atualizar a senha administrativa.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Initialize permission state
  useEffect(() => {
    if ("Notification" in window) {
      setBrowserNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Initialize previous leads IDs helper
  useEffect(() => {
    if (leads.length > 0 && prevLeadsIdsRef.current.length === 0) {
      prevLeadsIdsRef.current = leads.map(l => l.id);
    }
  }, [leads]);

  // Periodic polling for new leads if authorized
  useEffect(() => {
    if (!isAuthenticated || !adminPasscode) return;

    const interval = setInterval(async () => {
      try {
        const freshLeads = await fetchLeads(adminPasscode);
        
        // Find if list has any completely new leads
        if (prevLeadsIdsRef.current.length > 0) {
          const freshIds = freshLeads.map(l => l.id);
          const newLeadsFound = freshLeads.filter(l => !prevLeadsIdsRef.current.includes(l.id));
          
          if (newLeadsFound.length > 0) {
            playAlertSound();
            
            if ("Notification" in window && Notification.permission === "granted") {
              newLeadsFound.forEach(lead => {
                new Notification("🚗 Novo Lead Recebido!", {
                  body: `${lead.nomeCompleto} (${lead.modeloVeiculo}) acabou de simular!`,
                  icon: "/app_icon_192.png"
                });
              });
            }
          }
        }
        
        // Update both state and ref
        setLeads(freshLeads);
        prevLeadsIdsRef.current = freshLeads.map(l => l.id);
      } catch (err) {
        console.error("Erro na busca de leads periódico:", err);
      }
    }, 12000); // Poll every 12 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, adminPasscode]);

  // Auto-login if previously verified in session
  useEffect(() => {
    const savedPass = sessionStorage.getItem("admin_password");
    if (savedPass) {
      setPassword(savedPass);
      handleVerify(savedPass);
    }
  }, []);

  const handleVerify = async (passToVerify = password) => {
    if (!passToVerify.trim()) {
      setError("Por favor, digite a senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await fetchLeads(passToVerify);
      setLeads(data);
      setIsAuthenticated(true);
      setAdminPasscode(passToVerify);
      sessionStorage.setItem("admin_password", passToVerify);

      // Load Notification configuration automatically
      try {
        const config = await fetchNotificationConfig(passToVerify);
        setNotificationConfig(config);
      } catch (e) {
        console.warn("Nenhuma configuração prévia de webhook cadastrada.");
      }
    } catch (err: any) {
      setError("Senha administrativa incorreta. Tente novamente.");
      sessionStorage.removeItem("admin_password");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updated = await updateLeadStatus(id, newStatus, adminPasscode);
      setLeads(leads.map(l => l.id === id ? updated : l));
    } catch (err) {
      alert("Erro ao atualizar o status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Confirma a exclusão definitiva deste lead?")) return;

    try {
      await deleteLead(id, adminPasscode);
      setLeads(leads.filter(l => l.id !== id));
    } catch (err) {
      alert("Erro ao excluir lead.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setPassword("");
    setAdminPasscode("");
    setLeads([]);
  };

  const refreshList = async () => {
    setLoading(true);
    try {
      const data = await fetchLeads(adminPasscode);
      setLeads(data);
    } catch (err) {
      setError("Sessão expirada. Faça login novamente.");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Export Leads to standard CSV format
  const exportToCSV = () => {
    if (leads.length === 0) return;

    // Filter leads exactly as selected in UI
    const filtered = leads.filter(lead => {
      const matchesSearch = 
        lead.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.whatsapp.includes(searchTerm) ||
        lead.modeloVeiculo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "todos" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      alert("Nenhum lead correspondente para exportar.");
      return;
    }

    // CSV headers matching columns and data values
    const headers = ["ID", "Data Cadastro", "Nome Completo", "WhatsApp", "Cidade UF", "Modelo Veiculo", "Ano", "Possui Seguro", "Trabalho", "Melhor Horario", "Status", "Observacoes"];
    const rows = filtered.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleDateString("pt-BR") + " " + new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }),
      `"${l.nomeCompleto.replace(/"/g, '""')}"`,
      l.whatsapp,
      `"${l.cidadeUf.replace(/"/g, '""')}"`,
      `"${l.modeloVeiculo.replace(/"/g, '""')}"`,
      l.anoVeiculo,
      l.possuiSeguro,
      l.usaParaTrabalho,
      l.melhorHorario,
      l.status,
      `"${(l.observacoes || "").replace(/\n/g, " ").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Leads_AutoCotaExpress_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic WhatsApp pre-filled message generator to send to the partner broker
  const handleSendToBroker = (lead: DBLead) => {
    const formattedMessage = encodeURIComponent(
`*📍 NOVO LEAD RECEBIDO - AUTOCOTA EXPRESS*

*DADOS DO CLIENTE:*
• *Nome Completo:* ${lead.nomeCompleto}
• *WhatsApp de Contato:* ${lead.whatsapp}
• *Cidade/UF:* ${lead.cidadeUf}

*DADOS DO VEÍCULO:*
• *Modelo:* ${lead.modeloVeiculo}
• *Ano:* ${lead.anoVeiculo}

*PREFERÊNCIAS DE SEGURO:*
• *Já Possui Seguro:* ${lead.possuiSeguro}
• *Usa Para Trabalho:* ${lead.usaParaTrabalho}
• *Melhor Horário para Contato:* ${lead.melhorHorario}

*OBSERVAÇÕES ADICIONAIS:*
${lead.observacoes || "Nenhuma observação informada."}

---
_Gerado via AutoCota Express em ${new Date(lead.createdAt).toLocaleDateString("pt-BR")}_`
    );

    // Open WhatsApp redirect url
    window.open(`https://api.whatsapp.com/send?text=${formattedMessage}`, "_blank");
  };

  // Filtered Leads computation
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.whatsapp.includes(searchTerm) ||
      lead.modeloVeiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.cidadeUf.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats computation
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "Novo").length;
  const contactedLeads = leads.filter(l => l.status === "Em Contato").length;
  const completedLeads = leads.filter(l => l.status === "Concluído").length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-2xl shadow-blue-900/5 max-w-5xl mx-auto animate-fade-in">
      
      {/* Header Admin section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100 mb-8">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sliders className="w-3.5 h-3.5" />
            Mesa de Operação Integrada
          </span>
          <h2 className="text-3xl font-extrabold text-[#00236f] tracking-tight">
            Painel da Administração
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair do Painel
            </button>
          )}
          <button 
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs transition-all"
          >
            Fechar Painel
          </button>
        </div>
      </div>

      {/* Authentication view */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto py-12 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-[#00236f] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Acesso Restrito</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Insira a senha de administrador configurada para visualizar e gerenciar os dados dos leads de simulação.
            </p>
          </div>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleVerify(); }}
            className="space-y-3 pt-2"
          >
            <input 
              type="password"
              placeholder="Digite a Senha Administrador"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium text-center focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all focus:border-[#00236f]"
              id="admin-password-field"
            />
            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-80"
              id="admin-login-submit"
            >
              {loading ? "Verificando..." : "Autenticar Entrada"}
            </button>
          </form>
          <p className="text-[11px] text-gray-400">
            Dica rápida de desenvolvimento: a senha padrão é <span className="font-semibold text-gray-500">admin123</span> (pode ser customizada no arquivo .env pela variável ADMIN_PASSWORD)
          </p>
        </div>
      ) : (
        /* Logged in admin controls */
        <div className="space-y-8 animate-fade-in">

          {/* KPI Dashboard Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100/60 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 block">Total de Leads</span>
              <span className="text-2xl font-black text-[#00236f]">{totalLeads}</span>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/60 shadow-sm">
              <span className="text-xs font-semibold text-blue-700 block">Novos Pendentes</span>
              <span className="text-2xl font-black text-[#00236f]">{newLeads}</span>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100/60 shadow-sm">
              <span className="text-xs font-semibold text-yellow-800 block">Em Contato</span>
              <span className="text-2xl font-black text-yellow-900">{contactedLeads}</span>
            </div>

            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100/60 shadow-sm">
              <span className="text-xs font-semibold text-teal-700 block">Atendimentos Concluídos</span>
              <span className="text-2xl font-black text-teal-900">{completedLeads}</span>
            </div>

          </div>

          {/* Search, filters & Export controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3 flex-grow max-w-2xl">
              
              {/* Search Bar Input */}
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Pesquisar por Cliente, Carro, WhatsApp, Cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#00236f] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                  id="admin-search-bar"
                />
              </div>

              {/* Status Filter select */}
              <div className="min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00236f] bg-white cursor-pointer"
                  id="admin-status-dropdown"
                >
                  <option value="todos">Todos Status</option>
                  <option value="Novo">Novo / Pendente</option>
                  <option value="Em Contato">Em Contato</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshList}
                disabled={loading}
                className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-all"
                title="Sincronizar Atualizações"
                aria-label="Refresh Data list"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => {
                  setShowNotificationSettings(!showNotificationSettings);
                  setShowPasswordChange(false);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 border ${
                  showNotificationSettings
                    ? "bg-teal-50 border-teal-300 text-teal-800"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
                title="Configurar Notificações e Webhooks"
              >
                <Bell className={`w-4 h-4 ${showNotificationSettings ? "animate-bounce" : ""}`} />
                Configurar Alertas
              </button>

              <button
                onClick={() => {
                  setShowPasswordChange(!showPasswordChange);
                  setShowNotificationSettings(false);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 border ${
                  showPasswordChange
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
                title="Alterar Senha de Administrador"
              >
                <Lock className={`w-4 h-4 ${showPasswordChange ? "animate-pulse" : ""}`} />
                Alterar Senha
              </button>

              <button
                onClick={exportToCSV}
                className="bg-[#00236f] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5"
                id="btn-export-csv"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Change password panel */}
          {showPasswordChange && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 space-y-4 animate-fade-in mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#00236f] flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    Alterar Senha Administrativa
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Defina uma nova credencial segura para acessar o Painel de Administração Integrado.
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shrink-0"
                >
                  Ocultar Painel
                </button>
              </div>

              <div className="max-w-md pt-2">
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Nova Senha Administrativa</label>
                    <input
                      type="password"
                      placeholder="Mínimo de 4 caracteres"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Repita a nova senha desejada"
                      value={confirmAdminPassword}
                      onChange={(e) => setConfirmAdminPassword(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00236f] text-sm"
                    />
                  </div>
                </div>

                {passwordChangeMessage && (
                  <div className={`p-3 rounded-xl mb-4 text-xs font-bold leading-relaxed border ${
                    passwordChangeMessage.includes("sucesso")
                      ? "bg-teal-50 border-teal-200 text-teal-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {passwordChangeMessage}
                  </div>
                )}

                <div className="flex justify-start">
                  <button
                    onClick={handlePasswordChangeSubmit}
                    disabled={isChangingPassword || !newAdminPassword || !confirmAdminPassword}
                    className="bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isChangingPassword ? "Salvando..." : "Confirmar Nova Senha"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification settings panel */}
          {showNotificationSettings && (
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#00236f] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-600" />
                    Central de Canais e Notificações CotaExpress
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Evite perder prazos. Ative alertas em tempo real e integre robôs para receber avisos sobre cada nova cotação automaticamente!
                  </p>
                </div>
                <button
                  onClick={() => setShowNotificationSettings(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shrink-0"
                >
                  Ocultar Ajustes
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                
                {/* 1. Browser Notification Options */}
                <div className="bg-white p-5 rounded-xl border border-gray-150 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-800">Alertas de Tela (Push) & Som no Navegador</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Seu navegador soará um aviso sonoro (bipe) e exibirá uma notificação push do sistema operacional assim que novos leads entrarem no site (requer manter esta aba do painel aberta).
                    </p>
                  </div>
                  
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {browserNotificationsEnabled ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006a61] bg-teal-50 px-3.5 py-2 rounded-xl border border-teal-200">
                        ✓ Alertas do Navegador Ativos
                      </span>
                    ) : (
                      <button
                        onClick={requestNotificationPermission}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        🔔 Ativar Avisos do Navegador
                      </button>
                    )}
                    <button
                      onClick={playAlertSound}
                      className="text-xs font-semibold text-gray-600 hover:text-teal-700 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 px-3.5 py-2 rounded-xl transition-all"
                    >
                      🔊 Testar Som (Bipe)
                    </button>
                  </div>
                </div>

                {/* 2. Webhooks options */}
                <div className="bg-white p-5 rounded-xl border border-gray-150 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800">Integrações de Segundo Plano (Robôs de Conversas)</h4>
                  <div className="space-y-4">
                    
                    {/* Telegram */}
                    <div className="border border-gray-100 p-3.5 rounded-xl bg-gray-50/50 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notificationConfig.telegramEnabled}
                          onChange={(e) => setNotificationConfig({
                            ...notificationConfig,
                            telegramEnabled: e.target.checked
                          })}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-xs font-extrabold text-slate-700">Ativar Notificações no Telegram</span>
                      </label>
                      {notificationConfig.telegramEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block mb-1">BOT TOKEN (Ex: 12345:ABC...)</span>
                            <input
                              type="text"
                              placeholder="Forncido pelo @BotFather"
                              value={notificationConfig.telegramBotToken}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                telegramBotToken: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block mb-1">CHAT ID (Ex: -100234...)</span>
                            <input
                              type="text"
                              placeholder="Chat ID para receber"
                              value={notificationConfig.telegramChatId}
                              onChange={(e) => setNotificationConfig({
                                ...notificationConfig,
                                telegramChatId: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Discord */}
                    <div className="border border-gray-100 p-3.5 rounded-xl bg-gray-50/50 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notificationConfig.discordEnabled}
                          onChange={(e) => setNotificationConfig({
                            ...notificationConfig,
                            discordEnabled: e.target.checked
                          })}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-xs font-extrabold text-slate-700">Ativar Notificações no Discord (Canal)</span>
                      </label>
                      {notificationConfig.discordEnabled && (
                        <div className="animate-fade-in text-xs space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold block">DISCORD WEBHOOK URL</span>
                          <input
                            type="text"
                            placeholder="URL gerada nas configurações do canal do seu servidor"
                            value={notificationConfig.discordWebhookUrl}
                            onChange={(e) => setNotificationConfig({
                              ...notificationConfig,
                              discordWebhookUrl: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none placeholder:text-gray-300"
                          />
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* Save webhook config button */}
              <div className="flex justify-end border-t border-gray-200 pt-4 gap-2">
                <button
                  onClick={handleSaveNotifications}
                  disabled={isSavingConfig}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingConfig ? "Salvando..." : "Salvar Configurações de Avisos"}
                </button>
              </div>
            </div>
          )}

          {/* Lead Table / Stack list */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
            {filteredLeads.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-gray-500 font-semibold">Nenhum lead encontrado.</p>
                <p className="text-xs text-gray-400">Preencha o formulário para simular a criação de novos leads nesta base.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                      <th className="p-4 pl-6">Data / Cliente</th>
                      <th className="p-4">Carro / Ano</th>
                      <th className="p-4">WhatsApp / Local</th>
                      <th className="p-4">Seguro / Trabalho</th>
                      <th className="p-4">Status Atendimento</th>
                      <th className="p-4 text-center">Encaminhamento</th>
                      <th className="p-4 pr-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredLeads.map((lead) => {
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                          {/* Col 1 */}
                          <td className="p-4 pl-6">
                            <div className="space-y-1">
                              <span className="font-bold text-gray-900 block group-hover:text-[#00236f] transition-colors">{lead.nomeCompleto}</span>
                              <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-teal-600" />
                                {new Date(lead.createdAt).toLocaleDateString("pt-BR") + " " + new Date(lead.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>

                          {/* Col 2 */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                <CarFront className="w-3.5 h-3.5 text-gray-400" />
                                {lead.modeloVeiculo}
                              </span>
                              <span className="text-xs text-gray-500 block font-semibold">{lead.anoVeiculo}</span>
                            </div>
                          </td>

                          {/* Col 3 */}
                          <td className="p-4 mt-0.5">
                            <div className="space-y-0.5">
                              <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-bold">{lead.whatsapp}</span>
                              <span className="text-xs text-xs text-gray-500 flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-teal-600" />
                                {lead.cidadeUf}
                              </span>
                            </div>
                          </td>

                          {/* Col 4 */}
                          <td className="p-4 text-xs font-semibold">
                            <div className="space-y-1">
                              <span className={lead.possuiSeguro === "Sim" ? "text-blue-700 block" : "text-gray-500 block"}>
                                Seguro: {lead.possuiSeguro}
                              </span>
                              <span className={lead.usaParaTrabalho === "Sim" ? "text-teal-700 block" : "text-gray-400 block font-normal"}>
                                Trabalho: {lead.usaParaTrabalho}
                              </span>
                            </div>
                          </td>

                          {/* Col 5 */}
                          <td className="p-4">
                            <select
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                                lead.status === "Novo" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                lead.status === "Em Contato" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                                "bg-teal-50 text-teal-800 border-teal-200"
                              }`}
                              aria-label="Selection of lead treatment status"
                            >
                              <option value="Novo">Novo</option>
                              <option value="Em Contato">Em Contato</option>
                              <option value="Concluído">Concluído</option>
                            </select>
                          </td>

                          {/* Col 6 (Forward via web link to WhatsApp) */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleSendToBroker(lead)}
                              className="inline-flex items-center gap-1.5 bg-[#006a61] hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm shadow-teal-900/10"
                              title="Enviar dados deste lead completo formatado ao corretor via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Encaminhar
                            </button>
                          </td>

                          {/* Col 7 (Delete permanently) */}
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="p-1 px-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline"
                              title="Excluir definitivo"
                              aria-label="Delete Lead entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Helpful Tips in Dashboard Footer */}
          <div className="bg-teal-50/50 p-4 border border-teal-100 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 leading-relaxed space-y-1">
              <span className="font-bold text-teal-800 block">Dica de Produtividade do Facilitador:</span>
              <p>
                Ao clicar em <span className="font-bold text-[#006a61]">"Encaminhar"</span> ao lado de qualquer lead ou cliente na tabela, o aplicativo abre instantaneamente sua conta de mensagens (WhatsApp) pré-preenchida com o roteiro perfeito e estruturado com toda a ficha técnica da cotação. Você só precisa escolher o corretor parceiro para enviar de forma limpa e direta!
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
