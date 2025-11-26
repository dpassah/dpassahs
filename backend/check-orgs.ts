import { initDB, getAllOrgs, getPool } from './src/db';

async function check() {
    try {
        await initDB();
        const orgs = await getAllOrgs();
        console.log(`Found ${orgs.length} organizations.`);
        if (orgs.length > 0) {
            console.log('First org:', orgs[0]);
        } else {
            console.log('No organizations found in the database.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error checking orgs:', err);
        process.exit(1);
    }
}

check();
