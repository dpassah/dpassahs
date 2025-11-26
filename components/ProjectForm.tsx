import React, { useState, useEffect } from 'react';
import {
  UserSession,
  Project,
  Sector,
  SECTORS,
  PROJECT_TYPES,
  ProjectType,
  ProjectFormPayload,
} from '../types';
import { Calendar, MapPin, Briefcase, Flag, Save } from 'lucide-react';

interface ProjectFormProps {
  user: UserSession;
  initialData?: Project | null;
  onSubmit: (project: ProjectFormPayload) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  user,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const DISTRICTS = ['Kimiti', 'Koukou', 'Abdi', 'Ade', 'Tissi'] as const;

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [bailleur, setBailleur] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<ProjectType>(PROJECT_TYPES[0]);
  const [sector, setSector] = useState<Sector>(SECTORS[0]);
  const [beneficiaryType, setBeneficiaryType] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [activitiesCount, setActivitiesCount] = useState('');
  const [projectLeadName, setProjectLeadName] = useState('');
  const [projectLeadPhone, setProjectLeadPhone] = useState('');
  const [projectLeadEmail, setProjectLeadEmail] = useState('');
  const [areas, setAreas] = useState<{ district: string; villages: string }[]>([
    { district: DISTRICTS[0], villages: '' },
  ]);

