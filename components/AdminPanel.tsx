import React, { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Search,
  RefreshCw,
  Download,
  Plus,
  Save,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  adminListOrgs,
  adminCreateOrg,
  adminDisableOrg,
  adminEnableOrg,
  adminResetOrgPassword,
  adminListDelegationEvents,
  adminCreateDelegationEvent,
  DelegationEvent,
  adminSaveProvinceMonthlyStats,
  adminGetProvinceStructuralStats,
  adminSaveProvinceStructuralStats,
  adminListProvinceMonthlyStats,
  ProvinceMonthlyStat,
  adminListProjectsPaged,
  adminListActivitiesPaged,
} from '../services/api';
import { PublicLayout } from './PublicLayout';

type AdminSection = 'accounts' | 'orgs' | 'projects' | 'events' | 'delegationEvents';

// --- Helper Components ---

const ActionButton: React.FC<any> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border";
  const variants = {
    primary: "bg-[#002060] text-white border-[#002060] hover:bg-[#001540]",
    secondary: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
    danger: "bg-white text-red-700 border-red-200 hover:bg-red-50",
    success: "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    warning: "bg-white text-amber-700 border-amber-200 hover:bg-amber-50",
    ghost: "bg-transparent text-[#002060] border-transparent hover:bg-blue-50"
  };
  return (
    <button className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
    <div>
      <h2 className="text-sm sm:text-base font-extrabold text-[#002060] uppercase tracking-wide border-l-4 border-[#FECB00] pl-3">
        {title}
      </h2>
      {subtitle && <p className="text-[11px] text-gray-500 mt-1 pl-3">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

// --- Main Component ---

export const AdminPanel: React.FC = () => {
  // State: Orgs & Accounts
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgLoading, setOrgLoading] = useState(false);
  
  // State: Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectTotal, setProjectTotal] = useState(0);
  const [projectSearch, setProjectSearch] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectPage, setProjectPage] = useState(1);
  const projectPageSize = 20;

  // State: Activities (Events)
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [allActivitiesLoading, setAllActivitiesLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 20;
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityProjectFilter, setActivityProjectFilter] = useState<string>('');
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>('');

  // State: Forms (Org Creation)
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('');
  const [newOrgContactName, setNewOrgContactName] = useState('');
  const [newOrgContactPhone, setNewOrgContactPhone] = useState('');
  const [error, setError] = useState('');

  // State: Account Actions
  const [accountActionMessage, setAccountActionMessage] = useState('');
  const [accountActionDetails, setAccountActionDetails] = useState<{
    orgId?: string;
    newPassword?: string;
    contactEmail?: string;
  } | null>(null);
  const [accountSearch, setAccountSearch] = useState('');

  // State: Navigation
  const [activeSection, setActiveSection] = useState<AdminSection>('orgs');

  // State: Delegation Events
  const [delegationEvents, setDelegationEvents] = useState<DelegationEvent[]>([]);
  const [delegationEventsLoading, setDelegationEventsLoading] = useState(false);
  const [delegationEventError, setDelegationEventError] = useState('');
  const [delegationEventForm, setDelegationEventForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
  });

  // State: Statistics (Sila Province)
  const [statsRefugeesTotal, setStatsRefugeesTotal] = useState<number | ''>('');
  const [statsRefugeesPrevTotal, setStatsRefugeesPrevTotal] = useState<number | ''>('');
  const statsNewRefugees = typeof statsRefugeesTotal === 'number' && typeof statsRefugeesPrevTotal === 'number'
    ? Math.max(statsRefugeesTotal - statsRefugeesPrevTotal, 0) : '';

  const [statsReturneesTotal, setStatsReturneesTotal] = useState<number | ''>('');
  const [statsReturneesPrevTotal, setStatsReturneesPrevTotal] = useState<number | ''>('');
  const statsNewReturnees = typeof statsReturneesTotal === 'number' && typeof statsReturneesPrevTotal === 'number'
    ? Math.max(statsReturneesTotal - statsReturneesPrevTotal, 0) : '';

  const [statsMonth, setStatsMonth] = useState<string>('');
  const [statsYear, setStatsYear] = useState<number | ''>('');

  const [structPopulation, setStructPopulation] = useState<number | ''>('');
  const [structDisabled, setStructDisabled] = useState<number | ''>('');
  const [structFloodAffected, setStructFloodAffected] = useState<number | ''>('');
  const [structFireAffected, setStructFireAffected] = useState<number | ''>('');
  const [structVeryVulnerable, setStructVeryVulnerable] = useState<number | ''>('');

  const [monthlyStatsHistory, setMonthlyStatsHistory] = useState<ProvinceMonthlyStat[]>([]);

  // --- Effects ---

  useEffect(() => {
    const load = async () => {
      try {
        const stats = await adminGetProvinceStructuralStats();
        if (!stats) return;
        setStructPopulation(stats.populationTotal);
        setStructDisabled(stats.disabledTotal);
        setStructFloodAffected(stats.floodAffected);
        setStructFireAffected(stats.fireAffected);
        setStructVeryVulnerable(stats.veryVulnerable);
      } catch (err) {
        console.error('Erreur chargement stats structurelles', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const list = await adminListProvinceMonthlyStats();
        setMonthlyStatsHistory(list || []);
      } catch (err) {
        console.error('Erreur chargement historique stats mensuelles', err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await adminSaveProvinceStructuralStats({
          populationTotal: typeof structPopulation === 'number' && structPopulation >= 0 ? structPopulation : 0,
          disabledTotal: typeof structDisabled === 'number' && structDisabled >= 0 ? structDisabled : 0,
          floodAffected: typeof structFloodAffected === 'number' && structFloodAffected >= 0 ? structFloodAffected : 0,
          fireAffected: typeof structFireAffected === 'number' && structFireAffected >= 0 ? structFireAffected : 0,
          veryVulnerable: typeof structVeryVulnerable === 'number' && structVeryVulnerable >= 0 ? structVeryVulnerable : 0,
        });
      } catch (err) {
        console.error('Erreur sauvegarde stats structurelles', err);
      }
    };

    const allEmpty = structPopulation === '' && structDisabled === '' && structFloodAffected === '' && structFireAffected === '' && structVeryVulnerable === '';
    if (allEmpty) return;
    void save();
  }, [structPopulation, structDisabled, structFloodAffected, structFireAffected, structVeryVulnerable]);

  useEffect(() => {
    loadOrgs();
  }, []);

  // --- API Functions ---

  const loadOrgs = async () => {
    setOrgLoading(true);
    try {
      const result = await adminListOrgs();
      setOrgs(result.orgs || []);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger la liste des organisations.");
    } finally {
      setOrgLoading(false);
    }
  };

  const loadDelegationEvents = async () => {
    setDelegationEventsLoading(true);
    setDelegationEventError('');
    try {
      const events = await adminListDelegationEvents();
      setDelegationEvents(events);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Impossible de charger les activités de la délégation.";
      setDelegationEventError(message);
    } finally {
      setDelegationEventsLoading(false);
    }
  };

  const loadProjectsPage = async (page: number, search: string) => {
    setProjectsLoading(true);
    try {
      const res = await adminListProjectsPaged(page, projectPageSize, search);
      setProjects(res.items || []);
      setProjectTotal(res.total || 0);
      setProjectPage(res.page || page);
    } catch (err) {
      console.error('Admin list projects paged error', err);
      setProjects([]);
      setProjectTotal(0);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadActivitiesPage = async (page: number, search: string) => {
    setAllActivitiesLoading(true);
    try {
      const res = await adminListActivitiesPaged(page, activityPageSize, search);
      setAllActivities(res.items || []);
      setActivityTotal(res.total || 0);
      setActivityPage(res.page || page);
    } catch (err) {
      console.error('Admin list activities paged error', err);
      setAllActivities([]);
      setActivityTotal(0);
    } finally {
      setAllActivitiesLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newOrgName.trim() || !newOrgType.trim()) {
      setError('Veuillez remplir au minimum: Type et Nom abrégé.');
      return;
    }

    try {
      const shortName = newOrgName.trim().toUpperCase();
      const fullName = shortName;
      const email = `placeholder+${shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'org'}@example.td`;
      const payload = {
        orgName: shortName,
        orgNameFull: fullName,
        orgType: newOrgType.trim(),
        contactEmail: email,
        contactName: newOrgContactName.trim() || undefined,
        contactPhone: newOrgContactPhone.trim() || undefined,
      };
      const result = await adminCreateOrg(payload as any);
      setOrgs((prev) => [result.org, ...prev]);
      setNewOrgName('');
      setNewOrgType('');
      setNewOrgContactName('');
      setNewOrgContactPhone('');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de la création de l'organisation.";
      setError(message);
    }
  };

  // --- PDF Export Functions (Optimized) ---

  const exportProjectsToPdf = (rows: any[], popup: Window) => {
    const today = new Date().toLocaleDateString('fr-FR');
    
    const rowsHtml = rows && rows.length > 0 ? rows.map((p) => {
      const projectName = p.projectName || p.id || '';
      return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td>
              <div style="font-weight:bold; color:#002060;">${(p.orgName || '').toString()}</div>
              <div style="font-size:9px; color:#6b7280;">ID: ${(p.orgId || '').toString()}</div>
            </td>
            <td style="font-weight:600;">${projectName.toString()}</td>
            <td>${(p.type || '').toString()}</td>
            <td>
              <span style="background:#f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px;">
                ${(p.sector || '').toString()}
              </span>
            </td>
            <td>${(p.location || '').toString()}</td>
          </tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center; padding: 20px;">Aucune donnée disponible.</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Export Projets - Admin</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 10px; }
            h1 { font-size: 18px; color: #002060; margin-bottom: 5px; }
            .header { border-bottom: 2px solid #002060; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
            .meta { font-size: 10px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f9fafb; color: #374151; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            td { padding: 8px; vertical-align: top; font-size: 11px; }
            tr:nth-child(even) { background-color: #fcfcfc; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Registre Global des Projets</h1>
              <div class="meta">Administration Provinciale - SILA</div>
            </div>
            <div class="meta">Date d'édition : ${today} | Total : ${rows.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Organisation</th>
                <th style="width: 25%">Nom du projet</th>
                <th style="width: 15%">Type</th>
                <th style="width: 15%">Secteur</th>
                <th style="width: 25%">Localisation</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    
    setTimeout(() => {
      popup.print();
    }, 1000);
  };

  const exportActivitiesToPdf = (rows: any[], popup: Window) => {
    const today = new Date().toLocaleDateString('fr-FR');

    const rowsHtml = rows && rows.length > 0 ? rows.map((a) => {
      const hasDate = !!a.date;
      let isCompleted = false;
      if (hasDate) {
        const activityDate = new Date(a.date as string);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); activityDate.setHours(0, 0, 0, 0);
        isCompleted = activityDate < currentDate;
      }
      const statusLabel = isCompleted ? 'Complété' : 'À venir';
      const statusColor = isCompleted ? '#059669' : '#d97706';
      
      return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td>
              <div style="font-weight:bold; color:#002060;">${(a.orgName || '').toString()}</div>
              <div style="font-size:9px; color:#6b7280;">Projet: ${(a.projectId || '').toString()}</div>
            </td>
            <td style="font-weight:600;">${(a.title || '').toString()}</td>
            <td style="white-space:nowrap;">${(a.date || '').toString()}</td>
            <td>${(a.location || '').toString()}</td>
            <td>
              <span style="color: ${statusColor}; font-weight:bold; font-size:10px; border: 1px solid ${statusColor}30; padding: 2px 6px; border-radius:10px;">
                ${statusLabel}
              </span>
            </td>
          </tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center; padding: 20px;">Aucune activité trouvée.</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Export Activités - Admin</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #111827; margin: 0; padding: 10px; }
            h1 { font-size: 18px; color: #002060; margin-bottom: 5px; }
            .header { border-bottom: 2px solid #002060; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
            .meta { font-size: 10px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f9fafb; color: #374151; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            td { padding: 8px; vertical-align: top; font-size: 11px; }
            tr:nth-child(even) { background-color: #fcfcfc; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Suivi des Activités Partenaires</h1>
              <div class="meta">Administration Provinciale - SILA</div>
            </div>
            <div class="meta">Date d'édition : ${today} | Total : ${rows.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 20%">Organisation / Projet</th>
                <th style="width: 30%">Titre de l'activité</th>
                <th style="width: 15%">Date</th>
                <th style="width: 20%">Lieu</th>
                <th style="width: 15%">Statut</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    
    setTimeout(() => {
      popup.print();
    }, 1000);
  };

  // Helper styles
  const inputClassName = "block w-full rounded-md border-gray-300 shadow-sm focus:border-[#002060] focus:ring-[#002060] sm:text-xs text-[11px] py-2";
  const labelClassName = "block text-[11px] font-semibold text-gray-700 mb-1";

  return (
    <PublicLayout
      adminHeader={(
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-lg font-extrabold text-[#002060] tracking-tight flex items-center gap-2">
              <span className="w-2 h-6 bg-[#FECB00] rounded-sm inline-block"></span>
              Tableau de bord de l'administration
            </h1>
            <p className="text-xs text-gray-500 mt-1 pl-4 max-w-2xl">
              Gestion centralisée des partenaires, statistiques provinciales et suivi des projets dans le Sila.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 text-[10px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <span>Organisations: <b className="text-[#002060]">{orgs.length}</b></span>
              <span className="w-px h-3 bg-gray-300 self-center"></span>
              <span>Projets: <b className="text-[#002060]">{projects.length}</b></span>
            </div>
            <button
              type="button"
              onClick={() => { window.location.href = '/admin'; }}
              className="px-4 py-1.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
      adminTabs={(
        <div className="flex items-center overflow-x-auto whitespace-nowrap gap-0">
          {[
            { id: 'accounts', label: 'GESTION DES COMPTES' },
            { id: 'orgs', label: 'STATISTIQUES PROVINCE SILA' },
            { id: 'projects', label: 'PROJETS' },
            { id: 'events', label: 'ACTIVITÉS DES PROJETS' },
            { id: 'delegationEvents', label: 'ACTIVITÉS DE LA DÉLÉGATION' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSection(tab.id as AdminSection);
                if (tab.id === 'projects') loadProjectsPage(1, projectSearch);
                if (tab.id === 'events') loadActivitiesPage(1, activitySearch);
                if (tab.id === 'delegationEvents') loadDelegationEvents();
              }}
              className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide border-x border-blue-900/40 transition-colors ${activeSection === tab.id
                  ? 'bg-[#FECB00] text-[#002060] shadow-sm'
                  : 'bg-transparent text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    >
      <main className="flex-1 px-4 py-6 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* === SECTION 1: ACCOUNTS === */}
          {activeSection === 'accounts' && (
            <div className="space-y-6">
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SectionHeader
                  title="Gestion des comptes partenaires"
                  subtitle="Activez, désactivez ou réinitialisez les accès des organisations."
                  action={
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          placeholder="Rechercher..."
                          className="pl-8 w-48 border border-gray-300 rounded-md py-1.5 text-[11px] focus:ring-[#002060] focus:border-[#002060]"
                        />
                      </div>
                      <ActionButton
                        variant="secondary"
                        onClick={() => { setAccountActionMessage(''); setAccountActionDetails(null); loadOrgs(); }}
                        disabled={orgLoading}
                        title="Rafraîchir la liste"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${orgLoading ? 'animate-spin' : ''}`} />
                      </ActionButton>
                    </div>
                  }
                />

                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-100 text-xs text-red-700 font-bold">
                    Erreur: {error}
                  </div>
                )}

                {accountActionMessage && (
                  <div className="mb-4 rounded-md bg-blue-50 border border-blue-100 p-4 text-xs text-blue-900 shadow-sm">
                    <div className="font-bold mb-1">Résultat de l'action</div>
                    <p className="ml-4">{accountActionMessage}</p>
                    {accountActionDetails?.newPassword && (
                      <div className="mt-3 ml-4 bg-white border border-blue-200 rounded p-3 text-xs shadow-inner">
                        <div className="font-bold text-[#002060] mb-2 border-b border-gray-100 pb-1">Nouveaux identifiants</div>
                        <div className="grid grid-cols-[80px,1fr] gap-y-1">
                          <span className="text-gray-500">ID:</span>
                          <span className="font-mono bg-gray-50 px-1 rounded">{accountActionDetails.orgId}</span>
                          <span className="text-gray-500">Mot de passe:</span>
                          <span className="font-mono bg-gray-50 px-1 rounded font-bold">{accountActionDetails.newPassword}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-3 text-center font-bold w-[100px]">ID</th>
                        <th className="px-4 py-3 text-left font-bold">Organisation</th>
                        <th className="px-4 py-3 text-left font-bold hidden sm:table-cell">Email</th>
                        <th className="px-4 py-3 text-center font-bold w-[100px]">Statut</th>
                        <th className="px-4 py-3 text-right font-bold w-[280px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {orgs
                        .filter((o) => {
                          if (!accountSearch) return true;
                          const q = accountSearch.toLowerCase();
                          return (
                            (o.orgName || '').toLowerCase().includes(q) ||
                            (o.orgId || '').toLowerCase().includes(q)
                          );
                        })
                        .map((o, i) => {
                          const isInactiveEmail = (o.contactEmail || '').startsWith('placeholder+');
                          const isActivated = o.isActivated === 1 || o.isActivated === true;

                          return (
                            <tr key={o.orgId || i} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                  {o.orgId}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-[11px] font-bold text-[#002060]">{o.orgName}</div>
                                <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{o.orgNameFull}</div>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell text-[10px]">
                                {isInactiveEmail ? <span className="text-gray-400 italic">En attente</span> : <span className="text-gray-600">{o.contactEmail}</span>}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isActivated ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wide">Actif</span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold uppercase tracking-wide">Inactif</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <ActionButton
                                    variant={isActivated ? "danger" : "success"}
                                    onClick={async () => {
                                      try {
                                        if (isActivated) {
                                          const result = await adminDisableOrg(o.orgId);
                                          setAccountActionMessage(`Compte ${o.orgName} désactivé.`);
                                          setAccountActionDetails({ orgId: result.orgId });
                                        } else {
                                          const result = await adminEnableOrg(o.orgId);
                                          setAccountActionMessage(`Compte ${o.orgName} activé.`);
                                          setAccountActionDetails({ orgId: result.orgId });
                                        }
                                        loadOrgs();
                                      } catch (err: any) {
                                        setAccountActionMessage(err?.message || "Erreur statut");
                                      }
                                    }}
                                  >
                                    {isActivated ? 'Désactiver' : 'Activer'}
                                  </ActionButton>
                                  <ActionButton
                                    variant="secondary"
                                    disabled={orgLoading || isInactiveEmail}
                                    onClick={async () => {
                                      try {
                                        const result = await adminResetOrgPassword(o.orgId);
                                        setAccountActionMessage(`MDP réinitialisé pour ${o.orgName}.`);
                                        setAccountActionDetails({ orgId: result.orgId, newPassword: result.newPassword, contactEmail: result.contactEmail });
                                        loadOrgs();
                                      } catch (err: any) {
                                        setAccountActionMessage(err?.message || "Erreur reset");
                                      }
                                    }}
                                  >
                                    Reset MDP
                                  </ActionButton>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-blue-50 p-1.5 rounded-md text-[#002060]"><Plus className="h-4 w-4" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-[#002060] uppercase tracking-wide">Création Rapide de Partenaire</h3>
                    <p className="text-[11px] text-gray-500">Ajouter une organisation au référentiel.</p>
                  </div>
                </div>
                <form onSubmit={handleCreateOrg} className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-[1.5fr,2fr] gap-4 mb-4">
                    <div>
                      <label className={labelClassName}>Type de partenaire</label>
                      <select value={newOrgType} onChange={(e) => setNewOrgType(e.target.value)} className={inputClassName}>
                        <option value="" disabled>Sélectionnez un type</option>
                        <option value="agence_onusienne">Agence onusienne</option>
                        <option value="organisation_internationale">Organisation internationale</option>
                        <option value="organisation_nationale">Organisation nationale</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClassName}>Nom abrégé (Sigle)</label>
                      <input type="text" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value.toUpperCase())} placeholder="Ex: INTERSOS" className={inputClassName} />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <ActionButton type="submit" className="px-6">Enregistrer le partenaire</ActionButton>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* === SECTION 2: STATS === */}
          {activeSection === 'orgs' && (
            <div className="space-y-6">
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SectionHeader title="Statistiques Province Sila" subtitle="Mise à jour des données démographiques et humanitaires." />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* STRUCTURAL STATS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                      <MapPin className="h-4 w-4 text-[#FECB00]" />
                      <h3 className="text-xs font-bold text-gray-800 uppercase">Données Structurelles (Fixes)</h3>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClassName}>Population Totale</label>
                          <input type="number" min={0} value={typeof structPopulation === 'number' ? structPopulation : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStructPopulation(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                        <div>
                          <label className={labelClassName}>Personnes Handicapées</label>
                          <input type="number" min={0} value={typeof structDisabled === 'number' ? structDisabled : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStructDisabled(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                        <div>
                          <label className={labelClassName}>Affectés Inondations</label>
                          <input type="number" min={0} value={typeof structFloodAffected === 'number' ? structFloodAffected : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStructFloodAffected(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                        <div>
                          <label className={labelClassName}>Affectés Incendies</label>
                          <input type="number" min={0} value={typeof structFireAffected === 'number' ? structFireAffected : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStructFireAffected(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClassName}>Très Vulnérables</label>
                        <input type="number" min={0} value={typeof structVeryVulnerable === 'number' ? structVeryVulnerable : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStructVeryVulnerable(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                      </div>
                    </div>
                  </div>

                  {/* MONTHLY STATS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                      <Calendar className="h-4 w-4 text-[#FECB00]" />
                      <h3 className="text-xs font-bold text-gray-800 uppercase">Mise à jour Mensuelle</h3>
                    </div>

                    <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm space-y-4">
                      <div className="flex gap-3">
                        <div className="w-2/3">
                          <label className={labelClassName}>Mois</label>
                          <select className={inputClassName} value={statsMonth} onChange={(e) => setStatsMonth(e.target.value)}>
                            <option value="" disabled>Sélectionner</option>
                            {['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'].map((m, i) => (
                              <option key={i} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-1/3">
                          <label className={labelClassName}>Année</label>
                          <input type="number" min={2020} max={2100} value={statsYear === '' ? '' : statsYear} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStatsYear(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded border border-blue-100">
                        <div>
                          <label className={labelClassName}>Total Réfugiés</label>
                          <input type="number" min={0} value={typeof statsRefugeesTotal === 'number' ? statsRefugeesTotal : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStatsRefugeesTotal(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                        <div>
                          <label className={labelClassName}>Nouveaux (Calc)</label>
                          <input type="number" value={statsNewRefugees} readOnly className={`${inputClassName} bg-gray-100 text-gray-500`} />
                        </div>
                        <div>
                          <label className={labelClassName}>Total Retournés</label>
                          <input type="number" min={0} value={typeof statsReturneesTotal === 'number' ? statsReturneesTotal : ''} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setStatsReturneesTotal(Number.isNaN(v as number) ? '' : (v as number)); }} className={inputClassName} />
                        </div>
                        <div>
                          <label className={labelClassName}>Nouveaux (Calc)</label>
                          <input type="number" value={statsNewReturnees} readOnly className={`${inputClassName} bg-gray-100 text-gray-500`} />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <ActionButton
                          onClick={async () => {
                            try {
                              if (!statsMonth || statsYear === '' || !Number.isFinite(statsYear as number)) {
                                alert('Veuillez selectionner un mois et une annee valides.');
                                return;
                              }
                              await adminSaveProvinceMonthlyStats({
                                month: statsMonth,
                                year: statsYear as number,
                                totalRefugees: typeof statsRefugeesTotal === 'number' && statsRefugeesTotal >= 0 ? statsRefugeesTotal : 0,
                                newRefugees: typeof statsNewRefugees === 'number' && statsNewRefugees >= 0 ? statsNewRefugees : 0,
                                totalReturnees: typeof statsReturneesTotal === 'number' && statsReturneesTotal >= 0 ? statsReturneesTotal : 0,
                                newReturnees: typeof statsNewReturnees === 'number' && statsNewReturnees >= 0 ? statsNewReturnees : 0,
                              });
                              alert('Statistiques mensuelles enregistrees avec succes.');
                              // Reload history
                              const list = await adminListProvinceMonthlyStats();
                              setMonthlyStatsHistory(list || []);
                            } catch (err: any) {
                              alert(err?.message || "Echec de l'enregistrement.");
                            }
                          }}
                        >
                          <Save className="h-3 w-3 mr-1" /> Enregistrer le mois
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORY TABLE */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3">Historique Mensuel</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                          <th className="px-4 py-2 text-left font-bold">Période</th>
                          <th className="px-4 py-2 text-right font-bold">Total Réfugiés</th>
                          <th className="px-4 py-2 text-right font-bold text-emerald-600">Nouv. Réfugiés</th>
                          <th className="px-4 py-2 text-right font-bold">Total Retournés</th>
                          <th className="px-4 py-2 text-right font-bold text-emerald-600">Nouv. Retournés</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {monthlyStatsHistory.map((row, idx) => {
                          const monthNames: Record<string, string> = { '01': 'Janvier', '02': 'Fevrier', '03': 'Mars', '04': 'Avril', '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Aout', '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Decembre' };
                          return (
                            <tr key={`${row.year}-${row.month}-${idx}`} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-[11px] font-medium text-gray-900">
                                {monthNames[row.month] || row.month} {row.year}
                              </td>
                              <td className="px-4 py-2 text-right text-[11px] font-mono text-gray-600">{row.totalRefugees}</td>
                              <td className="px-4 py-2 text-right text-[11px] font-mono text-emerald-700 bg-emerald-50/30">{row.newRefugees}</td>
                              <td className="px-4 py-2 text-right text-[11px] font-mono text-gray-600">{row.totalReturnees}</td>
                              <td className="px-4 py-2 text-right text-[11px] font-mono text-emerald-700 bg-emerald-50/30">{row.newReturnees}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* === SECTION 3: PROJECTS === */}
          {activeSection === 'projects' && (
            <div className="space-y-6">
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SectionHeader
                  title="Répertoire des Projets"
                  subtitle="Vue d'ensemble des projets déclarés par les partenaires."
                  action={
                    <div className="flex gap-2">
                      <div className="relative">
                        <Filter className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          onBlur={() => loadProjectsPage(1, projectSearch)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              loadProjectsPage(1, projectSearch);
                            }
                          }}
                          placeholder="Filtrer..."
                          className="pl-8 w-56 border border-gray-300 rounded-md py-1.5 text-[11px] focus:ring-[#002060] focus:border-[#002060]"
                        />
                      </div>
                      <ActionButton
                        variant="secondary"
                        disabled={projectsLoading}
                        onClick={async () => {
                          // 1. افتح النافذة فوراً قبل أي عملية انتظار (await)
                          const popup = window.open('', '_blank');
                          
                          if (!popup) {
                            alert('Le navigateur a bloqué la fenêtre de téléchargement. Veuillez autoriser les pop-ups.');
                            return;
                          }

                          // 2. اعرض رسالة انتظار داخل النافذة
                          popup.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h3>Génération du PDF en cours...<br>Veuillez patienter...</h3></body></html>');

                          try {
                            // 3. جلب البيانات
                            const q = projectSearch.trim();
                            const res = await adminListProjectsPaged(1, 5000, q);
                            
                            // 4. استدعاء دالة الطباعة وتمرير النافذة المفتوحة
                            exportProjectsToPdf(res.items || [], popup);
                          } catch (err) {
                            console.error('Export projects error', err);
                            popup.document.body.innerHTML = '<h3 style="color:red">Erreur lors de la récupération des données.</h3>';
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 text-gray-600" />
                      </ActionButton>
                    </div>
                  }
                />

                {projectsLoading ? (
                  <div className="text-center py-10 text-gray-400 text-xs animate-pulse">Chargement des données...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs bg-gray-50 rounded-lg">Aucun projet enregistré.</div>
                ) : (
                  (() => {
                    const totalPages = Math.max(1, Math.ceil(projectTotal / projectPageSize));
                    const currentPage = Math.min(projectPage, totalPages);
                    const visibleProjects = projects;

                    return (
                      <>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2 px-1">
                          <span>Affichage {visibleProjects.length} sur {projectTotal} projets</span>
                          <div className="flex gap-2">
                            <button
                              disabled={currentPage <= 1}
                              onClick={() => loadProjectsPage(currentPage - 1, projectSearch)}
                              className="hover:text-blue-700 disabled:opacity-30"
                            >
                              Précédent
                            </button>
                            <span>Page {currentPage} / {totalPages}</span>
                            <button
                              disabled={currentPage >= totalPages}
                              onClick={() => loadProjectsPage(currentPage + 1, projectSearch)}
                              className="hover:text-blue-700 disabled:opacity-30"
                            >
                              Suivant
                            </button>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                                <th className="px-4 py-3 text-left font-bold">Projet</th>
                                <th className="px-4 py-3 text-left font-bold w-[120px]">Type</th>
                                <th className="px-4 py-3 text-left font-bold w-[150px]">Secteur</th>
                                <th className="px-4 py-3 text-left font-bold w-[100px]">ID</th>
                                <th className="px-4 py-3 text-left font-bold w-[180px]">Organisation</th>
                                <th className="w-[40px]"></th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {visibleProjects.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-4 text-xs text-gray-400">Aucun résultat.</td></tr>
                              ) : (
                                visibleProjects.map((p) => (
                                  <React.Fragment key={`${p.orgId}-${p.id}`}>
                                    <tr
                                      onClick={() => setExpandedProjectId(prev => prev === p.id ? null : p.id)}
                                      className={`cursor-pointer transition-colors ${expandedProjectId === p.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                    >
                                      <td className="px-4 py-3 text-[11px] font-bold text-[#002060]">{p.projectName || p.id}</td>
                                      <td className="px-4 py-3 text-[10px] text-gray-600">{p.type}</td>
                                      <td className="px-4 py-3 text-[10px] text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded-full">{p.sector}</span></td>
                                      <td className="px-4 py-3 text-[10px] font-mono text-gray-500">{p.id}</td>
                                      <td className="px-4 py-3 text-[10px] font-bold text-gray-700">{p.orgName}</td>
                                      <td className="px-2 text-center text-gray-400">
                                        {expandedProjectId === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                      </td>
                                    </tr>
                                    {expandedProjectId === p.id && (
                                      <tr className="bg-blue-50/20">
                                        <td colSpan={6} className="px-4 py-4">
                                          <div className="bg-white border border-blue-100 rounded-md p-4 shadow-inner">
                                            <h4 className="text-xs font-bold text-[#002060] mb-2 uppercase border-b border-gray-100 pb-1">Détails du Projet</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-[11px] text-gray-600">
                                              <div className="col-span-full mb-1">
                                                <span className="font-bold text-gray-800 block mb-0.5">Description:</span>
                                                <p className="leading-relaxed">{p.projectDescription || 'N/A'}</p>
                                              </div>
                                              <div><span className="font-bold text-gray-800">Localisation:</span> {p.location}</div>
                                              <div><span className="font-bold text-gray-800">Bénéficiaires (Type):</span> {p.beneficiariesType}</div>
                                              <div><span className="font-bold text-gray-800">Bénéficiaires (Prévus):</span> {p.beneficiariesPlanned}</div>
                                              <div><span className="font-bold text-gray-800">Chef de Projet:</span> {p.projectManagerName || '-'}</div>
                                              <div><span className="font-bold text-gray-800">Contact:</span> {p.projectManagerPhone || '-'}</div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()
                )}
              </section>
            </div>
          )}

          {/* === SECTION 4: DELEGATION EVENTS === */}
          {activeSection === 'delegationEvents' && (
            <div className="space-y-6">
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-xs">
                <SectionHeader title="Activités de la Délégation" subtitle="Journal des événements officiels et réunions de coordination." />

                {delegationEventError && (
                  <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-xs border border-red-100">{delegationEventError}</div>
                )}

                <form
                  className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!delegationEventForm.title.trim()) return;
                    try {
                      await adminCreateDelegationEvent({
                        title: delegationEventForm.title.trim(),
                        date: delegationEventForm.date || undefined,
                        location: delegationEventForm.location || undefined,
                        description: delegationEventForm.description || undefined,
                      });
                      setDelegationEventForm({ title: '', date: '', location: '', description: '' });
                      loadDelegationEvents();
                    } catch (err: any) {
                      setDelegationEventError(err?.message || "Erreur création");
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-4 w-4 text-[#002060]" />
                    <h3 className="text-xs font-bold text-gray-700 uppercase">Nouvelle Activité</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr] gap-4 mb-3">
                    <div>
                      <label className={labelClassName}>Titre</label>
                      <input type="text" required placeholder="Ex: Réunion mensuelle" value={delegationEventForm.title} onChange={e => setDelegationEventForm(prev => ({ ...prev, title: e.target.value }))} className={inputClassName} />
                    </div>
                    <div>
                      <label className={labelClassName}>Date</label>
                      <input type="date" value={delegationEventForm.date} onChange={e => setDelegationEventForm(prev => ({ ...prev, date: e.target.value }))} className={inputClassName} />
                    </div>
                    <div>
                      <label className={labelClassName}>Lieu</label>
                      <input type="text" placeholder="Goz Beida..." value={delegationEventForm.location} onChange={e => setDelegationEventForm(prev => ({ ...prev, location: e.target.value }))} className={inputClassName} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className={labelClassName}>Description</label>
                    <textarea rows={2} placeholder="Détails..." value={delegationEventForm.description} onChange={e => setDelegationEventForm(prev => ({ ...prev, description: e.target.value }))} className={inputClassName} />
                  </div>
                  <div className="flex justify-end">
                    <ActionButton type="submit" disabled={delegationEventsLoading || !delegationEventForm.title.trim()}>Enregistrer l'activité</ActionButton>
                  </div>
                </form>

                <div className="mt-3">
                  {delegationEventsLoading ? (
                    <div className="text-center py-8 text-gray-400 text-xs">Chargement...</div>
                  ) : delegationEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded">Aucune activité enregistrée.</div>
                  ) : (
                    <div className="grid gap-3">
                      {delegationEvents.map((ev) => (
                        <div key={ev.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-[#002060]">{ev.title}</h4>
                            <p className="text-[11px] text-gray-600 mt-1">{ev.description || <span className="italic text-gray-400">Pas de description</span>}</p>
                          </div>
                          <div className="flex flex-row md:flex-col gap-2 md:gap-1 text-[10px] text-gray-500 md:w-40 md:text-right md:border-l md:border-gray-100 md:pl-4 justify-between md:justify-center">
                            <div className="flex items-center md:justify-end gap-1"><Calendar className="h-3 w-3" /> {ev.date || 'N/A'}</div>
                            <div className="flex items-center md:justify-end gap-1"><MapPin className="h-3 w-3" /> {ev.location || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* === SECTION 5: PROJECT ACTIVITIES === */}
          {activeSection === 'events' && (
            <div className="space-y-6">
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <SectionHeader
                  title="Activités des Projets"
                  subtitle="Suivi opérationnel des actions menées par les partenaires."
                  action={
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={activitySearch}
                          onChange={(e) => setActivitySearch(e.target.value)}
                          onBlur={() => loadActivitiesPage(1, activitySearch)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              loadActivitiesPage(1, activitySearch);
                            }
                          }}
                          placeholder="Rechercher..."
                          className="pl-8 w-40 border border-gray-300 rounded-md py-1.5 text-[11px] focus:ring-[#002060] focus:border-[#002060]"
                        />
                      </div>

                      {/* Filtre projet */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-gray-600">Projet:</span>
                        <select
                          value={activityProjectFilter}
                          onChange={(e) => setActivityProjectFilter(e.target.value)}
                          className="border border-gray-300 rounded-md py-1 px-2 text-[11px] focus:ring-[#002060] focus:border-[#002060] bg-white"
                        >
                          <option value="">Tous</option>
                          {Array.from(
                            new Map(
                              allActivities.map((a) => [
                                a.projectId,
                                a.projectName || a.projectId,
                              ]),
                            ).entries(),
                          ).map(([id, name]) => (
                            <option key={id} value={id}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtre statut */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-gray-600">Statut:</span>
                        <select
                          value={activityStatusFilter}
                          onChange={(e) => setActivityStatusFilter(e.target.value)}
                          className="border border-gray-300 rounded-md py-1 px-2 text-[11px] focus:ring-[#002060] focus:border-[#002060] bg-white"
                        >
                          <option value="">Tous</option>
                          <option value="upcoming">À venir</option>
                          <option value="completed">Complété</option>
                        </select>
                      </div>

                      <ActionButton
                        variant="secondary"
                        disabled={allActivitiesLoading}
                        onClick={async () => {
                          const popup = window.open('', '_blank');
                          
                          if (!popup) {
                            alert('Le navigateur a bloqué la fenêtre de téléchargement. Veuillez autoriser les pop-ups.');
                            return;
                          }

                          popup.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h3>Génération du PDF en cours...<br>Veuillez patienter...</h3></body></html>');

                          try {
                            const q = activitySearch.trim();
                            const res = await adminListActivitiesPaged(1, 5000, q);
                            exportActivitiesToPdf(res.items || [], popup);
                          } catch (err) {
                            console.error('Export activities error', err);
                            popup.document.body.innerHTML = '<h3 style="color:red">Erreur lors de la récupération des données.</h3>';
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 text-gray-600" />
                      </ActionButton>
                    </div>
                  }
                />

                {allActivitiesLoading ? (
                  <div className="text-center py-10 text-gray-400 text-xs animate-pulse">Chargement des activités...</div>
                ) : allActivities.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs bg-gray-50 rounded-lg">Aucune activité trouvée.</div>
                ) : (
                  (() => {
                    const totalPages = Math.max(1, Math.ceil(activityTotal / activityPageSize));
                    const currentPage = Math.min(activityPage, totalPages);
                    const baseActivities = allActivities;
                    const filteredByProject = activityProjectFilter
                      ? baseActivities.filter((a) => a.projectId === activityProjectFilter)
                      : baseActivities;
                    const filteredByStatus = activityStatusFilter
                      ? filteredByProject.filter((a) => {
                          const hasDate = !!a.date;
                          let isCompleted = false;
                          if (hasDate) {
                            const d = new Date(a.date);
                            const t = new Date();
                            t.setHours(0, 0, 0, 0);
                            d.setHours(0, 0, 0, 0);
                            isCompleted = d < t;
                          }
                          if (activityStatusFilter === 'completed') return isCompleted;
                          if (activityStatusFilter === 'upcoming') return !isCompleted;
                          return true;
                        })
                      : filteredByProject;
                    const visible = filteredByStatus;

                    return (
                      <>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-2 px-1">
                          <span>Affichage de {visible.length} sur {activityTotal} activités</span>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={currentPage <= 1}
                              onClick={() => loadActivitiesPage(currentPage - 1, activitySearch)}
                              className="hover:text-blue-700 disabled:opacity-40"
                            >
                              Précédent
                            </button>
                            <span>Page {currentPage} / {totalPages}</span>
                            <button
                              disabled={currentPage >= totalPages}
                              onClick={() => loadActivitiesPage(currentPage + 1, activitySearch)}
                              className="hover:text-blue-700 disabled:opacity-40"
                            >
                              Suivant
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          {visible.length === 0 ? (
                            <div className="text-center text-xs text-gray-400 py-4">Aucun résultat.</div>
                          ) : (
                            visible.map((a) => {
                              const hasDate = !!a.date;
                              let isCompleted = false;
                              if (hasDate) {
                                const d = new Date(a.date);
                                const t = new Date(); t.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
                                isCompleted = d < t;
                              }

                              return (
                                <div key={a.id} className="group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 relative overflow-hidden">
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                  <div className="flex-1 pl-2">
                                    <div className="flex items-start justify-between">
                                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#002060] transition-colors">{a.title}</h4>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {isCompleted ? 'Complété' : 'À venir'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-1 mb-2 line-clamp-2">{a.description || <span className="italic text-gray-400">Pas de description</span>}</p>
                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100"><span className="font-bold text-gray-700">Org:</span> {a.orgName}</span>
                                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100"><span className="font-bold text-gray-700">Projet:</span> {a.projectId}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-row sm:flex-col gap-3 sm:gap-1 text-[10px] text-gray-500 sm:w-40 sm:text-right sm:border-l sm:border-gray-100 sm:pl-4 justify-between sm:justify-center">
                                    <div className="flex items-center sm:justify-end gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-800" /><span className="font-medium">{a.date || 'N/A'}</span></div>
                                    <div className="flex items-center sm:justify-end gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-800" /><span className="font-medium">{a.location || 'N/A'}</span></div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()
                )}
              </section>
            </div>
          )}

        </div>
      </main>
    </PublicLayout>
  );
};