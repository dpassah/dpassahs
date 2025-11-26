import React, { useState, useEffect, useCallback } from 'react';
import {
  UserSession,
  Project,
  ProjectActivity,
  SECTORS,
  Sector,
  ProjectType,
  ProjectFormPayload,
  PROJECT_TYPES,
} from '../types';
import { ProjectForm } from './ProjectForm';
import { ProjectTable } from './ProjectTable';
import {
  LogOut,
  LayoutDashboard,
  Plus,
  X,
  FileText,
  Search,
  Filter,
  Download,
  ChevronDown,
  Building,
} from 'lucide-react';
import {
  createProject,
  deleteProject as deleteProjectApi,
  fetchProjects,
  updateProject as updateProjectApi,
  listProjectActivities,
} from '../services/api';

const LEGACY_TYPE_MAP: Record<string, ProjectType> = {
  Dveloppement: 'Développement',
  'DǸveloppement': 'Développement',
};

const LEGACY_SECTOR_MAP: Record<string, Sector> = {
  Sant: Sector.SANTE,
  'ducation': Sector.EDUCATION,
  '%ducation': Sector.EDUCATION,
  'Scurit Alimentaire': Sector.SECURITE_ALIMENTAIRE,
};

const TYPE_FILTERS: Array<'Tous' | ProjectType> = ['Tous', ...PROJECT_TYPES];

const normalizeProject = (project: Project): Project => ({
  ...project,
  type: LEGACY_TYPE_MAP[project.type] ?? project.type,
  sector: LEGACY_SECTOR_MAP[project.sector] ?? project.sector,
});

