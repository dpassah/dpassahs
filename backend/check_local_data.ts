import { initDB, getPool } from './src/db';

async function checkData() {
  await initDB();
  const pool = getPool();

  console.log('\n--- Checking Delegation Events ---');
  try {
    // Check if we are using MySQL or SQLite by inspecting the pool object or config
    // But better just try a query.
    // Note: The pool abstraction in db.ts handles execute().
    
    const [rows] = await pool.execute('SELECT id, title, images FROM delegation_events');
    // @ts-ignore
    const events = Array.isArray(rows) ? rows : [rows];
    
    console.log(`Found ${events.length} events.`);
    events.forEach((ev: any) => {
       console.log(`\nID: ${ev.id}`);
       console.log(`Title: ${ev.title}`);
       console.log(`Images (Raw): ${ev.images}`);
       try {
          const parsed = JSON.parse(ev.images || '[]');
          console.log(`Images (Parsed):`, parsed);
       } catch (e) {
          console.log('Images (Not JSON):', ev.images);
       }
    });

  } catch (error) {
    console.error('Error querying events:', error);
  }
  process.exit(0);
}

checkData();
