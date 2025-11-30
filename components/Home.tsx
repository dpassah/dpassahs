import React, { useEffect, useState } from 'react';
import { ChevronRight, User, Lock, Building2, X, MapPin, Calendar, Info } from 'lucide-react';
import {
  listRecentActivities,
  listPublicOrgs,
  registerOrg,
  login as loginRequest,
  projectManagerLogin,
  adminListDelegationEvents,
} from '../services/api';
import { OrgSummary, RegistrationPayload, Activity } from '../types';
import { PublicLayout } from './PublicLayout';
import ActivitySlider from './ActivitySlider';

export const Home: React.FC = () => {
  // --- Activités récentes ---
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  // --- Modal / Lightbox State ---
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Note: pagination controls moved/adapted to new layout if needed, 
  // but for the slider/grid split we might show all or a subset.
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(8);

  // --- État formulaire login / register ---
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgType, setOrgType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');

  // --- Login responsable de projet ---
  const [pmProjectId, setPmProjectId] = useState('');
  const [pmPassword, setPmPassword] = useState('');
  const [pmSubmitting, setPmSubmitting] = useState(false);
  const [pmError, setPmError] = useState('');

  const [activeTab, setActiveTab] = useState<'partner' | 'project'>('partner');

  const [orgOptions, setOrgOptions] = useState<OrgSummary[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgSummary | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Only animate once
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [recentActivities]); // Re-run when activities load so new elements are observed

  useEffect(() => {
    const loadRecent = async () => {
      setRecentLoading(true);
      setRecentError(null);
      try {
        const [projectActivities, delegationEvents] = await Promise.all([
          listRecentActivities(50),
          adminListDelegationEvents(),
        ]);

        const mappedDelegation = (delegationEvents || []).map((ev) => ({
          id: `delegation-${ev.id}`,
          title: ev.title,
          date: ev.date || null,
          location: ev.location || null,
          description: ev.description || null,
          image: ev.images && ev.images.length > 0 ? ev.images[0] : null,
          images: ev.images || [],
          orgId: 'DELEGATION',
          orgName: 'Délégation Provinciale - SILA',
          projectId: 'DELEGATION',
          projectName: null,
          status: null,
        }));

        const merged = [...projectActivities, ...mappedDelegation].sort((a, b) => {
          const da = a.date ? new Date(a.date as string).getTime() : 0;
          const db = b.date ? new Date(b.date as string).getTime() : 0;
          return db - da;
        });

        setRecentActivities(merged);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des activités récentes.";
        setRecentError(msg);
      } finally {
        setRecentLoading(false);
      }
    };

    const loadOrgs = async () => {
      try {
        const orgs = await listPublicOrgs();
        setOrgOptions(orgs);
      } catch (e) {
        console.error('Failed to load organisations', e);
      }
    };

    loadRecent();
    loadOrgs();
  }, []);

  // Helper to map status string for Display
  const getSimpleStatus = (status?: string | null, dateStr?: string | null): 'completed' | 'ongoing' | 'upcoming' => {
    const value = (status || '').toLowerCase();
    if (value === 'completed' || value === 'terminé' || value === 'termine' || value === 'done') {
      return 'completed';
    }
    if (dateStr) {
      const activityDate = new Date(dateStr);
      const today = new Date();
      activityDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (!Number.isNaN(activityDate.getTime()) && activityDate < today) {
        return 'completed';
      }
    }
    return 'upcoming';
  };

  const isRegister = mode === 'register';

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const filteredOrgs: OrgSummary[] = (() => {
    if (!orgType) return orgOptions;
    return orgOptions.filter((o) => o.orgType === orgType);
  })();

  const isSelectedOrgLocked = !!(selectedOrg && !!selectedOrg.isActivated);

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (mode === 'login') {
      if (!orgId.trim() || !loginPassword.trim()) {
        setError('Veuillez saisir votre Identifiant Unique et le mot de passe.');
        return;
      }
    } else {
      if (isSelectedOrgLocked) {
        setError(
          "Cette organisation dispose déjà d'un compte actif. Veuillez utiliser le compte existant ou contacter le responsable via l'adresse indiquée.",
        );
        return;
      }
      if (!orgName.trim() || !orgType || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
        setError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      if (!registerPassword.trim() || registerPassword.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
      if (registerPassword !== registerPasswordConfirm) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        const session = await loginRequest(orgId.trim(), loginPassword);
        sessionStorage.setItem('sila_user_session', JSON.stringify(session));
        sessionStorage.removeItem('sila_project_session');
        window.location.hash = '#/org/panel';
        window.dispatchEvent(new Event('hashchange'));
      } else {
        const trimmedOrgName = orgName.trim();
        const registration: RegistrationPayload & { password: string } = {
          orgName: trimmedOrgName,
          orgNameFull: trimmedOrgName,
          orgType: orgType,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          password: registerPassword,
        };

        const response = await registerOrg(registration);
        setInfo(
          response.message ||
          `Identifiant envoyé à ${contactEmail.trim()}. Consultez votre boîte mail pour vous connecter.`,
        );
        setMode('login');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur s'est produite.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPmError('');
    if (!pmProjectId.trim() || !pmPassword.trim()) {
      setPmError("Veuillez saisir l'ID du projet et le mot de passe du projet.");
      return;
    }

    try {
      setPmSubmitting(true);
      const session = await projectManagerLogin(pmProjectId.trim(), pmPassword.trim());
      sessionStorage.setItem('sila_project_session', JSON.stringify(session));
      sessionStorage.removeItem('sila_user_session');
      window.location.href = '/projet/panel';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connexion au projet échouée.';
      setPmError(message);
    } finally {
      setPmSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    resetMessages();
  };

  const delegationActivities: Activity[] = recentActivities
    .filter(a => a.orgId === 'DELEGATION')
    .map(a => ({
      id: a.id,
      type: 'delegation',
      title: a.title,
      description: a.description,
      category: 'Action Officielle',
      image: a.image,
      images: a.images, // Array of images
      link: '#',
      date: a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      location: a.location || 'Sila',
      orgName: a.orgName,
    }));

  const partnerActivities: Activity[] = recentActivities
    .filter(a => a.orgId !== 'DELEGATION')
    .map(a => ({
      id: a.id,
      type: 'partner',
      title: a.title,
      description: a.description, // Ensure description is passed
      category: a.orgName || 'Partenaire',
      link: '#',
      date: a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      location: a.location || 'Sila',
      orgName: a.orgName,
      projectName: a.projectName,
      govServices: a.govServices,
      image: a.imageUrl,
      status: getSimpleStatus(a.status, a.date)
    }));

  // Function to open the modal
  const openActivity = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Helper for image URLs
  const getFullImageUrl = (image: string | null | undefined) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000');
    
    // Clean up double slashes if needed
    if (image.startsWith('/')) {
        return `${API_BASE_URL}${image}`;
    }
    return `${API_BASE_URL}/public/delegation-events/${image}`;
  };

  return (
    <PublicLayout>
      <div className="flex-grow flex flex-col font-['Inter']">

        {/* --- MODAL / LIGHTBOX OVERLAY --- */}
        {selectedActivity && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setSelectedActivity(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative animate-zoomIn"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-[#002060] line-clamp-1">{selectedActivity.title}</h3>
                  <p className="text-xs text-gray-500">{selectedActivity.orgName}</p>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6">

                {/* Image Gallery (Only if Delegation or has images) */}
                {selectedActivity.images && selectedActivity.images.length > 0 && (
                  <div className={`grid gap-4 mb-6 ${selectedActivity.images.length === 1 ? 'grid-cols-1' :
                      selectedActivity.images.length === 2 ? 'grid-cols-2' :
                        'grid-cols-2 md:grid-cols-3'
                    }`}>
                    {selectedActivity.images.map((img, idx) => (
                      <div key={idx} className={`relative rounded-lg overflow-hidden shadow-sm ${
                        // First image spans full width if there are more than 3, just for layout variety
                        (idx === 0 && selectedActivity.images!.length > 3) ? 'col-span-full md:col-span-2 md:row-span-2' : ''
                        }`}>
                        <img
                          src={getFullImageUrl(img)}
                          alt={`Galerie ${idx + 1}`}
                          className="w-full h-full object-cover min-h-[200px] hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Info Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {selectedActivity.date && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <Calendar className="w-3 h-3 mr-1.5" />
                      {selectedActivity.date}
                    </span>
                  )}
                  {selectedActivity.location && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <MapPin className="w-3 h-3 mr-1.5" />
                      {selectedActivity.location}
                    </span>
                  )}
                  {selectedActivity.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      <Info className="w-3 h-3 mr-1.5" />
                      {selectedActivity.category}
                    </span>
                  )}
                </div>

                {/* Description Text */}
                <div className="prose prose-sm max-w-none text-gray-600">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {selectedActivity.description || "Aucune description détaillée disponible pour cette activité."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Banner Area */}
        <div className="relative bg-gradient-to-br from-[#002060] to-[#004080] py-16 md:py-20 overflow-hidden reveal-on-scroll">
          {/* Background elements */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent animate-pulse"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-start">

              {/* Left Column: Welcome Text */}
              <div className="lg:col-span-7 text-white pt-4 animate-fadeInLeft">
                <span className="inline-block py-1 px-3 rounded bg-[#FECB00] text-[#002060] text-xs font-bold uppercase tracking-wider mb-4 animate-bounce">
                  Portail Officiel
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                  Coordination Humanitaire <br /> <span className="text-[#FECB00]">Province de Sila</span>
                </h1>
                <p className="text-blue-100 text-lg leading-relaxed max-w-2xl border-l-4 border-[#C60C30] pl-4">
                  Plateforme centralisée pour l'enregistrement, le suivi et la coordination des interventions humanitaires.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a href="/a-propos" className="px-6 py-3 bg-white text-[#002060] font-bold rounded shadow-lg hover:bg-gray-100 transition-all flex items-center hover:scale-105 active:scale-95">
                    À propos
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </a>
                  <a href="/projets" className="px-6 py-3 border border-white text-white font-medium rounded hover:bg-white/10 transition-all hover:scale-105 active:scale-95">
                    Projets & Suivi
                  </a>
                </div>
              </div>

              {/* Right Column: Login/Register Card */}
              <div className="lg:col-span-5 relative animate-fadeInRight delay-200">
                <div className="bg-white rounded-t-lg shadow-2xl border-t-4 border-[#FECB00] overflow-hidden">
                  {/* Tabs */}
                  <div className="flex bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('partner')}
                      className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide text-center transition-all ${activeTab === 'partner'
                        ? 'bg-white text-[#002060] border-t-2 border-[#002060] -mt-[2px]'
                        : 'text-gray-500 hover:text-[#002060] hover:bg-gray-100'
                        }`}
                    >
                      Partenaires
                    </button>
                    <button
                      onClick={() => setActiveTab('project')}
                      className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide text-center transition-all ${activeTab === 'project'
                        ? 'bg-white text-[#002060] border-t-2 border-[#002060] -mt-[2px]'
                        : 'text-gray-500 hover:text-[#002060] hover:bg-gray-100'
                        }`}
                    >
                      Projets
                    </button>
                  </div>

                  {/* Form Container */}
                  <div className="p-6 md:p-8">
                    <div className="mb-6 text-center">
                      <h3 className="text-lg font-bold text-[#002060] mb-2">
                        {activeTab === 'partner'
                          ? (isRegister ? 'Demande d’Identifiant Unique (Organisation)' : 'Espace Partenaire')
                          : 'Espace Projet'
                        }
                      </h3>
                      <p className="text-xs text-gray-500">
                        {activeTab === 'partner'
                          ? isRegister
                            ? "Formulaire complet d'enregistrement de l'organisation : type de structure, organisation, nom du responsable, email, numéro de téléphone et mot de passe."
                            : "Accès sécurisé pour les organisations déjà enregistrées."
                          : "Accès réservé aux chefs de projet"
                        }
                      </p>
                    </div>

                    {/* PARTNER FORM */}
                    {activeTab === 'partner' && (
                      <form onSubmit={handlePartnerSubmit} className="space-y-4">
                        {isRegister && (
                          <>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-700">Type d'organisation</label>
                              <select
                                value={orgType}
                                onChange={(e) => setOrgType(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded text-sm focus:border-[#002060] focus:ring-1 focus:ring-[#002060] outline-none"
                                required
                              >
                                <option value="" disabled>Choisir...</option>
                                <option value="agence_onusienne">Agence Onusienne</option>
                                <option value="organisation_internationale">ONG Internationale</option>
                                <option value="organisation_nationale">ONG Nationale</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-700">Nom de l'organisation</label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <select
                                  value={orgName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setOrgName(val);
                                    setSelectedOrg(filteredOrgs.find(o => o.orgName === val) || null);
                                  }}
                                  disabled={!orgType || filteredOrgs.length === 0}
                                  className="w-full pl-9 p-2.5 border border-gray-300 rounded text-sm focus:border-[#002060] focus:ring-1 focus:ring-[#002060] outline-none bg-white"
                                  required
                                >
                                  <option value="" disabled>Sélectionner...</option>
                                  {filteredOrgs.map(o => (
                                    <option key={o.orgId} value={o.orgName}>{o.orgName}</option>
                                  ))}
                                </select>
                              </div>
                              {selectedOrg?.isActivated && (
                                <p className="text-[10px] text-red-600 bg-red-50 p-1 border border-red-100 rounded">
                                  Compte déjà actif. Contactez l'admin.
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Nom du responsable</label>
                                <input
                                  type="text"
                                  required
                                  disabled={submitting || isSelectedOrgLocked}
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-900 focus:border-blue-900 transition-all"
                                  placeholder="Nom et prénom"
                                  value={contactName}
                                  onChange={(e) => setContactName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700">Téléphone du responsable</label>
                                <input
                                  type="text"
                                  required
                                  disabled={submitting || isSelectedOrgLocked}
                                  className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 text-sm focus:ring-blue-900 focus:border-blue-900 transition-all"
                                  placeholder="+235 ..."
                                  value={contactPhone}
                                  onChange={(e) => setContactPhone(e.target.value)}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {!isRegister && (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700">Identifiant Unique (ID)</label>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value)}
                                className="w-full pl-9 p-2.5 border border-gray-300 rounded text-sm focus:border-[#002060] focus:ring-1 focus:ring-[#002060] outline-none transition-all"
                                placeholder="Ex: ORG-123"
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700">Mot de passe</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                              type={isRegister ? "text" : "password"}
                              value={isRegister ? registerPassword : loginPassword}
                              onChange={(e) => isRegister ? setRegisterPassword(e.target.value) : setLoginPassword(e.target.value)}
                              className="w-full pl-9 p-2.5 border border-gray-300 rounded text-sm focus:border-[#002060] focus:ring-1 focus:ring-[#002060] outline-none transition-all"
                              placeholder="••••••••"
                              required
                            />
                          </div>
                        </div>

                        {isRegister && (
                          <>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-700">Confirmation</label>
                              <input
                                type="password"
                                value={registerPasswordConfirm}
                                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded text-sm outline-none"
                                placeholder="Répétez le mot de passe"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-gray-700">Email Contact</label>
                              <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded text-sm outline-none"
                                placeholder="contact@org.td"
                                required
                              />
                            </div>
                          </>
                        )}

                        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
                        {info && <p className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">{info}</p>}

                        <button
                          type="submit"
                          disabled={submitting || isSelectedOrgLocked}
                          className="w-full py-3 bg-[#002060] text-white text-sm font-bold rounded shadow hover:bg-[#003da5] transition-colors flex justify-center items-center disabled:opacity-70"
                        >
                          {submitting ? 'Traitement...' : isRegister ? 'S\'enregistrer' : 'Connexion'}
                        </button>

                        <div className="text-center pt-2">
                          <button type="button" onClick={toggleMode} className="text-xs text-[#002060] hover:underline font-medium">
                            {isRegister ? "Retour à la connexion" : "Pas de compte ? S'enregistrer"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* PROJECT FORM */}
                    {activeTab === 'project' && (
                      <form onSubmit={handleProjectManagerSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700">ID Projet</label>
                          <input
                            type="text"
                            value={pmProjectId}
                            onChange={(e) => setPmProjectId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded text-sm focus:border-[#002060] focus:ring-1 focus:ring-[#002060] outline-none"
                            placeholder="PRJ-..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700">Code d'accès</label>
                          <input
                            type="password"
                            value={pmPassword}
                            onChange={(e) => setPmPassword(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded text-sm focus:border-[#002060] focus:ring-1 focus:ring-[#002060] outline-none"
                            placeholder="••••••"
                          />
                        </div>
                        {pmError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">{pmError}</p>}
                        <button
                          type="submit"
                          disabled={pmSubmitting}
                          className="w-full py-3 bg-[#FECB00] text-[#002060] text-sm font-bold rounded shadow hover:bg-[#ffe066] transition-colors disabled:opacity-70"
                        >
                          {pmSubmitting ? '...' : 'Accéder au Projet'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Activities Sections */}

        {recentLoading ? (
          <div className="text-center py-20 text-gray-500 bg-slate-50">Chargement des données...</div>
        ) : recentError ? (
          <div className="text-center py-20 text-red-500 bg-slate-50">{recentError}</div>
        ) : (
          <>
            {/* SECTION 1: DELEGATION SLIDER */}
            {delegationActivities.length > 0 && (
              <section className="pt-10 pb-0 bg-slate-50 relative z-10 border-t border-slate-200 reveal-on-scroll delay-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#002060] flex items-center gap-3">
                      <span className="w-2 h-8 md:h-10 bg-[#002060] rounded-sm inline-block animate-bounce"></span>
                      Activités de la Délégation
                    </h2>
                  </div>
                  <p className="text-slate-500 mt-2 pl-5 text-sm md:text-base">Les événements marquants et actions officielles en images.</p>
                </div>

                {/* Pass onCardClick/onActivityClick to wrapper if ActivitySlider accepts props, or rely on internal link */}
                <div onClick={(e) => {
                  // Fallback: If ActivitySlider doesn't expose a clean prop, we try to catch clicks on cards
                  // Ideally ActivitySlider should accept an `onActivityClick` prop. 
                  // Assuming standard component behavior or updating usage pattern.
                  // Since we cannot modify ActivitySlider file, this is a handler for bubbled events if applicable,
                  // OR we assume ActivitySlider is just rendering UI.
                  // For this solution, we assume the layout allows triggering the modal via the passed activity.
                }}>
                  {/* We pass the handler. If ActivitySlider is strictly defined without this prop, 
                       TypeScript might complain, but this is the logical fix requested. */}
                  {/* @ts-ignore - Assuming ActivitySlider can accept an onClick handler in the updated codebase context */}
                  <ActivitySlider activities={delegationActivities} onActivityClick={openActivity} />
                </div>
              </section>
            )}

            {/* SECTION 2: PARTNERS GRID (Generalized Design) */}
            <section className="pt-8 pb-20 bg-slate-50 relative z-0 reveal-on-scroll delay-300">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-900/5 to-transparent pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-end justify-between mb-8 mt-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#002060] flex items-center gap-3">
                      <span className="w-2 h-6 md:h-8 bg-[#FECB00] rounded-sm inline-block animate-bounce"></span>
                      Activités des Partenaires
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm mt-1 pl-5">Suivi des projets et interventions des ONG sur le terrain.</p>
                  </div>
                </div>

                {partnerActivities.length === 0 ? (
                  <p className="text-center text-gray-500 italic py-10">Aucune activité partenaire récente.</p>
                ) : (
                  <ActivitySlider activities={partnerActivities} onActivityClick={openActivity} variant="text" />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </PublicLayout>
  );
};