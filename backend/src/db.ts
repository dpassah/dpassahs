import { createPool, Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  OrgRecord,
  Project,
  ProjectActivity,
  ProjectUpdateRequestSummary,
  AdminRecord,
} from './types';

dotenv.config();

let pool: Pool;

export const initDB = async () => {
  pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'portail_sila',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('Database pool initialized');

  try {
    const connection = await pool.getConnection();
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS orgs (
          org_id VARCHAR(64) PRIMARY KEY,
          org_name VARCHAR(255) NOT NULL,
          org_name_full VARCHAR(255) NOT NULL,
          org_type VARCHAR(128) NOT NULL,
          contact_name VARCHAR(255),
          contact_email VARCHAR(255) NOT NULL,
          contact_phone VARCHAR(64),
          org_password_hash VARCHAR(255),
          created_at BIGINT NOT NULL,
          is_activated TINYINT(1) NOT NULL DEFAULT 1
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS delegation_events (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          date DATE NULL,
          location VARCHAR(255) NULL,
          description TEXT NULL,
          created_at BIGINT NOT NULL
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS province_structural_stats (
          id VARCHAR(64) PRIMARY KEY,
          population_total INT NOT NULL,
          disabled_total INT NOT NULL,
          flood_affected INT NOT NULL,
          fire_affected INT NOT NULL,
          very_vulnerable INT NOT NULL,
          updated_at BIGINT NOT NULL
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(64) PRIMARY KEY,
          org_id VARCHAR(64) NOT NULL,
          bailleur VARCHAR(255) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          type VARCHAR(64) NOT NULL,
          sector VARCHAR(128) NOT NULL,
          location TEXT NOT NULL,
          created_at BIGINT NOT NULL,
          project_name VARCHAR(255),
          project_description TEXT,
          beneficiaries_type VARCHAR(255),
          beneficiaries_planned INT,
          activities_planned INT,
          project_manager_name VARCHAR(255),
          project_manager_phone VARCHAR(64),
          project_manager_email VARCHAR(255),
          CONSTRAINT fk_projects_org FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS project_activities (
          id VARCHAR(64) PRIMARY KEY,
          project_id VARCHAR(64) NOT NULL,
          org_id VARCHAR(64) NOT NULL,
          title VARCHAR(255) NOT NULL,
          date DATE NULL,
          location VARCHAR(255) NULL,
          status VARCHAR(64) NULL,
          description TEXT NULL,
          beneficiaries_count INT NULL,
          created_at BIGINT NOT NULL,
          image_url VARCHAR(255) NULL,
          CONSTRAINT fk_activities_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS project_update_requests (
          id VARCHAR(64) PRIMARY KEY,
          orgId VARCHAR(64) NOT NULL,
          projectId VARCHAR(64) NOT NULL,
          payload JSON NOT NULL,
          status VARCHAR(16) NOT NULL,
          created_at BIGINT NOT NULL,
          decided_at BIGINT NULL,
          CONSTRAINT fk_proj_update_project FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
          CONSTRAINT fk_proj_update_org FOREIGN KEY (orgId) REFERENCES orgs(orgId) ON DELETE CASCADE
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(64) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at BIGINT NOT NULL
        );
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS province_stats (
          id VARCHAR(64) PRIMARY KEY,
          month VARCHAR(2) NOT NULL,
          year INT NOT NULL,
          total_refugees INT NOT NULL,
          new_refugees INT NOT NULL,
          total_returnees INT NOT NULL,
          new_returnees INT NOT NULL,
          created_at BIGINT NOT NULL
        );
      `);

      // Ensure default admin
      const [admins] = await connection.query<RowDataPacket[]>('SELECT * FROM admins WHERE username = ?', ['DPASSAHS']);
      if (admins.length === 0) {
        const defaultPass = process.env.ADMIN_DEFAULT_PASS || 'DPASSAHS@2025';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(defaultPass, salt);
        await connection.query(
          'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
          ['DPASSAHS', hash, Date.now()]
        );
        console.log('Default admin created: DPASSAHS');
      }

    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
    throw err;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDB first.');
  }
  return pool;
};

// --- Helper: Password Hashing (Bcrypt) ---
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// --- Organizations ---

export const getOrgByName = async (orgName: string): Promise<OrgRecord | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       org_id AS orgId,
       org_name AS orgName,
       org_name_full AS orgNameFull,
       org_type AS orgType,
       contact_name AS contactName,
       contact_email AS contactEmail,
       contact_phone AS contactPhone,
       created_at AS createdAt,
       org_password_hash AS orgPasswordHash,
       is_activated AS isActivated
     FROM orgs
     WHERE org_name = ?`,
    [orgName],
  );
  return (rows[0] as OrgRecord) || null;
};

export const getOrgById = async (orgId: string): Promise<OrgRecord | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       org_id AS orgId,
       org_name AS orgName,
       org_name_full AS orgNameFull,
       org_type AS orgType,
       contact_name AS contactName,
       contact_email AS contactEmail,
       contact_phone AS contactPhone,
       created_at AS createdAt,
       org_password_hash AS orgPasswordHash,
       is_activated AS isActivated
     FROM orgs
     WHERE org_id = ?`,
    [orgId],
  );
  return (rows[0] as OrgRecord) || null;
};

export const getOrgByEmail = async (email: string): Promise<OrgRecord | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       org_id AS orgId,
       org_name AS orgName,
       org_name_full AS orgNameFull,
       org_type AS orgType,
       contact_name AS contactName,
       contact_email AS contactEmail,
       contact_phone AS contactPhone,
       created_at AS createdAt,
       org_password_hash AS orgPasswordHash,
       is_activated AS isActivated
     FROM orgs
     WHERE contact_email = ?`,
    [email],
  );
  return (rows[0] as OrgRecord) || null;
};

export const getAllOrgs = async (): Promise<OrgRecord[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       org_id AS orgId,
       org_name AS orgName,
       org_name_full AS orgNameFull,
       org_type AS orgType,
       contact_name AS contactName,
       contact_email AS contactEmail,
       contact_phone AS contactPhone,
       created_at AS createdAt,
       org_password_hash AS orgPasswordHash,
       is_activated AS isActivated
     FROM orgs`,
  );
  return rows as OrgRecord[];
};

export const saveOrg = async (org: OrgRecord): Promise<void> => {
  const pool = getPool();
  const existing = await getOrgById(org.orgId);

  // Normalize optional fields: mysql2 does not accept undefined in bind parameters
  const contactName = org.contactName ?? null;
  const contactPhone = org.contactPhone ?? null;
  const orgPasswordHash = org.orgPasswordHash ?? null;

  if (existing) {
    await pool.execute(
      `UPDATE orgs 
       SET org_name = ?, org_name_full = ?, org_type = ?, contact_name = ?, contact_email = ?, contact_phone = ?, org_password_hash = ?, is_activated = ?
       WHERE org_id = ?`,
      [
        org.orgName,
        org.orgNameFull,
        org.orgType,
        contactName,
        org.contactEmail,
        contactPhone,
        orgPasswordHash,
        org.isActivated !== undefined ? org.isActivated : 1,
        org.orgId,
      ],
    );
  } else {
    await pool.execute(
      `INSERT INTO orgs (org_id, org_name, org_name_full, org_type, contact_name, contact_email, contact_phone, org_password_hash, created_at, is_activated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        org.orgId,
        org.orgName,
        org.orgNameFull,
        org.orgType,
        contactName,
        org.contactEmail,
        contactPhone,
        orgPasswordHash,
        org.createdAt,
        org.isActivated !== undefined ? org.isActivated : 1,
      ],
    );
  }
};

