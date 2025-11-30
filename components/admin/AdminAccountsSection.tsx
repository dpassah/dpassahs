import React from 'react';

import { RefreshCw, Search, Plus } from 'lucide-react';

interface AdminAccountsSectionProps {
  orgs: any[];
  orgLoading: boolean;
  accountSearch: string;
  setAccountSearch: (value: string) => void;
  accountActionMessage: string;
  accountActionDetails: {
    orgId?: string;
    newPassword?: string;
    contactEmail?: string;
  } | null;
  error: string;
  onReloadOrgs: () => void;
  onCreateOrg: (e: React.FormEvent) => void;
  newOrgName: string;
  setNewOrgName: (value: string) => void;
  newOrgType: string;
  setNewOrgType: (value: string) => void;
  newOrgContactName: string;
  setNewOrgContactName: (value: string) => void;
  newOrgContactPhone: string;
  setNewOrgContactPhone: (value: string) => void;
  ActionButton: React.ComponentType<any>;
  SectionHeader: React.ComponentType<{ title: string; subtitle?: string; action?: React.ReactNode }>;
  inputClassName: string;
  labelClassName: string;
  adminDisableOrg: (orgId: string) => Promise<any>;
  adminEnableOrg: (orgId: string) => Promise<any>;
  adminResetOrgPassword: (orgId: string) => Promise<any>;
  setAccountActionMessage: (value: string) => void;
  setAccountActionDetails: (value: AdminAccountsSectionProps['accountActionDetails']) => void;
}

export const AdminAccountsSection: React.FC<AdminAccountsSectionProps> = ({
  orgs,
  orgLoading,
  accountSearch,
  setAccountSearch,
  accountActionMessage,
  accountActionDetails,
  error,
  onReloadOrgs,
  onCreateOrg,
  newOrgName,
  setNewOrgName,
  newOrgType,
  setNewOrgType,
  newOrgContactName,
  setNewOrgContactName,
  newOrgContactPhone,
  setNewOrgContactPhone,
  ActionButton,
  SectionHeader,
  inputClassName,
  labelClassName,
  adminDisableOrg,
  adminEnableOrg,
  adminResetOrgPassword,
  setAccountActionMessage,
  setAccountActionDetails,
}) => {
  return (
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
                onClick={() => {
                  setAccountActionMessage('');
                  setAccountActionDetails(null);
                  onReloadOrgs();
                }}
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
                            variant={isActivated ? 'danger' : 'success'}
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
                                onReloadOrgs();
                              } catch (err: any) {
                                setAccountActionMessage(err?.message || 'Erreur statut');
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
                                onReloadOrgs();
                              } catch (err: any) {
                                setAccountActionMessage(err?.message || 'Erreur reset');
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
        <form onSubmit={onCreateOrg} className="bg-gray-50 rounded-lg p-5 border border-gray-100">
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
  );
};
