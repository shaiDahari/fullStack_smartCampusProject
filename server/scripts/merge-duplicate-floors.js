const fs = require('fs');
const path = require('path');
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

async function createBackup() {
  console.log('Creating backup...');
  
  const [floors] = await db.query('SELECT * FROM floor');
  const [maps] = await db.query('SELECT * FROM map');
  const [sensors] = await db.query('SELECT * FROM sensor');
  
  const backup = {
    timestamp: new Date().toISOString(),
    floors,
    maps,
    sensors
  };
  
  const backupPath = path.join(__dirname, `backup-floors-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup saved to: ${backupPath}`);
  
  return backupPath;
}

async function findDuplicateFloors() {
  console.log('Finding duplicate floors...');
  
  const [duplicates] = await db.query(`
    SELECT building_id, level, COUNT(*) as count, 
           GROUP_CONCAT(id) as ids, 
           GROUP_CONCAT(name) as names
    FROM floor 
    GROUP BY building_id, level 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);

  return duplicates.map(dup => ({
    building_id: dup.building_id,
    level: dup.level,
    count: dup.count,
    ids: dup.ids.split(',').map(id => parseInt(id)),
    names: dup.names.split(',')
  }));
}

async function mergeDuplicateFloors(duplicates) {
  console.log('Starting floor merge process...');
  
  for (const group of duplicates) {
    console.log(`\nMerging ${group.count} floors for building ${group.building_id}, level ${group.level}:`);
    console.log(`Floor names: ${group.names.join(', ')}`);
    
    // Choose primary floor (lowest ID)
    const primaryId = Math.min(...group.ids);
    const duplicateIds = group.ids.filter(id => id !== primaryId);
    
    console.log(`Primary floor ID: ${primaryId}, merging duplicates: ${duplicateIds.join(', ')}`);
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Reassign maps to primary floor
      for (const duplicateId of duplicateIds) {
        await connection.query('UPDATE map SET floor_id = ? WHERE floor_id = ?', [primaryId, duplicateId]);
        console.log(`Reassigned maps from floor ${duplicateId} to ${primaryId}`);
      }
      
      // Reassign sensors to primary floor (if they reference floor_id directly)
      for (const duplicateId of duplicateIds) {
        await connection.query('UPDATE sensor SET floor_id = ? WHERE floor_id = ?', [primaryId, duplicateId]);
        console.log(`Reassigned sensors from floor ${duplicateId} to ${primaryId}`);
      }
      
      // Delete duplicate floors
      for (const duplicateId of duplicateIds) {
        await connection.query('DELETE FROM floor WHERE id = ?', [duplicateId]);
        console.log(`Deleted duplicate floor ${duplicateId}`);
      }
      
      await connection.commit();
      console.log(`Successfully merged ${group.count} floors into floor ${primaryId}`);
      
    } catch (error) {
      await connection.rollback();
      console.error(`Error merging floors for building ${group.building_id}, level ${group.level}:`, error.message);
      throw error;
    } finally {
      connection.release();
    }
  }
}

async function main() {
  try {
    console.log('=== Floor Merge Script ===');
    
    await initDatabase();
    await ensureTables();
    
    const backupPath = await createBackup();
    
    const duplicates = await findDuplicateFloors();
    
    if (duplicates.length === 0) {
      console.log('No duplicate floors found.');
      return;
    }
    
    console.log(`Found ${duplicates.length} groups of duplicate floors.`);
    await mergeDuplicateFloors(duplicates);
    
    // Verify results
    const [finalFloors] = await db.query('SELECT COUNT(*) as count FROM floor');
    const [remainingDuplicates] = await db.query(`
      SELECT COUNT(*) as count FROM (
        SELECT building_id, level FROM floor 
        GROUP BY building_id, level 
        HAVING COUNT(*) > 1
      ) as dups
    `);
    
    console.log('\n=== Merge Complete ===');
    console.log(`Total floors: ${finalFloors[0].count}`);
    console.log(`Remaining duplicates: ${remainingDuplicates[0].count}`);
    console.log(`Backup saved to: ${backupPath}`);
    
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    console.log('Script execution finished');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };