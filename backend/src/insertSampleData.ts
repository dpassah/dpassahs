import { initDB, getPool } from './db';

async function insertSampleData() {
    const pool = getPool();

    try {
        console.log('Inserting sample monthly stats...');

        // Insert province monthly stats
        await pool.execute(`
      INSERT INTO province_stats (id, month, year, total_refugees, new_refugees, total_returnees, new_returnees, created_at)
      VALUES 
        ('ps-2024-11', '11', 2024, 15000, 500, 8000, 200, ?),
        ('ps-2024-10', '10', 2024, 14500, 450, 7800, 180, ?),
        ('ps-2024-09', '09', 2024, 14050, 400, 7620, 150, ?)
      ON DUPLICATE KEY UPDATE 
        total_refugees = VALUES(total_refugees),
        new_refugees = VALUES(new_refugees),
        total_returnees = VALUES(total_returnees),
        new_returnees = VALUES(new_returnees)
    `, [Date.now(), Date.now(), Date.now()]);
        console.log('✓ Province monthly stats inserted');

        // Insert structural stats
        await pool.execute(`
      INSERT INTO province_structural_stats (id, population_total, disabled_total, flood_affected, fire_affected, very_vulnerable, updated_at)
      VALUES ('structural-1', 185000, 5200, 3500, 1200, 12000, ?)
      ON DUPLICATE KEY UPDATE 
        population_total = VALUES(population_total),
        disabled_total = VALUES(disabled_total),
        flood_affected = VALUES(flood_affected),
        fire_affected = VALUES(fire_affected),
        very_vulnerable = VALUES(very_vulnerable),
        updated_at = VALUES(updated_at)
    `, [Date.now()]);
        console.log('✓ Structural stats inserted');

        // Insert sites
        await pool.execute(`
      INSERT INTO sites (id, name, kind)
      VALUES 
        ('site-1', 'Camp Goz Beida', 'refugees'),
        ('site-2', 'Camp Kounoungou', 'refugees'),
        ('site-3', 'Village Hôte Adré', 'host_village'),
        ('site-4', 'Zone Retour Tiné', 'returnees')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
        console.log('✓ Sites inserted');

        // Insert site monthly stats for November 2024
        await pool.execute(`
      INSERT INTO site_monthly_stats (id, site_id, month, year, ref_total_ind, ref_total_hh, ret_total_ind, ret_total_hh, ref_new_ind, ref_new_hh, ret_new_ind, ret_new_hh, created_at)
      VALUES 
        ('sms-1-2024-11', 'site-1', '11', 2024, 8500, 1700, 0, 0, 300, 60, 0, 0, ?),
        ('sms-2-2024-11', 'site-2', '11', 2024, 6500, 1300, 0, 0, 200, 40, 0, 0, ?),
        ('sms-3-2024-11', 'site-3', '11', 2024, 0, 0, 0, 0, 0, 0, 0, 0, ?),
        ('sms-4-2024-11', 'site-4', '11', 2024, 0, 0, 8000, 1600, 0, 0, 200, 40, ?)
      ON DUPLICATE KEY UPDATE 
        ref_total_ind = VALUES(ref_total_ind),
        ref_total_hh = VALUES(ref_total_hh),
        ret_total_ind = VALUES(ret_total_ind),
        ret_total_hh = VALUES(ret_total_hh),
        ref_new_ind = VALUES(ref_new_ind),
        ref_new_hh = VALUES(ref_new_hh),
        ret_new_ind = VALUES(ret_new_ind),
        ret_new_hh = VALUES(ret_new_hh)
    `, [Date.now(), Date.now(), Date.now(), Date.now()]);
        console.log('✓ Site monthly stats inserted');

        console.log('\n✅ All sample data inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
        process.exit(1);
    }
}

// Run if called directly
async function main() {
    await initDB();
    await insertSampleData();
}

if (require.main === module) {
    main().catch((err) => {
        console.error('Failed to run script:', err);
        process.exit(1);
    });
}

export { insertSampleData };
