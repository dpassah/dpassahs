import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  initDB,
  getOrgById,
  getAllOrgs,
  getProjectsByOrg,
  getProjectById,
  insertProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
  getActivitiesByProject,
  insertProjectActivity,
  deleteProjectActivityRecord,
  getProjectUpdateRequests,
  createProjectUpdateRequest,
  getProjectUpdateRequestById,
  updateProjectUpdateRequestStatus,
  hashPassword,
  comparePassword,
  disableOrg,
  enableOrg,
  getProjectAuthById,
  setProjectPasswordHash,
  getAdminByUsername,
  getOrgByName,
  getOrgByEmail,
  saveOrg,
  getDelegationEvents,
  insertDelegationEvent,
  getRecentActivities,
  insertProvinceMonthlyStat,
  ProvinceMonthlyStatRecord,
  getProvinceStructuralStats,
  saveProvinceStructuralStats,
  listProvinceMonthlyStats,
  getAdminProjectsPaged,
  getAdminActivitiesPaged,
  listSites,
  insertSiteMonthlyStats,
  listSiteMonthlyStatsByMonthYear,
  getSiteMonthlyStatForMonthYear,
  SiteMonthlyStatRecord,
} from './db';
import {
  AdminLoginPayload,
  LoginPayload,
  OrgRecord,
  OrgRegistrationInput,
  Project,
  ProjectInput,
  ProjectType,
  Sector,
  ProjectActivityInput,
  ProjectActivity,
  ProjectUpdateRequestSummary,
} from './types';
import { authMiddleware, AuthRequest } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

const PRIMARY_TYPES: ProjectType[] = ['Humanitaire', 'Développement'];
const LEGACY_TYPE_MAP: Record<string, ProjectType> = {
  'DǸveloppement': 'Développement',
  'Dveloppement': 'Développement',
};

const PRIMARY_SECTORS: Sector[] = [
  'Santé',
  'Eau/WASH',
  'Éducation',
  'Protection',
  'Sécurité Alimentaire',
  'Abris',
];
const LEGACY_SECTOR_MAP: Record<string, Sector> = {
  'SantǸ': 'Santé',
  'Sant': 'Santé',
  '%ducation': 'Éducation',
  'ducation': 'Éducation',
  'SǸcuritǸ Alimentaire': 'Sécurité Alimentaire',
  'Scurit Alimentaire': 'Sécurité Alimentaire',
};

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : '*',
  }),
);
app.options('*', cors());

