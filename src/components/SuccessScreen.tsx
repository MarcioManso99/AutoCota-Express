import React, { useEffect, useState } from "react";
import { LeadForm } from "../types";
import { 
  CheckCircle, 
  Home, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  MessageSquare, 
  Handshake,
  ChevronDown,
  ChevronUp,
  Mail,
  UserCheck
} from "lucide-react";

interface SuccessScreenProps {
  onReset: () => void;
  leadData: LeadForm;
}

export function SuccessScreen({ onReset, leadData }: SuccessScreenProps) {
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  const [partyDots, setPartyDots] = useState<Array<{ id: number; left: string; delay: string; color: string; size: string }>>([]);

  // Generate delicate celebration dots on mount
  useEffect(() => {
    const dots = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 95}%`,
      delay: `${Math.random() * 3}s`,
      color: ["bg-teal-400", "bg-blue-500", "bg-indigo-400", "bg-emerald-400"][Math.floor(Math.random() * 4)],
      size: `${Math.random() * 8 + 6}px`
    }));
    setPartyDots(dots);

    // Smooth scroll to top on success render
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleFaq = (id: string) => {
    setActiveFaqId(activeFaqId === id ? null : id);
  };

  const faqs = [
    {
      id: "faq-1",
      question: "Qual o próximo passo após enviar o pré-cadastro?",
      answer: "Suas informações básicas de automóvel são recebidas por nossa mesa inteligente e encaminhadas instantaneamente para o corretor de seguro credenciado correspondente. Ele fará as cotações nas principais seguradoras do mercado e entrará em contato direto com você via WhatsApp."
    },
    {
      id: "faq-2",
      question: "Vou receber dezenas de ligações inconvenientes?",
      answer: "Não! Priorizamos o respeito absoluto à sua conveniência. O modelo AutoCota Express é voltado para contatos objetivos, utilizando preferencialmente o WhatsApp para que você possa analisar as propostas com tranquilidade no seu próprio ritmo."
    },
    {
      id: "faq-3",
      question: "O atendimento de cotação possui custo?",
      answer: "Nenhum! Todo o serviço de cotação de seguros, assessoria inicial de escolha e elaboração de pré-cadastro fornecido pelo AutoCota Express e nossos corretores parceiros oficiais é inteiramente 100% gratuito."
    },
    {
      id: "faq-4",
      question: "Quais são as seguradoras parceiras dos corretores?",
      answer: "Os corretores credenciados trabalham com as maiores e mais respeitáveis seguradoras autorizadas do Brasil (Porto Seguro, Bradesco Seguros, Tokio Marine, Azul Seguros, Allianz, Liberty Seguros, entre outras), garantindo ampla cobertura legal nacional."
    }
  ];

  return (
    <div className="relative space-y-12 pb-12 animate-fade-in">
      
      {/* Celebration Confetti Dust (Absolute Elements) */}
      <div className="absolute inset-x-0 -top-12 h-64 overflow-hidden pointer-events-none z-0">
        {partyDots.map((dot) => (
          <div
            key={dot.id}
            className={`absolute rounded-full animate-bounce duration-1000 ${dot.color}`}
            style={{
              left: dot.left,
              width: dot.size,
              height: dot.size,
              animationDelay: dot.delay,
              opacity: 0.75,
              top: `${Math.random() * 120}px`
            }}
          />
        ))}
      </div>

      {/* Subtle Ambient Background Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden -z-10">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
      </div>

      {/* Success Content Card Canvas */}
      <div className="relative z-10 w-full max-w-2xl mx-auto bg-white border border-gray-100 shadow-xl shadow-blue-900/5 rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center">
        
        {/* Animated Checkmark Circle */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center shadow-inner relative animate-pulse duration-1000">
            <CheckCircle className="w-14 h-14 text-teal-600 fill-teal-50" />
            <span className="absolute inset-0 rounded-full border border-teal-200 animate-ping"></span>
          </div>
        </div>

        {/* Message Group */}
        <div className="space-y-4 max-w-lg">
          <h1 className="text-3xl font-extrabold text-[#00236f] tracking-tight">
            Solicitação recebida!
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            {leadData.nomeCompleto.split(" ")[0] ? `Olá, ${leadData.nomeCompleto.split(" ")[0]}! ` : ""}
            Em breve seus dados serão encaminhados para um corretor parceiro habilitado, que poderá entrar em contato pelo{" "}
            <span className="font-bold text-teal-600">WhatsApp</span> ({leadData.whatsapp}).
          </p>
        </div>

        {/* Dynamic Progress Timeline Stepper */}
        <div className="mt-10 w-full max-w-md">
          <div className="flex items-center justify-between relative mb-2">
            
            {/* Step 1 */}
            <div className="z-10 bg-teal-100 rounded-full p-2 border-2 border-white shadow-sm flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-700" />
            </div>

            {/* Step 2 */}
            <div className="z-10 bg-teal-100 rounded-full p-2 border-2 border-white shadow-sm flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-700" />
            </div>

            {/* Step 3 (Encaminhando / Active Loading State) */}
            <div className="z-10 bg-[#00236f] text-white rounded-full p-2 border-2 border-white shadow-md flex items-center justify-center animate-pulse">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                ●
              </div>
            </div>

            {/* Continuous line background */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-[#00236f] -translate-y-1/2 -z-0 rounded-full"></div>
          </div>

          <div className="flex justify-between text-xs font-semibold text-gray-500 px-1">
            <span className="text-teal-600">Enviado</span>
            <span className="text-teal-600 font-bold">Validado</span>
            <span className="text-[#00236f] font-extrabold flex items-center gap-1">
              Encaminhando...
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={onReset}
            className="bg-[#00236f] text-white font-bold px-8 py-3.5 rounded-xl shadow-md shadow-blue-900/10 hover:bg-[#1e3a8a] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" />
            Voltar ao Início
          </button>
          
          <button 
            onClick={() => {
              setShowFAQ(!showFAQ);
              if(!showFAQ) {
                setTimeout(() => {
                  document.getElementById("faq-accordion-section")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="border-2 border-[#00236f] text-[#00236f] font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            {showFAQ ? "Ocultar dúvidas" : "Dúvidas frequentes"}
          </button>
        </div>

        {/* Trust badge summary */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Sua privacidade é nossa prioridade absoluta. Dados totalmente protegidos pela LGPD.</span>
        </div>

      </div>

      {/* Interactive FAQ Accordion Section (Toggled dynamically) */}
      {showFAQ && (
        <section className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8 animate-fade-in" id="faq-accordion-section">
          <h2 className="text-xl font-bold text-[#00236f] mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-teal-600" />
            Dúvidas Frequentes do Seguro
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = activeFaqId === faq.id;
              return (
                <div key={faq.id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800 hover:text-[#00236f] transition-all bg-gray-50/50"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white border-t border-gray-50 text-sm text-gray-600 leading-relaxed animate-slide-up">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Supportive Bento Grid Section (Process details as in original) */}
      <section className="max-w-5xl mx-auto mt-16 w-full grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-grid-explanation">
        
        {/* Core Item 1 */}
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-teal-500/20 hover:bg-white transition-all duration-300 flex flex-col gap-4 shadow-sm group">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-all">
            <Zap className="w-6 h-6 fill-teal-50" />
          </div>
          <h3 className="text-lg font-bold text-[#00236f]">Agilidade Real</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Nosso sistema processa seu perfil em milissegundos para selecionar o especialista em corretagem ideal e mais especializado de acordo com sua localidade.
          </p>
        </div>

        {/* Core Item 2 */}
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-teal-500/20 hover:bg-white transition-all duration-300 flex flex-col gap-4 shadow-sm group">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-all">
            <MessageSquare className="w-6 h-6 fill-teal-50" />
          </div>
          <h3 className="text-lg font-bold text-[#00236f]">Foco no WhatsApp</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Sem ligações inconvenientes ou spams indesejados. Receba e compare de forma simples propostas customizadas diretamente no aplicativo que você mais usa.
          </p>
        </div>

        {/* Core Item 3 */}
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-teal-500/20 hover:bg-white transition-all duration-300 flex flex-col gap-4 shadow-sm group">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-all">
            <Handshake className="w-6 h-6 fill-teal-50" />
          </div>
          <h3 className="text-lg font-bold text-[#00236f]">Corretores Oficiais</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Conectamos você apenas com profissionais legítimos certificados e ativos perante a SUSEP, protegendo você contra empresas fraudulentas ou não autorizadas.
          </p>
        </div>

      </section>

    </div>
  );
}