export const disableOrg = async (orgId: string): Promise<void> => {
  const pool = getPool();
  await pool.execute('UPDATE orgs SET is_activated = 0 WHERE org_id = ?', [orgId]);
};

export const enableOrg = async (orgId: string): Promise<void> => {
  const pool = getPool();
  await pool.execute('UPDATE orgs SET is_activated = 1 WHERE org_id = ?', [orgId]);
};

// --- Delegation Events ---

export interface DelegationEventRecord {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  description: string | null;
  createdAt: number;
}

export const getDelegationEvents = async (): Promise<DelegationEventRecord[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, title, date, location, description, created_at AS createdAt
     FROM delegation_events
     ORDER BY date DESC, created_at DESC`,
  );
  return rows as DelegationEventRecord[];
};

export const insertDelegationEvent = async (event: DelegationEventRecord): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO delegation_events (id, title, date, location, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      event.id,
      event.title,
      event.date || null,
      event.location || null,
      event.description || null,
      event.createdAt,
    ],
  );
};

// --- Projects ---

export const getProjectsByOrg = async (orgId: string): Promise<Project[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       org_id AS orgId,
       bailleur,
       start_date AS startDate,
       end_date AS endDate,
       type,
       sector,
       location,
       created_at AS createdAt,
       project_name AS projectName,
       project_description AS projectDescription,
       beneficiaries_type AS beneficiariesType,
       beneficiaries_planned AS beneficiariesPlanned,
       activities_planned AS activitiesPlanned,
       project_manager_name AS projectManagerName,
       project_manager_phone AS projectManagerPhone,
       project_manager_email AS projectManagerEmail
     FROM projects
     WHERE org_id = ?
     ORDER BY created_at DESC`,
    [orgId],
  );
  return rows as Project[];
};