// File upload configuration for delegation event images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to the backend's public directory
    const uploadPath = path.join(__dirname, '../public/delegation-events');

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `event-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Serve static files from public directory
// Images are stored in backend/public. 
// We use __dirname to correctly locate the folder relative to the script (src/ or dist/), ensuring it works regardless of CWD.
const publicPath = path.join(__dirname, '../public');
app.use(['/public', '/api/public'], express.static(publicPath));

app.use(express.json());

const normalizeType = (type: string | undefined | null): ProjectType | null => {
  if (!type) return null;
  const trimmed = type.trim();
  if (PRIMARY_TYPES.includes(trimmed as ProjectType)) return trimmed as ProjectType;
  if (LEGACY_TYPE_MAP[trimmed]) return LEGACY_TYPE_MAP[trimmed];
  return null;
};

const normalizeSector = (sector: string | undefined | null): Sector | null => {
  if (!sector) return null;
  const trimmed = sector.trim();
  if (PRIMARY_SECTORS.includes(trimmed as Sector)) return trimmed as Sector;
  if (LEGACY_SECTOR_MAP[trimmed]) return LEGACY_SECTOR_MAP[trimmed];
  return null;
};

const validateLogin = (payload: Partial<LoginPayload>): LoginPayload | null => {
  if (!payload.orgId?.trim() || !payload.password?.trim()) return null;
  return {
    orgId: payload.orgId.trim(),
    password: payload.password,
  };
};

const validateAdminLogin = (payload: Partial<AdminLoginPayload>): AdminLoginPayload | null => {
  if (!payload.username?.trim() || !payload.password?.trim()) return null;
  return {
    username: payload.username.trim(),
    password: payload.password,
  };
};

const validateProjectInput = (payload: Partial<ProjectInput>): ProjectInput | null => {
  const {
    bailleur,
    startDate,
    endDate,
    type,
    sector,
    location,
    projectName,
    projectDescription,
    beneficiariesType,
    beneficiariesPlanned,
    activitiesPlanned,
    projectManagerName,
    projectManagerPhone,
    projectManagerEmail,
  } = payload;

  if (
    !bailleur?.trim() ||
    !startDate ||
    !endDate ||
    !location?.trim() ||
    !type ||
    !sector
  ) {
    return null;
  }

  const normalizedType = normalizeType(type);
  const normalizedSector = normalizeSector(sector);
  if (!normalizedType || !normalizedSector) return null;

  let parsedBeneficiaries: number | undefined;
  if (beneficiariesPlanned !== undefined && beneficiariesPlanned !== null) {
    const n = Number(beneficiariesPlanned);
    if (!Number.isNaN(n)) parsedBeneficiaries = n;
  }

  let parsedActivities: number | undefined;
  if (activitiesPlanned !== undefined && activitiesPlanned !== null) {
    const n = Number(activitiesPlanned);
    if (!Number.isNaN(n)) parsedActivities = n;
  }

  return {
    bailleur: bailleur.trim(),
    startDate,
    endDate,
    type: normalizedType,
    sector: normalizedSector,
    location: location.trim(),
    projectName: projectName?.trim() || undefined,
    projectDescription: projectDescription?.trim() || undefined,
    beneficiariesType: beneficiariesType?.trim() || undefined,
    beneficiariesPlanned: parsedBeneficiaries,
    activitiesPlanned: parsedActivities,
    projectManagerName: projectManagerName?.trim() || undefined,
    projectManagerPhone: projectManagerPhone?.trim() || undefined,
    projectManagerEmail: projectManagerEmail?.trim() || undefined,
  };
};

const validateRegistration = (
  payload: Partial<OrgRegistrationInput>,
): OrgRegistrationInput | null => {
  if (
    !payload.orgName?.trim() ||
    !payload.orgNameFull?.trim() ||
    !payload.contactEmail?.trim() ||
    !payload.orgType?.trim()
  )
    return null;

  const contactEmail = payload.contactEmail?.trim();
  if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    return null;
  }

  return {
    orgName: payload.orgName.trim(),
    orgNameFull: payload.orgNameFull.trim(),
    orgType: payload.orgType.trim(),
    contactName: payload.contactName?.trim(),
    contactEmail,
    contactPhone: payload.contactPhone?.trim(),
  };
};

const generateOrgId = (): string => {
  const segment = randomUUID().slice(0, 8).toUpperCase();
  return `ORG-${segment}`;
};

const generateProjectId = (): string => {
  const segment = randomUUID().slice(0, 8).toUpperCase();
  return `PRJ-${segment}`;
};

const generateActivityId = (): string => {
  const segment = randomUUID().slice(0, 8).toUpperCase();
  return `ACT-${segment}`;
};

const generateRandomPassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  const buf = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  let pwd = '';
  for (let i = 0; i < length; i++) {
    const idx = buf.charCodeAt(i % buf.length) % chars.length;
    pwd += chars[idx];
  }
  return pwd;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP non configuré. Veuillez définir SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { transporter, from };
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// --- Admin Routes ---

app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const payload = validateAdminLogin(req.body);
    if (!payload) {
      return res.status(400).json({ message: "Paramètres d'identification admin manquants." });
    }

    const admin = await getAdminByUsername(payload.username);
    if (!admin) {
      return res.status(401).json({ message: 'Identifiants admin invalides.' });
    }

    const isValid = await comparePassword(payload.password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Identifiants admin invalides.' });
    }

    // TODO: Issue Admin JWT
    return res.json({
      id: admin.id,
      username: admin.username,
    });
  } catch (err) {
    console.error('Admin login error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion admin.' });
  }
});

// --- Admin: Sites & Site Monthly Stats ---

app.get('/api/admin/sites', async (_req: Request, res: Response) => {
  try {
    const sites = await listSites();
    return res.json({ sites });
  } catch (err) {
    console.error('Admin list sites error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des sites.' });
  }
});

app.get('/api/admin/site-stats', async (req: Request, res: Response) => {
  try {
    const monthRaw = (req.query.month as string | undefined) || '';
    const yearRaw = (req.query.year as string | undefined) || '';
    const m = monthRaw.trim();
    const y = parseInt(yearRaw, 10);

    if (!m || !/^\d{2}$/.test(m) || Number(m) < 1 || Number(m) > 12) {
      return res.status(400).json({ message: 'Mois invalide. Utiliser un format 01-12.' });
    }
    if (!Number.isFinite(y) || y < 2000 || y > 2100) {
      return res.status(400).json({ message: 'Annee invalide.' });
    }

    const stats = await listSiteMonthlyStatsByMonthYear(m, y);
    return res.json({ stats });
  } catch (err) {
    console.error('Admin list site monthly stats error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la lecture des statistiques des sites.' });
  }
});

app.post('/api/admin/stats/save', async (req: Request, res: Response) => {
  try {
    const { month, year, items } = req.body || {};

    const mNum = Number(typeof month === 'string' ? month : String(month || ''));
    const yNum = typeof year === 'number' ? year : Number(year);

    if (!Number.isFinite(mNum) || mNum < 1 || mNum > 12) {
      return res.status(400).json({ message: 'Mois invalide. Utiliser un format 01-12.' });
    }
    if (!Number.isFinite(yNum) || yNum < 2000 || yNum > 2100) {
      return res.status(400).json({ message: 'Annee invalide.' });
    }

    const payload = Array.isArray(items) ? items : [];
    const now = Date.now();

    const prevMonth = mNum === 1 ? 12 : mNum - 1;
    const prevYear = mNum === 1 ? yNum - 1 : yNum;

    const siteRecords: SiteMonthlyStatRecord[] = await Promise.all(
      payload
        .filter((it: any) => it && it.siteId)
        .map(async (it: any) => {
          const siteId = String(it.siteId);

          const cur_ref_total_ind = Number(it.ref_total_ind) || 0;
          const cur_ref_total_hh = Number(it.ref_total_hh) || 0;
          const cur_ret_total_ind = Number(it.ret_total_ind) || 0;
          const cur_ret_total_hh = Number(it.ret_total_hh) || 0;

          const prev = await getSiteMonthlyStatForMonthYear(siteId, prevMonth, prevYear);

          const prev_ref_total_ind = prev?.ref_total_ind ?? 0;
          const prev_ref_total_hh = prev?.ref_total_hh ?? 0;
          const prev_ret_total_ind = prev?.ret_total_ind ?? 0;
          const prev_ret_total_hh = prev?.ret_total_hh ?? 0;

          // Calculate increases (Stock-Based Entry)
          // New = Current - Previous. If Current < Previous, New = 0 (or should we allow negative? User said "Ensure the result is not negative")
          const ref_new_ind = Math.max(0, cur_ref_total_ind - prev_ref_total_ind);
          const ref_new_hh = Math.max(0, cur_ref_total_hh - prev_ref_total_hh);
          const ret_new_ind = Math.max(0, cur_ret_total_ind - prev_ret_total_ind);
          const ret_new_hh = Math.max(0, cur_ret_total_hh - prev_ret_total_hh);

          return {
            id: randomUUID(),
            siteId,
            month: mNum,
            year: yNum,
            ref_total_ind: cur_ref_total_ind,
            ref_total_hh: cur_ref_total_hh,
            ret_total_ind: cur_ret_total_ind,
            ret_total_hh: cur_ret_total_hh,
            ref_new_ind,
            ref_new_hh,
            ret_new_ind,
            ret_new_hh,
            createdAt: now,
          };
        }),
    );

    if (!siteRecords.length) {
      return res.status(400).json({ message: 'Aucune donnée à enregistrer pour les sites.' });
    }

    await insertSiteMonthlyStats(siteRecords);

    return res.status(201).json({ stats: siteRecords });
  } catch (err) {
    console.error('Admin save site stats error', err);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de l'enregistrement des statistiques des sites." });
  }
});

// Admin: paginated projects (for admin dashboard)
app.get('/api/admin/projects', async (req: Request, res: Response) => {
  try {
    const pageRaw = (req.query.page as string | undefined) || '1';
    const limitRaw = (req.query.limit as string | undefined) || '20';
    const search = (req.query.search as string | undefined) || '';

    const page = parseInt(pageRaw, 10);
    const limit = parseInt(limitRaw, 10);

    const { items, total } = await getAdminProjectsPaged(page, limit, search);
    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('Admin list projects paged error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des projets.' });
  }
});

// Admin: paginated project activities (for admin dashboard)
app.get('/api/admin/activities', async (req: Request, res: Response) => {
  try {
    const pageRaw = (req.query.page as string | undefined) || '1';
    const limitRaw = (req.query.limit as string | undefined) || '20';
    const search = (req.query.search as string | undefined) || '';

    const page = parseInt(pageRaw, 10);
    const limit = parseInt(limitRaw, 10);

    const { items, total } = await getAdminActivitiesPaged(page, limit, search);
    return res.json({ items, total, page, limit });
  } catch (err) {
    console.error('Admin list activities paged error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des activités.' });
  }
});

app.get('/api/admin/province-structural-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getProvinceStructuralStats();
    return res.json({ stats });
  } catch (err) {
    console.error('Admin get province structural stats error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la lecture des statistiques structurelles.' });
  }
});

app.post('/api/admin/province-structural-stats', async (req: Request, res: Response) => {
  try {
    const {
      populationTotal,
      disabledTotal,
      floodAffected,
      fireAffected,
      veryVulnerable,
    } = req.body || {};

    const stats = await saveProvinceStructuralStats({
      populationTotal: Number(populationTotal) || 0,
      disabledTotal: Number(disabledTotal) || 0,
      floodAffected: Number(floodAffected) || 0,
      fireAffected: Number(fireAffected) || 0,
      veryVulnerable: Number(veryVulnerable) || 0,
    });

    return res.status(201).json({ stats });
  } catch (err) {
    console.error('Admin save province structural stats error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de lenregistrement des statistiques structurelles.' });
  }
});

app.get('/api/admin/province-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await listProvinceMonthlyStats();
    return res.json({ stats });
  } catch (err) {
    console.error('Admin list province monthly stats error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la lecture des statistiques mensuelles.' });
  }
});

app.post('/api/admin/province-stats', async (req: Request, res: Response) => {
  try {
    const { month, year, totalRefugees, newRefugees, totalReturnees, newReturnees } = req.body || {};

    const m = typeof month === 'string' ? month.trim() : '';
    const y = typeof year === 'number' ? year : Number(year);

    if (!m || !/^\d{2}$/.test(m) || Number(m) < 1 || Number(m) > 12) {
      return res.status(400).json({ message: 'Mois invalide. Utiliser un format 01-12.' });
    }

    if (!Number.isFinite(y) || y < 2000 || y > 2100) {
      return res.status(400).json({ message: 'Annee invalide.' });
    }

    const tr = Number(totalRefugees) || 0;
    const nr = Number(newRefugees) || 0;
    const tt = Number(totalReturnees) || 0;
    const nt = Number(newReturnees) || 0;

    const stat: ProvinceMonthlyStatRecord = {
      id: randomUUID(),
      month: m,
      year: y,
      totalRefugees: tr,
      newRefugees: nr,
      totalReturnees: tt,
      newReturnees: nt,
      createdAt: Date.now(),
    };

    await insertProvinceMonthlyStat(stat);

    return res.status(201).json({ stat });
  } catch (err) {
    console.error('Admin save province stats error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de lenregistrement des statistiques provinciales.' });
  }
});

app.get('/api/public/recent-activities', async (req: Request, res: Response) => {
  try {
    const limitRaw = (req.query.limit as string | undefined) || '';
    const limit = parseInt(limitRaw, 10);
    const list = await getRecentActivities(Number.isFinite(limit) && limit > 0 ? limit : 6);
    return res.json({ activities: list });
  } catch (err) {
    console.error('Public recent activities error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des activités récentes.' });
  }
});

app.post('/api/admin/delegation-events/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Return the public URL of the uploaded file
    const imageUrl = `/public/delegation-events/${req.file.filename}`;

    return res.json({ url: imageUrl });
  } catch (err) {
    console.error('Image upload error', err);
    return res.status(500).json({ message: 'Error uploading image' });
  }
});

app.get('/api/admin/delegation-events', async (_req: Request, res: Response) => {
  try {
    const events = await getDelegationEvents();
    return res.json({ events });
  } catch (err) {
    console.error('Admin list delegation events error', err);
    return res.status(500).json({ message: "Erreur serveur lors du chargement des activités de la délégation." });
  }
});

app.post('/api/admin/delegation-events', async (req: Request, res: Response) => {
  try {
    const { title, date, location, description, images } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: "Le titre de l'activité est requis." });
    }

    const id = randomUUID();
    const createdAt = Date.now();

    const event = {
      id,
      title: title.trim(),
      date: date ? String(date) : null,
      location: location ? String(location) : null,
      description: description ? String(description) : null,
      images: images && Array.isArray(images) ? images : null,
      createdAt,
    };

    await insertDelegationEvent(event as any);

    return res.status(201).json({ event });
  } catch (err) {
    console.error('Admin create delegation event error', err);
    return res.status(500).json({ message: "Erreur serveur lors de la création de l'activité de la délégation." });
  }
});

app.get('/api/admin/project-update-requests', async (_req: Request, res: Response) => {
  try {
    const requests = await getProjectUpdateRequests();
    return res.json({ requests });
  } catch (err) {
    console.error('Admin list project update requests error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des demandes de modification de projets.' });
  }
});

app.post(
  '/api/admin/project-update-requests/:id/decision',
  async (req: Request, res: Response) => {
    try {
      const id = (req.params.id as string | undefined)?.trim();
      const decision = (req.body.decision as string | undefined)?.trim();

      if (!id || !decision || (decision !== 'approved' && decision !== 'rejected')) {
        return res.status(400).json({ message: 'Paramètres invalides pour la décision.' });
      }

      const request = await getProjectUpdateRequestById(id);
      if (!request) {
        return res.status(404).json({ message: 'Demande de modification introuvable.' });
      }

      if (decision === 'approved') {
        await updateProjectRecord({
          ...request.payload,
          id: request.projectId,
          orgId: request.orgId,
          createdAt: 0, // Not used for update
        });
      }

      await updateProjectUpdateRequestStatus(id, decision as any);
      const finalRequest = await getProjectUpdateRequestById(id);
      return res.json({ request: finalRequest });
    } catch (err) {
      console.error('Admin project update request decision error', err);
      return res
        .status(500)
        .json({ message: 'Erreur serveur lors du traitement de la demande de modification de projet.' });
    }
  },
);

app.get('/api/admin/orgs', async (req: Request, res: Response) => {
  try {
    const orgs = await getAllOrgs();
    // Remove password hash from response; derive hasPassword from presence of hash
    const safeOrgs = orgs.map((o) => {
      const { orgPasswordHash, ...rest } = o;
      return { ...rest, hasPassword: !!orgPasswordHash };
    });
    return res.json({ orgs: safeOrgs });
  } catch (err) {
    console.error('Admin list orgs error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des organisations.' });
  }
});

app.post('/api/admin/orgs', async (req: Request, res: Response) => {
  try {
    const payload = validateRegistration(req.body);
    if (!payload) {
      return res.status(400).json({ message: 'Données invalides.' });
    }

    const existing = await getOrgByName(payload.orgName);
    if (existing) {
      return res.status(409).json({ message: 'Cette organisation existe déjà.' });
    }

    // Generate random password for admin-created orgs
    const password = generateRandomPassword(12);
    const passwordHash = await hashPassword(password);

    const newOrg: OrgRecord = {
      orgId: generateOrgId(),
      orgName: payload.orgName,
      orgNameFull: payload.orgNameFull,
      orgType: payload.orgType,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      orgPasswordHash: passwordHash,
      createdAt: Date.now(),
    };

    await saveOrg(newOrg);

    // Send email with credentials
    try {
      const { transporter, from } = createTransporter();
      await transporter.sendMail({
        from,
        to: newOrg.contactEmail,
        subject: 'Bienvenue sur le Portail Partenaires - Vos identifiants',
        text: `Bonjour,\n\nVotre compte organisation "${newOrg.orgName}" a été créé.\n\nIdentifiant: ${newOrg.orgId}\nMot de passe: ${password}\n\nConnectez-vous sur le portail pour gérer vos projets.\n\nCordialement,\nL'équipe DPASSAHS`,
      });
    } catch (emailErr) {
      console.error('Failed to send welcome email', emailErr);
      // Continue, return credentials in response
    }

    // Return org and credentials (one-time)
    const safeOrg = { ...newOrg, orgPasswordHash: undefined };
    return res.status(201).json({
      org: safeOrg,
      credentials: { orgId: newOrg.orgId, password },
    });
  } catch (err) {
    console.error('Admin create org error', err);
    return res.status(500).json({ message: "Erreur serveur lors de la création de l'organisation." });
  }
});

