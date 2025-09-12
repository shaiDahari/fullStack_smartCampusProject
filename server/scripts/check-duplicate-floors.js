const db = require('../config/db');
const { ensureTables } = require('../models/miscModel');

async function initDatabase() {
  let retries = 10;
  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      console.log('Database connection initialized');
      return;
    } catch (error) {
      if (error.message.includes('DB pool not initialized')) {
        console.log('Waiting for database initialization...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      } else {
        throw error;
      }
    }
  }
  throw new Error('Database initialization timeout');
}

async function checkDuplicateFloors() {
  await initDatabase();
  await ensureTables();

  console.log('=== Checking for duplicate floors ===');

  // Find floors grouped by building and level
  const [duplicates] = await db.query(`
    SELECT building_id, level, COUNT(*) as count, 
           GROUP_CONCAT(id) as ids, 
           GROUP_CONCAT(name) as names
    FROM floor 
    GROUP BY building_id, level 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);

  if (duplicates.length === 0) {
    console.log('No duplicate floors found.');
    return [];
  }

  console.log(`Found ${duplicates.length} groups of duplicate floors:`);
  duplicates.forEach(dup => {
    console.log(`Building ${dup.building_id}, Level ${dup.level}: ${dup.count} floors (IDs: ${dup.ids}, Names: ${dup.names})`);
  });

  return duplicates;
}

if (require.main === module) {
  checkDuplicateFloors().catch(console.error);
}

module.exports = { checkDuplicateFloors };