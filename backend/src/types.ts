export type ProjectType = 'Humanitaire' | 'Développement';

export type Sector =
  | 'Santé'
  | 'Eau/WASH'
  | 'Éducation'
  | 'Protection'
  | 'Sécurité Alimentaire'
  | 'Abris';

export interface ProjectInput {
  bailleur: string;
  startDate: string;
  endDate: string;
  type: ProjectType;
  sector: Sector;
  location: string;
  projectName?: string;
  projectDescription?: string;
  beneficiariesType?: string;
  beneficiariesPlanned?: number;
  activitiesPlanned?: number;
  projectManagerName?: string;
  projectManagerPhone?: string;
  projectManagerEmail?: string;
}

export interface Project extends ProjectInput {
  id: string;
  orgId: string;
  createdAt: number;
}

export interface ProjectActivityInput {
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

export interface ProjectActivity extends ProjectActivityInput {
  id: string;
  projectId: string;
  orgId: string;
  createdAt: number;
}

export type ProjectUpdateStatus = 'pending' | 'approved' | 'rejected';

export interface ProjectUpdateRequest {
  id: string;
  orgId: string;
  projectId: string;
  payload: ProjectInput;
  status: ProjectUpdateStatus;
  createdAt: number;
  decidedAt?: number;
}

export interface LoginPayload {
  orgId: string;
  password: string;
}

export interface OrgRegistrationInput {
  orgName: string;
  orgNameFull: string;
  orgType: string;
  contactEmail: string;
  contactName?: string;
  contactPhone?: string;
}

export interface RegistrationPayload extends OrgRegistrationInput { }

export interface OrgRecord extends OrgRegistrationInput {
  orgId: string;
  createdAt: number;
  orgPasswordHash?: string;
  isActivated?: boolean;
}

export type ProjectUpdateRequestSummary = ProjectUpdateRequest;

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface AdminRecord {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: number;
}
