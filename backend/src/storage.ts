import fs from 'fs';
import path from 'path';
import { OrgRecord, Project } from './types';

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ORGS_FILE = path.join(DATA_DIR, 'orgs.json');

const ensureFile = (filePath: string, fallback: string) => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, fallback, 'utf-8');
  }
};

export const readProjects = (): Project[] => {
  ensureFile(PROJECTS_FILE, '[]');

  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(raw) as Project[];
  } catch (err) {
    console.error('Failed to read projects file', err);
    return [];
  }
};

export const writeProjects = (projects: Project[]) => {
  ensureFile(PROJECTS_FILE, '[]');
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
};

export const readOrgs = (): OrgRecord[] => {
  ensureFile(ORGS_FILE, '[]');

  try {
    const raw = fs.readFileSync(ORGS_FILE, 'utf-8');
    return JSON.parse(raw) as OrgRecord[];
  } catch (err) {
    console.error('Failed to read orgs file', err);
    return [];
  }
};

export const writeOrgs = (orgs: OrgRecord[]) => {
  ensureFile(ORGS_FILE, '[]');
  fs.writeFileSync(ORGS_FILE, JSON.stringify(orgs, null, 2), 'utf-8');
};