interface DashboardProps {
  user: UserSession;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('Tous');
  const [selectedType, setSelectedType] = useState<'Tous' | ProjectType>('Tous');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects(user.orgId);
      const normalized = data
        .map((p) => normalizeProject(p))
        .sort((a, b) => b.createdAt - a.createdAt);
      setProjects(normalized);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Impossible de récupérer les projets.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user.orgId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSaveProject = async (payload: ProjectFormPayload) => {
    setSaving(true);
    setError(null);
    setInfoMessage(null);
    try {
      let saved: Project;
      if (payload.id) {
        await updateProjectApi(user.orgId, payload.id, payload);
        setInfoMessage(
          "Votre demande de modification du projet a été envoyée à l'administration pour validation.",
        );
        setShowForm(false);
        setEditingProject(null);
        return;
      } else {
        saved = await createProject(user.orgId, payload);
      }

      const normalized = normalizeProject(saved);

      setProjects((prev) => {
        const others = prev.filter((p) => p.id !== normalized.id);
        return [normalized, ...others].sort((a, b) => b.createdAt - a.createdAt);
      });

      setShowForm(false);
      setEditingProject(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'enregistrer le projet.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const exportToPDF = async () => {
    if (filteredProjects.length === 0) return;

    try {
      const activitiesByProject: Record<string, ProjectActivity[]> = {};

      await Promise.all(
        filteredProjects.map(async (project) => {
          try {
            const activities = await listProjectActivities(user.orgId, project.id);
            activitiesByProject[project.id] = activities;
          } catch {
            activitiesByProject[project.id] = [];
          }
        }),
      );

      const today = new Date().toLocaleDateString('fr-FR');

      const projectBlocks = filteredProjects
        .map((p) => {
          const activities = activitiesByProject[p.id] || [];
          const nowTs = Date.now();
          const startTs = new Date(p.startDate).getTime();
          const endTs = new Date(p.endDate).getTime();
          let progressPct = 0;
          if (endTs > startTs) {
            if (nowTs <= startTs) {
              progressPct = 0;
            } else if (nowTs >= endTs) {
              progressPct = 100;
            } else {
              progressPct = ((nowTs - startTs) / (endTs - startTs)) * 100;
            }
          }
          const remainingMonthsRaw = endTs > nowTs ? (endTs - nowTs) / (30 * 24 * 60 * 60 * 1000) : 0;
          const remainingMonths = remainingMonthsRaw > 0 ? Math.ceil(remainingMonthsRaw) : 0;

          const activitiesList = activities;

          // On n'utilise plus les métadonnées encodées dans location pour le PDF.
          // Toutes les informations proviennent désormais des champs structurés du projet.
          const descriptionItems: { label: string; value: string }[] = [];
          const otherItems: { label: string; value: string }[] = [];

          // Calcul de l'avancement en fonction des activités
          let activitiesProgressLabel = 'N/A';
          if (typeof p.activitiesPlanned === 'number' && p.activitiesPlanned > 0) {
            const pct = Math.round((activitiesList.length / p.activitiesPlanned) * 100);
            activitiesProgressLabel = `${pct}%`;
          }

          const escapeHtml = (value: string): string =>
            value
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

          const renderLine = (label: string, value: string) => {
            const safeLabel = escapeHtml(label);
            const safeValue = escapeHtml(value);
            return `<div style="margin:1px 0;line-height:1.4;"><strong>${safeLabel}:</strong> <span>${safeValue}</span></div>`;
          };

          const metaHtml =
            !p.beneficiariesType &&
            !p.beneficiariesPlanned &&
            !p.activitiesPlanned &&
            !p.projectManagerName &&
            !p.projectManagerPhone &&
            !p.projectManagerEmail
              ? '<p style="margin:4px 0 0 0;font-size:11px;color:#6b7280;">Aucun détail renseigné.</p>'
              :
                '<div style="margin:4px 0 0 0;font-size:11px;color:#111827;">' +
                // Bloc structuré basé sur les nouveaux champs du projet
                (p.beneficiariesType
                  ? renderLine('Type de bénéficiaires', p.beneficiariesType)
                  : '') +
                (typeof p.beneficiariesPlanned === 'number'
                  ? renderLine(
                      'Bénéficiaires prévus',
                      p.beneficiariesPlanned.toLocaleString('fr-FR'),
                    )
                  : '') +
                (typeof p.activitiesPlanned === 'number'
                  ? renderLine(
                      "Nombre d'activités prévues",
                      p.activitiesPlanned.toLocaleString('fr-FR'),
                    )
                  : '') +
                (p.projectManagerName
                  ? renderLine('Chef de projet', p.projectManagerName)
                  : '') +
                (p.projectManagerPhone
                  ? renderLine('Tél. chef de projet', p.projectManagerPhone)
                  : '') +
                (p.projectManagerEmail
                  ? renderLine('Email chef de projet', p.projectManagerEmail)
                  : '') +
                '</div>';

          // Construire le bloc bas: Description du projet (paragraphe) + Activités (titre + liste numérotée)
          const descriptionHtml = p.projectDescription
            ? `<p style="margin:4px 0 0 0;font-size:11px;color:#374151;white-space:pre-wrap;text-align:justify;line-height:1.5;">${escapeHtml(
                `Description du projet: ${p.projectDescription}`,
              )}</p>`
            : '';

          const totalBeneficiariesRecorded = activitiesList.reduce<number>((sum, a) => {
            if (!a || typeof a.beneficiariesCount !== 'number') return sum;
            if (Number.isNaN(a.beneficiariesCount) || a.beneficiariesCount < 0) return sum;
            return sum + a.beneficiariesCount;
          }, 0);
          const plannedBeneficiariesForExport =
            typeof p.beneficiariesPlanned === 'number' && p.beneficiariesPlanned > 0
              ? p.beneficiariesPlanned
              : null;
          const beneficiariesProgressForExport =
            plannedBeneficiariesForExport && plannedBeneficiariesForExport > 0
              ? Math.min((totalBeneficiariesRecorded / plannedBeneficiariesForExport) * 100, 999)
              : null;

          let activitiesHtml = '';
          if (activitiesList.length === 0) {
            activitiesHtml =
              '<p style="margin:4px 0 0 0;font-size:11px;color:#374151;"><strong>Activités du projet (0)</strong> Aucune activité enregistrée pour ce projet.</p>';
          } else {
            const headerHtml = `<p style="margin:4px 0 2px 0;font-size:11px;color:#374151;"><strong>Activités du projet (${activitiesList.length})</strong></p>`;
            const beneficiariesSummaryHtml =
              plannedBeneficiariesForExport && totalBeneficiariesRecorded > 0
                ? `<p style="margin:0 0 4px 0;font-size:11px;color:#374151;"><strong>Total bénéficiaires enregistrés :</strong> ${totalBeneficiariesRecorded.toLocaleString('fr-FR')} / ${plannedBeneficiariesForExport.toLocaleString('fr-FR')}$${
                    beneficiariesProgressForExport !== null
                      ? ` (${beneficiariesProgressForExport.toFixed(1)}%)`
                      : ''
                  }</p>`
                : '';
            const listHtml =
              '<ol style="margin:0 0 0 16px;padding:0;font-size:11px;color:#374151;">' +
              activitiesList
                .map((a) => {
                  let datePart = '';
                  if (a.date) {
                    let baseDate = new Date(a.date).toLocaleDateString('fr-FR');
                    let rangeDate = baseDate;
                    if (a.description) {
                      const match = a.description.match(
                        /(Date de fin prévue:|Date de fin de l'activité:)\s*([0-9/]+)/,
                      );
                      if (match && match[2]) {
                        const endStr = match[2];
                        rangeDate = `${baseDate} au ${endStr}`;
                      }
                    }
                    datePart = rangeDate;
                  }

                  const locationPart = a.location ? `Lieu : ${a.location}` : '';
                  const beneficiariesPart =
                    typeof a.beneficiariesCount === 'number' && a.beneficiariesCount > 0
                      ? `Bénéficiaires : ${a.beneficiariesCount.toLocaleString('fr-FR')}`
                      : '';
                  const infoParts = [datePart, locationPart, beneficiariesPart].filter((s) => s && s.length > 0);
                  const parenPart = infoParts.length > 0 ? ` (${infoParts.join(' | ')})` : '';
                  let descHtml = '';
                  if (a.description) {
                    const escapedDesc = escapeHtml(a.description);
                    const withBoldServices = escapedDesc.replace(
                      /Services gouvernementaux impliqués\s*:/gi,
                      '<strong>Services gouvernementaux impliqués:</strong>',
                    );
                    descHtml = `<div style="margin-top:1px;white-space:pre-wrap;text-align:justify;line-height:1.4;">${withBoldServices}</div>`;
                  }
                  const titleSafe = escapeHtml(a.title);
                  return `<li style="margin:4px 0 8px 0;line-height:1.4;"><strong>${titleSafe}</strong>${parenPart}${descHtml}</li>`;
                })
                .join('') +
              '</ol>';
            activitiesHtml = headerHtml + beneficiariesSummaryHtml + listHtml;
          }

          const bottomHtml = `${descriptionHtml}${activitiesHtml}`;

          const firstLine = p.projectName || p.id;

          return `
            <section style="margin-bottom:18px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">
              <h3 style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:#111827;text-align:center;">
                <span>${firstLine}</span>
              </h3>
              <p style="margin:0 0 2px 0;font-size:11px;color:#4b5563;text-align:center;">
                <strong>Bailleur :</strong> ${p.bailleur || '-'}
              </p>
              <p style="margin:0;font-size:11px;color:#4b5563;text-align:center;">
                <strong>ID projet :</strong> ${p.id} &nbsp;&nbsp;|
                &nbsp;&nbsp;<strong>Secteur :</strong> ${p.sector} &nbsp;&nbsp;|
                &nbsp;&nbsp;<strong>Type :</strong> ${p.type}
              </p>
              <p style="margin:2px 0 0 0;font-size:11px;color:#4b5563;text-align:center;">
                <strong>Période :</strong> ${new Date(p.startDate).toLocaleDateString('fr-FR')} 
                &rarr; ${new Date(p.endDate).toLocaleDateString('fr-FR')}
              </p>
              <p style="margin:2px 0 0 0;font-size:11px;color:#4b5563;text-align:center;">
                <strong>Avancement (temps) :</strong> ${Math.round(progressPct)}% &nbsp;&nbsp;|
                &nbsp;&nbsp;<strong>Mois restants (approx.) :</strong> ${remainingMonths}
              </p>
              <p style="margin:2px 0 0 0;font-size:11px;color:#4b5563;text-align:center;">
                <strong>Avancement (activités) :</strong> ${activitiesProgressLabel}
              </p>
              <p style="margin:2px 0 0 0;font-size:11px;color:#4b5563;text-align:center;">
                <strong>Localisation / métadonnées :</strong>
              </p>
              ${metaHtml}
              ${bottomHtml}
            </section>
          `;
        })
        .join('');

      const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charSet="utf-8" />
    <title>Registre des Projets - ${user.orgName}</title>
    <style>
      @page { margin: 16mm 14mm; }
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; color: #111827; }
      h1 { font-size: 18px; margin: 2px 0 4px 0; }
      h2 { font-size: 13px; margin: 12px 0 4px 0; }
      .header { border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 10px; }
      .meta { font-size: 11px; color: #4b5563; }
      .portal-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #6b7280; margin: 0; }
    </style>
  </head>
  <body>
    <header class="header">
      <p class="portal-title">Portail Humanitaire - SILA</p>
      <h1>Registre des Projets - ${user.orgName}</h1>
      <div class="meta">ID Organisation : ${user.orgId} &nbsp;&nbsp;|&nbsp;&nbsp; Date d'édition : ${today}</div>
    </header>
    <main>
      ${projectBlocks}
    </main>
  </body>
</html>`;

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    } catch (e) {
      console.error('Erreur lors de la génération du PDF', e);
      alert("Impossible de générer le PDF du registre pour le moment.");
    }
  };

  const now = Date.now();
  const activeCount = projects.filter((p) => new Date(p.endDate).getTime() >= now).length;
  const closingSoonCount = projects.filter((p) => {
    const endAt = new Date(p.endDate).getTime();
    return endAt >= now && endAt - now <= 45 * 24 * 60 * 60 * 1000;
  }).length;
  const humanitarianCount = projects.filter((p) => p.type === 'Humanitaire').length;

  const filteredProjects = projects.filter((p) => {
    const lowerSearch = searchTerm.toLowerCase();
    const text = `${p.projectName || ''} ${p.projectDescription || ''} ${p.bailleur || ''} ${
      p.location || ''
    }`.toLowerCase();
    const matchesSearch = text.includes(lowerSearch);
    const matchesSector = selectedSector === 'Tous' || p.sector === selectedSector;
    const matchesType = selectedType === 'Tous' || p.type === selectedType;
    return matchesSearch && matchesSector && matchesType;
  });

  // --- Constants classes for unified design ---
  const headerBgClass = "bg-[#002060] shadow-md border-b border-blue-900";
  const cardClass = "bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300";
  const inputClass = "focus:ring-[#002060] focus:border-[#002060] block w-full pl-10 sm:text-sm border-gray-300 rounded-lg p-2.5 shadow-sm bg-white";
  const selectClass = "focus:ring-[#002060] focus:border-[#002060] block w-full pl-10 p-2.5 sm:text-sm border-gray-300 rounded-lg shadow-sm appearance-none bg-white";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Organisation header */}
      <header className={headerBgClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <img
                  src="/logo-sila.png"
                  alt="Portail HUMANITAIRES SILA"
                  className="h-10 w-auto"
                  loading="lazy"
                />
              </div>

              {infoMessage && (
                <div className="fixed top-24 right-4 z-50 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-[#002060] shadow-lg animate-in fade-in slide-in-from-right-5">
                  {infoMessage}
                </div>
              )}
              
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Building className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <h1 className="flex items-center">
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-0.5 rounded-full text-[10px] font-bold text-blue-100 shadow-sm ring-1 ring-white/20 backdrop-blur-md uppercase tracking-wider">
                    <Building className="h-3 w-3" />
                    Portail Humanitaire SILA
                  </span>
                </h1>
                <p className="text-xs text-blue-200 font-medium pl-1">
                  Délégation de l'Action Sociale - Province de Sila
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:block text-right">
                <div className="text-sm font-bold text-white tracking-wide">{user.orgName}</div>
                <div className="text-[10px] text-blue-300 font-mono bg-blue-900/50 px-2 py-0.5 rounded inline-block mt-1">
                  ID: {user.orgId}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="group relative bg-white/10 hover:bg-red-500/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-white/10 hover:border-red-400/30"
              >
                <LogOut className="h-4 w-4 group-hover:text-red-200 transition-colors" />
                <span className="hidden sm:inline group-hover:text-red-100 transition-colors">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main site navigation header */}
      <nav className="bg-[#002060] text-white shadow-lg sticky top-0 z-40 border-t border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 overflow-x-auto whitespace-nowrap no-scrollbar">
             {/* Note: Colors hardcoded in original kept here but wrapped in cleaner layout */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="h-full flex items-center px-5 bg-[#003da5] font-bold text-xs hover:bg-[#004db5] transition-colors border-r border-blue-800/50 cursor-default"
            >
              ACCUEIL
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="h-full flex items-center px-5 font-bold text-xs hover:bg-white/10 transition-colors border-r border-blue-800/50 cursor-default"
            >
              A PROPOS
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="h-full flex items-center px-5 font-bold text-xs hover:bg-white/10 transition-colors border-r border-blue-800/50 cursor-default"
            >
              NOS PARTENAIRES
            </a>
            <a
              href="/#/org/panel"
              className="h-full flex items-center px-5 font-bold text-xs bg-[#FECB00] text-[#002060] hover:bg-[#ffe066] transition-colors border-r border-blue-800/50"
            >
              DASHBOARD PARTENAIRE
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="h-full flex items-center px-5 font-bold text-xs hover:bg-white/10 transition-colors border-r border-blue-800/50 cursor-default"
            >
              PROJETS & SUIVI
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="h-full flex items-center px-5 font-bold text-xs hover:bg-white/10 transition-colors border-r border-blue-800/50 cursor-default"
            >
              STATISTIQUES
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="h-full flex items-center px-5 font-bold text-xs hover:bg-white/10 transition-colors cursor-default"
            >
              CONTACT
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Page Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#002060] tracking-tight">Registre des Projets</h2>
            <p className="text-sm text-gray-500 mt-1">Gérez et suivez l'ensemble de vos interventions dans la province.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {projects.length > 0 && (
              <button
                onClick={exportToPDF}
                className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:text-[#002060] hover:border-[#002060]/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002060] transition-all shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </button>
            )}
            <button
              onClick={handleAddNew}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-5 py-2.5 border border-transparent shadow-md text-sm font-bold rounded-lg text-white bg-[#002060] hover:bg-[#003da5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002060] transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau Projet
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className={`${cardClass} border-l-4 border-l-blue-600`}>
            <div className="px-5 py-5 flex items-center">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <FileText className="h-6 w-6 text-blue-700" />
              </div>
              <div className="ml-4">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wide">Projets Déclarés</dt>
                <dd className="mt-1 text-3xl font-black text-[#002060]">{projects.length}</dd>
              </div>
            </div>
          </div>
          <div className={`${cardClass} border-l-4 border-l-yellow-500`}>
            <div className="px-5 py-5 flex items-center">
              <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                <LayoutDashboard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wide">Secteurs d'Activité</dt>
                <dd className="mt-1 text-3xl font-black text-[#002060]">
                  {new Set(projects.map((p) => p.sector)).size}
                </dd>
              </div>
            </div>
          </div>
          <div className={`${cardClass} border-l-4 border-l-red-500`}>
            <div className="px-5 py-5 flex items-center">
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-wide">Aide Humanitaire</dt>
                <dd className="mt-1 text-3xl font-black text-[#002060]">{humanitarianCount}</dd>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 flex items-start gap-3">
            <div className="text-red-500 mt-0.5">
              <X className="w-5 h-5" />
            </div>
            <div className="text-sm text-red-700 font-medium">{error}</div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className={inputClass}
              placeholder="Rechercher (Nom, Bailleur, Lieu...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className={selectClass}
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="Tous">Tous les secteurs</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <div className="relative">
              <select
                className={selectClass}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'Tous' | ProjectType)}
              >
                {TYPE_FILTERS.map((t) => (
                  <option value={t} key={t}>
                    {t === 'Tous' ? 'Tous les types' : t}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Project list */}
        <div className="bg-white shadow-sm border border-gray-200 sm:rounded-lg overflow-hidden mt-6">
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Liste des Projets</h3>
            <span className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded-full font-medium">
              {filteredProjects.length} dossier(s)
            </span>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-800"></div>
            </div>
          ) : (
            <ProjectTable projects={filteredProjects} onEdit={handleEditProject} orgId={user.orgId} />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>
              &copy; 2025 Délégation de l'Action Sociale, de la Solidarité et des Affaires Humanitaires.
            </p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <span>Province de Sila</span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold">Tutelle: CNARR &amp; ONASA</span>
            </div>
          </div>
        </div>
      </footer>

      {showForm && (
        <div
          className="fixed z-50 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setShowForm(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                  <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                    {editingProject ? 'Modifier le Projet' : 'Enregistrer un Projet'}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors bg-gray-100 p-1 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <ProjectForm
                  user={user}
                  initialData={editingProject}
                  onCancel={() => setShowForm(false)}
                  onSubmit={handleSaveProject}
                  isSubmitting={saving}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};