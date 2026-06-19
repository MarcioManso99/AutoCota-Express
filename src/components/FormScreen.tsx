import React, { useState } from "react";
import { LeadForm } from "../types";
import { submitLead } from "../utils/leadsApi";
import { 
  CheckCircle, 
  HelpCircle, 
  Send, 
  ShieldCheck, 
  UserCheck, 
  Activity, 
  ShieldAlert,
  Sparkles,
  PhoneCall,
  MapPin,
  CarFront
} from "lucide-react";

interface FormScreenProps {
  onSubmit: (data: LeadForm) => void;
  initialData: LeadForm;
}

export function FormScreen({ onSubmit, initialData }: FormScreenProps) {
  const [formData, setFormData] = useState<LeadForm>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-formatting for WhatsApp mask: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    let formattedValue = "";
    if (value.length > 0) {
      formattedValue = "(" + value.slice(0, 2);
    }
    if (value.length > 2) {
      formattedValue += ") " + value.slice(2, 7);
    }
    if (value.length > 7) {
      formattedValue += "-" + value.slice(7, 11);
    } else if (value.length > 2) {
      // While typing, handle trailing formatting neatly
    }

    setFormData({ ...formData, whatsapp: formattedValue || value });
    if (errors.whatsapp) {
      setErrors({ ...errors, whatsapp: undefined });
    }
  };

  const handleInputChange = (
    key: keyof LeadForm, 
    value: string | boolean
  ) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) {
      setErrors({ ...errors, [key]: undefined });
    }
  };

  const validate = (): boolean => {
    const tempErrors: Partial<Record<keyof LeadForm, string>> = {};
    
    if (!formData.nomeCompleto.trim()) {
      tempErrors.nomeCompleto = "O nome completo é obrigatório.";
    } else if (formData.nomeCompleto.trim().split(" ").length < 2) {
      tempErrors.nomeCompleto = "Por favor, insira sobrenome também.";
    }

    const unmaskedPhone = formData.whatsapp.replace(/\D/g, "");
    if (!unmaskedPhone) {
      tempErrors.whatsapp = "O WhatsApp é obrigatório para contato.";
    } else if (unmaskedPhone.length < 10) {
      tempErrors.whatsapp = "Insira um número de telefone válido com DDD.";
    }

    if (!formData.cidadeUf.trim()) {
      tempErrors.cidadeUf = "Cidade/UF é obrigatório.";
    }

    if (!formData.modeloVeiculo.trim()) {
      tempErrors.modeloVeiculo = "Modelo do veículo é obrigatório.";
    }

    if (!formData.anoVeiculo) {
      tempErrors.anoVeiculo = "Ano do veículo é obrigatório.";
    } else {
      const yearNum = parseInt(formData.anoVeiculo, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 2) {
        tempErrors.anoVeiculo = `Ano inválido (insira entre 1900 e ${currentYear + 1}).`;
      }
    }

    if (!formData.aceitaTermos) {
      tempErrors.aceitaTermos = "Você precisa autorizar o envio de dados conforme as diretrizes da LGPD.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Scroll to top error or general feedback if needed
      return;
    }

    setIsSubmitting(true);
    try {
      const persistedLead = await submitLead(formData);
      setIsSubmitting(false);
      onSubmit(persistedLead);
    } catch (err) {
      console.error("Erro ao enviar lead:", err);
      setIsSubmitting(false);
      // Fallback submit
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in" id="form-section">
      
      {/* Hero & Intro Area */}
      <section className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#00236f] rounded-full text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Parceiro SUSEP Oficial
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#00236f] leading-tight tracking-tight">
            Pré-cadastro rápido para cotação de seguro auto
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
            Preencha seus dados básicos para que sua solicitação seja encaminhada a um corretor de seguros parceiro habilitado. <span className="font-semibold text-teal-600">O preenchimento é gratuito e sem compromisso.</span>
          </p>
          
          {/* Trust Points Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <CheckCircle className="w-5 h-5 fill-teal-50" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Atendimento gratuito</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <ShieldCheck className="w-5 h-5 fill-teal-50" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Sem compromisso</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <UserCheck className="w-5 h-5 fill-teal-50" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Corretores parceiros</span>
            </div>
          </div>
        </div>
        
        {/* Decorative electric car image */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-gray-100 animate-fade-in group">
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply z-10"></div>
          <img 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoGegVxD903LKe2s186sT8eZKqyZooisHLtOsuj3FIS9cNklnR2JlV6SvTcGRNeNk9nKDlf6H1xgNK4fdDFFJ0PAIaN-xAV4PwePnzaSvr-hQ20LxBuOSBnfVFFhMz4AT6NRB_25a7INZntgaMMaRzhVvi9a9gkTuIPpIJNse4mgNDATXvb_J7b2_k0mPs-zdFep0N_pyiw09dtFfb7Q9gvdjODlz9nGKJZogbw3O0Oz-N9KCouObqbgZAWi_oZg329FLbnsks0xke" 
            alt="Modern electric car parking in a clean futuristic garage"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-white/20 z-20 space-y-1">
            <span className="text-xs font-bold text-[#00236f] block uppercase tracking-wider">AutoCota Express</span>
            <p className="text-xs text-gray-600">Simplificando o caminho para proteger o que mais importa para você.</p>
          </div>
        </div>
      </section>

      {/* Main Content & Form Field Segment */}
      <section className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-xl shadow-blue-900/5 max-w-4xl mx-auto relative overflow-hidden" id="form">
        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-[#00236f] to-blue-500"></div>
        
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Formulário de Pré-cadastro</h3>
          <p className="text-sm text-gray-500 mt-1">Preencha o formulário abaixo em menos de 1 minuto para receber as melhores ofertas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Column 1 */}
            <div className="space-y-6">
              
              {/* Nome Completo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1.5">
                  Nome Completo
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={formData.nomeCompleto}
                    onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all ${errors.nomeCompleto ? "border-red-400 focus:ring-red-500/10" : "border-gray-200 focus:border-[#00236f]"}`}
                    placeholder="Ex: João Silva"
                    id="input-nome-completo"
                  />
                </div>
                {errors.nomeCompleto && (
                  <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{errors.nomeCompleto}</span>
                )}
              </div>

              {/* WhatsApp phone input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1.5">
                  WhatsApp
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">
                    <PhoneCall className="w-4 h-4 text-[#00236f]" />
                  </span>
                  <input 
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={handlePhoneChange}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all ${errors.whatsapp ? "border-red-400 focus:ring-red-500/10" : "border-gray-200 focus:border-[#00236f]"}`}
                    placeholder="(11) 99999-9999"
                    id="input-whatsapp"
                  />
                </div>
                {errors.whatsapp && (
                  <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{errors.whatsapp}</span>
                )}
              </div>

              {/* Cidade/UF */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1.5">
                  Cidade/UF
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                  </span>
                  <input 
                    type="text"
                    required
                    value={formData.cidadeUf}
                    onChange={(e) => handleInputChange("cidadeUf", e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all ${errors.cidadeUf ? "border-red-400 focus:ring-red-500/10" : "border-gray-200 focus:border-[#00236f]"}`}
                    placeholder="Ex: São Paulo / SP"
                    id="input-cidade-uf"
                  />
                </div>
                {errors.cidadeUf && (
                  <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{errors.cidadeUf}</span>
                )}
              </div>

              {/* Modelo do Veículo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1.5">
                  Modelo do Veículo
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <CarFront className="w-4 h-4 text-gray-400" />
                  </span>
                  <input 
                    type="text"
                    required
                    value={formData.modeloVeiculo}
                    onChange={(e) => handleInputChange("modeloVeiculo", e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all ${errors.modeloVeiculo ? "border-red-400 focus:ring-red-500/10" : "border-gray-200 focus:border-[#00236f]"}`}
                    placeholder="Ex: Toyota Corolla"
                    id="input-modelo-veiculo"
                  />
                </div>
                {errors.modeloVeiculo && (
                  <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{errors.modeloVeiculo}</span>
                )}
              </div>

              {/* Ano do Veículo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1.5">
                  Ano do Veículo
                  <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number"
                  required
                  value={formData.anoVeiculo}
                  onChange={(e) => handleInputChange("anoVeiculo", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all ${errors.anoVeiculo ? "border-red-400 focus:ring-red-500/10" : "border-gray-200 focus:border-[#00236f]"}`}
                  placeholder="Ex: 2023"
                  id="input-ano-veiculo"
                />
                {errors.anoVeiculo && (
                  <span className="text-xs text-red-500 font-medium ml-1 mt-0.5">{errors.anoVeiculo}</span>
                )}
              </div>

            </div>

            {/* Column 2 */}
            <div className="space-y-6">
              
              {/* Já possui seguro? */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  O veículo já possui seguro?
                </label>
                <select 
                  value={formData.possuiSeguro}
                  onChange={(e) => handleInputChange("possuiSeguro", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#00236f] focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px' }}
                  id="select-possui-seguro"
                >
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                  <option value="Não sei">Não sei</option>
                </select>
              </div>

              {/* Usa o veículo para trabalho? */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Usa o veículo para trabalho?
                </label>
                <select 
                  value={formData.usaParaTrabalho}
                  onChange={(e) => handleInputChange("usaParaTrabalho", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#00236f] focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px' }}
                  id="select-trabalho"
                >
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                  <option value="Às vezes">Às vezes</option>
                </select>
              </div>

              {/* Melhor horário para contato */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Melhor horário para contato
                </label>
                <select 
                  value={formData.melhorHorario}
                  onChange={(e) => handleInputChange("melhorHorario", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#00236f] focus:outline-none transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px' }}
                  id="select-horario"
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                </select>
              </div>

              {/* Observações */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Observações adicionais
                </label>
                <textarea 
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-800 bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#00236f] focus:outline-none transition-all resize-none"
                  placeholder="Alguma informação extra que gostaria de mencionar?"
                  id="textarea-observacoes"
                />
              </div>

            </div>

          </div>

          {/* Terms & Submit Button Segment */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <label className="flex items-start gap-3.5 cursor-pointer group select-none">
              <input 
                type="checkbox"
                checked={formData.aceitaTermos}
                onChange={(e) => handleInputChange("aceitaTermos", e.target.checked)}
                className={`mt-1 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer transition-colors ${errors.aceitaTermos ? "border-red-400 rounded-md" : ""}`}
                id="checkbox-lgpd"
              />
              <span className="text-sm text-gray-600 leading-relaxed font-label-md group-hover:text-gray-900 transition-colors">
                Autorizo a <span className="font-semibold text-[#00236f]">AutoCota Express</span> a coletar meus dados e encaminhá-los a corretores de seguros parceiros devidamente certificados e credenciados para fins de cotação de seguro automotivo, com total segurança e respeito à lei da LGPD.
              </span>
            </label>
            {errors.aceitaTermos && (
              <p className="text-xs text-red-500 font-semibold ml-8 mt-1">{errors.aceitaTermos}</p>
            )}

            {/* Enviar btn */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#006a61] hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-md shadow-teal-900/10 hover:shadow-teal-900/20 active:scale-[0.98] transition-all disabled:opacity-80 flex items-center justify-center gap-2 text-base"
                id="btn-submeter"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    Enviar solicitação
                    <Send className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            {/* Impressive Disclaimer Alert */}
            <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#00236f] space-y-1">
              <span className="font-bold text-sm text-[#00236f] block">Aviso Legal Importante:</span>
              <p className="text-xs text-gray-500 leading-relaxed">
                A AutoCota Express não é uma corretora de seguros independente e não realiza vendas diretas. Atuamos estritamente como um canal inteligente de captação, refinamento e organização de solicitações de leads de seguros auto. Toda a análise de risco, formulação oficial de propostas e a devida contratação securitária serão processadas exclusivamente por um corretor parceiro autorizado pela SUSEP. Ao submeter este formulário, você está ciente e concorda com esta intermediação facilitadora gratuita.
              </p>
            </div>
          </div>
        </form>
      </section>

      {/* Atmospheric Secondary Process Content cards with clean bento layout */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8" id="como-funciona">
        <div className="bg-[#1e3a8a] text-white p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px] shadow-sm group">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-115 transition-transform duration-500">
            <Activity className="w-64 h-64" />
          </div>
          <h3 className="text-2xl font-bold mb-3 z-10">Agilidade no Processo</h3>
          <p className="text-blue-100 leading-relaxed text-sm z-10 max-w-md">
            Conectamos suas informações de forma automatizada com os corretores parceiros mais preparados para sua categoria de veículo em tempo recorde. Sua proteção não precisa esperar.
          </p>
        </div>

        <div className="bg-gray-50 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center min-h-[220px] border border-gray-100 shadow-sm" id="seguranca">
          <h3 className="text-2xl font-bold text-[#00236f] mb-3">Segurança de Dados</h3>
          <p className="text-gray-600 leading-relaxed text-sm max-w-md">
            Seus dados são tratados com o rigor absoluto de segurança que rege a legislação LGPD nacional. Jamais vendemos seus contatos para terceiros não-parceiros. Apenas corretores devidamente credenciados receberão sua intenção de cotação.
          </p>
          <div className="mt-4 flex gap-2.5 text-teal-600">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Conexão Criptografada SSL</span>
          </div>
        </div>
      </section>
    </div>
  );
}
