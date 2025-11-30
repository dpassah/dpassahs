import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { StatsPage } from './components/StatsPage';
import { ProjectsPage } from './components/ProjectsPage';
import { AboutPage } from './components/AboutPage';
import { PartnersPage } from './components/PartnersPage';
import { ContactPage } from './components/ContactPage';
import { Dashboard } from './components/Dashboard';
import { OrganisationDashboardPage } from './components/OrganisationDashboardPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminPanel } from './components/AdminPanel';
import { ProjectManagerDashboard } from './components/ProjectManagerDashboard';
import { ProjectManagerLogin } from './components/ProjectManagerLogin';
import { ProjectManagerPanelPage } from './components/ProjectManagerPanelPage';
import { UserSession, RegistrationPayload, ProjectManagerSession } from './types';
import { login as loginRequest, registerOrg, projectManagerLogin } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [projectManager, setProjectManager] = useState<ProjectManagerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = sessionStorage.getItem('sila_user_session');
    const storedProjectSession = sessionStorage.getItem('sila_project_session');

    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch (e) {
        console.error('Failed to parse session', e);
        sessionStorage.removeItem('sila_user_session');
      }
    }

    if (storedProjectSession) {
      try {
        setProjectManager(JSON.parse(storedProjectSession));
      } catch (e) {
        console.error('Failed to parse project session', e);
        sessionStorage.removeItem('sila_project_session');
      }
    }

    setLoading(false);
  }, []);

  const handleLogin = async (orgId: string, password: string) => {
    // Logging in as organisation user clears any project-manager-only view
    sessionStorage.removeItem('sila_project_session');
    setProjectManager(null);
    const session = await loginRequest(orgId, password);
    sessionStorage.setItem('sila_user_session', JSON.stringify(session));
    setUser(session);
  };

  const handleProjectManagerLogin = async (projectId: string, password: string) => {
    // Logging in as project manager clears any org-wide dashboard session
    sessionStorage.removeItem('sila_user_session');
    setUser(null);

    const session = await projectManagerLogin(projectId, password);
    sessionStorage.setItem('sila_project_session', JSON.stringify(session));
    setProjectManager(session);

    window.location.href = '/projet/panel';
  };

  const handleRegister = async (payload: RegistrationPayload) => {
    return registerOrg(payload);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sila_user_session');
    sessionStorage.removeItem('sila_project_session');
    setUser(null);
    setProjectManager(null);
    window.location.hash = '';
    window.location.href = '/';
  };

  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const pathname = currentPath;
  const hash = currentHash;

  const isAdminLoginRoute = pathname === '/admin';

  // Admin panel routing with subsections under /admin/panel
  const isAdminPanelBaseRoute = pathname === '/admin/panel' || pathname.startsWith('/admin/panel/');

  type AdminSection = 'accounts' | 'orgs' | 'projects' | 'events' | 'delegationEvents';

  const getAdminSectionFromPath = (path: string): AdminSection => {
    if (!path.startsWith('/admin/panel')) return 'accounts';
    const parts = path.split('/').filter(Boolean); // ["admin", "panel", maybe slug]
    const slug = parts[2] || '';
    switch (slug) {
      case 'comptes':
        return 'accounts';
      case 'statistiques':
        return 'orgs';
      case 'projets':
        return 'projects';
      case 'activites-projets':
        return 'events';
      case 'activites-delegation':
        return 'delegationEvents';
      default:
        return 'accounts';
    }
  };

  const adminInitialSection = getAdminSectionFromPath(pathname);
  const isPmLoginRoute = pathname === '/projet';
  const isPmPanelRoute = pathname === '/projet/panel';
  const isHomeRoute = pathname === '/';
  const isLoginRoute = pathname === '/login';
  const isStatsRoute = pathname === '/statistiques';
  const isProjectsRoute = pathname === '/projets';
  const isPartnersRoute = pathname === '/partenaires';
  const isAboutRoute = pathname === '/a-propos';
  const isContactRoute = pathname === '/contact';
  const isOrgPanelHashRoute = hash === '#/org/panel';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (isAdminLoginRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminLogin />
      </div>
    );
  }

  if (isAdminPanelBaseRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminPanel initialSection={adminInitialSection} />
      </div>
    );
  }

  if (isPmLoginRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjectManagerLogin />
      </div>
    );
  }

  if (isPmPanelRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjectManagerPanelPage />
      </div>
    );
  }

  // Route hash spécifique pour l'espace organisation: /#/org/panel
  if (isOrgPanelHashRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OrganisationDashboardPage />
      </div>
    );
  }

  // Toujours afficher la page d'accueil publique sur '/'
  if (isHomeRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Home />
      </div>
    );
  }

  // Pages publiques: login, statistiques, projets, partenaires, à propos, contact
  if (!user && !projectManager && (isLoginRoute || isStatsRoute || isProjectsRoute || isPartnersRoute || isAboutRoute || isContactRoute)) {
    if (isStatsRoute) {
      return (
        <div className="min-h-screen bg-gray-50">
          <StatsPage />
        </div>
      );
    }
    if (isProjectsRoute) {
      return (
        <div className="min-h-screen bg-gray-50">
          <ProjectsPage />
        </div>
      );
    }
    if (isPartnersRoute) {
      return (
        <div className="min-h-screen bg-gray-50">
          <PartnersPage />
        </div>
      );
    }
    if (isAboutRoute) {
      return (
        <div className="min-h-screen bg-gray-50">
          <AboutPage />
        </div>
      );
    }
    if (isContactRoute) {
      return (
        <div className="min-h-screen bg-gray-50">
          <ContactPage />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <Home />
      </div>
    );
  }

  // Comportement par défaut (ex: après connexion) sur les autres routes
  return (
    <div className="min-h-screen bg-gray-50">
      {projectManager ? (
        <ProjectManagerDashboard session={projectManager} onLogout={handleLogout} />
      ) : user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Home />
      )}
    </div>
  );
};

export default App;