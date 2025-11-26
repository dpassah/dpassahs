import React, { useEffect, useState } from 'react';
import { Dashboard } from './Dashboard';
import type { UserSession } from '../types';

export const OrganisationDashboardPage: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sila_user_session');
      if (!raw) {
        window.location.href = '/';
        return;
      }
      const parsed = JSON.parse(raw) as UserSession;
      if (!parsed.orgId || !parsed.orgName) {
        sessionStorage.removeItem('sila_user_session');
        window.location.href = '/';
        return;
      }
      setUser(parsed);
    } catch (e) {
      sessionStorage.removeItem('sila_user_session');
      window.location.href = '/';
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('sila_user_session');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 text-sm">
        Chargement de votre espace organisation...
      </div>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
