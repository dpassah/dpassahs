import React from 'react';
import { Activity } from '../types';

interface PartnerCardProps {
  activity: Activity;
}

const PartnerCard: React.FC<PartnerCardProps> = ({ activity }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'ongoing':
        return 'En cours';
      case 'upcoming':
        return 'À venir';
      default:
        return 'En attente';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {activity.image && (
        <div className="h-40 overflow-hidden">
          <img
            src={activity.image}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2">{activity.title}</h3>
        
        {activity.orgName && (
          <p className="text-sm text-gray-600 mb-1">{activity.orgName}</p>
        )}
        
        {activity.projectName && (
          <p className="text-sm text-gray-600 mb-1">{activity.projectName}</p>
        )}
        
        {activity.date && (
          <p className="text-sm text-gray-500 mb-2">{activity.date}</p>
        )}
        
        {activity.location && (
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {activity.location}
          </div>
        )}
        
        {activity.status && (
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(activity.status)}`}>
            {getStatusText(activity.status)}
          </span>
        )}
      </div>
    </div>
  );
};

export default PartnerCard;
