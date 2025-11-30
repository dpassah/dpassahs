import React, { useEffect, useState } from 'react';
import { MapPin, ShieldCheck, ChevronRight, User, Lock, Building2 } from 'lucide-react';
import {
  listRecentActivities,
  listPublicOrgs,
  registerOrg,
  login as loginRequest,
  projectManagerLogin,
  adminListDelegationEvents,
} from '../services/api';
import { OrgSummary, RegistrationPayload } from '../types';
import { PublicLayout } from './PublicLayout';

export const Home: React.FC = () => {
  // --- Modal State for Activity Detail ---
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Activités de la Délégation ---
  const [delegationActivities, setDelegationActivities] = useState<any[]>([]);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [delegationError, setDelegationError] = useState<string | null>(null);
  const [visibleDelegationCount, setVisibleDelegationCount] = useState(3);
  const [expandedDelegationId, setExpandedDelegationId] = useState<string | null>(null);

  // --- Activités des Partenaires ---
  const [partnerActivities, setPartnerActivities] = useState<any[]>([]);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [visiblePartnerCount, setVisiblePartnerCount] = useState(3);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);

  // --- Modal Handlers ---
  const openActivityModal = (activity: any) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const closeActivityModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedActivity(null), 300);
  };

  // --- Helper Functions ---
  const getActivityStatus = (status: string | undefined, date: string | null) => {
    if (!status) {
      return { label: 'En attente', className: 'bg-gray-100 text-gray-600' };
    }
    switch (status.toLowerCase()) {
      case 'completed':
      case 'terminé':
        return { label: 'Terminé', className: 'bg-green-100 text-green-700' };
      case 'in_progress':
      case 'en cours':
        return { label: 'En cours', className: 'bg-blue-100 text-blue-700' };
      case 'planned':
      case 'planifié':
        return { label: 'Planifié', className: 'bg-yellow-100 text-yellow-700' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-600' };
    }
  };

  useEffect(() => {
    const loadDelegationActivities = async () => {
      setDelegationLoading(true);
      setDelegationError(null);
      try {
        const delegationEvents = await adminListDelegationEvents();
        
        const mappedDelegation = (delegationEvents || []).map((ev) => ({
          id: `delegation-${ev.id}`,
          title: ev.title,
          date: ev.date,
          location: ev.location,
          description: ev.description,
          orgName: 'Délégation Provinciale',
          images: ev.images || [],
          createdAt: ev.createdAt,
        }));

        setDelegationActivities(mappedDelegation);
      } catch (err) {
        console.error('Failed to load delegation activities:', err);
        setDelegationError('Échec du chargement des activités de la délégation');
      } finally {
        setDelegationLoading(false);
      }
    };

    const loadPartnerActivities = async () => {
      setPartnerLoading(true);
      setPartnerError(null);
      try {
        const activities = await listRecentActivities();
        setPartnerActivities(activities || []);
      } catch (err) {
        console.error('Failed to load partner activities:', err);
        setPartnerError('Échec du chargement des activités des partenaires');
      } finally {
        setPartnerLoading(false);
      }
    };

    loadDelegationActivities();
    loadPartnerActivities();
  }, []);

  // ... (rest of the component code would be here)

  return (
    <PublicLayout>
      <div className="flex-grow flex flex-col">
        {/* Banner Area */}
        <div className="relative bg-gradient-to-br from-[#002060] to-[#004080] py-16 md:py-20 overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          
          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Plateforme de Suivi des Activités Sociales et Humanitaires
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Province de Sila - Coordination, Suivi et Évaluation des Interventions sur le Terrain
              </p>
            </div>
          </div>
        </div>

        {/* 4. Activities / News Section */}
        <section className="py-16 bg-gray-50 flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            
            {/* Section 1: Activités de la Délégation */}
            <div className="px-6 py-8">
              {delegationLoading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#002060] mb-4"></div>
                  <p className="text-[#002060] text-lg">Chargement des activités de la délégation...</p>
                </div>
              ) : delegationError ? (
                <div className="text-center py-16">
                  <p className="text-red-500 text-lg">{delegationError}</p>
                </div>
              ) : (
                <>
                  {delegationActivities.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-gray-500 text-lg italic">Aucune activité de la délégation.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Slider Container */}
                      <div className="overflow-hidden">
                        <div 
                          className="flex transition-transform duration-500 ease-out snap-x snap-mandatory"
                          style={{
                            transform: `translateX(-${(visibleDelegationCount - 1) * 33.333}%)`
                          }}
                        >
                          {delegationActivities.map((activity, index) => (
                            <div
                              key={activity.id}
                              className="group relative flex flex-col min-w-full sm:min-w-[50%] lg:min-w-[33.333333%] h-[450px] snap-start overflow-hidden bg-white transition-colors duration-300 ease-out hover:bg-slate-50 focus:outline-none focus:z-10 focus:ring-inset focus:ring-4 focus:ring-indigo-300/50 cursor-pointer"
                              onClick={() => openActivityModal(activity)}
                            >
                              {/* Image Container - Fixed height ratio */}
                              <div className="relative h-56 shrink-0 overflow-hidden">
                                {activity.images && activity.images.length > 0 ? (
                                  <img
                                    src={activity.images[0].startsWith('http') ? activity.images[0] : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${activity.images[0]}`}
                                    alt={activity.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="w-16 h-16 bg-[#002060]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl">📸</span>
                                      </div>
                                      <p className="text-gray-500 text-sm">Aucune image</p>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                
                                {/* Category Badge */}
                                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm tracking-wide">
                                  Délégation
                                </span>
                              </div>

                              {/* Content Container - Flex grow to fill space */}
                              <div className="flex flex-col flex-grow p-6 text-right">
                                
                                {/* Date Row */}
                                {activity.date && (
                                  <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-400 mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-500">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0h18M5.25 12h13.5" />
                                    </svg>
                                    <span>{new Date(activity.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                  </div>
                                )}

                                {/* Title */}
                                <h3 className="text-xl font-extrabold text-slate-800 leading-snug mb-3 group-hover:text-indigo-700 transition-colors">
                                  {activity.title}
                                </h3>

                                {/* Description - Clamped */}
                                <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-4">
                                  {activity.description || 'Aucune description détaillée.'}
                                </p>
                                
                                {/* Spacer to push footer down */}
                                <div className="flex-grow" />

                                {/* Footer / Call to Action */}
                                <div className="flex items-center text-indigo-600 text-sm font-bold pt-4 border-t border-slate-100 mt-2">
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 20 20" 
                                    fill="currentColor" 
                                    className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1.5"
                                  >
                                    <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 0 1.06L11.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06l-4.25-4.25a.75.75 0 0 0-1.06 0Z" clipRule="evenodd" />
                                  </svg>
                                  <span className="group-hover:underline decoration-2 underline-offset-4 decoration-indigo-200">عرض التفاصيل</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Navigation Controls */}
                      {delegationActivities.length > 3 && (
                        <div className="flex items-center justify-between mt-6">
                          <button
                            type="button"
                            onClick={() => setVisibleDelegationCount(Math.max(1, visibleDelegationCount - 1))}
                            disabled={visibleDelegationCount === 1}
                            className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
                          >
                            <svg className="w-6 h-6 text-[#002060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <div className="flex gap-2">
                            {Array.from({ length: Math.min(3, delegationActivities.length) }, (_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setVisibleDelegationCount(i + 1)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  visibleDelegationCount === i + 1 ? 'bg-[#002060]' : 'bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setVisibleDelegationCount(Math.min(delegationActivities.length, visibleDelegationCount + 1))}
                            disabled={visibleDelegationCount === delegationActivities.length}
                            className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
                          >
                            <svg className="w-6 h-6 text-[#002060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Section 2: Activités des Partenaires */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#C60C30] to-[#E74C3C] px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-[#C60C30] text-sm font-bold">🤝</span>
                      </div>
                      Activités des Partenaires
                    </h2>
                    <p className="text-red-100 text-sm mt-1">Suivi des interventions sur le terrain</p>
                  </div>
                  <a href="/projets" className="text-sm font-semibold text-white hover:underline mt-2 md:mt-0">
                    Voir toutes les activités &rarr;
                  </a>
                </div>
              </div>

              <div className="p-6">
                {partnerLoading ? (
                  <div className="text-center py-10 text-gray-500">Chargement des activités des partenaires...</div>
                ) : partnerError ? (
                  <div className="text-center py-10 text-red-500">{partnerError}</div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {partnerActivities.length === 0 ? (
                        <p className="col-span-3 text-center text-gray-500 italic">Aucune activité des partenaires.</p>
                      ) : (
                        partnerActivities.slice(0, visiblePartnerCount).map((activity) => {
                          const isExpanded = expandedPartnerId === activity.id;
                          return (
                            <div
                              key={activity.id}
                              onClick={() =>
                                setExpandedPartnerId((prev) => (prev === activity.id ? null : activity.id))
                              }
                              className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                            >
                              <div className="h-2 bg-[#C60C30] group-hover:bg-[#FECB00] transition-colors rounded-t"></div>
                              <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <span className="inline-block px-2 py-1 bg-red-50 text-[#C60C30] text-[10px] font-bold uppercase rounded">
                                      {activity.orgName || activity.orgId}
                                    </span>
                                    {activity.govServices && (
                                      <div className="mt-1 text-[10px] text-gray-500">
                                        {activity.govServices}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {activity.date ? new Date(activity.date).toLocaleDateString() : '-'}
                                  </span>
                                </div>

                                <h3 className={`text-base font-bold text-gray-800 mb-1 group-hover:text-[#C60C30] transition-colors ${
                                  isExpanded ? '' : 'line-clamp-2'
                                }`}>
                                  Projet: {activity.projectName || 'Projet non spécifié'}
                                </h3>
                                <p className={`text-xs font-semibold text-gray-700 mb-2 ${
                                  isExpanded ? '' : 'line-clamp-2'
                                }`}>
                                  {activity.title}
                                </p>

                                <div className="text-xs text-gray-500 space-y-1">
                                  <p className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-[#C60C30]" />
                                    {activity.location || 'Sila'}
                                  </p>
                                  <p className="flex items-center">
                                    <ShieldCheck className="h-3 w-3 mr-1 text-gray-400" />
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getActivityStatus(
                                        activity.status,
                                        activity.date ?? null,
                                      ).className}`}
                                    >
                                      {getActivityStatus(activity.status, activity.date ?? null).label}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {partnerActivities.length > visiblePartnerCount && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisiblePartnerCount((prev) =>
                              Math.min(prev + 3, partnerActivities.length),
                            )
                          }
                          className="px-4 py-2 text-sm font-semibold text-[#C60C30] border border-[#C60C30] rounded hover:bg-[#C60C30] hover:text-white transition-colors"
                        >
                          Voir plus d'activités des partenaires
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Activity Detail Modal */}
        {isModalOpen && selectedActivity && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={closeActivityModal}
          >
            <div 
              className={`bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
                isModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#002060] to-[#003080] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedActivity.title}</h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {selectedActivity.date ? new Date(selectedActivity.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Date non spécifiée'}
                    </p>
                  </div>
                  <button
                    onClick={closeActivityModal}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Main Image */}
                {selectedActivity.images && selectedActivity.images.length > 0 && (
                  <div className="mb-6">
                    <img
                      src={selectedActivity.images[0].startsWith('http') ? selectedActivity.images[0] : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${selectedActivity.images[0]}`}
                      alt={selectedActivity.title}
                      className="w-full h-96 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                )}

                {/* Activity Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedActivity.description || 'Aucune description détaillée.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Lieu</h4>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-[#C60C30]" />
                        {selectedActivity.location || 'Sila'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Organisateur</h4>
                      <p className="text-gray-600">{selectedActivity.orgName}</p>
                    </div>
                  </div>

                  {/* Image Gallery */}
                  {selectedActivity.images && selectedActivity.images.length > 1 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Galerie d'images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {selectedActivity.images.map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image.startsWith('http') ? image : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${image}`}
                            alt={`Image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:border-[#002060]/50 transition-colors cursor-pointer"
                            onClick={() => window.open(image.startsWith('http') ? image : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${image}`, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
