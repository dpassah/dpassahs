<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Portail HUMANITAIRES

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-l3D2_PgxyTOAklvtT87iW4VgA3VT8GS

## Run Locally

**Prerequisites:**  Node.js

### Backend (API)
1. `cd backend`
2. `npm install`
3. Configure `.env` (example):
   - `PORT=5000`
   - `ALLOWED_ORIGINS=http://localhost:5173`
   - `SMTP_HOST=your-smtp-host`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-smtp-username`
   - `SMTP_PASS=your-smtp-password`
   - `SMTP_SECURE=false` (true if you use 465)
   - `SMTP_FROM="Portail HUMANITAIRES <no-reply@domain>"` (adresse émettrice)
   - `DB_HOST=your-db-host` (Hostinger MySQL)
   - `DB_PORT=3306`
   - `DB_USER=your-db-user`
   - `DB_PASS=your-db-password`
   - `DB_NAME=your-db-name`
   - `DB_CONNECTION_LIMIT=10`
4. Run the API in watch mode: `npm run dev` (or `npm run build && npm start` for production)

### Frontend (Vite/React)
1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` and `VITE_API_BASE_URL` (e.g. `http://localhost:5000`) in [.env.local](.env.local)
3. Run the app: `npm run dev`

### Base de Donnees (MySQL Hostinger)
- Le backend utilise MySQL via `mysql2` (plus de fichiers JSON).
- Les tables sont creees automatiquement au demarrage si absentes : `orgs` et `projects`.
- Script SQL equivalent si besoin de creation manuelle :
  ```sql
  CREATE TABLE orgs (
    org_id VARCHAR(64) PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    org_name_full VARCHAR(255) NOT NULL,
    org_type VARCHAR(128) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(64),
    created_at BIGINT NOT NULL
  );

  CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) NOT NULL,
    bailleur VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(64) NOT NULL,
    sector VARCHAR(128) NOT NULL,
    location TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    CONSTRAINT fk_projects_org FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE
  );
  ```

### Accès
- Les organisations demandent un identifiant via le formulaire « Demande d’Identifiant Unique » (endpoint `/api/register`). L’ID est envoyé par email via SMTP.
- Connexion ensuite avec le nom d’organisation + l’ID reçu par email (endpoint `/api/login`).
