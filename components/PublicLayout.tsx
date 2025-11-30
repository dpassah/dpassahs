import React, { useEffect, useState } from 'react';
import { Phone, Mail, Facebook, Globe, Calendar, MapPin, Menu, X } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  adminHeader?: React.ReactNode;
  adminTabs?: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, adminHeader, adminTabs }) => {
  const [hasOrgSession, setHasOrgSession] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('sila_user_session') : null;
      setHasOrgSession(!!raw);

      const handleStorage = () => {
        const next = sessionStorage.getItem('sila_user_session');
        setHasOrgSession(!!next);
      };

      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    } catch {
      setHasOrgSession(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 flex flex-col">
      {/* 1. Top Bar (Contact Info) */}
      <div className="bg-[#002060] text-white py-2 text-xs border-b border-[#001540] animate-fadeInDown relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center hover:text-yellow-400 transition-colors duration-300 hover:scale-105 transform origin-left cursor-default">
              <Phone className="h-3 w-3 mr-1" />
              <span>+235 66 00 00 00</span>
            </div>
            <div className="flex items-center hover:text-yellow-400 transition-colors duration-300 hover:scale-105 transform origin-left cursor-default">
              <Mail className="h-3 w-3 mr-1" />
              <span>dpassahs@gmail.com</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center text-blue-200 hover:text-white transition-colors duration-300">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <div className="flex space-x-2 border-l border-blue-800 pl-4">
              <a
                href="https://www.facebook.com/share/1A2M37Xd3o/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex hover:scale-125 transition-transform duration-300"
              >
                <Facebook className="h-3 w-3 hover:text-yellow-400 cursor-pointer" />
              </a>
              <div className="inline-flex hover:scale-125 transition-transform duration-300">
                <Globe className="h-3 w-3 hover:text-yellow-400 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Header */}
      <header className="bg-white py-4 relative shadow-sm z-40">
        {/* Tchad Flag Strip */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002664] via-[#FECB00] to-[#C60C30] animate-pulse" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Text Left */}
          <div className="flex items-center gap-3 animate-fadeInLeft delay-100">
            <img
              src="/logo-sila.png"
              alt="Logo Sila"
              className="h-16 w-16 object-contain hover:rotate-3 transition-transform duration-500"
            />
            <div className="text-center md:text-left">
              <h1 className="text-sm font-bold text-gray-500 uppercase tracking-widest">République du Tchad</h1>
              <h2 className="text-xs text-[#C60C30] font-bold uppercase tracking-wider mb-1">Unité - Travail - Progrès</h2>
              <h3 className="text-lg font-extrabold text-[#002060] leading-none hover:text-[#C60C30] transition-colors duration-300">PROVINCE DE SILA</h3>
            </div>
          </div>

          {/* Ministry Title Right */}
          <div className="hidden md:block text-right animate-fadeInRight delay-100">
            <h4 className="text-sm font-bold text-[#002060] max-w-md uppercase leading-tight hover:scale-105 transition-transform duration-500 origin-right">
              Délégation Provinciale de l'Action Sociale,<br /> de la Solidarité et des Affaires Humanitaires
            </h4>
          </div>
        </div>
      </header>

      {/* 3. Navigation Bar (public) */}
      <nav className="bg-[#002060] text-white shadow-md sticky top-0 z-50 border-t border-blue-900 animate-fadeInDown delay-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            
            {/* Desktop Menu (Original) */}
            <div className="hidden md:flex items-center overflow-x-auto whitespace-nowrap gap-4 w-full">
              <div className="flex items-center overflow-x-auto whitespace-nowrap">
                <a href="/" className="px-4 py-3 bg-[#003da5] font-semibold text-sm hover:bg-[#C60C30] transition-all duration-300 border-r border-blue-800 hover:tracking-wide">
                  ACCUEIL
                </a>
                <a href="/a-propos" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] transition-all duration-300 border-r border-blue-800 hover:-translate-y-0.5">
                  A PROPOS
                </a>
                <a href="/partenaires" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] transition-all duration-300 border-r border-blue-800 hover:-translate-y-0.5">
                  NOS PARTENAIRES
                </a>
                {hasOrgSession && (
                  <a href="/#/org/panel" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] transition-all duration-300 border-r border-blue-800 hover:-translate-y-0.5">
                    DUDSHARD PARENAIRE
                  </a>
                )}
                <a href="/projets" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] transition-all duration-300 border-r border-blue-800 hover:-translate-y-0.5">
                  PROJETS & SUIVI
                </a>
                <a href="/statistiques" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] transition-all duration-300 border-r border-blue-800 hover:-translate-y-0.5">
                  STATISTIQUES
                </a>
                <a href="/contact" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] transition-all duration-300 hover:-translate-y-0.5">
                  CONTACT
                </a>
              </div>
            </div>

            {/* Mobile Header & Toggle */}
            <div className="md:hidden flex items-center justify-between w-full">
              <span className="font-bold text-sm tracking-widest pl-2">MENU</span>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-white hover:bg-blue-800 rounded-md transition-colors"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#001540] border-t border-blue-800 animate-fadeInDown">
            <div className="flex flex-col">
              <a href="/" className="px-4 py-3 bg-[#003da5] font-semibold text-sm hover:bg-[#C60C30] border-b border-blue-900">
                ACCUEIL
              </a>
              <a href="/a-propos" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] border-b border-blue-900">
                A PROPOS
              </a>
              <a href="/partenaires" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] border-b border-blue-900">
                NOS PARTENAIRES
              </a>
              {hasOrgSession && (
                <a href="/#/org/panel" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] border-b border-blue-900">
                  DUDSHARD PARENAIRE
                </a>
              )}
              <a href="/projets" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] border-b border-blue-900">
                PROJETS & SUIVI
              </a>
              <a href="/statistiques" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] border-b border-blue-900">
                STATISTIQUES
              </a>
              <a href="/contact" className="px-4 py-3 font-medium text-sm hover:bg-[#FECB00] hover:text-[#002060] border-b border-blue-900">
                CONTACT
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* 3bis. Admin Tabs Bar (only when adminTabs provided) */}
      {adminTabs && (
        <div className="bg-[#001b4a] text-white shadow-sm border-b border-blue-900/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 overflow-x-auto whitespace-nowrap flex items-stretch gap-2">
            {adminTabs}
          </div>
        </div>
      )}

      {/* Admin header band (for admin panel) */}
      {adminHeader && (
        <div className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {adminHeader}
          </div>
        </div>
      )}

      {/* Main content slot */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>

      {/* 6. Footer */}
      <footer className="bg-[#1a1a1a] text-gray-300 border-t-4 border-[#C60C30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Col 1 */}
            <div>
              <h5 className="text-white font-bold uppercase tracking-wider mb-4 border-l-2 border-[#FECB00] pl-2">
                À propos
              </h5>
              <p className="text-xs leading-relaxed text-gray-400">
                Ce portail est une initiative de la Délégation Provinciale de l'Action Sociale pour améliorer la transparence et la coordination de l'aide humanitaire dans la province de Sila.
              </p>
              <div className="mt-4 flex space-x-3">
                <a
                  href="https://www.facebook.com/share/1A2M37Xd3o/"
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 bg-gray-800 rounded flex items-center justify-center hover:bg-[#002060] transition-colors cursor-pointer"
                >
                  <Facebook size={16} />
                </a>
                <div className="h-8 w-8 bg-gray-800 rounded flex items-center justify-center hover:bg-[#002060] transition-colors cursor-pointer"><Globe size={16} /></div>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="text-white font-bold uppercase tracking-wider mb-4 border-l-2 border-[#FECB00] pl-2">
                Liens Rapides
              </h5>
              <ul className="text-xs space-y-2">
                <li><a href="/" className="hover:text-[#FECB00] transition-colors font-semibold">ACCUEIL</a></li>
                <li><a href="/a-propos" className="hover:text-[#FECB00] transition-colors">A PROPOS</a></li>
                <li><a href="/partenaires" className="hover:text-[#FECB00] transition-colors">NOS PARTENAIRES</a></li>
                <li><a href="/projets" className="hover:text-[#FECB00] transition-colors">PROJETS &amp; SUIVI</a></li>
                <li><a href="/statistiques" className="hover:text-[#FECB00] transition-colors">STATISTIQUES</a></li>
                <li><a href="/contact" className="hover:text-[#FECB00] transition-colors">CONTACT</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="text-white font-bold uppercase tracking-wider mb-4 border-l-2 border-[#FECB00] pl-2">
                Contact
              </h5>
              <ul className="text-xs space-y-2 text-gray-400">
                <li className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-[#C60C30] shrink-0" />
                  <span>Goz Beïda, Province de Sila<br />République du Tchad</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-[#C60C30] shrink-0" />
                  <span>dpassahs@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500">
            <p>&copy; 2025 Direction des Affaires Humanitaires - Sila. Tous droits réservés.</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 md:mt-0">
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/admin';
                }}
                className="hover:text-white font-semibold"
              >
                Accès Administration (DPASSAHS)
              </a>
              <span className="hidden md:inline text-gray-700">|</span>
              <a href="#/mentions" className="hover:text-white">Mentions légales</a>
              <a href="#/confidentialite" className="hover:text-white">Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
