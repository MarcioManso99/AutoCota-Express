import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FormScreen } from "./components/FormScreen";
import { SuccessScreen } from "./components/SuccessScreen";
import { AdminPanel } from "./components/AdminPanel";
import { InstallPrompt } from "./components/InstallPrompt";
import { LeadForm } from "./types";

const INITIAL_FORM_STATE: LeadForm = {
  nomeCompleto: "",
  whatsapp: "",
  cidadeUf: "",
  modeloVeiculo: "",
  anoVeiculo: "",
  possuiSeguro: "Não",
  usaParaTrabalho: "Não",
  melhorHorario: "Manhã",
  observacoes: "",
  aceitaTermos: false
};

export default function App() {
  const [screen, setScreen] = useState<"form" | "success" | "admin">("form");
  const [leadData, setLeadData] = useState<LeadForm>(INITIAL_FORM_STATE);

  // Auto scroll to top on screen transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [screen]);

  const handleFormSubmit = (data: LeadForm) => {
    setLeadData(data);
    setScreen("success");
  };

  const handleReset = () => {
    setLeadData(INITIAL_FORM_STATE);
    setScreen("form");
  };

  const handleGoToForm = () => {
    setScreen("form");
  };

  const handleGoToAdmin = () => {
    setScreen("admin");
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-gray-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Shared branding Header */}
      <Header onGoToForm={handleGoToForm} showLinkOnly={screen === "success"} />

      {/* Main Container Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {screen === "form" ? (
          <FormScreen 
            onSubmit={handleFormSubmit} 
            initialData={leadData} 
          />
        ) : screen === "success" ? (
          <SuccessScreen 
            onReset={handleReset} 
            leadData={leadData} 
          />
        ) : (
          <AdminPanel 
            onClose={handleGoToForm}
          />
        )}
      </main>

      {/* Shared branding Footer */}
      <Footer onAdminClick={handleGoToAdmin} />

      {/* Floating PWA Install Prompt banner */}
      <InstallPrompt />
    </div>
  );
}
