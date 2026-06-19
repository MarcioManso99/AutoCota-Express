import React, { useState, useEffect } from "react";
import { Download, X, Share, ExternalLink, Info } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isWhatsAppOrInApp, setIsWhatsAppOrInApp] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iosDetection = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosDetection);

    // Detect WhatsApp or generic social WebView
    const ua = navigator.userAgent || "";
    const whatsAppDetection = /WhatsApp/i.test(ua) || ua.includes("WhatsApp");
    const otherInApp = /FBAN|FBAV|Instagram|FB_IAB|Messenger|LinkedInApp/i.test(ua);
    setIsWhatsAppOrInApp(whatsAppDetection || otherInApp);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser from automatically showing the bar
      e.preventDefault();
      // Store the event to execute later
      setDeferredPrompt(e);
      // Show custom overlay
      setShowPrompt(true);
    };

    const forceOpenGuide = () => {
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("open-pwa-guide", forceOpenGuide);

    // Check if running inside standalone mode (PWA active)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    
    if (isStandalone) {
      setShowPrompt(false);
    } else {
      // Show the guide after 2.5 seconds if not closed in this session
      const hasClosedPrompt = sessionStorage.getItem("autocota_pwa_prompt_closed");
      if (!hasClosedPrompt) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-guide", forceOpenGuide);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("Usuário aceitou instalar o PWA");
      } else {
        console.log("Usuário cancelou a instalação");
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    });
  };

  const handleClose = () => {
    sessionStorage.setItem("autocota_pwa_prompt_closed", "true");
    setShowPrompt(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copiado! Agora abra o Google Chrome ou Safari e cole o link para instalar sem marcas no ícone.");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 text-white p-5 rounded-2xl shadow-2xl border border-teal-500/40 flex flex-col gap-3 animate-slide-up backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20 shrink-0 select-none text-xl">
            🚗
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Instalar Aplicativo Real</h4>
            <p className="text-xs text-slate-300">Tenha o ícone limpo (sem o logo de navegador ou WhatsApp) na tela inicial!</p>
          </div>
        </div>
        <button 
          onClick={handleClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition duration-150"
          aria-label="Ignorar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isWhatsAppOrInApp ? (
        // EXCLUSIVE WHATSAPP / IN-APP WEBVIEW RESOLUTION GUIDE
        <div className="text-xs bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-slate-200 leading-relaxed flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Info className="w-4 h-4 shrink-0" />
            <span>Remover o "W" ou o ícone do navegador:</span>
          </div>
          
          <p className="text-[11px] text-slate-300">
            Você abriu o link direto pelo <strong>WhatsApp</strong>. Por isso o celular cria um atalho comum com o símbolo "W" no canto do ícone, em vez de instalar o aplicativo real.
          </p>

          <div className="border-t border-slate-800/85 pt-2 flex flex-col gap-2">
            <span className="font-semibold text-teal-400">Siga este passo a passo simples:</span>
            
            {isIOS ? (
              <div className="space-y-1.5 text-slate-300">
                <p>
                  1. Toque no ícone da <strong>bússola</strong> (ou de navegador) no canto inferior direito da tela atual do WhatsApp para abri-lo no Safari externo.
                </p>
                <p>
                  2. No Safari, toque no botão de <strong>Compartilhar</strong> <Share className="inline w-3 h-3 text-white.mx-0.5" />.
                </p>
                <p>
                  3. Selecione <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 text-slate-300">
                <p>
                  1. No topo direito da tela atual do WhatsApp, toque nos <strong>três pontinhos</strong>.
                </p>
                <p>
                  2. Escolha <strong>"Abrir no Chrome"</strong> (ou "Abrir no navegador").
                </p>
                <p>
                  3. Quando o site abrir no Chrome, toque em <strong>"Instalar aplicativo"</strong> no aviso que surgirá na tela!
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-1 border-t border-slate-800/85 pt-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-[11px] flex items-center gap-1 transition duration-150"
            >
              <ExternalLink className="w-3 h-3" />
              Copiar Link
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg text-[11px] transition duration-150"
            >
              Entendi
            </button>
          </div>
        </div>
      ) : isIOS ? (
        // iOS Safari Instructions
        <div className="text-xs bg-slate-800/80 p-2.5 rounded-xl text-slate-300 border border-slate-700 leading-relaxed flex flex-col gap-1.5 animate-fade-in">
          <div className="flex items-center gap-1.5 text-teal-400 font-semibold">
            <Share className="w-3.5 h-3.5" />
            <span>Como instalar no iPhone (Safari):</span>
          </div>
          <p>
            1. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima <Share className="inline w-3 h-3 text-white mx-0.5" /> na barra inferior do Safari).
          </p>
          <p>
            2. Toque em <strong>"Adicionar à Tela de Início"</strong> para tê-lo sem o ícone do navegador.
          </p>
        </div>
      ) : (
        // Android / Chrome Install Flow
        <div className="flex flex-col gap-2 mt-0.5">
          {deferredPrompt ? (
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-slate-400 hover:text-white transition duration-200"
              >
                Depois
              </button>
              <button
                onClick={handleInstallClick}
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition duration-200 flex items-center gap-1.5 shadow-lg shadow-teal-500/15"
              >
                <Download className="w-4 h-4" />
                Instalar Aplicativo
              </button>
            </div>
          ) : (
            // Show clear manual guide for solving the browser shortcut icon badge
            <div className="text-xs bg-slate-800/80 p-2.5 rounded-xl text-slate-300 border border-slate-700 leading-relaxed flex flex-col gap-1.5 animate-fade-in">
              <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-0.5">
                <span className="text-sm">💡</span>
                <span>Como instalar como Aplicativo Real (Sem o ícone de navegador):</span>
              </div>
              <p>
                1. Toque nos <strong>três pontinhos</strong> (menu) do Chrome no canto superior direito.
              </p>
              <p>
                2. Selecione a opção dedicada <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela de início"</strong>.
              </p>
              <p className="text-[10px] text-slate-400 mt-1 italic border-t border-slate-700/50 pt-1">
                Ao instalar diretamente do menu do Google Chrome, ele remove automaticamente qualquer marca ou selo de navegador do ícone!
              </p>
              <div className="flex justify-end gap-2 mt-1">
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition duration-200 text-xs"
                >
                  Entendi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