app.post('/api/admin/orgs/:orgId/disable', async (req: Request, res: Response) => {
  try {
    const orgId = (req.params.orgId as string | undefined)?.trim();
    if (!orgId) {
      return res.status(400).json({ message: 'Paramètre orgId requis.' });
    }

    const org = await getOrgById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation introuvable.' });
    }

    await disableOrg(orgId);

    return res.json({ orgId: org.orgId, status: 'disabled' });
  } catch (err) {
    console.error('Admin disable org error', err);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de la désactivation du compte de l'organisation." });
  }
});

app.post('/api/admin/orgs/:orgId/enable', async (req: Request, res: Response) => {
  try {
    const orgId = (req.params.orgId as string | undefined)?.trim();
    if (!orgId) {
      return res.status(400).json({ message: 'Paramètre orgId requis.' });
    }

    const org = await getOrgById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation introuvable.' });
    }

    await enableOrg(orgId);

    return res.json({ orgId: org.orgId, status: 'enabled' });
  } catch (err) {
    console.error('Admin enable org error', err);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de l'activation du compte de l'organisation." });
  }
});

app.post('/api/admin/orgs/:orgId/reset-password', async (req: Request, res: Response) => {
  try {
    const orgId = (req.params.orgId as string | undefined)?.trim();
    if (!orgId) {
      return res.status(400).json({ message: 'Paramètre orgId requis.' });
    }

    const org = await getOrgById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation introuvable.' });
    }

    if (!org.contactEmail) {
      return res.status(400).json({ message: "Cette organisation n'a pas d'adresse email de contact valide." });
    }

    const newPassword = generateRandomPassword(12);
    const newHash = await hashPassword(newPassword);

    const updated: OrgRecord = {
      ...org,
      orgPasswordHash: newHash,
    };

    await saveOrg(updated);

    try {
      const { transporter, from } = createTransporter();
      const subject = 'Réinitialisation du mot de passe - Portail HUMANITAIRES Sila';
      const text = `Bonjour,\n\nLe mot de passe de votre organisation sur le Portail HUMANITAIRES (Province de Sila) a été réinitialisé.\n\nIdentifiant Unique (ID): ${updated.orgId}\nNouveau mot de passe: ${newPassword}\n\nMerci de conserver ces informations en lieu sûr.\n\nMerci,\nPortail HUMANITAIRES - Délégation de l'Action Sociale (Sila)`;
      const html = `<p>Bonjour,</p><p>Le mot de passe de votre organisation sur le <strong>Portail HUMANITAIRES (Province de Sila)</strong> a été réinitialisé.</p><p><strong>Identifiant Unique (ID):</strong> ${updated.orgId}<br/><strong>Nouveau mot de passe:</strong> ${newPassword}</p><p>Merci de conserver ces informations en lieu sûr.</p><p>Merci,<br/>Portail HUMANITAIRES - Délégation de l'Action Sociale (Sila)</p>`;

      await transporter.sendMail({
        from,
        to: updated.contactEmail,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('Admin reset password email error', err);
    }

    return res.json({ orgId: updated.orgId, contactEmail: updated.contactEmail, newPassword });
  } catch (err) {
    console.error('Admin reset org password error', err);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de la réinitialisation du mot de passe de l'organisation." });
  }
});

app.post('/api/admin/orgs/:orgId/resend-id', async (req: Request, res: Response) => {
  try {
    const orgId = (req.params.orgId as string | undefined)?.trim();
    if (!orgId) {
      return res.status(400).json({ message: 'Paramètre orgId requis.' });
    }

    const org = await getOrgById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organisation introuvable.' });
    }

    if (!org.contactEmail) {
      return res.status(400).json({ message: "Cette organisation n'a pas d'adresse email de contact valide." });
    }

    try {
      const { transporter, from } = createTransporter();
      const subject = 'Rappel de votre Identifiant Unique - Portail HUMANITAIRES Sila';
      const text = `Bonjour,\n\nVoici un rappel de votre Identifiant Unique (ID) pour le Portail HUMANITAIRES (Province de Sila).\n\nIdentifiant Unique (ID): ${org.orgId}\nOrganisation: ${org.orgName}\n\nMerci,\nPortail HUMANITAIRES - Délégation de l'Action Sociale (Sila)`;
      const html = `<p>Bonjour,</p><p>Voici un rappel de votre <strong>Identifiant Unique (ID)</strong> pour le <strong>Portail HUMANITAIRES (Province de Sila)</strong>.</p><p><strong>Identifiant Unique (ID):</strong> ${org.orgId}<br/><strong>Organisation:</strong> ${org.orgName}</p><p>Merci,<br/>Portail HUMANITAIRES - Délégation de l'Action Sociale (Sila)</p>`;

      await transporter.sendMail({
        from,
        to: org.contactEmail,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('Admin resend ID email error', err);
    }

    return res.json({
      orgId: org.orgId,
      contactEmail: org.contactEmail,
      message: `Identifiant renvoyé à ${org.contactEmail}.`,
    });
  } catch (err) {
    console.error('Admin resend org ID error', err);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de l'envoi du rappel d'identifiant." });
  }
});

app.get('/api/admin/orgs', async (_req: Request, res: Response) => {
  try {
    const orgs = await getAllOrgs();
    return res.json({ orgs });
  } catch (err) {
    console.error('Admin list orgs error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des organisations.' });
  }
});

app.post('/api/admin/orgs', async (req: Request, res: Response) => {
  try {
    const payload = validateRegistration(req.body);
    if (!payload) {
      return res.status(400).json({ message: 'Données organisation invalides ou incomplètes.' });
    }

    const existingByName = await getOrgByName(payload.orgName);
    if (existingByName) {
      return res
        .status(409)
        .json({ message: "Une organisation avec ce nom est déjà enregistrée dans le registre." });
    }

    const existingByEmail = await getOrgByEmail(payload.contactEmail);
    if (existingByEmail) {
      return res
        .status(409)
        .json({ message: "Une organisation utilisant cette adresse email est déjà enregistrée." });
    }

    const password = generateRandomPassword(12);
    const passwordHash = await hashPassword(password);

    const org: OrgRecord = {
      orgId: generateOrgId(),
      createdAt: Date.now(),
      ...payload,
      orgPasswordHash: passwordHash,
    };

    await saveOrg(org);

    try {
      const { transporter, from } = createTransporter();
      const subject = 'Bienvenue - Portail HUMANITAIRES Sila';
      const text = `Bonjour,\n\nVotre compte a été créé.\nID: ${org.orgId}\nMot de passe: ${password}\n\nMerci.`;
      await transporter.sendMail({ from, to: org.contactEmail, subject, text });
    } catch (e) {
      console.error("Email error", e);
    }

    return res.status(201).json({ org });
  } catch (err) {
    console.error('Admin create org error', err);
    return res.status(500).json({ message: "Erreur serveur lors de la création de l'organisation." });
  }
});


// --- Public/Auth Routes ---

app.get('/api/public/orgs', async (_req: Request, res: Response) => {
  try {
    const orgs = await getAllOrgs();
    const summaries = orgs.map((o) => ({
      orgId: o.orgId,
      orgName: o.orgName,
      orgNameFull: o.orgNameFull,
      orgType: o.orgType,
      contactEmail: o.contactEmail,
      // Use explicit activation flag; fallback to password presence if undefined
      isActivated: o.isActivated !== undefined ? o.isActivated : !!o.orgPasswordHash,
    }));
    return res.json({ orgs: summaries });
  } catch (err) {
    console.error('Public list orgs error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des organisations.' });
  }
});

