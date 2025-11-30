export type ProjectType = 'Humanitaire' | 'Développement';

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
  orgId: string; // To link project to the specific organization
  createdAt: number;
}

export interface ProjectFormPayload extends ProjectInput {
  id?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  orgId: string;
  title: string;
  date?: string;
  location?: string;
  status?: string;
  description?: string;
  createdAt: number;
  rescheduleReason?: string;
  beneficiariesCount?: number;
  daysCount?: number;
  endDate?: string;
  govServices?: string;
}

export enum Sector {
  SANTE = 'Santé',
  EAU_WASH = 'Eau/WASH',
  EDUCATION = 'Éducation',
  PROTECTION = 'Protection',
  SECURITE_ALIMENTAIRE = 'Sécurité Alimentaire',
  ABRIS = 'Abris',
}

export interface UserSession {
  orgName: string;
  orgId: string;
}

export interface RegistrationPayload {
  orgName: string;
  orgNameFull: string;
  orgType: string;
  contactEmail: string;
  contactName?: string;
  contactPhone?: string;
}

export interface OrgSummary {
  orgId: string;
  orgName: string;
  orgNameFull: string;
  orgType: string;
  contactEmail: string;
  isActivated: boolean;
}

export const SECTORS = [
  Sector.SANTE,
  Sector.EAU_WASH,
  Sector.EDUCATION,
  Sector.PROTECTION,
  Sector.SECURITE_ALIMENTAIRE,
  Sector.ABRIS,
];

export const PROJECT_TYPES: ProjectType[] = ['Humanitaire', 'Développement'];

export type PartenaireType =
  | 'Agence onusienne'
  | 'Organisation internationale'
  | 'Organisation nationale';

export const PARTENAIRE_TYPES: PartenaireType[] = [
  'Agence onusienne',
  'Organisation internationale',
  'Organisation nationale',
];

export interface AdminSession {
  id: number;
  username: string;
}

export interface Activity {
  id: string;
  type: 'delegation' | 'partner';
  title: string;
  category?: string;
  description?: string;
  image?: string;
  images?: string[];
  link?: string;
  date?: string;
  location?: string;
  orgName?: string;
  projectName?: string;
  govServices?: string;
  status?: 'completed' | 'ongoing' | 'upcoming';
}

export interface ProjectManagerSession {
  orgId: string;
  orgName: string;
  project: Project;
}
