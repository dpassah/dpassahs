import React, { useEffect, useState } from 'react';
import { PublicLayout } from './PublicLayout';
import { listPublicProjectsWithActivities, PublicProjectWithActivities } from '../services/api';

export const ProjectsPage: React.FC = () => {
  const [items, setItems] = useState<PublicProjectWithActivities[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vue: projets (actuelle) ou activités (toutes les activités avec filtres)
  const [viewMode, setViewMode] = useState<'projects' | 'activities'>('projects');

  // Filtres pour la vue activités
  const [filterLocation, setFilterLocation] = useState('');
  const [filterGov, setFilterGov] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'past' | 'upcoming'>('all');

  // Expansion des cartes activités dans la vue "Vue par activités"
  const [expandedFlatActivityIds, setExpandedFlatActivityIds] = useState<Set<string>>(new Set());

  // استخدام Set للسماح بفتح أكثر من مشروع في نفس الوقت
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  // استخدام Set للسماح بفتح تفاصيل أكثر من نشاط في نفس الوقت
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listPublicProjectsWithActivities();
        setItems(data);
      } catch (err: any) {
        setError(err?.message || 'Erreur lors du chargement des projets.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleProject = (id: string) => {
    setExpandedProjectIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleActivity = (id: string) => {
    setExpandedActivityIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // دوال مساعدة لحساب التواريخ لتقليل تكرار الكود
  const isPast = (d: Date, today: Date) => {
    const dY = d.getFullYear(); const dM = d.getMonth(); const dD = d.getDate();
    const tY = today.getFullYear(); const tM = today.getMonth(); const tD = today.getDate();
    return dY < tY || (dY === tY && (dM < tM || (dM === tM && dD < tD)));
  };

  const isFuture = (d: Date, today: Date) => {
    const dY = d.getFullYear(); const dM = d.getMonth(); const dD = d.getDate();
    const tY = today.getFullYear(); const tM = today.getMonth(); const tD = today.getDate();
    return dY > tY || (dY === tY && (dM > tM || (dM === tM && dD > tD)));
  };

  const allActivities = React.useMemo(
    () => {
      const today = new Date();
      const list: Array<{
        id: string;
        title: string;
        description?: string | null;
        date?: string | null;
        location?: string | null;
        statusLabel: 'past' | 'upcoming' | 'none';
        orgName: string;
        projectName: string;
        govServices?: string | null;
      }> = [];

      for (const item of items) {
        for (const act of item.activities) {
          let statusLabel: 'past' | 'upcoming' | 'none' = 'none';
          if (act.date) {
            const d = new Date(act.date);
            if (!Number.isNaN(d.getTime())) {
              if (isPast(d, today)) statusLabel = 'past';
              else if (isFuture(d, today)) statusLabel = 'upcoming';
            }
          }

          list.push({
            id: act.id,
            title: act.title,
            description: act.description,
            date: act.date,
            location: act.location,
            statusLabel,
            orgName: item.orgName,
            projectName: item.project.projectName || 'Projet sans titre',
            govServices: act.govServices,
          });
        }
      }

      return list;
    },
    [items],
  );

  const filteredActivities = React.useMemo(
    () =>
      allActivities.filter((a) => {
        if (filterLocation && !(a.location || '').toLowerCase().includes(filterLocation.toLowerCase())) return false;
        if (filterGov && !(a.govServices || '').toLowerCase().includes(filterGov.toLowerCase())) return false;

        if (filterStatus === 'past' && a.statusLabel !== 'past') return false;
        if (filterStatus === 'upcoming' && a.statusLabel !== 'upcoming') return false;
        return true;
      }),
    [allActivities, filterLocation, filterGov, filterStatus],
  );

  return (
    <PublicLayout>
      <main className="flex-1 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col items-center justify-center text-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-[#002060] tracking-tight">
              Projets & Suivi
            </h1>
            <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
              Aperçu des projets humanitaires et sociaux dans la Province de Sila et de leurs activités
              exécutées sur le terrain.
            </p>
            {loading && (
              <div className="flex items-center space-x-2 text-sm text-[#002060] font-medium mt-2 bg-blue-50 px-4 py-2 rounded-full">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Chargement des données...</span>
              </div>
            )}
          </header>

          {error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-center shadow-sm max-w-lg mx-auto">
              {error}
            </div>
          ) : (
            <section className="space-y-8">
              {/* Sous-onglets */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex rounded-full bg-white shadow-sm border border-gray-200 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('projects')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      viewMode === 'projects'
                        ? 'bg-[#002060] text-white shadow'
                        : 'text-gray-600 hover:text-[#002060] hover:bg-gray-50'
                    }`}
                  >
                    Vue par projets
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('activities')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      viewMode === 'activities'
                        ? 'bg-[#002060] text-white shadow'
                        : 'text-gray-600 hover:text-[#002060] hover:bg-gray-50'
                    }`}
                  >
                    Vue par activités
                  </button>
                </div>
              </div>

              {viewMode === 'projects' && (
                <>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <span className="h-px w-8 sm:w-16 bg-gray-300" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] text-center">
                      Liste des projets
                    </h2>
                    <span className="h-px w-8 sm:w-16 bg-gray-300" />
                  </div>

                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
                      <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl text-gray-300">📂</span>
                      </div>
                      <p className="text-gray-500 font-medium">Aucun projet public disponible</p>
                      <p className="text-gray-400 text-sm mt-1 max-w-md">
                        Les projets enregistrés et leurs activités apparaîtront ici dès qu'ils seront publiés par la délégation.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:gap-8">
                      {items.map((item) => {
                        // Logic to count executed vs programmed
                        const executedCount = item.activities.filter((act) => {
                          if (!act.date) return false;
                          const d = new Date(act.date);
                          const today = new Date();
                          if (Number.isNaN(d.getTime())) return false;
                          return isPast(d, today);
                        }).length;

                        const programmedCount = item.activities.filter((act) => {
                          if (!act.date) return false;
                          const d = new Date(act.date);
                          const today = new Date();
                          if (Number.isNaN(d.getTime())) return false;
                          return isFuture(d, today);
                        }).length;

                        const isExpanded = expandedProjectIds.has(item.project.id);

                        const locationSegments: string[] = (() => {
                          const raw = item.project.location?.trim();
                          if (!raw) return [];
                          return raw
                            .split('||')
                            .map((part) => part.trim())
                            .filter((part) => part.length > 0);
                        })();

                        return (
                          <div
                            key={item.project.id}
                            className="group bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden transition-all duration-300"
                          >
                            {/* Project Header - Clickable */}
                            <div
                              className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-gradient-to-r from-white to-slate-50/50 cursor-pointer select-none"
                              onClick={() => toggleProject(item.project.id)}
                            >
                              {/* Left Side: ID, Org, Title */}
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider">
                                    ID: {item.project.id}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    {item.orgName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-xl md:text-2xl font-bold text-[#002060] leading-tight group-hover:text-blue-800 transition-colors">
                                    {item.project.projectName || 'Projet sans titre'}
                                  </h3>
                                  {/* Animated Arrow */}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`text-gray-400 transition-transform duration-300 ${
                                      isExpanded ? 'rotate-180' : 'rotate-0'
                                    }`}
                                  >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </div>
                              </div>

                              {/* Right Side: Activity Stats & Location/Tags */}
                              <div className="flex flex-col gap-2 pointer-events-none items-start md:items-end">
                                {/* Activity Stats (Moved to Header) */}
                                <div className="flex flex-col items-start md:items-end text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span>Activités programmées ({programmedCount})</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span>Activités exécutées ({executedCount})</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center justify-start md:justify-end">
                                  {item.project.sector && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#002060] border border-blue-100 shadow-sm">
                                      {item.project.sector}
                                    </span>
                                  )}
                                  {item.project.type && (
                                    <span className="text-[11px] font-medium text-gray-500">
                                      {item.project.type}
                                    </span>
                                  )}
                                </div>
                                {locationSegments.length > 0 && (
                                  <div className="flex items-start gap-1 text-[11px] text-gray-600 justify-start md:justify-end text-left md:text-right">
                                    <span className="mt-0.5">📍</span>
                                    <div className="space-y-0.5">
                                      {locationSegments.map((seg) => (
                                        <div key={seg} className="whitespace-pre-wrap break-words">
                                          {seg}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Divider - Only visible if expanded */}
                            {isExpanded && <div className="h-px bg-gray-100 w-full" />}

                            {/* Activities Section */}
                            {isExpanded && (
                              <div className="p-6 md:p-8 pt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                {item.activities.length === 0 ? (
                                  <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-100">
                                    <p className="text-sm text-gray-400 italic">
                                      Aucune activité exécutée n&apos;est encore enregistrée pour ce projet.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {item.activities.map((act) => {
                                      const isActivityExpanded = expandedActivityIds.has(act.id);

                                      let statusLabel: 'past' | 'upcoming' | 'none' = 'none';
                                      if (act.date) {
                                        const d = new Date(act.date);
                                        const today = new Date();
                                        if (!Number.isNaN(d.getTime())) {
                                          if (isPast(d, today)) statusLabel = 'past';
                                          else if (isFuture(d, today)) statusLabel = 'upcoming';
                                        }
                                      }

                                      const statusConfig =
                                        statusLabel === 'past'
                                          ? {
                                              bg: 'bg-emerald-50',
                                              text: 'text-emerald-700',
                                              border: 'border-emerald-200',
                                              dot: 'bg-emerald-500',
                                              label: 'Complétée',
                                            }
                                          : statusLabel === 'upcoming'
                                          ? {
                                              bg: 'bg-amber-50',
                                              text: 'text-amber-700',
                                              border: 'border-amber-200',
                                              dot: 'bg-amber-500',
                                              label: 'À venir',
                                            }
                                          : {
                                              bg: 'bg-gray-50',
                                              text: 'text-gray-500',
                                              border: 'border-gray-200',
                                              dot: 'bg-gray-400',
                                              label: null,
                                            };

                                      return (
                                        <div
                                          key={act.id}
                                          className="relative flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all group/card cursor-pointer"
                                          onClick={() => toggleActivity(act.id)}
                                        >
                                          <div className="space-y-1.5 mb-3">
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-800 text-sm leading-snug">
                                                  {act.title || 'Activité sans titre'}
                                                </p>

                                                {/* RED COLOR FOR GOV SERVICES */}
                                                {act.govServices && (
                                                  <p
                                                    className="mt-0.5 text-[11px] font-bold text-red-600 truncate"
                                                    title={act.govServices}
                                                  >
                                                    Services Gouv: {act.govServices}
                                                  </p>
                                                )}

                                                {act.date && (
                                                  (() => {
                                                    const d = new Date(act.date);
                                                    const label = Number.isNaN(d.getTime())
                                                      ? (typeof act.date === 'string' ? act.date.slice(0, 10) : String(act.date))
                                                      : d.toLocaleDateString('fr-FR', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                        });
                                                    return (
                                                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md mt-1">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                                                        {label}
                                                      </span>
                                                    );
                                                  })()
                                                )}
                                              </div>
                                              {statusConfig.label && (
                                                <span
                                                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}
                                                >
                                                  {statusConfig.label}
                                                </span>
                                              )}
                                            </div>
                                            {act.description && (
                                              <p
                                                className={
                                                  isActivityExpanded
                                                    ? 'text-xs text-gray-600 leading-relaxed whitespace-pre-wrap'
                                                    : 'text-xs text-gray-500 line-clamp-2 leading-relaxed'
                                                }
                                              >
                                                {act.description}
                                              </p>
                                            )}
                                            {act.location && (
                                              <span className="text-gray-400 truncate max-w-[120px] text-[11px] block mt-1">
                                                📍 {act.location}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {viewMode === 'activities' && (
                <section className="space-y-6">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <span className="h-px w-8 sm:w-16 bg-gray-300" />
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] text-center">
                      Toutes les activités
                    </h2>
                    <span className="h-px w-8 sm:w-16 bg-gray-300" />
                  </div>

                  {/* Filtres */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5 flex flex-col gap-3 md:gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600">Lieu / Localité</label>
                        <input
                          type="text"
                          value={filterLocation}
                          onChange={(e) => setFilterLocation(e.target.value)}
                          placeholder="Filtrer par lieu (ex: Zabout)"
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#002060] focus:border-[#002060]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600">Service gouvernemental</label>
                        <input
                          type="text"
                          value={filterGov}
                          onChange={(e) => setFilterGov(e.target.value)}
                          placeholder="Filtrer par service (ex: MSP, MEN, ... )"
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#002060] focus:border-[#002060]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-gray-600">Statut</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'past' | 'upcoming')}
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#002060] focus:border-[#002060]"
                        >
                          <option value="all">Tous</option>
                          <option value="upcoming">À venir</option>
                          <option value="past">Terminées</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterLocation('');
                          setFilterGov('');
                          setFilterStatus('all');
                        }}
                        className="text-[11px] text-gray-500 hover:text-[#002060] hover:underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </div>

                  {/* Liste des activités */}
                  {filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
                      <p className="text-gray-500 font-medium text-sm">Aucune activité ne correspond aux filtres.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                      {filteredActivities.map((act) => {
                        const isExpanded = expandedFlatActivityIds.has(act.id);
                        const statusConfig =
                          act.statusLabel === 'past'
                            ? {
                                bg: 'bg-emerald-50',
                                text: 'text-emerald-700',
                                border: 'border-emerald-200',
                                dot: 'bg-emerald-500',
                                label: 'Terminée',
                              }
                            : act.statusLabel === 'upcoming'
                            ? {
                                bg: 'bg-amber-50',
                                text: 'text-amber-700',
                                border: 'border-amber-200',
                                dot: 'bg-amber-500',
                                label: 'À venir',
                              }
                            : {
                                bg: 'bg-gray-50',
                                text: 'text-gray-500',
                                border: 'border-gray-200',
                                dot: 'bg-gray-400',
                                label: null,
                              };

                        const dateLabel = (() => {
                          if (!act.date) return null;
                          const d = new Date(act.date);
                          if (Number.isNaN(d.getTime())) return act.date?.toString() ?? null;
                          return d.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        })();

                        return (
                          <div
                            key={act.id}
                            onClick={() => {
                              setExpandedFlatActivityIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(act.id)) next.delete(act.id);
                                else next.add(act.id);
                                return next;
                              });
                            }}
                            className="flex flex-col justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer"
                          >
                            <div className="space-y-2 mb-2">
                              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                <span className="block truncate">{act.orgName}</span>
                                {act.govServices && (
                                  <span
                                    className="block mt-0.5 text-[10px] font-semibold text-emerald-700 normal-case truncate"
                                    title={act.govServices}
                                  >
                                    {act.govServices}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm font-bold text-[#002060] leading-snug line-clamp-2">
                                Projet: {act.projectName}
                              </h3>
                              <p className={isExpanded ? 'text-xs font-semibold text-gray-700' : 'text-xs font-semibold text-gray-700 line-clamp-2'}>
                                {act.title}
                              </p>
                              {act.description && (
                                <p
                                  className={
                                    isExpanded
                                      ? 'text-[11px] text-gray-600 leading-snug whitespace-pre-wrap'
                                      : 'text-[11px] text-gray-600 line-clamp-3 leading-snug'
                                  }
                                >
                                  {act.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                              <div className="flex items-center gap-2">
                                {dateLabel && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50">
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                    {dateLabel}
                                  </span>
                                )}
                                {act.location && (
                                  <span className="truncate max-w-[120px]">📍 {act.location}</span>
                                )}
                              </div>
                              {statusConfig.label && (
                                <span
                                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}
                                >
                                  {statusConfig.label}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </section>
          )}
        </div>
      </main>
    </PublicLayout>
  );
};