// Admin: paginated projects with orgName and optional search
export const getAdminProjectsPaged = async (
  page: number,
  limit: number,
  search?: string,
): Promise<{ items: (Project & { orgName: string })[]; total: number }> => {
  const pool = getPool();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
  const offset = (safePage - 1) * safeLimit;

  const whereParts: string[] = [];
  const params: any[] = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereParts.push(
      `(o.org_name LIKE ? OR p.id LIKE ? OR p.project_name LIKE ? OR p.bailleur LIKE ? OR p.sector LIKE ? OR p.type LIKE ? OR p.location LIKE ?)`
    );
    params.push(q, q, q, q, q, q, q);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM projects p
      JOIN orgs o ON p.org_id = o.org_id
      ${whereSql}
    `,
    params,
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT 
        p.id,
        p.org_id AS orgId,
        o.org_name AS orgName,
        p.bailleur,
        p.start_date AS startDate,
        p.end_date AS endDate,
        p.type,
        p.sector,
        p.location,
        p.created_at AS createdAt,
        p.project_name AS projectName,
        p.project_description AS projectDescription,
        p.beneficiaries_type AS beneficiariesType,
        p.beneficiaries_planned AS beneficiariesPlanned,
        p.activities_planned AS activitiesPlanned,
        p.project_manager_name AS projectManagerName,
        p.project_manager_phone AS projectManagerPhone,
        p.project_manager_email AS projectManagerEmail
      FROM projects p
      JOIN orgs o ON p.org_id = o.org_id
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, safeLimit, offset],
  );

  return { items: rows as any, total };
};

export const getAllProjects = async (): Promise<Project[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       org_id AS orgId,
       bailleur,
       start_date AS startDate,
       end_date AS endDate,
       type,
       sector,
       location,
       created_at AS createdAt,
       project_name AS projectName,
       project_description AS projectDescription,
       beneficiaries_type AS beneficiariesType,
       beneficiaries_planned AS beneficiariesPlanned,
       activities_planned AS activitiesPlanned,
       project_manager_name AS projectManagerName,
       project_manager_phone AS projectManagerPhone,
       project_manager_email AS projectManagerEmail
     FROM projects
     ORDER BY created_at DESC`,
  );
  return rows as Project[];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       org_id AS orgId,
       bailleur,
       start_date AS startDate,
       end_date AS endDate,
       type,
       sector,
       location,
       created_at AS createdAt,
       project_name AS projectName,
       project_description AS projectDescription,
       beneficiaries_type AS beneficiariesType,
       beneficiaries_planned AS beneficiariesPlanned,
       activities_planned AS activitiesPlanned,
       project_manager_name AS projectManagerName,
       project_manager_phone AS projectManagerPhone,
       project_manager_email AS projectManagerEmail
     FROM projects
     WHERE id = ?`,
    [id],
  );
  return (rows[0] as Project) || null;
};

// Project auth helper: only used on backend to validate project-level logins
export const getProjectAuthById = async (
  id: string,
): Promise<{ id: string; orgId: string; projectPasswordHash: string | null } | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, org_id AS orgId, project_password_hash AS projectPasswordHash
     FROM projects
     WHERE id = ?`,
    [id],
  );
  if (!rows.length) return null;
  const row = rows[0] as any;
  return {
    id: row.id,
    orgId: row.orgId,
    projectPasswordHash: (row.projectPasswordHash as string) || null,
  };
};

