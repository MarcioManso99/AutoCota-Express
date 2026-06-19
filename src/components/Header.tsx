import React from "react";
import { Car, Menu, Globe, ShieldCheck } from "lucide-react";

interface HeaderProps {
  onGoToForm: () => void;
  showLinkOnly?: boolean;
}

export function Header({ onGoToForm, showLinkOnly = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={onGoToForm} 
          className="flex items-center gap-2 cursor-pointer group"
          id="header-logo"
        >
          <div className="p-2 bg-[#00236f]/10 rounded-lg group-hover:bg-[#00236f]/20 transition-all">
            <Car className="w-6 h-6 text-[#00236f]" />
          </div>
          <span className="text-xl font-bold text-[#00236f] tracking-tight">
            AutoCota <span className="font-medium text-teal-600">Express</span>
          </span>
        </div>

        {/* Navigation */}
        {!showLinkOnly && (
          <>
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={onGoToForm}
                className="text-gray-600 hover:text-[#00236f] text-sm font-medium transition-colors"
              >
                Início
              </button>
              <a 
                href="#como-funciona" 
                className="text-gray-600 hover:text-[#00236f] text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Como Funciona
              </a>
              <a 
                href="#seguranca" 
                className="text-gray-600 hover:text-[#00236f] text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("seguranca")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Segurança
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={onGoToForm}
                className="bg-[#00236f] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#1e3a8a] transition-all active:scale-95 shadow-sm shadow-blue-900/10"
              >
                Solicitar Cotação
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-[#00236f] hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && !showLinkOnly && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3 space-y-2 animate-fade-in">
          <button 
            onClick={() => {
              onGoToForm();
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
          >
            Início
          </button>
          <a 
            href="#como-funciona" 
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
          >
            Como Funciona
          </a>
          <a 
            href="#seguranca" 
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              document.getElementById("seguranca")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
          >
            Segurança
          </a>
          <button
            onClick={() => {
              onGoToForm();
              setMobileMenuOpen(false);
            }}
            className="w-full bg-[#00236f] text-white text-center py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1e3a8a]"
          >
            Solicitar Cotação
          </button>
        </div>
      )}
    </header>
  );
}
