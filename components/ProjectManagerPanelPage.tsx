import React, { useEffect, useState } from 'react';
import { ProjectManagerDashboard } from './ProjectManagerDashboard';
import { ProjectManagerSession } from '../types';

export const ProjectManagerPanelPage: React.FC = () => {
  const [session, setSession] = useState<ProjectManagerSession | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('sila_project_session');
    if (!raw) {
      window.location.href = '/projet';
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ProjectManagerSession;
      if (!parsed || !parsed.project || !parsed.orgId) {
        sessionStorage.removeItem('sila_project_session');
        window.location.href = '/projet';
        return;
      }
      setSession(parsed);
    } catch (err) {
      sessionStorage.removeItem('sila_project_session');
      window.location.href = '/projet';
    }
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  const handleLogout = () => {
    sessionStorage.removeItem('sila_project_session');
    window.location.href = '/';
  };

  return <ProjectManagerDashboard session={session} onLogout={handleLogout} />;
};