export const insertProjectRecord = async (project: Project): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO projects (
      id, org_id, created_at, bailleur, start_date, end_date, type, sector, location,
      project_name, project_description, beneficiaries_type, beneficiaries_planned, 
      activities_planned, project_manager_name, project_manager_phone, project_manager_email
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project.id,
      project.orgId,
      project.createdAt,
      project.bailleur,
      project.startDate,
      project.endDate,
      project.type,
      project.sector,
      project.location,
      project.projectName || null,
      project.projectDescription || null,
      project.beneficiariesType || null,
      project.beneficiariesPlanned || null,
      project.activitiesPlanned || null,
      project.projectManagerName || null,
      project.projectManagerPhone || null,
      project.projectManagerEmail || null,
    ],
  );
};

export const updateProjectRecord = async (project: Project): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    `UPDATE projects SET 
      bailleur = ?, start_date = ?, end_date = ?, type = ?, sector = ?, location = ?,
      project_name = ?, project_description = ?, beneficiaries_type = ?, beneficiaries_planned = ?, 
      activities_planned = ?, project_manager_name = ?, project_manager_phone = ?, project_manager_email = ?
     WHERE id = ? AND org_id = ?`,
    [
      project.bailleur,
      project.startDate,
      project.endDate,
      project.type,
      project.sector,
      project.location,
      project.projectName || null,
      project.projectDescription || null,
      project.beneficiariesType || null,
      project.beneficiariesPlanned || null,
      project.activitiesPlanned || null,
      project.projectManagerName || null,
      project.projectManagerPhone || null,
      project.projectManagerEmail || null,
      project.id,
      project.orgId,
    ],
  );
};

export const deleteProjectRecord = async (orgId: string, id: string): Promise<void> => {
  const pool = getPool();
  await pool.execute('DELETE FROM projects WHERE id = ? AND orgId = ?', [id, orgId]);
};

// Update project password hash (used when generating or resetting project passwords)
export const setProjectPasswordHash = async (id: string, hash: string): Promise<void> => {
  const pool = getPool();
  await pool.execute('UPDATE projects SET project_password_hash = ? WHERE id = ?', [hash, id]);
};

// --- Project Update Requests ---

export const createProjectUpdateRequest = async (
  req: ProjectUpdateRequestSummary,
): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO project_update_requests (id, orgId, projectId, payload, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.id, req.orgId, req.projectId, JSON.stringify(req.payload), req.status, req.createdAt],
  );
};

export const getProjectUpdateRequests = async (): Promise<ProjectUpdateRequestSummary[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       orgId,
       projectId,
       payload,
       status,
       created_at AS createdAt,
       decided_at AS decidedAt
     FROM project_update_requests
     WHERE status = 'pending'
     ORDER BY created_at ASC`,
  );
  return rows.map((r) => ({
    ...r,
    payload: JSON.parse(r.payload),
  })) as ProjectUpdateRequestSummary[];
};

export const getProjectUpdateRequestById = async (
  id: string,
): Promise<ProjectUpdateRequestSummary | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       orgId,
       projectId,
       payload,
       status,
       created_at AS createdAt,
       decided_at AS decidedAt
     FROM project_update_requests
     WHERE id = ?`,
    [id],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    ...r,
    payload: JSON.parse(r.payload),
  } as ProjectUpdateRequestSummary;
};

