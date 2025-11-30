import React from 'react';
import { Calendar, MapPin, Search, Download } from 'lucide-react';

interface ActivityRow {
  id: string;
  orgName?: string;
  projectId?: string;
  projectName?: string;
  title?: string;
  description?: string | null;
  date?: string | null;
  location?: string | null;
}

interface AdminProjectActivitiesSectionProps {
  allActivities: ActivityRow[];
  allActivitiesLoading: boolean;
  activitySearch: string;
  setActivitySearch: (v: string) => void;
  activityPage: number;
  activityPageSize: number;
  activityTotal: number;
  activityProjectFilter: string;
  setActivityProjectFilter: (v: string) => void;
  activityStatusFilter: string;
  setActivityStatusFilter: (v: string) => void;
  adminListActivitiesPaged: (page: number, pageSize: number, search: string) => Promise<{ items?: ActivityRow[]; total?: number; page?: number }>;
  exportActivitiesToPdf: (rows: ActivityRow[], popup: Window) => void;
  loadActivitiesPage: (page: number, search: string) => Promise<void> | void;
  SectionHeader: React.ComponentType<{
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
  }>;
  ActionButton: React.ComponentType<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }
  >;
  inputClassName: string;
  labelClassName: string;
}

export const AdminProjectActivitiesSection: React.FC<AdminProjectActivitiesSectionProps> = ({
  allActivities,
  allActivitiesLoading,
  activitySearch,
  setActivitySearch,
  activityPage,
  activityPageSize,
  activityTotal,
  activityProjectFilter,
  setActivityProjectFilter,
  activityStatusFilter,
  setActivityStatusFilter,
  adminListActivitiesPaged,
  exportActivitiesToPdf,
  loadActivitiesPage,
  SectionHeader,
  ActionButton,
  inputClassName,
  labelClassName,
}) => {
  return (
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
                    <option key={id} value={id as string}>
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

                  popup.document.write(
                    '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h3>Génération du PDF en cours...<br>Veuillez patienter...</h3></body></html>',
                  );

                  try {
                    const q = activitySearch.trim();
                    const res = await adminListActivitiesPaged(1, 5000, q);
                    exportActivitiesToPdf(res.items || [], popup);
                  } catch (err) {
                    console.error('Export activities error', err);
                    popup.document.body.innerHTML =
                      '<h3 style="color:red">Erreur lors de la récupération des données.</h3>';
                  }
                }}
              >
                <Download className="h-3.5 w-3.5 text-gray-600" />
              </ActionButton>
            </div>
          }
        />

        {allActivitiesLoading ? (
          <div className="text-center py-10 text-gray-400 text-xs animate-pulse">
            Chargement des activités...
          </div>
        ) : allActivities.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs bg-gray-50 rounded-lg">
            Aucune activité trouvée.
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
                    const d = new Date(a.date as string);
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
                  <span>
                    Affichage de {visible.length} sur {activityTotal} activités
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => loadActivitiesPage(currentPage - 1, activitySearch)}
                      className="hover:text-blue-700 disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <span>
                      Page {currentPage} / {totalPages}
                    </span>
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
                    <div className="text-center text-xs text-gray-400 py-4">
                      Aucun résultat.
                    </div>
                  ) : (
                    visible.map((a) => {
                      const hasDate = !!a.date;
                      let isCompleted = false;
                      if (hasDate) {
                        const d = new Date(a.date as string);
                        const t = new Date();
                        t.setHours(0, 0, 0, 0);
                        d.setHours(0, 0, 0, 0);
                        isCompleted = d < t;
                      }

                      return (
                        <div
                          key={a.id}
                          className="group bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 relative overflow-hidden"
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${
                              isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          ></div>
                          <div className="flex-1 pl-2">
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#002060] transition-colors">
                                {a.title}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                  isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}
                              >
                                {isCompleted ? 'Complété' : 'À venir'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 mt-1 mb-2 line-clamp-2">
                              {a.description || (
                                <span className="italic text-gray-400">Pas de description</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                <span className="font-bold text-gray-700">Org:</span> {a.orgName}
                              </span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                <span className="font-bold text-gray-700">Projet:</span> {a.projectId}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-3 sm:gap-1 text-[10px] text-gray-500 sm:w-40 sm:text-right sm:border-l sm:border-gray-100 sm:pl-4 justify-between sm:justify-center">
                            <div className="flex items-center sm:justify-end gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-blue-800" />
                              <span className="font-medium">{a.date || 'N/A'}</span>
                            </div>
                            <div className="flex items-center sm:justify-end gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-blue-800" />
                              <span className="font-medium">{a.location || 'N/A'}</span>
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
      </section>
    </div>
  );
};