// --- Public contact endpoint ---

app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Nom, email et message sont requis.' });
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Adresse e-mail invalide." });
    }

    const { transporter, from } = createTransporter();

    const to = process.env.CONTACT_EMAIL || 'dpassahs@gmail.com';
    const subject = 'Nouveau message depuis le Portail HUMANITAIRES Sila';
    const text = `Nom / Organisation: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject,
      text,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Contact form error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de lenvoi du message.' });
  }
});

// Public: list all projects with their executed activities (read-only, no auth)
app.get('/api/public/projects-with-activities', async (_req: Request, res: Response) => {
  try {
    const orgs = await getAllOrgs();
    const items: Array<{
      orgId: string;
      orgName: string;
      project: Project;
      activities: ProjectActivity[];
    }> = [];

    for (const org of orgs) {
      const projects = await getProjectsByOrg(org.orgId);
      for (const project of projects) {
        const activities = await getActivitiesByProject(project.id);
        items.push({
          orgId: org.orgId,
          orgName: org.orgName,
          project,
          activities,
        });
      }
    }

    return res.json({ items });
  } catch (err) {
    console.error('Public list projects with activities error', err);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des projets publics.' });
  }
});

app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const payload = validateLogin(req.body);
    if (!payload) {
      return res.status(400).json({ message: "Paramètres d'identification manquants." });
    }

    const org = await getOrgById(payload.orgId);
    if (!org || !org.orgPasswordHash) {
      return res
        .status(401)
        .json({ message: 'Identifiant ou mot de passe invalide. Vérifiez vos accès.' });
    }

    if (org.isActivated === false) {
      return res.status(403).json({ message: 'Ce compte a été désactivé.' });
    }

    const isValid = await comparePassword(payload.password, org.orgPasswordHash);
    if (!isValid) {
      return res
        .status(401)
        .json({ message: 'Identifiant ou mot de passe invalide. Vérifiez vos accès.' });
    }

    const token = jwt.sign(
      { orgId: org.orgId, orgName: org.orgName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ orgId: org.orgId, orgName: org.orgName, token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

app.post('/api/register', async (req: Request, res: Response) => {
  try {
    const payload = validateRegistration(req.body);
    if (!payload) {
      return res.status(400).json({ message: 'Informations de registre invalides ou manquantes.' });
    }

    const rawPassword = (req.body.password as string | undefined) || '';
    if (!rawPassword || rawPassword.length < 8) {
      return res.status(400).json({
        message: 'Mot de passe manquant ou trop court (8 caractères minimum).',
      });
    }
    const passwordHash = await hashPassword(rawPassword);

    const existing = await getOrgByName(payload.orgName);

    if (payload.contactEmail) {
      const existingByEmail = await getOrgByEmail(payload.contactEmail);
      if (existingByEmail && (!existing || existingByEmail.orgId !== existing.orgId)) {
        return res.status(409).json({
          message:
            "Cette adresse email est déjà utilisée pour une autre organisation dans le registre.",
        });
      }
    }

    let org: OrgRecord;
    if (existing) {
      // If the organisation is already claimed (has password), prevent re-registration/overwrite
      if (existing.orgPasswordHash) {
        return res.status(409).json({ message: 'Cette organisation est déjà enregistrée et active.' });
      }

      org = {
        ...existing,
        orgName: payload.orgName,
        orgNameFull: payload.orgNameFull,
        orgType: payload.orgType,
        contactName: payload.contactName || existing.contactName,
        contactEmail: payload.contactEmail || existing.contactEmail,
        contactPhone: payload.contactPhone || existing.contactPhone,
        orgPasswordHash: passwordHash,
        isActivated: true, // Ensure account is activated upon claim
      };
    } else {
      org = {
        orgId: generateOrgId(),
        createdAt: Date.now(),
        ...payload,
        orgPasswordHash: passwordHash,
        isActivated: true,
      };
    }

    await saveOrg(org);

    try {
      const { transporter, from } = createTransporter();
      const subject = 'Votre Identifiant Unique - Portail HUMANITAIRES Sila';
      const text = `Bonjour,\n\nVotre organisation a été enregistrée et votre compte est maintenant actif.\n\nVotre Identifiant Unique (ID): ${org.orgId}\n\nVous pouvez désormais vous connecter sur le portail avec cet identifiant et le mot de passe que vous avez choisi.\n\nMerci.`;
      await transporter.sendMail({ from, to: org.contactEmail, subject, text });
    } catch (err) {
      console.error('SMTP configuration error', err);
    }

    return res.status(existing ? 200 : 201).json({
      message: `Compte créé avec succès. Identifiant envoyé à ${org.contactEmail}.`,
      orgName: org.orgName,
    });
  } catch (err) {
    console.error('Registration error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la création du compte.' });
  }
});

// --- Protected Routes (Organization) ---

app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const orgId = (req.query.orgId as string | undefined)?.trim();

    if (!orgId) {
      return res.status(400).json({ message: 'Paramètre orgId requis.' });
    }

    const projects = await getProjectsByOrg(orgId);
    return res.json({ projects });
  } catch (err) {
    console.error('Fetch projects error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des projets.' });
  }
});

app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const orgId = (req.body.orgId as string | undefined)?.trim();

    if (!orgId) {
      return res.status(400).json({ message: 'Paramètre orgId requis pour la création du projet.' });
    }

    const payload = validateProjectInput(req.body);
    if (!payload) {
      return res.status(400).json({ message: 'Champs du projet invalides ou manquants.' });
    }

    const newProject: Project = {
      id: generateProjectId(),
      createdAt: Date.now(),
      orgId,
      ...payload,
    };

    await insertProjectRecord(newProject);

    // Generate and store project password hash, then email plain password to project manager
    const projectManagerEmail = payload.projectManagerEmail;
    if (projectManagerEmail) {
      const password = generateRandomPassword(12);
      try {
        const hash = await hashPassword(password);
        await setProjectPasswordHash(newProject.id, hash);

        const { transporter, from } = createTransporter();
        const subject = 'Accès responsable de projet - Portail HUMANITAIRES Sila';
        const text = `Bonjour,\n\nUn nouveau projet a été créé et vous en êtes le responsable.\n\nID du projet : ${newProject.id}\nMot de passe du projet : ${password}\n\nConservez ces informations pour accéder à l'espace projet.\n\nMerci.`;
        await transporter.sendMail({ from, to: projectManagerEmail, subject, text });
      } catch (e) {
        console.error('Project password setup/email error', e);
      }
    }

    return res.status(201).json({ project: newProject });
  } catch (err) {
    console.error('Create project error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la création du projet.' });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user!;
    const id = req.params.id;

    const project = await getProjectById(id);
    if (!project || project.orgId !== user.orgId) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    await deleteProjectRecord(user.orgId, id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete project error', err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
});