export const updateProjectUpdateRequestStatus = async (
  id: string,
  status: 'approved' | 'rejected',
): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    'UPDATE project_update_requests SET status = ?, decidedAt = ? WHERE id = ?',
    [status, Date.now(), id],
  );
};

// --- Project Activities ---

export const getActivitiesByProject = async (projectId: string): Promise<ProjectActivity[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       id,
       project_id AS projectId,
       org_id AS orgId,
       title,
       date,
       location,
       status,
       description,
       beneficiaries_count AS beneficiariesCount,
       days_count AS daysCount,
       end_date AS endDate,
       gov_services AS govServices,
       created_at AS createdAt,
       image_url AS imageUrl
     FROM project_activities
     WHERE project_id = ?
     ORDER BY date DESC, created_at DESC`,
    [projectId],
  );
  return rows as ProjectActivity[];
};

// Admin: paginated activities joined with org and project, with optional search
export const getAdminActivitiesPaged = async (
  page: number,
  limit: number,
  search?: string,
): Promise<{
  items: (ProjectActivity & { orgName: string; projectName: string | null })[];
  total: number;
}> => {
  const pool = getPool();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
  const offset = (safePage - 1) * safeLimit;

  const whereParts: string[] = [];
  const params: any[] = [];

  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereParts.push(
      `(o.org_name LIKE ? OR a.title LIKE ? OR a.location LIKE ? OR p.project_name LIKE ? OR a.project_id LIKE ?)`
    );
    params.push(q, q, q, q, q);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const [countRows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS total
      FROM project_activities a
      JOIN projects p ON a.project_id = p.id
      JOIN orgs o ON a.org_id = o.org_id
      ${whereSql}
    `,
    params,
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT
        a.id,
        a.project_id AS projectId,
        a.org_id AS orgId,
        o.org_name AS orgName,
        a.title,
        a.date,
        a.location,
        a.status,
        a.description,
        a.beneficiaries_count AS beneficiariesCount,
        a.days_count AS daysCount,
        a.end_date AS endDate,
        a.gov_services AS govServices,
        a.created_at AS createdAt,
        a.image_url AS imageUrl,
        p.project_name AS projectName
      FROM project_activities a
      JOIN projects p ON a.project_id = p.id
      JOIN orgs o ON a.org_id = o.org_id
      ${whereSql}
      ORDER BY a.date DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, safeLimit, offset],
  );

  return { items: rows as any, total };
};

export const insertProjectActivity = async (activity: ProjectActivity): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO project_activities (id, project_id, org_id, title, date, location, status, description, beneficiaries_count, days_count, end_date, gov_services, created_at, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activity.id,
      activity.projectId,
      activity.orgId,
      activity.title,
      activity.date || null,
      activity.location || null,
      activity.status || 'pending',
      activity.description || null,
      typeof activity.beneficiariesCount === 'number' &&
      !Number.isNaN(activity.beneficiariesCount) &&
      activity.beneficiariesCount >= 0
        ? activity.beneficiariesCount
        : 0,
      typeof activity.daysCount === 'number' && !Number.isNaN(activity.daysCount)
        ? activity.daysCount
        : null,
      activity.endDate || null,
      activity.govServices || null,
      activity.createdAt,
      activity.imageUrl || null,
    ],
  );
};

export const deleteProjectActivityRecord = async (
  orgId: string,
  projectId: string,
  activityId: string,
): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    'DELETE FROM project_activities WHERE id = ? AND project_id = ? AND org_id = ?',
    [activityId, projectId, orgId],
  );
};

export interface RecentActivityRecord {
  id: string;
  title: string;
  date: string | null;
  location: string | null;
  orgId: string;
  orgName: string;
  projectId: string;
  projectName: string | null;
  status: string | null;
}

