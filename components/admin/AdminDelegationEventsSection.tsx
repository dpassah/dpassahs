import React from 'react';
import { Calendar, MapPin, Plus } from 'lucide-react';

interface DelegationEventForm {
  title: string;
  date: string;
  location: string;
  description: string;
}

interface DelegationEventRow {
  id: string;
  title: string;
  date?: string | null;
  location?: string | null;
  description?: string | null;
}

interface AdminDelegationEventsSectionProps {
  delegationEvents: DelegationEventRow[];
  delegationEventsLoading: boolean;
  delegationEventError: string;
  delegationEventForm: DelegationEventForm;
  setDelegationEventForm: (form: DelegationEventForm) => void;
  adminCreateDelegationEvent: (payload: {
    title: string;
    date?: string;
    location?: string;
    description?: string;
  }) => Promise<void>;
  loadDelegationEvents: () => Promise<void> | void;
  inputClassName: string;
  labelClassName: string;
  SectionHeader: React.ComponentType<{
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
  }>;
  ActionButton: React.ComponentType<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }
  >;
}

export const AdminDelegationEventsSection: React.FC<AdminDelegationEventsSectionProps> = ({
  delegationEvents,
  delegationEventsLoading,
  delegationEventError,
  delegationEventForm,
  setDelegationEventForm,
  adminCreateDelegationEvent,
  loadDelegationEvents,
  inputClassName,
  labelClassName,
  SectionHeader,
  ActionButton,
}) => {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-xs">
        <SectionHeader
          title="Activités de la Délégation"
          subtitle="Journal des événements officiels et réunions de coordination."
        />

        {delegationEventError && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded text-xs border border-red-100">
            {delegationEventError}
          </div>
        )}

        <form
          className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!delegationEventForm.title.trim()) return;
            try {
              await adminCreateDelegationEvent({
                title: delegationEventForm.title.trim(),
                date: delegationEventForm.date || undefined,
                location: delegationEventForm.location || undefined,
                description: delegationEventForm.description || undefined,
              });
              setDelegationEventForm({
                title: '',
                date: '',
                location: '',
                description: '',
              });
              loadDelegationEvents();
            } catch (err: any) {
              // يُتوقع أن يتم التعامل مع الخطأ على مستوى أعلى إذا لزم
            }
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-4 w-4 text-[#002060]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase">
              Nouvelle Activité
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr] gap-4 mb-3">
            <div>
              <label className={labelClassName}>Titre</label>
              <input
                type="text"
                required
                placeholder="Ex: Réunion mensuelle"
                value={delegationEventForm.title}
                onChange={(e) =>
                  setDelegationEventForm({ ...delegationEventForm, title: e.target.value })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Date</label>
              <input
                type="date"
                value={delegationEventForm.date}
                onChange={(e) =>
                  setDelegationEventForm({ ...delegationEventForm, date: e.target.value })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Lieu</label>
              <input
                type="text"
                placeholder="Goz Beida..."
                value={delegationEventForm.location}
                onChange={(e) =>
                  setDelegationEventForm({ ...delegationEventForm, location: e.target.value })
                }
                className={inputClassName}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className={labelClassName}>Description</label>
            <textarea
              rows={2}
              placeholder="Détails..."
              value={delegationEventForm.description}
              onChange={(e) =>
                setDelegationEventForm({ ...delegationEventForm, description: e.target.value })
              }
              className={inputClassName}
            />
          </div>
          <div className="flex justify-end">
            <ActionButton
              type="submit"
              disabled={delegationEventsLoading || !delegationEventForm.title.trim()}
            >
              Enregistrer l'activité
            </ActionButton>
          </div>
        </form>

        <div className="mt-3">
          {delegationEventsLoading ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Chargement...
            </div>
          ) : delegationEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded">
              Aucune activité enregistrée.
            </div>
          ) : (
            <div className="grid gap-3">
              {delegationEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#002060]">{ev.title}</h4>
                    <p className="text-[11px] text-gray-600 mt-1">
                      {ev.description || (
                        <span className="italic text-gray-400">Pas de description</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 md:gap-1 text-[10px] text-gray-500 md:w-40 md:text-right md:border-l md:border-gray-100 md:pl-4 justify-between md:justify-center">
                    <div className="flex items-center md:justify-end gap-1">
                      <Calendar className="h-3 w-3" /> {ev.date || 'N/A'}
                    </div>
                    <div className="flex items-center md:justify-end gap-1">
                      <MapPin className="h-3 w-3" /> {ev.location || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
