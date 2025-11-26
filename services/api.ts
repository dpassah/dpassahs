import {
  AdminSession,
  Project,
  ProjectInput,
  RegistrationPayload,
  UserSession,
  ProjectManagerSession,
  OrgSummary,
  ProjectActivity,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions extends RequestInit {
  method?: HttpMethod;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const content = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      // Optional: Trigger logout or redirect if token expired
      // window.location.href = '/'; 
    }
    const message =
      content?.message || content?.error || `La requête a échoué (code ${response.status})`;
    throw new Error(message);
  }

  return content as T;
};

const getAuthToken = () => {
  const sessionStr = sessionStorage.getItem('userSession');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      return session.token;
    } catch {
      return null;
    }
  }
  return null;
};

const request = async <T>(path: string, options: RequestOptions = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
};

export const login = async (orgId: string, password: string): Promise<UserSession> => {
  return request<UserSession>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ orgId, password }),
  });
};

export interface DelegationEvent {
  id: string;
  title: string;
  date?: string | null;
  location?: string | null;
  description?: string | null;
  createdAt: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  date?: string | null;
  location?: string | null;
  orgId: string;
  orgName: string;
  projectId: string;
  projectName?: string | null;
  status?: string | null;
}

export const adminListDelegationEvents = async (): Promise<DelegationEvent[]> => {
  const result = await request<{ events: DelegationEvent[] }>('/api/admin/delegation-events', {
    method: 'GET',
  });
  return result.events || [];
};

export const adminCreateDelegationEvent = async (payload: {
  title: string;
  date?: string | null;
  location?: string | null;
  description?: string | null;
}): Promise<DelegationEvent> => {
  const result = await request<{ event: DelegationEvent }>('/api/admin/delegation-events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.event;
};

export const listRecentActivities = async (limit = 6): Promise<RecentActivity[]> => {
  const params = new URLSearchParams();
  if (limit) {
    params.set('limit', String(limit));
  }
  const result = await request<{ activities: RecentActivity[] }>(
    `/api/public/recent-activities${params.toString() ? `?${params.toString()}` : ''}`,
  );
  return result.activities || [];
};

// --- Admin paginated projects & activities ---

export interface AdminProjectsPagedResponse {
  items: (Project & { orgName: string })[];
  total: number;
  page: number;
  limit: number;
}

export const adminListProjectsPaged = async (
  page: number,
  limit: number,
  search: string,
): Promise<AdminProjectsPagedResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set('search', search.trim());
  return request<AdminProjectsPagedResponse>(`/api/admin/projects?${params.toString()}`);
};

export interface AdminActivitiesPagedResponse {
  items: (ProjectActivity & { orgName: string; projectName?: string | null })[];
  total: number;
  page: number;
  limit: number;
}

export const adminListActivitiesPaged = async (
  page: number,
  limit: number,
  search: string,
): Promise<AdminActivitiesPagedResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set('search', search.trim());
  return request<AdminActivitiesPagedResponse>(`/api/admin/activities?${params.toString()}`);
};

export const adminLogin = async (username: string, password: string): Promise<AdminSession> => {
  return request<AdminSession>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const adminListOrgs = async () => {
  return request<{ orgs: any[] }>('/api/admin/orgs', {
    method: 'GET',
  });
};

export const adminCreateOrg = async (payload: RegistrationPayload) => {
  return request<{ org: any }>('/api/admin/orgs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const adminDisableOrg = async (orgId: string) => {
  return request<{ orgId: string; status: 'disabled' }>(`/api/admin/orgs/${encodeURIComponent(orgId)}/disable`, {
    method: 'POST',
  });
};

export const adminEnableOrg = async (orgId: string) => {
  return request<{ orgId: string; status: 'enabled' }>(`/api/admin/orgs/${encodeURIComponent(orgId)}/enable`, {
    method: 'POST',
  });
};

export const adminResetOrgPassword = async (orgId: string) => {
  return request<{ orgId: string; contactEmail: string; newPassword: string }>(
    `/api/admin/orgs/${encodeURIComponent(orgId)}/reset-password`,
    {
      method: 'POST',
    },
  );
};

export const adminResendOrgId = async (orgId: string) => {
  return request<{ orgId: string; contactEmail: string; message: string }>(
    `/api/admin/orgs/${encodeURIComponent(orgId)}/resend-id`,
    {
      method: 'POST',
    },
  );
};

export const projectManagerLogin = async (
  projectId: string,
  password: string,
): Promise<ProjectManagerSession> => {
  return request<ProjectManagerSession>('/api/project-login', {
    method: 'POST',
    body: JSON.stringify({ projectId, password }),
  });
};

export const listPublicOrgs = async (): Promise<OrgSummary[]> => {
  const result = await request<{ orgs: OrgSummary[] }>('/api/public/orgs', {
    method: 'GET',
  });
  return result.orgs || [];
};

export interface RegisterResponse {
  message: string;
  orgName?: string;
  orgId?: string;
}

export const registerOrg = async (payload: RegistrationPayload & { password?: string }): Promise<RegisterResponse> => {
  return request<RegisterResponse>('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const fetchProjects = async (orgId: string): Promise<Project[]> => {
  const params = new URLSearchParams({ orgId });
  const result = await request<{ projects: Project[] }>(`/api/projects?${params.toString()}`);
  return result.projects;
};

export const createProject = async (orgId: string, payload: ProjectInput): Promise<Project> => {
  // orgId is now inferred from token on backend, but we keep sending it if backend expects it for validation
  // or we can remove it from body if backend uses token only. 
  // Current backend implementation checks: if (orgId && orgId !== user.orgId) return 403
  // So sending it is fine, as long as it matches.
  const result = await request<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ ...payload, orgId }),
  });
  return result.project;
};

