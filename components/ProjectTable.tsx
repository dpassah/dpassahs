import React from 'react';
import { Project, ProjectActivity, Sector } from '../types';
import { MapPin, Calendar, Tag, Pencil, ChevronDown } from 'lucide-react';
import { listProjectActivities } from '../services/api';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  orgId: string;
}

const sectorBadgeClasses: Record<Sector, string> = {
  [Sector.SANTE]: 'bg-green-100 text-green-800',
  [Sector.EAU_WASH]: 'bg-blue-100 text-blue-800',
  [Sector.EDUCATION]: 'bg-yellow-100 text-yellow-800',
  [Sector.PROTECTION]: 'bg-purple-100 text-purple-800',
  [Sector.SECURITE_ALIMENTAIRE]: 'bg-orange-100 text-orange-800',
  [Sector.ABRIS]: 'bg-gray-100 text-gray-800',
};

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onEdit,
  orgId,
}) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activitiesByProject, setActivitiesByProject] = React.useState<
    Record<string, ProjectActivity[]>
  >({});
  const [activitiesLoadingId, setActivitiesLoadingId] = React.useState<string | null>(null);
  const [activitiesErrorId, setActivitiesErrorId] = React.useState<string | null>(null);

  const renderLocation = (raw?: string | null) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Pattern example: "Kimiti: Kharoub, Zabout, Doroti || Koukou: Aradib"
    const parts = trimmed.split('||').map((p) => p.trim()).filter(Boolean);

    if (parts.length === 0) {
      return <span className="ml-1 align-baseline">{trimmed}</span>;
    }

    return (
      <div className="ml-1 align-baseline space-y-0.5">
        {parts.map((part, idx) => {
          const [deptRaw, locationsRaw] = part.split(':');
          if (!locationsRaw) {
            return (
              <div key={idx}>
                {part}
              </div>
            );
          }
          const dept = deptRaw.trim();
          const locations = locationsRaw.trim();
          return (
            <div key={idx}>
              <span className="font-semibold">Departement de {dept}:</span>{' '}
              <span>{locations}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const loadActivities = async (projectId: string) => {
    if (activitiesByProject[projectId] || activitiesLoadingId === projectId) return;
    try {
      setActivitiesLoadingId(projectId);
      setActivitiesErrorId(null);
      const list = await listProjectActivities(orgId, projectId);
      setActivitiesByProject((prev) => ({ ...prev, [projectId]: list }));
    } catch (err) {
      setActivitiesErrorId(projectId);
    } finally {
      setActivitiesLoadingId(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 bg-white">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <MapPin className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun projet trouvé</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
          Aucun projet ne correspond à vos critères actuels. Essayez de modifier les filtres ou
          ajoutez un nouveau projet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="-my-2 sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="overflow-hidden border-t border-gray-200 divide-y divide-gray-200">
            {projects.map((project) => {
              const isExpanded = expandedId === project.id;

              const activities = activitiesByProject[project.id] || [];
              const activitiesCount = activities.length;

              return (
                <div key={project.id} className="bg-white hover:bg-blue-50/40 transition-colors">
                  <button
                    type="button"
                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                    onClick={async () => {
                      setExpandedId((current) => (current === project.id ? null : project.id));
                      if (!activitiesByProject[project.id]) {
                        await loadActivities(project.id);
                      }
                    }}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">
                          {project.projectName || project.bailleur}
                        </span>
                        <span className="text-[11px] text-gray-400">ID: {project.id}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">Bailleur: {project.bailleur}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-medium ${sectorBadgeClasses[project.sector]}`}
                        >
                          {project.sector}
                        </span>
                        <span className="inline-flex items-center">
                          <Tag className="w-3 h-3 mr-1" /> {project.type}
                        </span>
                        <span className="inline-flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                          {new Date(project.startDate).toLocaleDateString('fr-FR')}
                          <span className="mx-1 text-gray-400">→</span>
                          {new Date(project.endDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="hidden sm:inline text-[11px] text-gray-500 mr-2">
                        {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'
                          }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 pt-0 text-sm text-gray-700 bg-blue-50/40 border-t border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Bailleur
                          </div>
                          <div className="text-sm font-medium text-gray-900">{project.bailleur}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">ID projet: {project.id}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Secteur &amp; Type
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sectorBadgeClasses[project.sector]}`}
                            >
                              {project.sector}
                            </span>
                            <span className="inline-flex items-center text-xs text-gray-700">
                              <Tag className="w-3 h-3 mr-1" /> {project.type}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Période de mise en œuvre
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>
                              {new Date(project.startDate).toLocaleDateString('fr-FR')} au{' '}
                              {new Date(project.endDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Date d'enregistrement
                          </div>
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{new Date(project.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Détails du projet
                        </div>
                        <div className="flex items-start text-xs md:text-sm text-gray-800">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="space-y-1.5">
                            {project.projectDescription && (
                              <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                <span className="font-semibold">Description :</span>
                                <span className="ml-1 align-baseline">{project.projectDescription}</span>
                              </div>
                            )}
                            {project.beneficiariesType && (
                              <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                <span className="font-semibold">Type de bénéficiaires :</span>
                                <span className="ml-1 align-baseline">{project.beneficiariesType}</span>
                              </div>
                            )}
                            {typeof project.beneficiariesPlanned === 'number' && (
                              <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                <span className="font-semibold">Bénéficiaires prévus :</span>
                                <span className="ml-1 align-baseline">{project.beneficiariesPlanned}</span>
                              </div>
                            )}
                            {typeof project.activitiesPlanned === 'number' && (
                              <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                <span className="font-semibold">Nombre d'activités prévues :</span>
                                <span className="ml-1 align-baseline">{project.activitiesPlanned}</span>
                              </div>
                            )}
                            {(project.projectManagerName || project.projectManagerPhone || project.projectManagerEmail) && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                                {project.projectManagerName && (
                                  <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                    <span className="font-semibold">Chef de projet :</span>
                                    <span className="ml-1 align-baseline">{project.projectManagerName}</span>
                                  </div>
                                )}
                                {project.projectManagerPhone && (
                                  <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                    <span className="font-semibold">Téléphone :</span>
                                    <span className="ml-1 align-baseline">{project.projectManagerPhone}</span>
                                  </div>
                                )}
                                {project.projectManagerEmail && (
                                  <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                    <span className="font-semibold">Email :</span>
                                    <span className="ml-1 align-baseline">{project.projectManagerEmail}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {project.location && (
                              <div className="leading-snug text-xs md:text-sm text-gray-800 break-words">
                                <span className="font-semibold">Localisation :</span>
                                {renderLocation(project.location)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 text-xs md:text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                            Activités du projet
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-medium">
                            {activitiesCount} activité(s)
                          </span>
                        </div>
                        {activitiesLoadingId === project.id ? (
                          <p className="text-[11px] text-gray-500">Chargement des activités...</p>
                        ) : activitiesErrorId === project.id ? (
                          <p className="text-[11px] text-red-600">
                            Impossible de charger les activités pour ce projet.
                          </p>
                        ) : activitiesCount === 0 ? (
                          <p className="text-[11px] text-gray-500">
                            Aucune activité enregistrée pour ce projet.
                          </p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {activities.map((a) => {
                              let displayDate: string | null = null;
                              if (a.date) {
                                displayDate = new Date(a.date).toLocaleDateString('fr-FR');
                                if (a.description) {
                                  const match = a.description.match(
                                    /(Date de fin prévue:|Date de fin de l'activité:)\s*([0-9/]+)/,
                                  );
                                  if (match && match[2]) {
                                    const endStr = match[2];
                                    displayDate = `${new Date(a.date).toLocaleDateString('fr-FR')} au ${endStr}`;
                                  }
                                }
                              }

                              return (
                                <li
                                  key={a.id}
                                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-semibold text-gray-900 truncate">
                                      {a.title}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
                                      {displayDate && (
                                        <span>
                                          <Calendar className="inline-block w-3 h-3 mr-0.5 text-gray-400" />
                                          {displayDate}
                                        </span>
                                      )}
                                      {a.location && <span>Lieu : {a.location}</span>}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