  useEffect(() => {
    if (initialData) {
      setProjectName('');
      setProjectDescription('');
      setBailleur(initialData.bailleur);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setType(initialData.type);
      setSector(initialData.sector);
      setBeneficiaryType('');
      setBeneficiaries('');
      setActivitiesCount('');
      setProjectLeadName('');
      setProjectLeadPhone('');
      setProjectLeadEmail('');
      setAreas([{ district: DISTRICTS[0], villages: initialData.location }]);
    } else {
      setProjectName('');
      setProjectDescription('');
      setBailleur('');
      setStartDate('');
      setEndDate('');
      setType(PROJECT_TYPES[0]);
      setSector(SECTORS[0]);
      setBeneficiaryType('');
      setBeneficiaries('');
      setProjectLeadName('');
      setProjectLeadPhone('');
      setProjectLeadEmail('');
      setAreas([{ district: DISTRICTS[0], villages: '' }]);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const metaParts: string[] = [];
    if (projectName.trim()) {
      metaParts.push(`Nom du Projet: ${projectName.trim()}`);
    }
    if (projectDescription.trim()) {
      metaParts.push(`Description: ${projectDescription.trim()}`);
    }
    if (beneficiaryType.trim()) {
      metaParts.push(`Type de bénéficiaires: ${beneficiaryType.trim()}`);
    }
    if (beneficiaries.trim()) {
      metaParts.push(`Bénéficiaires prévus: ${beneficiaries.trim()}`);
    }
    if (activitiesCount.trim()) {
      metaParts.push(`Nombre d'activités prévues: ${activitiesCount.trim()}`);
    }
    if (projectLeadName.trim()) {
      metaParts.push(`Chef de projet: ${projectLeadName.trim()}`);
    }
    if (projectLeadPhone.trim()) {
      metaParts.push(`Tél. chef de projet: ${projectLeadPhone.trim()}`);
    }
    if (projectLeadEmail.trim()) {
      metaParts.push(`Email chef de projet: ${projectLeadEmail.trim()}`);
    }

    const areaParts = areas
      .filter((a) => a.district && a.villages.trim())
      .map((a) => `${a.district}: ${a.villages.trim()}`);

    // location column in DB should contain only geographic locations (districts + villages/camps)
    const location = areaParts.join(' || ');

    const beneficiariesPlanned = beneficiaries.trim() ? Number(beneficiaries.trim()) : undefined;
    const activitiesPlanned = activitiesCount.trim() ? Number(activitiesCount.trim()) : undefined;

    const projectData: ProjectFormPayload = {
      id: initialData ? initialData.id : undefined,
      bailleur,
      startDate,
      endDate,
      type,
      sector,
      location,
      projectName: projectName.trim() || undefined,
      projectDescription: projectDescription.trim() || undefined,
      beneficiariesType: beneficiaryType.trim() || undefined,
      beneficiariesPlanned: Number.isNaN(beneficiariesPlanned) ? undefined : beneficiariesPlanned,
      activitiesPlanned: Number.isNaN(activitiesPlanned) ? undefined : activitiesPlanned,
      projectManagerName: projectLeadName.trim() || undefined,
      projectManagerPhone: projectLeadPhone.trim() || undefined,
      projectManagerEmail: projectLeadEmail.trim() || undefined,
    };

    onSubmit(projectData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Nom du Projet</label>
            <input
              type="text"
              disabled={isSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900"
              placeholder="Intitulé complet du projet"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Bailleur / Donor / Financé par
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                required
                disabled={isSubmitting}
                className="focus:ring-blue-900 focus:border-blue-900 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors"
                placeholder="Ex: Union Européenne, ECHO..."
                value={bailleur}
                onChange={(e) => setBailleur(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Description courte du projet
          </label>
          <textarea
            disabled={isSubmitting}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900 min-h-[160px] resize-vertical"
            placeholder="Quelques lignes pour décrire le projet (objectifs, population ciblée, etc.)"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date de Début</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              required
              disabled={isSubmitting}
              className="focus:ring-blue-900 focus:border-blue-900 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date de Fin</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              required
              disabled={isSubmitting}
              className="focus:ring-blue-900 focus:border-blue-900 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2.5 border transition-colors"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Type de projet</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm rounded-md border transition-colors"
              value={type}
              disabled={isSubmitting}
              onChange={(e) => setType(e.target.value as ProjectType)}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secteur</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Flag className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm rounded-md border transition-colors"
                value={sector}
                disabled={isSubmitting}
                onChange={(e) => setSector(e.target.value as Sector)}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Bénéficiaires</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Type de bénéficiaires</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900 bg-white"
              disabled={isSubmitting}
              value={beneficiaryType}
              onChange={(e) => setBeneficiaryType(e.target.value)}
            >
              <option value="">Sélectionnez un type</option>
              <option value="Réfugiés">Réfugiés</option>
              <option value="Rapatriés">Rapatriés</option>
              <option value="Communauté hôte">Communauté hôte</option>
              <option value="Communauté hôte + Réfugiés / Rapatriés">
                Communauté hôte + Réfugiés / Rapatriés
              </option>
              <option value="Autre">Autre (précisez dans la description)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bénéficiaires prévus</label>
            <input
              type="number"
              min={0}
              disabled={isSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900"
              placeholder="Ex: 3500"
              value={beneficiaries}
              onChange={(e) => setBeneficiaries(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre d'activité</label>
            <input
              type="number"
              min={0}
              disabled={isSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900"
              placeholder="Ex: 10"
              value={activitiesCount}
              onChange={(e) => setActivitiesCount(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact du projet</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Chef de projet</label>
            <input
              type="text"
              disabled={isSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900"
              placeholder="Nom complet du chef de projet"
              value={projectLeadName}
              onChange={(e) => setProjectLeadName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              type="tel"
              disabled={isSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900"
              placeholder="Ex: +235 ..."
              value={projectLeadPhone}
              onChange={(e) => setProjectLeadPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              disabled={isSubmitting}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2.5 sm:text-sm focus:ring-blue-900 focus:border-blue-900"
              placeholder="Ex: chef.projet@organisation.org"
              value={projectLeadEmail}
              onChange={(e) => setProjectLeadEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Lieu(x) d'intervention (Sila)
        </label>
        <div className="mt-2 space-y-3">
          {areas.map((area, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row md:items-start md:gap-4 md:gap-x-4 md:gap-y-0"
            >
              <div className="md:w-1/3 w-full mb-2 md:mb-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Sélectionnez la/les préfectures concernées
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-8 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-900 focus:border-blue-900 rounded-md border bg-white"
                    disabled={isSubmitting}
                    value={area.district}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAreas((prev) => {
                        const copy = [...prev];
                        copy[index] = { ...copy[index], district: value };
                        return copy;
                      });
                    }}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="md:flex-1 w-full">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {beneficiaryType === 'Réfugiés / Rapatriés'
                    ? 'Camp/site de la préfecture sélectionnée'
                    : beneficiaryType === 'Communauté hôte'
                    ? 'Ville/village de la préfecture sélectionnée'
                    : beneficiaryType === 'Communauté hôte + Réfugiés / Rapatriés'
                    ? 'Ville/village et camp/site de la préfecture sélectionnée'
                    : 'Ville/village ou camp/site de la préfecture sélectionnée'}
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 sm:text-xs focus:ring-blue-900 focus:border-blue-900"
                  placeholder={
                    beneficiaryType === 'Réfugiés / Rapatriés'
                      ? 'Ex: Camp X, Site Y... (séparés par des virgules)'
                      : beneficiaryType === 'Communauté hôte'
                      ? 'Ex: Ville A, Village B... (séparés par des virgules)'
                      : beneficiaryType === 'Communauté hôte + Réfugiés / Rapatriés'
                      ? 'Ex: Ville A, Camp X... (séparés par des virgules)'
                      : 'Ex: Ville A, Village B ou Camp X... (séparés par des virgules)'
                  }
                  value={area.villages}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAreas((prev) => {
                      const copy = [...prev];
                      copy[index] = { ...copy[index], villages: value };
                      return copy;
                    });
                  }}
                />
              </div>
              <div className="mt-2 md:mt-6 md:ml-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting || areas.length === 1}
                  className="text-xs px-2 py-1 rounded-md border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (areas.length === 1) return;
                    setAreas((prev) => prev.filter((_, i) => i !== index));
                  }}
                >
                  -
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={isSubmitting}
            className="inline-flex items-center text-xs text-blue-900 hover:underline mt-1"
            onClick={() =>
              setAreas((prev) => [
                ...prev,
                { district: DISTRICTS[Math.min(prev.length, DISTRICTS.length - 1)], villages: '' },
              ])
            }
          >
            + Ajouter une autre préfecture
          </button>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:col-start-2 sm:text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Enregistrement...' : initialData ? 'Mettre à jour' : 'Enregistrer'}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onCancel}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};
