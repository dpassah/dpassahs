import React, { useEffect, useState } from 'react';
import { MapPin, ShieldCheck, ChevronRight, User, Lock, Building2 } from 'lucide-react';
import {
  listRecentActivities,
  listPublicOrgs,
  registerOrg,
  login as loginRequest,
  projectManagerLogin,
  adminListDelegationEvents,
} from '../services/api';
import { OrgSummary, RegistrationPayload } from '../types';
import { PublicLayout } from './PublicLayout';

export const Home: React.FC = () => {
  // --- Activités récentes ---
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(6);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

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
        setVisibleActivitiesCount(6);
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

  const getOrgTypeLabel = () => {
    switch (orgType) {
      case 'agence_onusienne':
        return 'Agence Onusienne';
      case 'organisation_internationale':
        return 'Organisation Internationale';
      case 'organisation_nationale':
        return 'Organisation Nationale';
      default:
        return '';
    }
  };

  const getActivityStatus = (status?: string | null, dateStr?: string | null) => {
    const value = (status || '').toLowerCase();

    // Si le statut est explicitement terminé
    if (value === 'completed' || value === 'terminé' || value === 'termine' || value === 'done') {
      return {
        label: 'Activité terminée',
        className: 'bg-green-50 text-green-700 border border-green-100',
      };
    }

    // Sinon, déduire à partir de la date :
    // - date passée  => terminée
    // - date future ou absente => à venir
    if (dateStr) {
      const activityDate = new Date(dateStr);
      const today = new Date();
      // Normaliser au jour (ignorer l'heure)
      activityDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (!Number.isNaN(activityDate.getTime()) && activityDate < today) {
        return {
          label: 'Activité terminée',
          className: 'bg-green-50 text-green-700 border border-green-100',
        };
      }
    }

    return {
      label: 'Activité à venir',
      className: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    };
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

  return (
    <PublicLayout>
      {/* Hero Section & Main Layout */}
      <div className="flex-grow flex flex-col">
         {/* Banner Area */}
         <div className="relative bg-gradient-to-br from-[#002060] to-[#004080] py-16 md:py-20 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
               <div className="grid lg:grid-cols-12 gap-12 items-start">
                  
                  {/* Left Column: Welcome Text */}
                  <div className="lg:col-span-7 text-white pt-4">
                     <span className="inline-block py-1 px-3 rounded bg-[#FECB00] text-[#002060] text-xs font-bold uppercase tracking-wider mb-4">
                       Portail Officiel
                     </span>
                     <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
                       Coordination Humanitaire <br/> <span className="text-[#FECB00]">Province de Sila</span>
                     </h1>
                     <p className="text-blue-100 text-lg leading-relaxed max-w-2xl border-l-4 border-[#C60C30] pl-4">
                       Plateforme centralisée pour l'enregistrement, le suivi et la coordination des interventions humanitaires.
                     </p>
                     
                     <div className="mt-8 flex flex-wrap gap-4">
                        <button className="px-6 py-3 bg-white text-[#002060] font-bold rounded shadow-lg hover:bg-gray-100 transition-all flex items-center">
                           En savoir plus
                           <ChevronRight className="ml-2 h-4 w-4" />
                        </button>
                        <button className="px-6 py-3 border border-white text-white font-medium rounded hover:bg-white/10 transition-all">
                           Consulter les rapports
                        </button>
                     </div>
                  </div>

                  {/* Right Column: Login/Register Card */}
                  <div className="lg:col-span-5 relative">
                     <div className="bg-white rounded-t-lg shadow-2xl border-t-4 border-[#FECB00] overflow-hidden">
                        {/* Tabs */}
                        <div className="flex bg-gray-50 border-b border-gray-200">
                           <button
                             onClick={() => setActiveTab('partner')}
                             className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide text-center transition-all ${
                               activeTab === 'partner' 
                               ? 'bg-white text-[#002060] border-t-2 border-[#002060] -mt-[2px]' 
                               : 'text-gray-500 hover:text-[#002060] hover:bg-gray-100'
                             }`}
                           >
                             Partenaires
                           </button>
                           <button
                             onClick={() => setActiveTab('project')}
                             className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide text-center transition-all ${
                               activeTab === 'project' 
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
                                          // show text for registration simplicity in demo, or keep password
                                          // sticking to password type
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

         {/* 4. Activities / News Section */}
         <section className="py-16 bg-gray-50 flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-4">
                  <div>
                     <h2 className="text-2xl font-bold text-[#002060]">Activités Récentes</h2>
                     <p className="text-sm text-gray-500 mt-1">Suivi des interventions sur le terrain</p>
                  </div>
                  <a href="/projets" className="text-sm font-semibold text-[#C60C30] hover:underline mt-2 md:mt-0">
                     Voir toutes les activités &rarr;
                  </a>
               </div>

               {recentLoading ? (
                  <div className="text-center py-10 text-gray-500">Chargement des données...</div>
               ) : recentError ? (
                  <div className="text-center py-10 text-red-500">{recentError}</div>
               ) : (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentActivities.length === 0 ? (
                        <p className="col-span-3 text-center text-gray-500 italic">Aucune activité récente.</p>
                      ) : (
                        recentActivities.slice(0, visibleActivitiesCount).map((a) => {
                          const isDelegation = a.orgId === 'DELEGATION';
                          const isExpanded = expandedActivityId === a.id;
                          return (
                            <div
                              key={a.id}
                              onClick={() =>
                                setExpandedActivityId((prev) => (prev === a.id ? null : a.id))
                              }
                              className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                            >
                              <div className="h-2 bg-[#002060] group-hover:bg-[#FECB00] transition-colors rounded-t"></div>
                              <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <span className="inline-block px-2 py-1 bg-blue-50 text-[#002060] text-[10px] font-bold uppercase rounded">
                                      {a.orgName || a.orgId}
                                    </span>
                                    {!isDelegation && a.govServices && (
                                      <div className="mt-1 text-[10px] text-gray-500">
                                        {a.govServices}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {a.date ? new Date(a.date).toLocaleDateString() : '-'}
                                  </span>
                                </div>

                                {isDelegation ? (
                                  <>
                                    <h3 className={`text-base font-bold text-gray-800 mb-1 group-hover:text-[#002060] transition-colors ${
                                      isExpanded ? '' : 'line-clamp-2'
                                    }`}>
                                      {a.title}
                                    </h3>
                                    <p className={`text-xs text-gray-600 mb-2 ${
                                      isExpanded ? '' : 'line-clamp-3'
                                    }`}>
                                      {a.description || 'Aucune description détaillée.'}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <h3 className={`text-base font-bold text-gray-800 mb-1 group-hover:text-[#002060] transition-colors ${
                                      isExpanded ? '' : 'line-clamp-2'
                                    }`}>
                                      Projet: {a.projectName || 'Projet non spécifié'}
                                    </h3>
                                    <p className={`text-xs font-semibold text-gray-700 mb-2 ${
                                      isExpanded ? '' : 'line-clamp-2'
                                    }`}>
                                      {a.title}
                                    </p>
                                  </>
                                )}

                                <div className="text-xs text-gray-500 space-y-1">
                                  <p className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-[#C60C30]" />
                                    {a.location || 'Sila'}
                                  </p>
                                  <p className="flex items-center">
                                    <ShieldCheck className="h-3 w-3 mr-1 text-gray-400" />
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getActivityStatus(
                                        a.status,
                                        a.date ?? null,
                                      ).className}`}
                                    >
                                      {getActivityStatus(a.status, a.date ?? null).label}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {recentActivities.length > visibleActivitiesCount && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleActivitiesCount((prev) =>
                              Math.min(prev + 3, recentActivities.length),
                            )
                          }
                          className="px-4 py-2 text-sm font-semibold text-[#002060] border border-[#002060] rounded hover:bg-[#002060] hover:text-white transition-colors"
                        >
                          Voir plus d'activités
                        </button>
                      </div>
                    )}
                  </>
               )}
            </div>
         </section>
      </div>
    </PublicLayout>
  );
};