app.post('/api/project-login', async (req: Request, res: Response) => {
  try {
    const projectId = (req.body.projectId as string | undefined)?.trim();
    const password = (req.body.password as string | undefined) || '';

    if (!projectId || !password.trim()) {
      return res
        .status(400)
        .json({ message: "Paramètres d'identification du projet manquants (ID + mot de passe)." });
    }

    const auth = await getProjectAuthById(projectId);
    if (!auth || !auth.projectPasswordHash) {
      return res
        .status(401)
        .json({ message: 'Projet introuvable ou accès projet non configuré.' });
    }

    const isValid = await comparePassword(password, auth.projectPasswordHash);
    if (!isValid) {
      return res
        .status(401)
        .json({ message: 'Identifiants projet invalides. Vérifiez ID et mot de passe.' });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    const org = await getOrgById(auth.orgId);
    if (!org) {
      return res.status(404).json({ message: "Organisation du projet introuvable." });
    }

    return res.json({ orgId: org.orgId, orgName: org.orgName, project });
  } catch (err) {
    console.error('Project login error', err);
    return res.status(500).json({ message: 'Erreur serveur lors de la connexion au projet.' });
  }
});

app.get('/api/projects/:projectId/activities', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const orgId = req.query.orgId as string;

    if (!projectId || !orgId) return res.status(400).json({ message: "Missing params" });

    const project = await getProjectById(projectId);
    if (!project || project.orgId !== orgId) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    const activities = await getActivitiesByProject(projectId);
    return res.json({ activities });
  } catch (e) {
    console.error('Error fetching project activities', e);
    return res.status(500).json({ message: 'Error' });
  }
});

