import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const resetAdmin = async () => {
    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'portail_sila',
    });

    try {
        const username = 'DPASSAHS';
        const password = process.env.ADMIN_DEFAULT_PASS || 'DPASSAHS@2025';

        console.log(`Resetting password for admin: ${username}`);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await pool.execute(
            'UPDATE admins SET password_hash = ? WHERE username = ?',
            [hash, username]
        );

        // If no rows affected, maybe the user doesn't exist, so insert it
        if ((result as any).affectedRows === 0) {
            console.log('Admin not found, creating new one...');
            await pool.execute(
                'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
                [username, hash, Date.now()]
            );
        }

        console.log('Admin password reset successfully.');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);

    } catch (err) {
        console.error('Failed to reset admin password:', err);
    } finally {
        await pool.end();
    }
};

resetAdmin();
