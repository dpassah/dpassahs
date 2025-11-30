import React, { useEffect, useState } from 'react';
import { Save, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  adminListSites,
  adminListSiteMonthlyStats,
  adminSaveSiteMonthlyStats,
  Site,
} from '../../services/api';

interface SiteStatsTotalOnly {
  ref_total_ind: number | '';
  ref_total_hh: number | '';
  ret_total_ind: number | '';
  ret_total_hh: number | '';
}

interface AdminStatsProps {
  statsMonth: string;
  setStatsMonth: (v: string) => void;
  statsYear: number | '';
  setStatsYear: (v: number | '') => void;
  SectionHeader: any;
  ActionButton: any;
  inputClassName: string;
  labelClassName: string;
}

export const AdminProvinceStatsSection: React.FC<AdminStatsProps> = ({
  statsMonth,
  setStatsMonth,
  statsYear,
  setStatsYear,
  SectionHeader,
  ActionButton,
  inputClassName,
  labelClassName,
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState<Record<string, SiteStatsTotalOnly>>({});
  const [currentSiteId, setCurrentSiteId] = useState<string>('');

  useEffect(() => {
    const loadSites = async () => {
      const list = await adminListSites();
      if (list && list.length > 0) {
        const sorted = list.sort((a: Site, b: Site) => a.name.localeCompare(b.name));
        setSites(sorted);
        setCurrentSiteId(sorted[0].id);
      }
    };
    void loadSites();
  }, []);

  useEffect(() => {
    if (!statsMonth || !statsYear) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await adminListSiteMonthlyStats(statsMonth, Number(statsYear));
        const map: Record<string, SiteStatsTotalOnly> = {};
        (data || []).forEach((row: any) => {
          map[row.siteId] = {
            ref_total_ind: row.ref_total_ind,
            ref_total_hh: row.ref_total_hh,
            ret_total_ind: row.ret_total_ind,
            ret_total_hh: row.ret_total_hh,
          };
        });
        setInputs(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    void fetchData();
  }, [statsMonth, statsYear]);

  const handleInput = (siteId: string, field: keyof SiteStatsTotalOnly, val: string) => {
    setInputs(prev => ({
      ...prev,
      [siteId]: { ...prev[siteId], [field]: val === '' ? '' : Number(val) }
    }));
  };

  const handleNext = () => {
    const idx = sites.findIndex(s => s.id === currentSiteId);
    if (idx < sites.length - 1) setCurrentSiteId(sites[idx + 1].id);
  };

  const handlePrev = () => {
    const idx = sites.findIndex(s => s.id === currentSiteId);
    if (idx > 0) setCurrentSiteId(sites[idx - 1].id);
  };

  const onSave = async () => {
    if (!statsMonth || !statsYear) return alert("Sélectionnez le mois et l'année.");
    try {
      const items = sites.map(s => {
        const row = inputs[s.id] || {};
        const safe = (v: any) => (typeof v === 'number' && v >= 0 ? v : 0);
        return {
          siteId: s.id,
          ref_total_ind: safe(row.ref_total_ind),
          ref_total_hh: safe(row.ref_total_hh),
          ret_total_ind: safe(row.ret_total_ind),
          ret_total_hh: safe(row.ret_total_hh),
        };
      });

      await adminSaveSiteMonthlyStats({ month: statsMonth, year: Number(statsYear), items });
      alert("Enregistré avec succès ! Le système a calculé les augmentations.");
    } catch (e) { alert("Erreur lors de l'enregistrement"); }
  };

  const currentSite = sites.find(s => s.id === currentSiteId);
  const rawVals = currentSiteId ? (inputs[currentSiteId] || {}) : {};
  const vals = {
    ref_total_ind: rawVals.ref_total_ind ?? '',
    ref_total_hh: rawVals.ref_total_hh ?? '',
    ret_total_ind: rawVals.ret_total_ind ?? '',
    ret_total_hh: rawVals.ret_total_hh ?? '',
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mise à jour Mensuelle (Système Intelligent)"
        subtitle="Entrez simplement le TOTAL ACTUEL. Le système calculera automatiquement l'augmentation par rapport au mois dernier."
      />

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="w-1/2 md:w-40">
            <label className={labelClassName}>Mois</label>
            <select value={statsMonth} onChange={e => setStatsMonth(e.target.value)} className={inputClassName}>
              <option value="">Sélectionner</option>
              {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-1/2 md:w-32">
            <label className={labelClassName}>Année</label>
            <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))} className={inputClassName}>
              <option value="">Année</option>
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <ActionButton onClick={onSave} className="bg-[#002060] text-white px-6 py-2">
          <Save className="w-4 h-4 mr-2" /> Enregistrer
        </ActionButton>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-700 w-5 h-5" />
            <span className="font-bold text-gray-800">Saisie des Totaux</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handlePrev} disabled={!currentSiteId || sites.findIndex(s => s.id === currentSiteId) === 0} className="p-2 border rounded hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-blue-700 uppercase">Camps des Réfugiés</span>
              <select
                value={sites.find(s => s.id === currentSiteId && s.kind === 'refugees') ? currentSiteId : ''}
                onChange={e => setCurrentSiteId(e.target.value)}
                className={`${inputClassName} w-56 h-8 text-[11px] font-semibold text-blue-900`}
              >
                <option value="">Sélectionner un site réfugiés</option>
                {sites.filter(s => s.kind === 'refugees').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase">Sites des Retournés</span>
              <select
                value={sites.find(s => s.id === currentSiteId && s.kind === 'returnees') ? currentSiteId : ''}
                onChange={e => setCurrentSiteId(e.target.value)}
                className={`${inputClassName} w-56 h-8 text-[11px] font-semibold text-emerald-900`}
              >
                <option value="">Sélectionner un centre retournés</option>
                {sites.filter(s => s.kind === 'returnees').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleNext} disabled={!currentSiteId || sites.findIndex(s => s.id === currentSiteId) === sites.length - 1} className="p-2 border rounded hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6">
          {!currentSite ? <p className="text-center py-4">Chargement...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-blue-100 rounded-lg p-6 bg-blue-50/20">
                <h4 className="text-blue-800 font-bold mb-4 uppercase text-center border-b border-blue-100 pb-2">Réfugiés (Total Actuel)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Individus</label>
                    <input
                      type="number"
                      min="0"
                      className={`${inputClassName} text-center text-2xl h-14 font-black text-blue-900 border-blue-200 focus:border-blue-500`}
                      value={vals.ref_total_ind}
                      onChange={e => handleInput(currentSite.id, 'ref_total_ind', e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Entrez le nombre total de personnes présentes ce mois-ci</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Ménages</label>
                    <input
                      type="number"
                      min="0"
                      className={`${inputClassName} text-center text-xl h-12 font-bold text-blue-800 border-blue-200 focus:border-blue-500`}
                      value={vals.ref_total_hh}
                      onChange={e => handleInput(currentSite.id, 'ref_total_hh', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-emerald-100 rounded-lg p-6 bg-emerald-50/20">
                <h4 className="text-emerald-800 font-bold mb-4 uppercase text-center border-b border-emerald-100 pb-2">Retournés (Total Actuel)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Individus</label>
                    <input
                      type="number"
                      min="0"
                      className={`${inputClassName} text-center text-2xl h-14 font-black text-emerald-900 border-emerald-200 focus:border-emerald-500`}
                      value={vals.ret_total_ind}
                      onChange={e => handleInput(currentSite.id, 'ret_total_ind', e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-center">Entrez le nombre total de personnes présentes ce mois-ci</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Ménages</label>
                    <input
                      type="number"
                      min="0"
                      className={`${inputClassName} text-center text-xl h-12 font-bold text-emerald-800 border-emerald-200 focus:border-emerald-500`}
                      value={vals.ret_total_hh}
                      onChange={e => handleInput(currentSite.id, 'ret_total_hh', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-gray-500">
        Note : Le système comparera ces chiffres avec le mois précédent pour déterminer l'augmentation mensuelle.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="font-bold text-blue-800 text-sm uppercase">Résumé : Camps des Réfugiés</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-50/50 text-blue-900 font-semibold border-b border-blue-100">
                <tr>
                  <th className="px-4 py-2">Camp</th>
                  <th className="px-4 py-2 text-right">Individus</th>
                  <th className="px-4 py-2 text-right">Ménages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {sites.filter(s => s.kind === 'refugees').map(s => {
                  const d = inputs[s.id] || {};
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2 font-medium text-gray-700">{s.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-blue-700">{d.ref_total_ind || 0}</td>
                      <td className="px-4 py-2 text-right font-mono text-blue-700">{d.ref_total_hh || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-blue-100 font-bold text-blue-900 border-t border-blue-200">
                <tr>
                  <td className="px-4 py-2">TOTAL</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {sites.filter(s => s.kind === 'refugees').reduce((acc, s) => acc + (Number(inputs[s.id]?.ref_total_ind) || 0), 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {sites.filter(s => s.kind === 'refugees').reduce((acc, s) => acc + (Number(inputs[s.id]?.ref_total_hh) || 0), 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-emerald-100 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
            <h3 className="font-bold text-emerald-800 text-sm uppercase">Résumé : Centres des Retournés</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-emerald-50/50 text-emerald-900 font-semibold border-b border-emerald-100">
                <tr>
                  <th className="px-4 py-2">Centre</th>
                  <th className="px-4 py-2 text-right">Individus</th>
                  <th className="px-4 py-2 text-right">Ménages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {sites.filter(s => s.kind === 'returnees').map(s => {
                  const d = inputs[s.id] || {};
                  return (
                    <tr key={s.id} className="hover:bg-emerald-50/30">
                      <td className="px-4 py-2 font-medium text-gray-700">{s.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-700">{d.ret_total_ind || 0}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-700">{d.ret_total_hh || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-emerald-100 font-bold text-emerald-900 border-t border-emerald-200">
                <tr>
                  <td className="px-4 py-2">TOTAL</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {sites.filter(s => s.kind === 'returnees').reduce((acc, s) => acc + (Number(inputs[s.id]?.ret_total_ind) || 0), 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {sites.filter(s => s.kind === 'returnees').reduce((acc, s) => acc + (Number(inputs[s.id]?.ret_total_hh) || 0), 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};