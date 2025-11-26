import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import { listPublicOrgs, fetchProjects } from '../services/api';
import { OrgSummary } from '../types';
import { PublicLayout } from './PublicLayout';

export const PartnersPage: React.FC = () => {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});

  const getOrgTypeLabel = (orgType: string): string => {
    switch (orgType) {
      case 'agence_onusienne':
        return 'Agence onusienne';
      case 'organisation_internationale':
        return 'Organisation internationale';
      case 'organisation_nationale':
        return 'Organisation nationale';
      default:
        return 'Statut du partenaire';
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listPublicOrgs();
        setOrgs(data);
      } catch (e) {
        setError("Erreur lors du chargement des partenaires.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const activeOrgs = orgs.filter((o) => o.isActivated);
    if (activeOrgs.length === 0) {
      setProjectCounts({});
      return;
    }

    let cancelled = false;

    const loadCounts = async () => {
      try {
        const entries = await Promise.all(
          activeOrgs.map(async (org) => {
            try {
              const projects = await fetchProjects(org.orgId);
              return [org.orgId, projects.length] as const;
            } catch {
              return [org.orgId, 0] as const;
            }
          }),
        );

        if (cancelled) return;

        const map: Record<string, number> = {};
        for (const [id, count] of entries) {
          map[id] = count;
        }
        setProjectCounts(map);
      } catch {
        if (!cancelled) {
          setProjectCounts({});
        }
      }
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [orgs]);

  return (
    <PublicLayout>
      <div className="flex-grow bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002060] tracking-tight">Nos Partenaires</h1>
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                Organisations humanitaires et de développement actives dans la province de Sila.
              </p>
            </div>
          </div>

          {loading && (
            <div className="text-center py-10 text-gray-500 text-sm">Chargement des partenaires...</div>
          )}

          {error && !loading && (
            <div className="mb-6 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orgs.filter((o) => o.isActivated).length === 0 ? (
                <p className="col-span-full text-center text-gray-500 italic text-sm">
                  Aucune organisation partenaire activée pour le moment.
                </p>
              ) : (
                orgs
                  .filter((org) => org.isActivated)
                  .map((org) => (
                  <div
                    key={org.orgId}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Building2 className="h-5 w-5 text-[#002060]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 line-clamp-2">{org.orgName}</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wide">
                          {getOrgTypeLabel(org.orgType)}
                        </p>
                        <p className="text-[11px] text-[#002060] mt-1 font-semibold">
                          {(projectCounts[org.orgId] ?? 0).toString()} projet(s) actif(s)
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-1.5 text-xs text-gray-600">
                      {org.contactEmail && (
                        <p className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-[#C60C30]" />
                          <span className="truncate">{org.contactEmail}</span>
                        </p>
                      )}
                      {org.contactPhone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{org.contactPhone}</span>
                        </p>
                      )}
                      {org.location && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{org.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};
