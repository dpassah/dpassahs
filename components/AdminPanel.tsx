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
  uploadDelegationEventImage,
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
import { AdminProvinceStatsSection } from './admin/AdminProvinceStatsSection';
import { AdminPopulationManagementSection } from './admin/AdminPopulationManagementSection';

type AdminSection = 'accounts' | 'orgs' | 'projects' | 'events' | 'delegationEvents' | 'population';

interface AdminPanelProps {
  initialSection?: AdminSection;
}

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

export const AdminPanel: React.FC<AdminPanelProps> = ({ initialSection }) => {

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
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection || 'orgs');

  const sectionToSlug: Record<AdminSection, string> = {
    accounts: 'comptes',
    orgs: 'statistiques',
    projects: 'projets',
    events: 'activites-projets',
    delegationEvents: 'activites-delegation',
    population: 'population',
  };

  // State: Delegation Events
  const [delegationEvents, setDelegationEvents] = useState<DelegationEvent[]>([]);
  const [delegationEventsLoading, setDelegationEventsLoading] = useState(false);
  const [delegationEventError, setDelegationEventError] = useState('');
  const [delegationEventForm, setDelegationEventForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    images: [] as File[],
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

  const now = new Date();
  const [statsMonth, setStatsMonth] = useState<string>(String(now.getMonth() + 1).padStart(2, '0'));
  const [statsYear, setStatsYear] = useState<number | ''>(now.getFullYear());

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
      adminHeader={null}
      adminTabs={(
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center overflow-x-auto whitespace-nowrap gap-0">
            {[
              { id: 'accounts', label: 'GESTION DES COMPTES' },
              { id: 'orgs', label: 'STATISTIQUES PROVINCE SILA' },
              { id: 'population', label: 'POPULATION' },
              { id: 'projects', label: 'PROJETS' },
              { id: 'events', label: 'ACTIVITÉS DES PROJETS' },
              { id: 'delegationEvents', label: 'ACTIVITÉS DE LA DÉLÉGATION' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  const nextSection = tab.id as AdminSection;
                  setActiveSection(nextSection);
                  try {
                    const slug = sectionToSlug[nextSection];
                    const nextPath = `/admin/panel/${slug}`;
                    if (window.location.pathname !== nextPath) {
                      window.history.pushState(null, '', nextPath);
                    }
                  } catch {
                    // ignore history errors in non-browser environments
                  }
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

          <button
            type="button"
            onClick={() => { window.location.href = '/admin'; }}
            className="ml-3 px-4 py-1.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            Se déconnecter
          </button>
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
            <AdminProvinceStatsSection
              structPopulation={structPopulation}
              setStructPopulation={setStructPopulation}
              structDisabled={structDisabled}
              setStructDisabled={setStructDisabled}
              structFloodAffected={structFloodAffected}
              setStructFloodAffected={setStructFloodAffected}
              structFireAffected={structFireAffected}
              setStructFireAffected={setStructFireAffected}
              structVeryVulnerable={structVeryVulnerable}
              setStructVeryVulnerable={setStructVeryVulnerable}
              statsMonth={statsMonth}
              setStatsMonth={setStatsMonth}
              statsYear={statsYear}
              setStatsYear={setStatsYear}
              statsRefugeesTotal={statsRefugeesTotal}
              setStatsRefugeesTotal={setStatsRefugeesTotal}
              statsNewRefugees={statsNewRefugees as number}
              statsReturneesTotal={statsReturneesTotal}
              setStatsReturneesTotal={setStatsReturneesTotal}
              statsNewReturnees={statsNewReturnees as number}
              monthlyStatsHistory={monthlyStatsHistory}
              setMonthlyStatsHistory={setMonthlyStatsHistory}
              adminSaveProvinceMonthlyStats={adminSaveProvinceMonthlyStats}
              adminListProvinceMonthlyStats={adminListProvinceMonthlyStats}
              SectionHeader={SectionHeader}
              ActionButton={ActionButton}
              inputClassName={inputClassName}
              labelClassName={labelClassName}
            />
          )}

          {/* === SECTION 3: POPULATION === */}
          {activeSection === 'population' && (
            <AdminPopulationManagementSection
              SectionHeader={SectionHeader}
              ActionButton={ActionButton}
              inputClassName={inputClassName}
              labelClassName={labelClassName}
            />
          )}

          {/* === SECTION 4: PROJECTS === */}
          {activeSection === 'projects' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#002060] to-[#003080] px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#FECB00] rounded-lg flex items-center justify-center">
                          <span className="text-[#002060] text-sm font-bold">📋</span>
                        </div>
                        Répertoire des Projets
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">Vue d'ensemble des projets déclarés par les partenaires</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-200" />
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
                          placeholder="Rechercher un projet..."
                          className="pl-10 w-64 bg-blue-50/20 border border-blue-200/30 rounded-lg py-2 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                        />
                      </div>
                      <ActionButton
                        variant="secondary"
                        disabled={projectsLoading}
                        onClick={async () => {
                          const popup = window.open('', '_blank');
                          if (!popup) {
                            alert('Le navigateur a bloqué la fenêtre de téléchargement. Veuillez autoriser les pop-ups.');
                            return;
                          }
                          popup.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#002060;color:white;"><h3>Génération du PDF en cours...<br>Veuillez patienter...</h3></body></html>');
                          try {
                            const q = projectSearch.trim();
                            const res = await adminListProjectsPaged(1, 5000, q);
                            exportProjectsToPdf(res.items || [], popup);
                          } catch (err) {
                            console.error('Export projects error', err);
                            popup.document.body.innerHTML = '<h3 style="color:red">Erreur lors de la récupération des données.</h3>';
                          }
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        <Download className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {projectsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002060] mb-4"></div>
                      <p className="text-gray-500 text-sm">Chargement des projets...</p>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📂</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun projet trouvé</h3>
                      <p className="text-gray-500 text-sm">Aucun projet n'a été enregistré par les partenaires.</p>
                    </div>
                  ) : (
                    (() => {
                      const totalPages = Math.max(1, Math.ceil(projectTotal / projectPageSize));
                      const currentPage = Math.min(projectPage, totalPages);
                      const visibleProjects = projects;

                      return (
                        <>
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-50 px-3 py-1 rounded-full">
                                <span className="text-sm font-semibold text-blue-700">
                                  {visibleProjects.length} sur {projectTotal} projets
                                </span>
                              </div>
                              {projectSearch && (
                                <div className="bg-amber-50 px-3 py-1 rounded-full">
                                  <span className="text-sm font-semibold text-amber-700">
                                    Filtré: "{projectSearch}"
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={currentPage <= 1}
                                onClick={() => loadProjectsPage(currentPage - 1, projectSearch)}
                                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                ← Précédent
                              </button>
                              <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                                Page {currentPage} / {totalPages}
                              </span>
                              <button
                                disabled={currentPage >= totalPages}
                                onClick={() => loadProjectsPage(currentPage + 1, projectSearch)}
                                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Suivant →
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4">
                            {visibleProjects.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500 text-sm">Aucun résultat pour cette recherche.</p>
                              </div>
                            ) : (
                              visibleProjects.map((p) => (
                                <div
                                  key={`${p.orgId}-${p.id}`}
                                  className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#002060]/20 transition-all duration-200 overflow-hidden"
                                >
                                  <div
                                    onClick={() => setExpandedProjectId(prev => prev === p.id ? null : p.id)}
                                    className="p-6 cursor-pointer"
                                  >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                          <div className="w-12 h-12 bg-gradient-to-br from-[#002060] to-[#003080] rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg">
                                              {(p.orgName || '').charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#002060] transition-colors mb-1">
                                              {p.projectName || p.id}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                              <span className="font-medium text-gray-700">{p.orgName}</span>
                                              <span className="text-gray-400">•</span>
                                              <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
                                                {p.sector}
                                              </span>
                                              <span className="text-gray-400">•</span>
                                              <span className="text-xs font-mono text-gray-500">
                                                ID: {p.id}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="text-xs text-gray-500 mb-1">Type</div>
                                          <div className="text-sm font-medium text-gray-700">{p.type}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-xs text-gray-500 mb-1">Localisation</div>
                                          <div className="text-sm font-medium text-gray-700">{p.location || 'N/A'}</div>
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-[#002060] transition-colors">
                                          {expandedProjectId === p.id ? (
                                            <ChevronUp className="h-5 w-5" />
                                          ) : (
                                            <ChevronDown className="h-5 w-5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {expandedProjectId === p.id && (
                                    <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50/20 p-6">
                                      <div className="bg-white rounded-lg p-5 border border-blue-100">
                                        <h4 className="text-sm font-bold text-[#002060] mb-4 flex items-center gap-2">
                                          <span>📊</span>
                                          Détails du Projet
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                                              Informations Générales
                                            </h5>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Organisation:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.orgName}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Type:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.type}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Secteur:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.sector}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Localisation:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.location || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                                              Bénéficiaires
                                            </h5>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Type:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.beneficiariesType || 'N/A'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Prévus:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.beneficiariesPlanned || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-3">
                                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
                                              Coordination
                                            </h5>
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Chef de projet:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.projectManagerName || 'N/A'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs text-gray-500">Contact:</span>
                                                <span className="text-xs font-medium text-gray-900">{p.projectManagerPhone || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {p.projectDescription && (
                                          <div className="mt-4 pt-4 border-t border-gray-100">
                                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Description</h5>
                                            <p className="text-sm text-gray-600 leading-relaxed">{p.projectDescription}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </section>
            </div>
          )}

          {/* === SECTION 5: DELEGATION EVENTS === */}
          {activeSection === 'delegationEvents' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#002060] to-[#003080] px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#FECB00] rounded-lg flex items-center justify-center">
                          <span className="text-[#002060] text-sm font-bold">🤝</span>
                        </div>
                        Activités de la Délégation
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">Journal des événements officiels et réunions de coordination</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {delegationEventError && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span className="text-sm font-medium">{delegationEventError}</span>
                      </div>
                    </div>
                  )}

                  <form
                    className="mb-8 bg-gradient-to-br from-gray-50 to-blue-50/30 border border-gray-200 rounded-xl p-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!delegationEventForm.title.trim()) return;
                      
                      try {
                        // Upload images first if any
                        const imageUrls: string[] = [];
                        if (delegationEventForm.images && delegationEventForm.images.length > 0) {
                          for (const file of delegationEventForm.images) {
                            if (file instanceof File) {
                              const result = await uploadDelegationEventImage(file);
                              imageUrls.push(result.url);
                            }
                          }
                        }

                        await adminCreateDelegationEvent({
                          title: delegationEventForm.title.trim(),
                          date: delegationEventForm.date || undefined,
                          location: delegationEventForm.location || undefined,
                          description: delegationEventForm.description || undefined,
                          images: imageUrls.length > 0 ? imageUrls : undefined,
                        });
                        
                        setDelegationEventForm({ 
                          title: '', 
                          date: '', 
                          location: '', 
                          description: '',
                          images: []
                        });
                        loadDelegationEvents();
                      } catch (err: any) {
                        console.error('Delegation event creation error:', err);
                        setDelegationEventError(err?.message || "Erreur lors de la création de l'activité");
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-[#002060] rounded-lg flex items-center justify-center">
                        <Plus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#002060] uppercase tracking-wide">Nouvelle Activité</h3>
                        <p className="text-xs text-gray-500">Enregistrer un événement ou une réunion</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <div className="lg:col-span-2">
                        <label className={labelClassName}>Titre de l'activité</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Réunion mensuelle de coordination" 
                          value={delegationEventForm.title} 
                          onChange={e => setDelegationEventForm(prev => ({ ...prev, title: e.target.value }))} 
                          className={inputClassName} 
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Date</label>
                        <input 
                          type="date" 
                          value={delegationEventForm.date} 
                          onChange={e => setDelegationEventForm(prev => ({ ...prev, date: e.target.value }))} 
                          className={inputClassName} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClassName}>Lieu</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Salle de conférence, Goz Beida..." 
                          value={delegationEventForm.location} 
                          onChange={e => setDelegationEventForm(prev => ({ ...prev, location: e.target.value }))} 
                          className={inputClassName} 
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Images (jusqu'à 3)</label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            max="3"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 3) {
                                e.target.value = '';
                                return;
                              }
                              setDelegationEventForm(prev => ({ ...prev, images: files }));
                            }}
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#002060] file:text-white hover:file:bg-[#003080]"
                          />
                          {delegationEventForm.images && delegationEventForm.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {Array.from(delegationEventForm.images).map((file, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={file instanceof File ? URL.createObjectURL(file) : ''}
                                    alt={`Preview ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImages = Array.from(delegationEventForm.images || []);
                                      newImages.splice(index, 1);
                                      setDelegationEventForm(prev => ({ ...prev, images: newImages }));
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className={labelClassName}>Description</label>
                      <textarea 
                        rows={3} 
                        placeholder="Décrire l'activité, les participants, les objectifs..." 
                        value={delegationEventForm.description} 
                        onChange={e => setDelegationEventForm(prev => ({ ...prev, description: e.target.value }))} 
                        className={inputClassName} 
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <ActionButton 
                        type="submit" 
                        disabled={delegationEventsLoading || !delegationEventForm.title.trim()}
                        className="px-6"
                      >
                        {delegationEventsLoading ? 'Enregistrement...' : 'Enregistrer l\'activité'}
                      </ActionButton>
                    </div>
                  </form>

                  <div className="mt-8">
                    {delegationEventsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002060] mb-4"></div>
                        <p className="text-gray-500 text-sm">Chargement des activités...</p>
                      </div>
                    ) : delegationEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">📅</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune activité enregistrée</h3>
                        <p className="text-gray-500 text-sm">Commencez par ajouter une nouvelle activité de délégation.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {delegationEvents.map((ev) => (
                          <div key={ev.id} className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#002060]/20 transition-all duration-200 overflow-hidden">
                            <div className="p-6">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-[#002060] to-[#003080] rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-bold text-lg">🤝</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#002060] transition-colors mb-1">
                                        {ev.title}
                                      </h3>
                                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                        {ev.date && (
                                          <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            <span>{ev.date}</span>
                                          </div>
                                        )}
                                        {ev.location && (
                                          <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-purple-600" />
                                            <span>{ev.location}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {ev.description && (
                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                      {ev.description}
                                    </p>
                                  )}

                                  {ev.images && ev.images.length > 0 && (
                                    <div className="mb-3">
                                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Images</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {ev.images.map((image, index) => {
                                          const getImageUrl = (img: string) => {
                                            if (!img) return '';
                                            if (img.startsWith('http')) return img;
                                            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                                            if (img.startsWith('/')) return `${baseUrl}${img}`;
                                            return `${baseUrl}/public/delegation-events/${img}`;
                                          };
                                          const imageUrl = getImageUrl(image);
                                          return (
                                            <img
                                              key={index}
                                              src={imageUrl}
                                              alt={`Activity image ${index + 1}`}
                                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-[#002060]/30 transition-colors cursor-pointer"
                                              onClick={() => window.open(imageUrl, '_blank')}
                                              onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                                              }}
                                            />
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex lg:flex-col gap-2 lg:gap-1">
                                  <button className="p-2 text-gray-400 hover:text-[#002060] hover:bg-gray-50 rounded-lg transition-colors">
                                    <span className="text-lg">ℹ️</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* === SECTION 6: PROJECT ACTIVITIES === */}
          {activeSection === 'events' && (
            <div className="space-y-6">
              <section className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#002060] to-[#003080] px-6 py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#FECB00] rounded-lg flex items-center justify-center">
                          <span className="text-[#002060] text-sm font-bold">📅</span>
                        </div>
                        Activités des Projets
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">Suivi opérationnel des actions menées par les partenaires</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-200" />
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
                          placeholder="Rechercher une activité..."
                          className="pl-10 w-48 bg-blue-50/20 border border-blue-200/30 rounded-lg py-2 text-sm text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                        />
                      </div>

                      <select
                        value={activityProjectFilter}
                        onChange={(e) => setActivityProjectFilter(e.target.value)}
                        className="bg-blue-50/20 border border-blue-200/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                      >
                        <option value="" className="text-gray-900">Tous les projets</option>
                        {Array.from(
                          new Map(
                            allActivities.map((a) => [
                              a.projectId,
                              a.projectName || a.projectId,
                            ]),
                          ).entries(),
                        ).map(([id, name]) => (
                          <option key={id} value={id} className="text-gray-900">
                            {name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={activityStatusFilter}
                        onChange={(e) => setActivityStatusFilter(e.target.value)}
                        className="bg-blue-50/20 border border-blue-200/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                      >
                        <option value="" className="text-gray-900">Tous les statuts</option>
                        <option value="upcoming" className="text-gray-900">À venir</option>
                        <option value="completed" className="text-gray-900">Complété</option>
                      </select>

                      <ActionButton
                        variant="secondary"
                        disabled={allActivitiesLoading}
                        onClick={async () => {
                          const popup = window.open('', '_blank');
                          if (!popup) {
                            alert('Le navigateur a bloqué la fenêtre de téléchargement. Veuillez autoriser les pop-ups.');
                            return;
                          }
                          popup.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#002060;color:white;"><h3>Génération du PDF en cours...<br>Veuillez patienter...</h3></body></html>');
                          try {
                            const q = activitySearch.trim();
                            const res = await adminListActivitiesPaged(1, 5000, q);
                            exportActivitiesToPdf(res.items || [], popup);
                          } catch (err) {
                            console.error('Export activities error', err);
                            popup.document.body.innerHTML = '<h3 style="color:red">Erreur lors de la récupération des données.</h3>';
                          }
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      >
                        <Download className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {allActivitiesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002060] mb-4"></div>
                      <p className="text-gray-500 text-sm">Chargement des activités...</p>
                    </div>
                  ) : allActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📋</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune activité trouvée</h3>
                      <p className="text-gray-500 text-sm">Aucune activité n'a été enregistrée par les partenaires.</p>
                    </div>
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
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="bg-blue-50 px-3 py-1 rounded-full">
                                <span className="text-sm font-semibold text-blue-700">
                                  {visible.length} sur {activityTotal} activités
                                </span>
                              </div>
                              {activitySearch && (
                                <div className="bg-amber-50 px-3 py-1 rounded-full">
                                  <span className="text-sm font-semibold text-amber-700">
                                    Recherche: "{activitySearch}"
                                  </span>
                                </div>
                              )}
                              {activityProjectFilter && (
                                <div className="bg-purple-50 px-3 py-1 rounded-full">
                                  <span className="text-sm font-semibold text-purple-700">
                                    Projet: {allActivities.find(a => a.projectId === activityProjectFilter)?.projectName || activityProjectFilter}
                                  </span>
                                </div>
                              )}
                              {activityStatusFilter && (
                                <div className={`${activityStatusFilter === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} px-3 py-1 rounded-full`}>
                                  <span className="text-sm font-semibold">
                                    {activityStatusFilter === 'completed' ? 'Complétées' : 'À venir'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                disabled={currentPage <= 1}
                                onClick={() => loadActivitiesPage(currentPage - 1, activitySearch)}
                                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                ← Précédent
                              </button>
                              <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                                Page {currentPage} / {totalPages}
                              </span>
                              <button
                                disabled={currentPage >= totalPages}
                                onClick={() => loadActivitiesPage(currentPage + 1, activitySearch)}
                                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Suivant →
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4">
                            {visible.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <span className="text-2xl mb-2 block">🔍</span>
                                <p className="text-gray-500 text-sm">Aucune activité ne correspond à vos critères de recherche.</p>
                              </div>
                            ) : (
                              visible.map((a) => {
                                const hasDate = !!a.date;
                                let isCompleted = false;
                                if (hasDate) {
                                  const d = new Date(a.date);
                                  const t = new Date(); 
                                  t.setHours(0, 0, 0, 0); 
                                  d.setHours(0, 0, 0, 0);
                                  isCompleted = d < t;
                                }

                                return (
                                  <div
                                    key={a.id}
                                    className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-[#002060]/20 transition-all duration-200 overflow-hidden"
                                  >
                                    <div className="flex">
                                      {/* Status indicator bar */}
                                      <div className={`w-2 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                      
                                      <div className="flex-1 p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            {/* Header with title and status */}
                                            <div className="flex items-start gap-3 mb-3">
                                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                isCompleted 
                                                  ? 'bg-emerald-100 text-emerald-600' 
                                                  : 'bg-amber-100 text-amber-600'
                                              }`}>
                                                {isCompleted ? (
                                                  <span className="text-lg">✓</span>
                                                ) : (
                                                  <Calendar className="h-5 w-5" />
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#002060] transition-colors mb-1">
                                                  {a.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                                    isCompleted 
                                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                                  }`}>
                                                    {isCompleted ? 'Complété' : 'À venir'}
                                                  </span>
                                                  <span className="text-gray-400">•</span>
                                                  <span className="text-sm text-gray-600 font-medium">{a.orgName}</span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Description */}
                                            {a.description && (
                                              <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                                                {a.description}
                                              </p>
                                            )}

                                            {/* Metadata badges */}
                                            <div className="flex flex-wrap gap-2">
                                              <div className="inline-flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                                                <span className="text-xs font-semibold text-gray-500">PROJET:</span>
                                                <span className="text-xs font-medium text-gray-900">{a.projectName || a.projectId}</span>
                                              </div>
                                              {a.date && (
                                                <div className="inline-flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                                                  <Calendar className="h-3 w-3 text-blue-600" />
                                                  <span className="text-xs font-medium text-blue-900">{a.date}</span>
                                                </div>
                                              )}
                                              {a.location && (
                                                <div className="inline-flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
                                                  <MapPin className="h-3 w-3 text-purple-600" />
                                                  <span className="text-xs font-medium text-purple-900">{a.location}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Action buttons */}
                                          <div className="flex lg:flex-col gap-2 lg:gap-1">
                                            <button className="p-2 text-gray-400 hover:text-[#002060] hover:bg-gray-50 rounded-lg transition-colors">
                                              <span className="text-lg">ℹ️</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
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
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </PublicLayout>
  );
}; 