import React, { useRef, useState, useEffect } from 'react';
import { Activity } from '../types';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Building2 } from 'lucide-react';

interface ActivitySliderProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  variant?: 'image' | 'text';
}

const ActivitySlider: React.FC<ActivitySliderProps> = ({ activities, onActivityClick, variant = 'image' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Responsive items per page
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (typeof window !== 'undefined') {
        setItemsPerPage(window.innerWidth < 768 ? 1 : 3);
      }
    };

    // Initial check
    updateItemsPerPage();

    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  // Reset index if total pages changes to avoid out of bounds
  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerPage]);

  if (!activities || activities.length === 0) {
    return null;
  }

  const getImageUrl = (image: string | string[] | undefined) => {
    if (!image) return null;

    // If it's an array, take the first image
    let imgStr = Array.isArray(image) ? image[0] : image;
    
    if (typeof imgStr !== 'string') return null;

    if (imgStr.startsWith('http')) {
      return imgStr;
    }

    // Fix for production: force /api prefix for backend static files
    if (import.meta.env.PROD) {
        const cleanImg = imgStr.startsWith('/') ? imgStr.substring(1) : imgStr;
        if (cleanImg.startsWith('public/')) return `/api/${cleanImg}`;
        return `/api/public/delegation-events/${cleanImg}`;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    if (imgStr.startsWith('/public/')) {
      return `${API_BASE_URL}${imgStr}`;
    }
    
    if (imgStr.startsWith('/')) {
        return `${API_BASE_URL}${imgStr}`;
    }

    // If it's just a filename, prepend the public path
    return `${API_BASE_URL}/public/delegation-events/${imgStr}`;
  };

  const getFullImageUrl = (image: string) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    
    if (import.meta.env.PROD) {
        const cleanImg = image.startsWith('/') ? image.substring(1) : image;
        if (cleanImg.startsWith('public/')) return `/api/${cleanImg}`;
        return `/api/public/delegation-events/${cleanImg}`;
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    if (image.startsWith('/public/')) return `${API_BASE_URL}${image}`;
    return `${API_BASE_URL}/public/delegation-events/${image}`;
  };

  const activitiesPerPage = itemsPerPage;
  const totalPages = Math.ceil(activities.length / activitiesPerPage);
  const startIndex = currentIndex * activitiesPerPage;
  const visibleActivities = activities.slice(startIndex, startIndex + activitiesPerPage);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalPages - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === totalPages - 1 ? 0 : prevIndex + 1
    );
  };

  // Modal handlers
  const openModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setSelectedActivity(null);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedActivity) return;

    const images = selectedActivity.images && selectedActivity.images.length > 0
      ? selectedActivity.images
      : selectedActivity.image ? [selectedActivity.image] : [];

    if (images.length <= 1) return;

    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedActivity) return;

    const images = selectedActivity.images && selectedActivity.images.length > 0
      ? selectedActivity.images
      : selectedActivity.image ? [selectedActivity.image] : [];

    if (images.length <= 1) return;

    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedActivity) return;

      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') {
        const images = selectedActivity.images && selectedActivity.images.length > 0
          ? selectedActivity.images
          : selectedActivity.image ? [selectedActivity.image] : [];
        if (images.length > 1) setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
      if (e.key === 'ArrowLeft') {
        const images = selectedActivity.images && selectedActivity.images.length > 0
          ? selectedActivity.images
          : selectedActivity.image ? [selectedActivity.image] : [];
        if (images.length > 1) setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedActivity]);

  return (
    <div className="relative group/slider">
      <div className="overflow-hidden rounded-none">
        <div
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out gap-0"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div
              key={pageIndex}
              className="flex-shrink-0 w-full flex gap-4 px-4 md:px-0"
            >
              {activities
                .slice(pageIndex * activitiesPerPage, (pageIndex + 1) * activitiesPerPage)
                .map((activity) => {
                  const imageUrl = getImageUrl(activity.image);

                  if (variant === 'text') {
                    return (
                      <div
                        key={activity.id}
                        className="flex-1 cursor-pointer flex"
                        onClick={() => onActivityClick ? onActivityClick(activity) : openModal(activity)}
                      >
                        <div className="w-full bg-white rounded-xl shadow-md hover:shadow-xl border border-slate-200 p-6 flex flex-col transition-all duration-300 relative overflow-hidden group hover:-translate-y-1">
                          {/* Status Strip */}
                          <div className={`absolute top-0 left-0 w-full h-1.5 ${activity.status === 'completed' ? 'bg-emerald-500' :
                              activity.status === 'ongoing' ? 'bg-blue-500' : 'bg-gray-300'
                            }`}></div>

                          {/* Top Metadata: Status Badge & Date */}
                          <div className="flex justify-between items-center mb-3 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                activity.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                activity.status === 'ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}>
                                {activity.status === 'completed' ? 'Terminée' : activity.status === 'ongoing' ? 'En cours' : 'À venir'}
                            </span>
                            {activity.date && (
                              <span className="text-xs text-slate-400 flex items-center font-medium">
                                <Calendar className="w-3 h-3 mr-1 text-slate-300" /> {activity.date}
                              </span>
                            )}
                          </div>

                          {/* Project Name (First) */}
                          {activity.projectName && (
                            <div className="mb-1">
                              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wide block truncate">
                                {activity.projectName}
                              </span>
                            </div>
                          )}

                          {/* Activity Title (Second) */}
                          <h3 className="text-lg font-bold text-[#002060] mb-3 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors">
                            {activity.title}
                          </h3>

                          {/* Category & Gov Services */}
                          <div className="flex flex-wrap gap-2 mb-3">
                             <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded border border-slate-200">
                                {activity.category || 'Activité'}
                             </span>
                             {activity.govServices && (
                                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded">
                                  Svc: {activity.govServices}
                                </span>
                             )}
                          </div>

                          {/* Description Short */}
                          <p className="text-slate-500 text-sm line-clamp-3 flex-grow leading-relaxed mb-4">
                            {activity.description || "Cliquez pour voir les détails..."}
                          </p>

                          {/* Footer */}
                          <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[55%] flex items-center">
                               <Building2 className="w-3 h-3 mr-1 text-slate-300" />
                               {activity.orgName}
                            </span>
                            <span className="text-xs text-[#002060] font-bold flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                              Détails <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={activity.id}
                      className="flex-1 overflow-hidden relative group cursor-pointer rounded-lg"
                      onClick={() => onActivityClick ? onActivityClick(activity) : openModal(activity)}
                    >
                      {imageUrl ? (
                        <div className="h-[28rem] overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={activity.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          {/* Overlay content */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                              {activity.govServices && (
                                <div className="mb-2">
                                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-red-600 bg-white rounded shadow-sm">
                                    Services Gouv: {activity.govServices}
                                  </span>
                                </div>
                              )}
                              {activity.projectName && (
                                <div className="mb-1">
                                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                                    Projet: {activity.projectName}
                                  </span>
                                </div>
                              )}
                              <h3 className="font-bold text-2xl mb-3 drop-shadow-lg group-hover:text-[#FECB00] transition-colors">{activity.title}</h3>
                              {activity.description && (
                                <p className="text-base mb-3 line-clamp-2 drop-shadow-md leading-relaxed">
                                  {activity.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {activity.date && (
                                  <span className="text-sm drop-shadow-md flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> {activity.date}
                                  </span>
                                )}
                                {activity.location && (
                                  <span className="text-sm drop-shadow-md flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {activity.location}
                                  </span>
                                )}
                              </div>
                              {activity.category && (
                                <span className="inline-block px-4 py-2 text-sm font-medium bg-blue-600/90 backdrop-blur-sm rounded-full border border-blue-400/50">
                                  {activity.category}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover hint */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-2 rounded-full backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[28rem] flex items-center justify-center bg-gray-100 text-gray-400">
                          <span className="text-sm">Aucune image disponible</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {totalPages > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg border border-gray-200 text-gray-700 hover:bg-[#002060] hover:text-white transition-all duration-200 z-20 hover:scale-110 -ml-3 md:-ml-5"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg border border-gray-200 text-gray-700 hover:bg-[#002060] hover:text-white transition-all duration-200 z-20 hover:scale-110 -mr-3 md:-mr-5"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Page indicators */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
                ? 'bg-[#002060] w-8'
                : 'bg-gray-300 hover:bg-gray-400'
                }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white w-full max-w-2xl p-8 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                {selectedActivity.category && (
                  <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100 rounded-full mb-3 mr-2">
                    {selectedActivity.category}
                  </span>
                )}
                {selectedActivity.govServices && (
                  <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 rounded-full mb-3 border border-red-200">
                    Services Gouv: {selectedActivity.govServices}
                  </span>
                )}
                {selectedActivity.projectName && (
                  <div className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-1">
                    Projet: {selectedActivity.projectName}
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedActivity.title}</h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {selectedActivity.date && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-[#002060]" />
                  <span className="font-medium">{selectedActivity.date}</span>
                </div>
              )}
              {selectedActivity.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-[#002060]" />
                  <span className="font-medium">{selectedActivity.location}</span>
                </div>
              )}
            </div>

            <div className="prose prose-sm prose-blue text-gray-600 leading-relaxed">
              <p className="whitespace-pre-line">{selectedActivity.description || "Aucune description disponible."}</p>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-100">
              <div className="flex items-center justify-end text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{selectedActivity.orgName || "Délégation Provinciale"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default ActivitySlider;