export interface ProjectFormPayload extends ProjectInput { }

export interface ProjectUpdateRequestSummary {
  id: string;
  orgId: string;
  projectId: string;
  payload: ProjectInput;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  decidedAt?: number;
}

export const updateProject = async (
  orgId: string,
  id: string,
  payload: ProjectFormPayload,
): Promise<ProjectUpdateRequestSummary> => {
  const result = await request<{ request: ProjectUpdateRequestSummary }>(
    `/api/projects/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, orgId }),
    },
  );
  return result.request;
};

export const adminListProjectUpdateRequests = async (): Promise<ProjectUpdateRequestSummary[]> => {
  return request<{ requests: ProjectUpdateRequestSummary[] }>(
    '/api/admin/project-update-requests',
  ).then(res => res.requests || []);
};

export const adminDecideProjectUpdateRequest = async (
  id: string,
  decision: 'approved' | 'rejected',
): Promise<ProjectUpdateRequestSummary> => {
  const result = await request<{ request: ProjectUpdateRequestSummary }>(
    `/api/admin/project-update-requests/${encodeURIComponent(id)}/decision`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    },
  );
  return result.request;
};

export const deleteProject = async (orgId: string, id: string): Promise<void> => {
  await request<{ success: boolean }>(`/api/projects/${id}?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  });
};

export const listProjectActivities = async (
  orgId: string,
  projectId: string,
): Promise<ProjectActivity[]> => {
  const result = await request<{ activities: ProjectActivity[] }>(
    `/api/projects/${encodeURIComponent(projectId)}/activities?orgId=${encodeURIComponent(orgId)}`,
  );
  return result.activities || [];
};

export interface CreateProjectActivityInput {
  title: string;
  date?: string;
  location?: string;
  status?: string;
  description?: string;
  imageUrl?: string;
  rescheduleReason?: string;
  beneficiariesCount?: number;
  daysCount?: number;
  endDate?: string;
  govServices?: string;
}

export const createProjectActivity = async (
  orgId: string,
  projectId: string,
  payload: CreateProjectActivityInput,
): Promise<ProjectActivity> => {
  const result = await request<{ activity: ProjectActivity }>(
    `/api/projects/${encodeURIComponent(projectId)}/activities`,
    {
      method: 'POST',
      body: JSON.stringify({ ...payload, orgId }),
    },
  );
  return result.activity;
};

export const deleteProjectActivity = async (
  orgId: string,
  projectId: string,
  id: string,
): Promise<void> => {
  await request<{ success: boolean }>(
    `/api/projects/${encodeURIComponent(projectId)}/activities/${encodeURIComponent(id)}?orgId=${encodeURIComponent(orgId)}`,
    {
      method: 'DELETE',
    },
  );
};

// --- Province stats (admin) ---

export interface ProvinceMonthlyStat {
  id: string;
  month: string;
  year: number;
  totalRefugees: number;
  newRefugees: number;
  totalReturnees: number;
  newReturnees: number;
  createdAt: number;
}

export const adminSaveProvinceMonthlyStats = async (payload: {
  month: string;
  year: number;
  totalRefugees: number;
  newRefugees: number;
  totalReturnees: number;
  newReturnees: number;
}): Promise<ProvinceMonthlyStat> => {
  const result = await request<{ stat: ProvinceMonthlyStat }>('/api/admin/province-stats', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result.stat;
};

export const adminListProvinceMonthlyStats = async (): Promise<ProvinceMonthlyStat[]> => {
  const result = await request<{ stats: ProvinceMonthlyStat[] }>('/api/admin/province-stats', {
    method: 'GET',
  });
  const all = result.stats || [];
  // backend renvoie en ordre DESC (annee/mois), نرجع آخر 3 فقط
  return all.slice(0, 3);
};

export interface ProvinceStructuralStats {
  populationTotal: number;
  disabledTotal: number;
  floodAffected: number;
  fireAffected: number;
  veryVulnerable: number;
}

export const adminGetProvinceStructuralStats = async (): Promise<ProvinceStructuralStats | null> => {
  const result = await request<{ stats: any | null }>('/api/admin/province-structural-stats', {
    method: 'GET',
  });
  if (!result.stats) return null;
  return {
    populationTotal: Number(result.stats.populationTotal) || 0,
    disabledTotal: Number(result.stats.disabledTotal) || 0,
    floodAffected: Number(result.stats.floodAffected) || 0,
    fireAffected: Number(result.stats.fireAffected) || 0,
    veryVulnerable: Number(result.stats.veryVulnerable) || 0,
  };
};

// --- Public contact ---

export const sendContactMessage = async (name: string, email: string, message: string): Promise<void> => {
  await request<{ success: boolean }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify({ name, email, message }),
  });
};

// --- Public projects with activities (for /projets page) ---

export interface PublicProjectWithActivities {
  orgId: string;
  orgName: string;
  project: Project;
  activities: ProjectActivity[];
}

export const listPublicProjectsWithActivities = async (): Promise<PublicProjectWithActivities[]> => {
  const result = await request<{ items: PublicProjectWithActivities[] }>('/api/public/projects-with-activities', {
    method: 'GET',
  });
  return result.items || [];
};

export const adminSaveProvinceStructuralStats = async (
  payload: ProvinceStructuralStats,
): Promise<ProvinceStructuralStats> => {
  const result = await request<{ stats: any }>('/api/admin/province-structural-stats', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    populationTotal: Number(result.stats.populationTotal) || 0,
    disabledTotal: Number(result.stats.disabledTotal) || 0,
    floodAffected: Number(result.stats.floodAffected) || 0,
    fireAffected: Number(result.stats.fireAffected) || 0,
    veryVulnerable: Number(result.stats.veryVulnerable) || 0,
  };
};
