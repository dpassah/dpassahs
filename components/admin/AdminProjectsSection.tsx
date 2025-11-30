import React from 'react';
import { Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectRow {
  id: string;
  orgId?: string;
  orgName?: string;
  projectName?: string;
  type?: string;
  sector?: string;
  location?: string;
  projectDescription?: string;
  beneficiariesType?: string;
  beneficiariesPlanned?: string | number;
  projectManagerName?: string;
  projectManagerPhone?: string;
}

interface AdminProjectsSectionProps {
  projects: ProjectRow[];
  projectsLoading: boolean;
  projectTotal: number;
  projectSearch: string;
  setProjectSearch: (v: string) => void;
  projectPage: number;
  projectPageSize: number;
  expandedProjectId: string | null;
  setExpandedProjectId: (v: string | null) => void;
  loadProjectsPage: (page: number, search: string) => Promise<void> | void;
  adminListProjectsPaged: (page: number, pageSize: number, search: string) => Promise<{ items?: ProjectRow[]; total?: number; page?: number }>;
  exportProjectsToPdf: (rows: ProjectRow[], popup: Window) => void;
  SectionHeader: React.ComponentType<{
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
  }>;
  ActionButton: React.ComponentType<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }
  >;
}

export const AdminProjectsSection: React.FC<AdminProjectsSectionProps> = ({
  projects,
  projectsLoading,
  projectTotal,
  projectSearch,
  setProjectSearch,
  projectPage,
  projectPageSize,
  expandedProjectId,
  setExpandedProjectId,
  loadProjectsPage,
  adminListProjectsPaged,
  exportProjectsToPdf,
  SectionHeader,
  ActionButton,
}) => {
  return (
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
                  const popup = window.open('', '_blank');

                  if (!popup) {
                    alert('Le navigateur a bloqué la fenêtre de téléchargement. Veuillez autoriser les pop-ups.');
                    return;
                  }

                  popup.document.write(
                    '<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><h3>Génération du PDF en cours...<br>Veuillez patienter...</h3></body></html>',
                  );

                  try {
                    const q = projectSearch.trim();
                    const res = await adminListProjectsPaged(1, 5000, q);
                    exportProjectsToPdf(res.items || [], popup);
                  } catch (err) {
                    console.error('Export projects error', err);
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

        {projectsLoading ? (
          <div className="text-center py-10 text-gray-400 text-xs animate-pulse">
            Chargement des données...
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-xs bg-gray-50 rounded-lg">
            Aucun projet enregistré.
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(projectTotal / projectPageSize));
            const currentPage = Math.min(projectPage, totalPages);
            const visibleProjects = projects;

            return (
              <>
                <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2 px-1">
                  <span>
                    Affichage {visibleProjects.length} sur {projectTotal} projets
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => loadProjectsPage(currentPage - 1, projectSearch)}
                      className="hover:text-blue-700 disabled:opacity-30"
                    >
                      Précédent
                    </button>
                    <span>
                      Page {currentPage} / {totalPages}
                    </span>
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
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-4 text-xs text-gray-400"
                          >
                            Aucun résultat.
                          </td>
                        </tr>
                      ) : (
                        visibleProjects.map((p) => (
                          <React.Fragment key={`${p.orgId}-${p.id}`}>
                            <tr
                              onClick={() =>
                                setExpandedProjectId((prev) => (prev === p.id ? null : p.id))
                              }
                              className={`cursor-pointer transition-colors ${
                                expandedProjectId === p.id
                                  ? 'bg-blue-50/50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-3 text-[11px] font-bold text-[#002060]">
                                {p.projectName || p.id}
                              </td>
                              <td className="px-4 py-3 text-[10px] text-gray-600">
                                {p.type}
                              </td>
                              <td className="px-4 py-3 text-[10px] text-gray-600">
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                  {p.sector}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-mono text-gray-500">
                                {p.id}
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-gray-700">
                                {p.orgName}
                              </td>
                              <td className="px-2 text-center text-gray-400">
                                {expandedProjectId === p.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </td>
                            </tr>
                            {expandedProjectId === p.id && (
                              <tr className="bg-blue-50/20">
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="bg-white border border-blue-100 rounded-md p-4 shadow-inner">
                                    <h4 className="text-xs font-bold text-[#002060] mb-2 uppercase border-b border-gray-100 pb-1">
                                      Détails du Projet
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-[11px] text-gray-600">
                                      <div className="col-span-full mb-1">
                                        <span className="font-bold text-gray-800 block mb-0.5">
                                          Description:
                                        </span>
                                        <p className="leading-relaxed">
                                          {p.projectDescription || 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="font-bold text-gray-800">
                                          Localisation:
                                        </span>{' '}
                                        {p.location}
                                      </div>
                                      <div>
                                        <span className="font-bold text-gray-800">
                                          Bénéficiaires (Type):
                                        </span>{' '}
                                        {p.beneficiariesType}
                                      </div>
                                      <div>
                                        <span className="font-bold text-gray-800">
                                          Bénéficiaires (Prévus):
                                        </span>{' '}
                                        {p.beneficiariesPlanned}
                                      </div>
                                      <div>
                                        <span className="font-bold text-gray-800">
                                          Chef de Projet:
                                        </span>{' '}
                                        {p.projectManagerName || '-'}
                                      </div>
                                      <div>
                                        <span className="font-bold text-gray-800">
                                          Contact:
                                        </span>{' '}
                                        {p.projectManagerPhone || '-'}
                                      </div>
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
  );
};
