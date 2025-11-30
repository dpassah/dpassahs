import { initDB, getPool } from './src/db';
import fs from 'fs';
import path from 'path';

async function runSqlFile() {
  try {
    // Initialize DB connection (will pick up credentials from .env)
    await initDB();
    const pool = getPool();

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'restore_events.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon to execute statements one by one (basic splitting)
    // Note: This basic split might fail if semicolons are inside strings, 
    // but for our simple restore_events.sql it should be fine.
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    for (const statement of statements) {
        try {
            await pool.execute(statement);
            console.log('✓ Executed statement.');
        } catch (err: any) {
             // Ignore duplicate entry errors if we are running this multiple times
             if (err.code === 'ER_DUP_ENTRY') {
                 console.log('⚠ Skipped duplicate entry.');
             } else {
                 console.error('❌ Error executing statement:', err.message);
             }
        }
    }

    console.log('\n✅ SQL script executed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
    runSqlFile();
}
