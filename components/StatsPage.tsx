import React, { useEffect, useState } from 'react';
import { PublicLayout } from './PublicLayout';
import {
  adminGetProvinceStructuralStats,
  adminListProvinceMonthlyStats,
  adminListSiteMonthlyStats,
  adminListSites,
  ProvinceStructuralStats,
  ProvinceMonthlyStat,
  SiteMonthlyStat,
  Site,
} from '../services/api';

const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const from = 0;
    const to = Number.isFinite(value) ? value : 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span className={className}>{displayValue.toLocaleString()}</span>
  );
};

export const StatsPage: React.FC = () => {
  const [provinceStructStats, setProvinceStructStats] = useState<ProvinceStructuralStats | null>(null);
  const [provinceMonthlyStats, setProvinceMonthlyStats] = useState<ProvinceMonthlyStat[]>([]);
  const [siteStats, setSiteStats] = useState<SiteMonthlyStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [detailView, setDetailView] = useState<'refugees' | 'returnees' | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        // Fetch structural stats, monthly stats and sites
        const [structStats, monthlyStats, sitesList] = await Promise.all([
          adminGetProvinceStructuralStats(),
          adminListProvinceMonthlyStats(),
          adminListSites(),
        ]);

        setProvinceStructStats(structStats);
        setProvinceMonthlyStats(monthlyStats || []);
        setSites(sitesList || []);

        // If we have monthly stats, fetch the site stats for the latest month
        if (monthlyStats && monthlyStats.length > 0) {
          const latest = monthlyStats[0];
          const sites = await adminListSiteMonthlyStats(latest.month, latest.year);
          setSiteStats(sites || []);
        }

      } catch (err) {
        console.error('Erreur chargement stats Province Sila', err);
        const msg =
          err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques provinciales.';
        setStatsError(msg);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const latestMonthly = provinceMonthlyStats.length > 0 ? provinceMonthlyStats[0] : null;

  // Calculate totals from site stats if available, otherwise fallback to province stats
  const calculatedRefugeesTotal = siteStats.reduce((acc, s) => acc + (s.ref_total_ind || 0), 0);
  const calculatedReturneesTotal = siteStats.reduce((acc, s) => acc + (s.ret_total_ind || 0), 0);

  // If site stats are empty (e.g. no data entered for sites yet), fallback to the manual province stats if they exist
  const displayRefugeesTotal = siteStats.length > 0 ? calculatedRefugeesTotal : (latestMonthly?.totalRefugees || 0);
  const displayReturneesTotal = siteStats.length > 0 ? calculatedReturneesTotal : (latestMonthly?.totalReturnees || 0);

  const monthNames: Record<string, string> = {
    '01': 'Janvier',
    '02': 'Fevrier',
    '03': 'Mars',
    '04': 'Avril',
    '05': 'Mai',
    '06': 'Juin',
    '07': 'Juillet',
    '08': 'Aout',
    '09': 'Septembre',
    '10': 'Octobre',
    '11': 'Novembre',
    '12': 'Decembre',
  };

  const latestLabelMonth = latestMonthly ? monthNames[latestMonthly.month] || latestMonthly.month : '';

  const cardBaseClass = `
    group relative flex flex-col justify-center items-center 
    w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52 
    rounded-full 
    bg-white border-4 border-white 
    shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_15px_35px_rgb(0,0,0,0.15)]
    transition-all duration-500 ease-out 
    transform hover:-translate-y-2 hover:scale-105 
    overflow-hidden cursor-pointer mx-auto
  `;

  const cardContentClass = "flex flex-col justify-center items-center text-center p-2 z-10 w-full";
  const titleClass = "text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-tight mb-1 sm:mb-2 group-hover:text-gray-600 transition-colors duration-300 px-2";
  const valueBaseClass = "text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tighter drop-shadow-sm";
  const colorBarClass = "absolute top-0 left-0 right-0 h-3 opacity-60 z-0 transition-all duration-700 group-hover:h-full group-hover:opacity-10";

  const handleToggleDetailView = (view: 'refugees' | 'returnees') => {
    setDetailView(detailView === view ? null : view);
  };

  return (
    <PublicLayout>
      <main className="flex-1 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col items-center justify-center text-center gap-3">
            <h1 className="text-3xl md:text-4xl font-black text-[#002060] tracking-tight">
              Statistiques Province Sila
            </h1>
            <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
              Aperçu des indicateurs sociaux clés et de l’évolution mensuelle des réfugiés et des retournés dans la Province de Sila.
            </p>
            {statsLoading && (
              <div className="flex items-center space-x-2 text-sm text-[#002060] font-medium mt-2 bg-blue-50 px-4 py-2 rounded-full">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Mise à jour des données...</span>
              </div>
            )}
          </header>

          {statsError ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-center shadow-sm max-w-lg mx-auto">
              {statsError}
            </div>
          ) : (
            <>
              {/* Structural cards */}
              <section className="space-y-8">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <span className="h-px w-8 sm:w-16 bg-gray-300"></span>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] text-center">
                    Données Sociales
                  </h2>
                  <span className="h-px w-8 sm:w-16 bg-gray-300"></span>
                </div>

                {/* Grid layout adjusted */}
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  {/* Card 1: Population */}
                  <div className={cardBaseClass}>
                    <div className={`${colorBarClass} bg-[#002060]`} />
                    <div className={cardContentClass}>
                      <p className={titleClass}>Population Totale</p>
                      {provinceStructStats ? (
                        <AnimatedNumber
                          value={provinceStructStats.populationTotal}
                          className={`${valueBaseClass} text-[#002060]`}
                        />
                      ) : (
                        <p className={`${valueBaseClass} text-gray-300`}>--</p>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Handicapées */}
                  <div className={cardBaseClass}>
                    <div className={`${colorBarClass} bg-[#002060]`} />
                    <div className={cardContentClass}>
                      <p className={titleClass}>Handicapées</p>
                      {provinceStructStats ? (
                        <AnimatedNumber
                          value={provinceStructStats.disabledTotal}
                          className={`${valueBaseClass} text-[#002060]`}
                        />
                      ) : (
                        <p className={`${valueBaseClass} text-gray-300`}>--</p>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Vulnérables */}
                  <div className={cardBaseClass}>
                    <div className={`${colorBarClass} bg-[#002060]`} />
                    <div className={cardContentClass}>
                      <p className={titleClass}>Vulnérables</p>
                      {provinceStructStats ? (
                        <AnimatedNumber
                          value={provinceStructStats.veryVulnerable}
                          className={`${valueBaseClass} text-[#002060]`}
                        />
                      ) : (
                        <p className={`${valueBaseClass} text-gray-300`}>--</p>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Inondations */}
                  <div className={cardBaseClass}>
                    <div className={`${colorBarClass} bg-sky-600`} />
                    <div className={cardContentClass}>
                      <p className={titleClass}>Inondations</p>
                      {provinceStructStats ? (
                        <AnimatedNumber
                          value={provinceStructStats.floodAffected}
                          className={`${valueBaseClass} text-sky-700`}
                        />
                      ) : (
                        <p className={`${valueBaseClass} text-gray-300`}>--</p>
                      )}
                    </div>
                  </div>

                  {/* Card 5: Incendies */}
                  <div className={cardBaseClass}>
                    <div className={`${colorBarClass} bg-orange-600`} />
                    <div className={cardContentClass}>
                      <p className={titleClass}>Incendies</p>
                      {provinceStructStats ? (
                        <AnimatedNumber
                          value={provinceStructStats.fireAffected}
                          className={`${valueBaseClass} text-orange-700`}
                        />
                      ) : (
                        <p className={`${valueBaseClass} text-gray-300`}>--</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Latest month evolution */}
              <section className="space-y-8 mt-12">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <span className="h-px w-8 sm:w-16 bg-gray-300"></span>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                      Evolution Mensuelle
                    </h2>
                    <span className="h-px w-8 sm:w-16 bg-gray-300"></span>
                  </div>
                  {latestMonthly && (
                    <span className="inline-block bg-white border border-gray-200 text-gray-500 text-[10px] font-bold px-4 py-1.5 rounded-full shadow-sm">
                      {latestLabelMonth} {latestMonthly.year}
                    </span>
                  )}
                </div>

                {!latestMonthly ? (
                  <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 italic">Aucune donnée mensuelle disponible pour le moment.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                      {/* Monthly Card 1: Total Refugees */}
                      <div
                        className={cardBaseClass}
                        onClick={() => handleToggleDetailView('refugees')}
                      >
                        <div className={`${colorBarClass} bg-[#FECB00]`} />
                        <div className={cardContentClass}>
                          <p className={titleClass}>Total Réfugiés</p>
                          <AnimatedNumber
                            value={displayRefugeesTotal}
                            className={`${valueBaseClass} text-[#002060]`}
                          />
                          {detailView === 'refugees' && (
                            <span className="mt-1 text-[9px] font-semibold text-[#002060] uppercase tracking-wide">
                              Voir les camps
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Monthly Card 2: New Refugees */}
                      <div className={cardBaseClass}>
                        <div className={`${colorBarClass} bg-emerald-500`} />
                        <div className={cardContentClass}>
                          <p className={titleClass}>Nouveaux Réfugiés</p>
                          <AnimatedNumber
                            value={latestMonthly.newRefugees}
                            className={`${valueBaseClass} text-emerald-600`}
                          />
                        </div>
                      </div>

                      {/* Monthly Card 3: Total Returnees */}
                      <div
                        className={cardBaseClass}
                        onClick={() => handleToggleDetailView('returnees')}
                      >
                        <div className={`${colorBarClass} bg-[#002060]`} />
                        <div className={cardContentClass}>
                          <p className={titleClass}>Total Retournés</p>
                          <AnimatedNumber
                            value={displayReturneesTotal}
                            className={`${valueBaseClass} text-[#002060]`}
                          />
                          {detailView === 'returnees' && (
                            <span className="mt-1 text-[9px] font-semibold text-[#002060] uppercase tracking-wide">
                              Voir les sites
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Monthly Card 4: New Returnees */}
                      <div className={cardBaseClass}>
                        <div className={`${colorBarClass} bg-emerald-500`} />
                        <div className={cardContentClass}>
                          <p className={titleClass}>Nouveaux Retournés</p>
                          <AnimatedNumber
                            value={latestMonthly.newReturnees}
                            className={`${valueBaseClass} text-emerald-600`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detailed per-site breakdown when a total card is active */}
                    {detailView && siteStats.length > 0 && (
                      <div className="mt-10 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xs sm:text-sm font-extrabold text-[#002060] uppercase tracking-widest">
                              {detailView === 'refugees'
                                ? 'Camps des Réfugiés - Détail par site'
                                : 'Sites des Retournés - Détail par site'}
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-1">
                              Cliquez à nouveau sur la carte pour masquer ce détail.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailView(null)}
                            className="text-[11px] px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            Fermer
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sites
                            .filter((s) =>
                              detailView === 'refugees' ? s.kind === 'refugees' : s.kind === 'returnees',
                            )
                            .map((s) => {
                              const stat = siteStats.find((st) => st.siteId === s.id);
                              const totalInd = detailView === 'refugees'
                                ? stat?.ref_total_ind || 0
                                : stat?.ret_total_ind || 0;
                              const totalHh = detailView === 'refugees'
                                ? stat?.ref_total_hh || 0
                                : stat?.ret_total_hh || 0;

                              return (
                                <div
                                  key={s.id}
                                  className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm flex flex-col gap-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                                        {s.name}
                                      </p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {detailView === 'refugees' ? 'Camp de réfugiés' : 'Site de retournés'}
                                      </p>
                                    </div>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                        detailView === 'refugees'
                                          ? 'border-blue-200 text-blue-700 bg-blue-50'
                                          : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                      }`}
                                    >
                                      {latestLabelMonth} {latestMonthly.year}
                                    </span>
                                  </div>

                                  <div className="mt-2 grid grid-cols-2 gap-3 text-[11px]">
                                    <div className="flex flex-col px-2 py-1.5 rounded-lg bg-white border border-gray-100">
                                      <span className="text-[10px] text-gray-500 uppercase mb-0.5">Individus</span>
                                      <span
                                        className={`font-mono text-sm font-extrabold ${
                                          detailView === 'refugees'
                                            ? 'text-blue-700'
                                            : 'text-emerald-700'
                                        }`}
                                      >
                                        {totalInd.toLocaleString()}
                                      </span>
                                    </div>

                                    <div className="flex flex-col px-2 py-1.5 rounded-lg bg-white border border-gray-100">
                                      <span className="text-[10px] text-gray-500 uppercase mb-0.5">Ménages</span>
                                      <span
                                        className={`font-mono text-sm font-extrabold ${
                                          detailView === 'refugees'
                                            ? 'text-blue-700'
                                            : 'text-emerald-700'
                                        }`}
                                      >
                                        {totalHh.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </PublicLayout>
  );
};