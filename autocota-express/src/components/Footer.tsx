import React, { useState } from "react";
import { Car, ShieldAlert, Sparkles, X } from "lucide-react";

interface FooterProps {
  onAdminClick?: () => void;
}

export function Footer({ onAdminClick }: FooterProps) {
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2" id="footer-logo">
              <Car className="w-6 h-6 text-[#00236f]" />
              <span className="text-lg font-bold text-[#00236f]">
                AutoCota <span className="text-teal-600">Express</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-md">
              Facilitando sua busca pela melhor proteção automotiva, conectando você com agilidade e total segurança a corretores certificados.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-medium items-center">
            <button
              onClick={() => setActiveModal("terms")}
              className="text-gray-600 hover:text-[#00236f] transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>
            <button
              onClick={() => setActiveModal("privacy")}
              className="text-gray-600 hover:text-[#00236f] transition-colors cursor-pointer"
            >
              Política de Privacidade
            </button>
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="text-teal-600 hover:text-[#00236f] transition-colors cursor-pointer font-semibold sm:border-l sm:border-gray-200 sm:pl-6"
                id="footer-admin-link"
              >
                Painel Admin
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-gray-500">
          <p>© {currentYear} AutoCota Express. Todos os direitos reservados.</p>
          <p className="max-w-xl italic text-left md:text-right leading-relaxed">
            <span className="font-bold text-gray-700 not-italic">Aviso Legal: </span>
            Não somos uma corretora de seguros, mas sim um facilitador de orçamentos e captação de leads. A análise, cotação, proposta comercial e emissão da apólice são efetuadas por parceiros habilitados e certificados à SUSEP.
          </p>
        </div>
      </div>

      {/* Interactive Modal for Terms of Use and Privacy Policy */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-100 animate-slide-up">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {activeModal === "terms" ? (
                  <>
                    <Sparkles className="w-5 h-5 text-[#00236f]" />
                    Termos de Uso - AutoCota Express
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5 text-teal-600" />
                    Política de Privacidade (LGPD)
                  </>
                )}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Save and close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-gray-600 leading-relaxed">
              {activeModal === "terms" ? (
                <>
                  <p className="font-semibold text-gray-800">1. Aceite dos Termos</p>
                  <p>
                    Ao utilizar a plataforma AutoCota Express, você concorda expressamente em se submeter aos presentes Termos de Uso. Nosso serviço consiste exclusivamente em facilitar o contato e encaminhamento de suas informações básicas para corretores habilitados.
                  </p>
                  <p className="font-semibold text-gray-800">2. Limitação de Responsabilidade</p>
                  <p>
                    A AutoCota Express não é uma seguradora, nem uma corretora de seguros autorizada direta. Não emitimos apólices de seguro, não definimos prêmios e não garantimos a aprovação ou condições comerciais apresentadas. Todo o relacionamento de cotação e contratação ocorrerá de forma direta com o corretor parceiro certificado.
                  </p>
                  <p className="font-semibold text-gray-800">3. Comunicação</p>
                  <p>
                    Como parte do nosso serviço de comodidade, o corretor parceiro entrará em contato preferencialmente através do aplicativo de mensagens WhatsApp, de ligações ou de e-mail com ofertas baseadas puramente nos dados fornecidos por você neste pré-cadastro.
                  </p>
                  <p className="font-semibold text-gray-800">4. Propriedade Intelectual</p>
                  <p>
                    O conteúdo e design da plataforma são protegidos por direitos autorais. Qualquer uso indevido da marca AutoCota Express ou reprodução das telas será passível de sanções legais.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-800">1. Compromisso com a LGPD</p>
                  <p>
                    A AutoCota Express respeita integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018). Suas informações pessoais são tratadas com sigilo e segurança.
                  </p>
                  <p className="font-semibold text-gray-800">2. Coleta de Dados e Finalidade</p>
                  <p>
                    Coletamos dados estritamente necessários para permitir a elaboração de simulações personalizadas de seguro auto. Os dados coletados incluem: Nome Completo, WhatsApp, Cidade/UF, Modelo, Ano do Veículo e preferências básicas de seguro.
                  </p>
                  <p className="font-semibold text-gray-800">3. Compartilhamento Seguro</p>
                  <p>
                    Ao marcar a caixa de consentimento e clicar em "Enviar solicitação", você autoriza de forma livre e inequívoca o compartilhamento dos dados preenchidos com corretores de seguros parceiros legalmente constituídos e devidamente habilitados junto à SUSEP. Eles usarão estes dados única e exclusivamente para formular e apresentar propostas de seguros para o seu veículo.
                  </p>
                  <p className="font-semibold text-gray-800">4. Seus Direitos</p>
                  <p>
                    Qualquer usuário pode solicitar formalmente a exclusão permanente de seus dados coletados da nossa base a qualquer momento através dos canais de suporte, bem como revogar o consentimento outorgado.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-[#00236f] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3a8a] transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
