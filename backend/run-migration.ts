import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const runMigration = async () => {
    console.log('Running migration to add images column to delegation_events table...');
    
    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'portail_sila',
    });

    try {
        const connection = await pool.getConnection();
        
        // Read the SQL migration file
        const migrationSQL = fs.readFileSync(path.join(__dirname, 'add_images_column.sql'), 'utf8');
        
        // Execute the migration
        await connection.execute(migrationSQL);
        
        console.log('Migration completed successfully! Images column added to delegation_events table.');
        
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
