import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    console.log('Testing database connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    const pool = createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'portail_sila',
    });

    try {
        const connection = await pool.getConnection();
        console.log('Successfully connected to database!');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    }
};

testConnection();
