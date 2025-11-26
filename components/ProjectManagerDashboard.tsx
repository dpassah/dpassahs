import React, { useEffect, useState } from 'react';
import { ProjectManagerSession, ProjectActivity } from '../types';
import { MapPin, Calendar, Tag, User, Phone, Mail, Activity, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { listProjectActivities, createProjectActivity, deleteProjectActivity } from '../services/api';

interface ProjectManagerDashboardProps {
  session: ProjectManagerSession;
  onLogout: () => void;
}

export const ProjectManagerDashboard: React.FC<ProjectManagerDashboardProps> = ({
  session,
  onLogout,
}) => {
  const { orgName, project } = session;
  const projectName = project.projectName || null;
  const description = project.projectDescription || null;
  const beneficiaryType = project.beneficiariesType || null;
  const beneficiaryCount =
    typeof project.beneficiariesPlanned === 'number'
      ? project.beneficiariesPlanned.toString()
      : null;
  const plannedActivities =
    typeof project.activitiesPlanned === 'number' ? project.activitiesPlanned : null;
  const projectLead = project.projectManagerName || null;
  const projectLeadPhone = project.projectManagerPhone || null;
  const projectLeadEmail = project.projectManagerEmail || null;
  const hasLegacyMetaBlob = project.location
    ? /Nom du Projet\s*:?/i.test(project.location)
    : false;
  const locationSegments = (() => {
    if (hasLegacyMetaBlob || !project.location) return [] as string[];

    const raw = project.location.trim();
    if (!raw) return [] as string[];

    // Example pattern: "Kimiti: Kharoub, Zabout, Doroti || Koukou: Aradib"
    const parts = raw.split('||').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return [] as string[];

    const formatted: string[] = [];
    for (const part of parts) {
      const [deptRaw, locationsRaw] = part.split(':');
      if (!locationsRaw) {
        formatted.push(part);
        continue;
      }
      const dept = deptRaw.trim();
      const locations = locationsRaw.trim();
      formatted.push(`Departement de ${dept}: ${locations}`);
    }
    return formatted;
  })();

  // Extract individual places from the raw location string to use as suggestions for Lieu
  const locationPlaceOptions: string[] = (() => {
    if (!project.location) return [];
    const raw = project.location.trim();
    if (!raw) return [];

    const parts = raw.split('||').map((p) => p.trim()).filter(Boolean);
    const places: string[] = [];
    for (const part of parts) {
      const [, locationsRaw] = part.split(':');
      if (!locationsRaw) continue;
      const locs = locationsRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      places.push(...locs);
    }
    // Remove duplicates
    return Array.from(new Set(places));
  })();

  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDate, setNewActivityDate] = useState('');
  const [newActivityLocation, setNewActivityLocation] = useState('');
  const [selectedActivityLocations, setSelectedActivityLocations] = useState<string[]>([]);
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [newActivityDaysCount, setNewActivityDaysCount] = useState('');
  const [newActivityBeneficiaries, setNewActivityBeneficiaries] = useState('');
  const [newActivityEndDate, setNewActivityEndDate] = useState('');
  const [newActivityGovServices, setNewActivityGovServices] = useState('');
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityDate, setEditActivityDate] = useState('');
  const [editActivityGovServices, setEditActivityGovServices] = useState('');
  const [editActivityDaysCount, setEditActivityDaysCount] = useState('');
  const [editActivityBeneficiaries, setEditActivityBeneficiaries] = useState('');
  const [editActivityEndDate, setEditActivityEndDate] = useState('');
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setActivitiesLoading(true);
        setActivitiesError('');
        const list = await listProjectActivities(session.orgId, project.id);
        setActivities(list);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Impossible de charger les activités de ce projet.';
        setActivitiesError(message);
      } finally {
        setActivitiesLoading(false);
      }
    };
    load();
  }, [session.orgId, project.id]);

  // Auto-calculate end date for the edited activity when date or duration changes
  useEffect(() => {
    const daysRaw = editActivityDaysCount.trim();
    if (!editActivityDate || !daysRaw) {
      setEditActivityEndDate('');
      return;
    }

    const days = Number(daysRaw);
    if (!Number.isFinite(days) || days <= 0) {
      setEditActivityEndDate('');
      return;
    }

    const start = new Date(editActivityDate);
    if (Number.isNaN(start.getTime())) {
      setEditActivityEndDate('');
      return;
    }

    const end = new Date(start);
    end.setDate(end.getDate() + (days - 1));
    setEditActivityEndDate(end.toISOString().slice(0, 10));
  }, [editActivityDate, editActivityDaysCount]);

  const toggleActivityLocation = (place: string) => {
    setSelectedActivityLocations((prev) => {
      const exists = prev.includes(place);
      const next = exists ? prev.filter((p) => p !== place) : [...prev, place];
      setNewActivityLocation(next.join(', '));
      return next;
    });
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) {
      setActivitiesError("Le titre de l'activité est requis.");
      return;
    }
    try {
      setActivitiesError('');

      let fullDescription = newActivityDescription.trim();
      const days = newActivityDaysCount.trim();
      const beneficiaries = newActivityBeneficiaries.trim();
      const endDate = newActivityEndDate.trim();
      const govServices = newActivityGovServices.trim();

      const extraLines: string[] = [];
      if (days) {
        extraLines.push(`Durée de l'activité: ${days} jour(s)`);
      }
      let beneficiariesCount: number | undefined;
      if (beneficiaries) {
        const parsed = Number(beneficiaries);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          beneficiariesCount = parsed;
          extraLines.push(`Nombre de bénéficiaires de l'activité: ${beneficiariesCount}`);
        } else {
          extraLines.push(`Nombre de bénéficiaires de l'activité: ${beneficiaries}`);
        }
      }
      if (days && Number(days) > 1 && endDate) {
        extraLines.push(
          `Date de fin de l'activité: ${new Date(endDate).toLocaleDateString('fr-FR')}`,
        );
      }
      if (govServices) {
        extraLines.push(`Services gouvernementaux impliqués: ${govServices}`);
      }

      if (extraLines.length > 0) {
        fullDescription = [fullDescription, extraLines.join('\n')]
          .filter((part) => part && part.trim().length > 0)
          .join('\n\n');
      }

      const created = await createProjectActivity(session.orgId, project.id, {
        title: newActivityTitle.trim(),
        date: newActivityDate || undefined,
        location: newActivityLocation || undefined,
        description: fullDescription || undefined,
        beneficiariesCount,
        daysCount: days ? Number(days) : undefined,
        endDate: endDate || undefined,
        govServices: govServices || undefined,
      });
      setActivities((prev) => [created, ...prev]);
      setNewActivityTitle('');
      setNewActivityDate('');
      setNewActivityLocation('');
      setNewActivityDescription('');
      setNewActivityDaysCount('');
      setNewActivityBeneficiaries('');
      setNewActivityEndDate('');
      setNewActivityGovServices('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de creer l'activite.";
      setActivitiesError(message);
    }
  };

  const handleUpdateActivityDate = async (activity: ProjectActivity) => {
    if (!editActivityDate) {
      setActivitiesError("La nouvelle date de l'activite est requise pour la modification.");
      return;
    }

    try {
      setUpdatingActivityId(activity.id);
      setActivitiesError('');

      await deleteProjectActivity(session.orgId, project.id, activity.id);

      const newDescriptionParts: string[] = [];
      if (activity.description && activity.description.trim().length > 0) {
        const originalLines = activity.description.split('\n');
        const filteredLines = originalLines.filter((line) => {
          const trimmed = line.trim();
          if (/^Services gouvernementaux impliqués\s*:/i.test(trimmed)) return false;
          if (/^Nombre de bénéficiaires de l'activité\s*:/i.test(trimmed)) return false;
          if (/^Durée de l'activité\s*:/i.test(trimmed)) return false;
          if (/^Date de fin de l'activité\s*:/i.test(trimmed)) return false;
          return true;
        });
        const base = filteredLines.join('\n').trim();
        if (base.length > 0) {
          newDescriptionParts.push(base);
        }
      }

      const govServices = editActivityGovServices.trim();
      if (govServices.length > 0) {
        newDescriptionParts.push(`Services gouvernementaux impliqués: ${govServices}`);
      }

      const daysRaw = editActivityDaysCount.trim();
      let nextDaysCount: number | undefined;
      if (daysRaw) {
        const parsed = Number(daysRaw);
        if (!Number.isNaN(parsed) && parsed > 0) {
          nextDaysCount = parsed;
          newDescriptionParts.push(`Durée de l'activité: ${parsed} jour(s)`);
        } else {
          newDescriptionParts.push(`Durée de l'activité: ${daysRaw}`);
        }
      }

      const beneficiariesRaw = editActivityBeneficiaries.trim();
      let nextBeneficiariesCount: number | undefined;
      if (beneficiariesRaw) {
        const parsed = Number(beneficiariesRaw);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          nextBeneficiariesCount = parsed;
          newDescriptionParts.push(
            `Nombre de bénéficiaires de l'activité: ${nextBeneficiariesCount}`,
          );
        } else {
          newDescriptionParts.push(`Nombre de bénéficiaires de l'activité: ${beneficiariesRaw}`);
        }
      }

      const endDateRaw = editActivityEndDate.trim();
      if (endDateRaw) {
        const end = new Date(endDateRaw);
        const label = Number.isNaN(end.getTime())
          ? endDateRaw
          : end.toLocaleDateString('fr-FR');
        newDescriptionParts.push(`Date de fin de l'activité: ${label}`);
      }

      const updated = await createProjectActivity(session.orgId, project.id, {
        title: activity.title,
        date: editActivityDate,
        location: activity.location,
        description: newDescriptionParts.join('\n\n'),
        govServices: editActivityGovServices || undefined,
        daysCount: nextDaysCount,
        beneficiariesCount: nextBeneficiariesCount,
        endDate: endDateRaw || undefined,
      });

      setActivities((prev) => [updated, ...prev.filter((a) => a.id !== activity.id)]);
      setEditingActivityId(null);
      setEditActivityDate('');
      setEditActivityGovServices('');
      setEditActivityDaysCount('');
      setEditActivityBeneficiaries('');
      setEditActivityEndDate('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Échec de la mise à jour de la date de l'activité.";
      setActivitiesError(message);
    } finally {
      setUpdatingActivityId(null);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteProjectActivity(session.orgId, project.id, id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Échec de la suppression de l'activité.";
      setActivitiesError(message);
    }
  };

  const totalActivities = activities.length;
  const latestActivityTimestamp = activities
    .filter((a): a is ProjectActivity => !!a && typeof a.date !== 'undefined')
    .reduce<number>((max, a) => {
      if (!a.date) return max;
      const t = new Date(a.date).getTime();
      return t > max ? t : max;
    }, 0);
  const latestActivityDate = latestActivityTimestamp
    ? new Date(latestActivityTimestamp).toLocaleDateString('fr-FR')
    : null;
  const activityBaseline = plannedActivities && plannedActivities > 0 ? plannedActivities : 10;
  const activityProgress = Math.min(totalActivities / activityBaseline, 1);

  const totalBeneficiariesRecorded = activities.reduce<number>((sum, a) => {
    if (!a || typeof a.beneficiariesCount !== 'number') return sum;
    if (Number.isNaN(a.beneficiariesCount) || a.beneficiariesCount < 0) return sum;
    return sum + a.beneficiariesCount;
  }, 0);
  const plannedBeneficiaries =
    typeof project.beneficiariesPlanned === 'number' && project.beneficiariesPlanned > 0
      ? project.beneficiariesPlanned
      : null;
  const beneficiariesProgress =
    plannedBeneficiaries && plannedBeneficiaries > 0
      ? Math.min((totalBeneficiariesRecorded / plannedBeneficiaries) * 100, 999)
      : null;

  // --- Styles Constants ---
  const cardClass = "bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300";
  const labelClass = "text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-1";
  const inputClass = "block w-full border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-900 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002060]/20 focus:border-[#002060] transition-all";
  const buttonPrimaryClass = "inline-flex justify-center items-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-[#002060] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#002060] shadow-sm transition-all";
  const buttonSecondaryClass = "inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-xs font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top banner */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold">
              Espace Responsable
            </span>
            <div className="flex items-center gap-3">
               <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#002060]">
                Tableau de bord
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#002060] border border-blue-100 uppercase">
                {project.id}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {orgName}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="group flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span>Déconnexion</span>
             <X className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          {/* High level cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bailleur */}
            <div className={cardClass + " p-5"}>
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-1.5 rounded-md bg-blue-50 text-[#002060]">
                    <User className="w-3.5 h-3.5" />
                 </div>
                 <p className={labelClass + " mb-0"}>Bailleur</p>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate pl-1">
                {project.bailleur || '—'}
              </p>
            </div>

            {/* Secteur */}
            <div className={cardClass + " p-5"}>
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-1.5 rounded-md bg-purple-50 text-purple-700">
                    <Tag className="w-3.5 h-3.5" />
                 </div>
                 <p className={labelClass + " mb-0"}>Secteur</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
                  {project.sector}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                   {project.type}
                </span>
              </div>
            </div>

            {/* Période */}
            <div className={cardClass + " p-5"}>
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-1.5 rounded-md bg-orange-50 text-orange-700">
                    <Calendar className="w-3.5 h-3.5" />
                 </div>
                 <p className={labelClass + " mb-0"}>Période</p>
              </div>
              <p className="text-xs font-semibold text-gray-800 pl-1">
                {new Date(project.startDate).toLocaleDateString('fr-FR')} <span className="text-gray-400 mx-1">➜</span> {new Date(project.endDate).toLocaleDateString('fr-FR')}
              </p>
            </div>

            {/* Activités Stats */}
            <div className={cardClass + " p-5 relative overflow-hidden"}>
              <div className="absolute right-0 top-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
              <div className="flex items-center gap-2 mb-2 relative z-10">
                 <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                    <Activity className="w-3.5 h-3.5" />
                 </div>
                 <p className={labelClass + " mb-0"}>Activités</p>
              </div>
              <div className="flex items-baseline gap-1 pl-1 relative z-10">
                <span className="text-xl font-black text-[#002060]">{totalActivities}</span>
                <span className="text-xs text-gray-500 font-medium">/ {plannedActivities !== null ? plannedActivities : '—'} prévues</span>
              </div>
            </div>
          </div>

          {/* Metrics row: localisation + bénéficiaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Localisation du projet */}
            <div className={`${cardClass} p-5 flex flex-col justify-center`}>
              <div className="flex items-center gap-2 mb-3">
                 <MapPin className="w-4 h-4 text-gray-400" />
                 <p className={labelClass + " mb-0"}>Localisation</p>
              </div>
              {locationSegments.length > 0 ? (
                <div className="space-y-1 text-xs font-medium text-gray-700 pl-6 border-l-2 border-gray-100">
                  {locationSegments.slice(0, 3).map((line) => (
                    <p key={line} className="truncate" title={line}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic pl-6">
                  {project.location || 'Non renseignée.'}
                </p>
              )}
            </div>

            {/* Bénéficiaires prévus */}
            <div className={`${cardClass} p-5 flex flex-col justify-center`}>
               <p className={labelClass}>Bénéficiaires prévus</p>
               <div className="flex items-baseline gap-2 mt-1">
                 <p className="text-2xl sm:text-3xl font-black text-[#002060]">
                  {plannedBeneficiaries !== null
                    ? plannedBeneficiaries.toLocaleString('fr-FR')
                    : '—'}
                 </p>
               </div>
               {beneficiaryType && (
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1 truncate">
                   Cible: {beneficiaryType}
                 </p>
               )}
            </div>

            {/* Total bénéficiaires enregistrés */}
            <div className={`${cardClass} p-5 flex flex-col justify-center bg-gradient-to-br from-white to-blue-50/30`}>
              <p className={labelClass}>Total atteints</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {totalBeneficiariesRecorded > 0
                  ? totalBeneficiariesRecorded.toLocaleString('fr-FR')
                  : '0'}
              </p>
              {plannedBeneficiaries && totalBeneficiariesRecorded > 0 && beneficiariesProgress !== null ? (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                   <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(beneficiariesProgress, 100)}%` }}></div>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 mt-1">En attente de données...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6 items-start">
            {/* Left column: activities and stream */}
            <div className="space-y-6">
              <section className={cardClass}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#002060] uppercase tracking-wide">
                      Activités du projet
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Journal des réalisations sur le terrain
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`group ${showNewActivityForm ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-[#002060] border-blue-100'} border px-3 py-1.5 rounded-lg text-xs font-bold transition-all`}
                    onClick={() => setShowNewActivityForm((prev) => !prev)}
                  >
                    {showNewActivityForm ? (
                       <span className="flex items-center gap-1"><X className="w-3 h-3"/> Fermer</span>
                    ) : (
                       <span className="flex items-center gap-1"><Plus className="w-3 h-3"/> Ajouter</span>
                    )}
                  </button>
                </div>

                {showNewActivityForm && (
                  <div className="p-5 bg-slate-50 border-b border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <form className="space-y-4" onSubmit={handleCreateActivity}>
                      <div>
                        <label className={labelClass}>Titre de l'activité</label>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Ex: Distribution de kits alimentaires"
                          value={newActivityTitle}
                          onChange={(e) => setNewActivityTitle(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Date de début</label>
                          <input
                            type="date"
                            className={inputClass}
                            value={newActivityDate}
                            onChange={(e) => setNewActivityDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Lieu(x)</label>
                          {locationPlaceOptions.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                              {locationPlaceOptions.map((place) => (
                                <button
                                  key={place}
                                  type="button"
                                  onClick={() => toggleActivityLocation(place)}
                                  className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${selectedActivityLocations.includes(place) ? 'bg-[#002060] text-white border-[#002060]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                  {place}
                                </button>
                              ))}
                            </div>
                          )}
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Indiquez un ou plusieurs lieux si besoin"
                            value={newActivityLocation}
                            onChange={(e) => setNewActivityLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className={labelClass}>Durée (Jours)</label>
                          <input
                            type="number"
                            min="1"
                            className={inputClass}
                            placeholder="Ex: 2"
                            value={newActivityDaysCount}
                            onChange={(e) => setNewActivityDaysCount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Nb. Bénéficiaires</label>
                          <input
                            type="number"
                            min="0"
                            className={inputClass}
                            placeholder="Ex: 150"
                            value={newActivityBeneficiaries}
                            onChange={(e) => setNewActivityBeneficiaries(e.target.value)}
                          />
                        </div>
                        {newActivityDaysCount && Number(newActivityDaysCount) > 1 && (
                          <div>
                            <label className={labelClass}>Date de fin</label>
                            <input
                              type="date"
                              className={inputClass}
                              value={newActivityEndDate}
                              onChange={(e) => setNewActivityEndDate(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>Description détaillée</label>
                        <textarea
                          className={inputClass + " min-h-[80px]"}
                          placeholder="Objectifs, déroulement, observations..."
                          value={newActivityDescription}
                          onChange={(e) => setNewActivityDescription(e.target.value)}
                        />
                      </div>

                      <div>
                          <label className={labelClass}>Services Gouv. Impliqués</label>
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Ex: Santé, Éducation"
                            value={newActivityGovServices}
                            onChange={(e) => setNewActivityGovServices(e.target.value)}
                          />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className={buttonPrimaryClass}
                        >
                          Enregistrer l'activité
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activitiesError && (
                  <div className="mx-5 mt-4 rounded-lg bg-red-50 border border-red-100 p-3 flex items-start gap-2">
                    <div className="text-red-500 mt-0.5"><X className="w-4 h-4"/></div>
                    <p className="text-xs text-red-700 font-medium">{activitiesError}</p>
                  </div>
                )}

                <div className="p-0">
                  <div className="bg-gray-50/50 px-5 py-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chronologie</span>
                    <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500">
                      {activities.length}
                    </span>
                  </div>
                  
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {activitiesLoading ? (
                    <div className="p-8 text-center">
                       <div className="animate-spin h-6 w-6 border-2 border-[#002060] border-t-transparent rounded-full mx-auto mb-2"></div>
                       <p className="text-xs text-gray-500">Chargement...</p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5 opacity-50" />
                      </div>
                      <p className="text-sm font-medium">Aucune activité</p>
                      <p className="text-xs mt-1 max-w-xs">Utilisez le bouton "Ajouter" pour commencer à documenter votre projet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {activities.filter((a): a is ProjectActivity => !!a).map((a) => {
                        const isExpanded = expandedActivityId === a.id;

                        let displayDate = a.date
                          ? new Date(a.date).toLocaleDateString('fr-FR')
                          : '-';
                        if (a.date && a.description) {
                          const match = a.description.match(
                            /(Date de fin prévue:|Date de fin de l'activité:)\s*([0-9/]+)/,
                          );
                          if (match && match[2]) {
                            const endStr = match[2];
                            displayDate = `${new Date(a.date).toLocaleDateString('fr-FR')} au ${endStr}`;
                          }
                        }

                        let activityStatus: 'pending' | 'completed' | 'unknown' = 'unknown';
                        if (a.date) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const activityDate = new Date(a.date);
                          activityDate.setHours(0, 0, 0, 0);
                          activityStatus = activityDate > today ? 'pending' : 'completed';
                        }

                        const isPending = activityStatus === 'pending';

                        return (
                          <div
                            key={a.id}
                            className={`group transition-colors ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                          >
                            <div 
                                className="px-5 py-4 cursor-pointer"
                                onClick={() => setExpandedActivityId((current) => current === a.id ? null : a.id)}
                            >
                              <div className="flex items-start gap-3">
                                {/* Date Box */}
                                <div className="hidden sm:flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-white border border-gray-200 text-center shrink-0 shadow-sm">
                                   <span className="text-[10px] text-gray-400 font-bold uppercase">{a.date ? new Date(a.date).toLocaleString('fr-FR', { month: 'short' }) : '-'}</span>
                                   <span className="text-lg font-black text-[#002060] leading-none">{a.date ? new Date(a.date).getDate() : '-'}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                   <div className="flex items-start justify-between gap-2">
                                      <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#002060] transition-colors">
                                        {a.title}
                                      </h3>
                                      {activityStatus !== 'unknown' && (
                                        <span
                                          className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                            activityStatus === 'completed'
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                              : 'bg-amber-50 text-amber-700 border-amber-100'
                                          }`}
                                        >
                                          {activityStatus === 'completed' ? 'Complétée' : 'À venir'}
                                        </span>
                                      )}
                                   </div>
                                   
                                   <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                      <span className="sm:hidden font-medium">{displayDate}</span>
                                      {a.location && (
                                         <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {a.location}
                                         </span>
                                      )}
                                      {typeof a.beneficiariesCount === 'number' && (
                                         <span className="flex items-center gap-1 text-[#002060] font-medium">
                                            <User className="w-3 h-3" /> {a.beneficiariesCount} bénéficiaires
                                         </span>
                                      )}
                                   </div>
                                </div>
                                
                                <div className="shrink-0 text-gray-400">
                                   {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="px-5 pb-5 pt-0 ml-0 sm:ml-16">
                                <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 leading-relaxed whitespace-pre-wrap shadow-sm">
                                  {a.description || <span className="italic text-gray-400">Aucune description détaillée disponible.</span>}
                                </div>
                                
                                {isPending && (
                                  <div className="mt-3 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingActivityId(a.id);

                                        // Nouvelle date (date de depart)
                                        setEditActivityDate(a.date ? a.date.slice(0, 10) : '');

                                        // Durée de l'activité (jours)
                                        if (
                                          typeof a.daysCount === 'number' &&
                                          a.daysCount > 0 &&
                                          !Number.isNaN(a.daysCount)
                                        ) {
                                          setEditActivityDaysCount(String(a.daysCount));
                                        } else {
                                          setEditActivityDaysCount('');
                                        }

                                        // Nombre de bénéficiaires de l'activité
                                        if (
                                          typeof a.beneficiariesCount === 'number' &&
                                          a.beneficiariesCount >= 0 &&
                                          !Number.isNaN(a.beneficiariesCount)
                                        ) {
                                          setEditActivityBeneficiaries(String(a.beneficiariesCount));
                                        } else {
                                          setEditActivityBeneficiaries('');
                                        }

                                        // Date de fin de l'activité
                                        setEditActivityEndDate(
                                          a.endDate ? a.endDate.slice(0, 10) : '',
                                        );

                                        // Services gouvernementaux impliqués
                                        let currentServices = '';
                                        if (
                                          typeof a.govServices === 'string' &&
                                          a.govServices.trim().length > 0
                                        ) {
                                          currentServices = a.govServices.trim();
                                        } else if (a.description) {
                                          const lines = a.description.split('\n');
                                          for (const line of lines) {
                                            const m = line.match(
                                              /Services gouvernementaux impliqués\s*:(.*)/i,
                                            );
                                            if (m) {
                                              currentServices = m[1].trim();
                                              break;
                                            }
                                          }
                                        }
                                        setEditActivityGovServices(currentServices);
                                      }}
                                      className={buttonSecondaryClass}
                                    >
                                      Modifier la date / Reporter
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Edit Form */}
                            {editingActivityId === a.id && (
                              <div className="mx-5 mb-5 p-4 rounded-xl border border-amber-200 bg-amber-50 relative animate-in fade-in zoom-in-95 duration-200">
                                <div className="absolute top-2 right-2">
                                   <button onClick={() => setEditingActivityId(null)} className="text-amber-400 hover:text-amber-700"><X className="w-4 h-4"/></button>
                                </div>
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <Activity className="w-4 h-4"/> Reporter l'activité
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Nouvelle date</label>
                                    <input
                                      type="date"
                                      className="block w-full border border-amber-300 rounded-md bg-white text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                      value={editActivityDate}
                                      onChange={(e) => setEditActivityDate(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Durée de l'activité (jours)</label>
                                      <input
                                        type="number"
                                        min={1}
                                        className="block w-full border border-amber-300 rounded-md bg-white text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                        value={editActivityDaysCount}
                                        onChange={(e) => setEditActivityDaysCount(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Nombre de bénéficiaires</label>
                                      <input
                                        type="number"
                                        min={0}
                                        className="block w-full border border-amber-300 rounded-md bg-white text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                        value={editActivityBeneficiaries}
                                        onChange={(e) => setEditActivityBeneficiaries(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Date de fin de l'activité</label>
                                      <input
                                        type="date"
                                        className="block w-full border border-amber-300 rounded-md bg-gray-100 text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                        value={editActivityEndDate}
                                        onChange={(e) => setEditActivityEndDate(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">Services Impliqués</label>
                                      <input
                                        type="text"
                                        className="block w-full border border-amber-300 rounded-md bg-white text-xs px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                                        value={editActivityGovServices}
                                        onChange={(e) => setEditActivityGovServices(e.target.value)}
                                      />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={updatingActivityId === a.id}
                                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-50"
                                      onClick={() => handleUpdateActivityDate(a)}
                                    >
                                      {updatingActivityId === a.id ? '...' : 'Confirmer'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right column: project meta & contact */}
            <div className="space-y-6">
              <section className={cardClass + " p-5 sticky top-24"}>
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-[#002060] uppercase tracking-wide">
                    Fiche Technique
                  </h2>
                </div>

                <div className="space-y-5">
                  {(projectName || description) && (
                    <div className="space-y-2">
                      {projectName && (
                        <div>
                           <p className={labelClass}>Projet</p>
                           <h3 className="text-lg font-bold text-gray-900 leading-tight">
                             {projectName}
                           </h3>
                        </div>
                      )}
                      {description && (
                         <div>
                            <p className={labelClass + " mt-2"}>Contexte</p>
                            <div className="text-xs text-gray-600 leading-relaxed text-justify bg-gray-50 p-3 rounded-lg border border-gray-100">
                              {description}
                            </div>
                         </div>
                      )}
                    </div>
                  )}

                  {(projectLead || projectLeadPhone || projectLeadEmail) && (
                    <div>
                      <p className={labelClass}>Chef de Projet</p>
                      <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2 shadow-sm">
                        {projectLead && (
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                               <User className="w-3 h-3"/>
                             </div>
                             <p className="text-xs font-bold text-gray-800">{projectLead}</p>
                          </div>
                        )}
                        {projectLeadPhone && (
                           <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone className="w-3 h-3 text-gray-400"/>
                              <span>{projectLeadPhone}</span>
                           </div>
                        )}
                        {projectLeadEmail && (
                           <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="w-3 h-3 text-gray-400"/>
                              <span className="truncate">{projectLeadEmail}</span>
                           </div>
                        )}
                      </div>
                    </div>
                  )}

                  {locationSegments.length > 0 && (
                     <div>
                        <p className={labelClass}>Zones d'intervention</p>
                        <div className="space-y-2 mt-1">
                           {locationSegments.map((seg, idx) => (
                             <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 bg-blue-50/50 p-2 rounded border border-blue-50">
                                <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                                <span className="leading-snug">{seg}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  )}
                </div>
              </section>
            </div>
          </div>
      </main>
    </div>
  );
};