app.post('/api/projects/:projectId/activities', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const orgId = req.body.orgId;

    const project = await getProjectById(projectId);
    if (!project || project.orgId !== orgId) {
      return res.status(404).json({ message: 'Projet introuvable.' });
    }

    const input = req.body;
    const activityInput: ProjectActivityInput = {
      title: input.title,
      date: input.date,
      location: input.location,
      status: input.status,
      description: input.description,
      imageUrl: input.imageUrl,
      rescheduleReason: input.rescheduleReason,
      beneficiariesCount: input.beneficiariesCount,
      daysCount: input.daysCount,
      endDate: input.endDate,
      govServices: input.govServices,
    };

    const newActivity: ProjectActivity = {
      id: generateActivityId(),
      projectId,
      orgId,
      createdAt: Date.now(),
      ...activityInput,
    };

    await insertProjectActivity(newActivity);

    return res.status(201).json({ activity: newActivity });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error" });
  }
});

app.delete('/api/projects/:projectId/activities/:id', async (req: Request, res: Response) => {
  try {
    const { projectId, id } = req.params;
    const orgId = req.query.orgId as string;

    await deleteProjectActivityRecord(orgId, projectId, id);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: "Error" });
  }
});

const init = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize app', err);
    process.exit(1);
  }
};

init();