export const getRecentActivities = async (limit: number): Promise<RecentActivityRecord[]> => {
  const pool = getPool();
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       a.id,
       a.title,
       a.date,
       a.location,
       a.status,
       a.gov_services AS govServices,
       a.org_id AS orgId,
       o.org_name AS orgName,
       a.project_id AS projectId,
       p.project_name AS projectName
     FROM project_activities a
     JOIN projects p ON a.project_id = p.id
     JOIN orgs o ON a.org_id = o.org_id
     ORDER BY a.date DESC, a.created_at DESC
     LIMIT ?`,
    [safeLimit],
  );
  return rows as RecentActivityRecord[];
};

// --- Province Monthly Stats ---

export interface ProvinceMonthlyStatRecord {
  id: string;
  month: string; // "01" .. "12"
  year: number;
  totalRefugees: number;
  newRefugees: number;
  totalReturnees: number;
  newReturnees: number;
  createdAt: number;
}

export const insertProvinceMonthlyStat = async (stat: ProvinceMonthlyStatRecord): Promise<void> => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO province_stats (
      id, month, year, total_refugees, new_refugees, total_returnees, new_returnees, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      stat.id,
      stat.month,
      stat.year,
      stat.totalRefugees,
      stat.newRefugees,
      stat.totalReturnees,
      stat.newReturnees,
      stat.createdAt,
    ],
  );
};

export const listProvinceMonthlyStats = async (): Promise<ProvinceMonthlyStatRecord[]> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       month,
       year,
       total_refugees AS totalRefugees,
       new_refugees AS newRefugees,
       total_returnees AS totalReturnees,
       new_returnees AS newReturnees,
       created_at AS createdAt
     FROM province_stats
     ORDER BY year DESC, month DESC, created_at DESC`,
  );
  return rows as ProvinceMonthlyStatRecord[];
};

// --- Province Structural Stats ---

export interface ProvinceStructuralStatsRecord {
  id: string;
  populationTotal: number;
  disabledTotal: number;
  floodAffected: number;
  fireAffected: number;
  veryVulnerable: number;
  updatedAt: number;
}

const PROVINCE_STRUCTURAL_ID = 'PROVINCE_MAIN';

export const getProvinceStructuralStats = async (): Promise<ProvinceStructuralStatsRecord | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 
       id,
       population_total AS populationTotal,
       disabled_total AS disabledTotal,
       flood_affected AS floodAffected,
       fire_affected AS fireAffected,
       very_vulnerable AS veryVulnerable,
       updated_at AS updatedAt
     FROM province_structural_stats
     WHERE id = ?`,
    [PROVINCE_STRUCTURAL_ID],
  );
  if (!rows.length) return null;
  return rows[0] as ProvinceStructuralStatsRecord;
};

export const saveProvinceStructuralStats = async (
  stats: Omit<ProvinceStructuralStatsRecord, 'id' | 'updatedAt'>,
): Promise<ProvinceStructuralStatsRecord> => {
  const pool = getPool();
  const now = Date.now();
  const existing = await getProvinceStructuralStats();

  if (existing) {
    await pool.execute(
      `UPDATE province_structural_stats
       SET population_total = ?, disabled_total = ?, flood_affected = ?, fire_affected = ?, very_vulnerable = ?, updated_at = ?
       WHERE id = ?`,
      [
        stats.populationTotal,
        stats.disabledTotal,
        stats.floodAffected,
        stats.fireAffected,
        stats.veryVulnerable,
        now,
        PROVINCE_STRUCTURAL_ID,
      ],
    );
  } else {
    await pool.execute(
      `INSERT INTO province_structural_stats (
        id, population_total, disabled_total, flood_affected, fire_affected, very_vulnerable, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        PROVINCE_STRUCTURAL_ID,
        stats.populationTotal,
        stats.disabledTotal,
        stats.floodAffected,
        stats.fireAffected,
        stats.veryVulnerable,
        now,
      ],
    );
  }

  return {
    id: PROVINCE_STRUCTURAL_ID,
    populationTotal: stats.populationTotal,
    disabledTotal: stats.disabledTotal,
    floodAffected: stats.floodAffected,
    fireAffected: stats.fireAffected,
    veryVulnerable: stats.veryVulnerable,
    updatedAt: now,
  };
};

// --- Admins ---

export const getAdminByUsername = async (username: string): Promise<AdminRecord | null> => {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, username, password_hash as passwordHash FROM admins WHERE username = ?',
    [username],
  );
  return (rows[0] as AdminRecord) || null;
};
