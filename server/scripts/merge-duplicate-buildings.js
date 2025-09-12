const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { ensureTables } = require('../models/miscModel');

// Initialize database connection
async function initDatabase() {
  // Wait a bit for the pool initialization to complete
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
        console.error('Failed to initialize database:', error.message);
        throw error;
      }
    }
  }
  throw new Error('Database initialization timeout');
}

async function createBackup() {
  console.log('Creating backup...');
  
  const [buildings] = await db.query('SELECT * FROM building');
  const [floors] = await db.query('SELECT * FROM floor');
  const [maps] = await db.query('SELECT * FROM map');
  
  const backup = {
    timestamp: new Date().toISOString(),
    buildings,
    floors,
    maps
  };
  
  const backupPath = path.join(__dirname, `backup-buildings-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`Backup saved to: ${backupPath}`);
  
  return backupPath;
}

async function generateSlugsForExistingBuildings() {
  console.log('Generating slugs for existing buildings...');
  
  // Clear existing slugs first to avoid conflicts
  await db.query('UPDATE building SET slug = NULL');
  console.log('Cleared existing slugs');
  
  const [buildings] = await db.query('SELECT id, name FROM building ORDER BY id');
  const slugCounts = {};
  
  for (const building of buildings) {
    let baseSlug = building.name.trim().toLowerCase().replace(/\s+/g, '-');
    let finalSlug = baseSlug;
    
    // Handle duplicates by adding a counter
    if (slugCounts[baseSlug]) {
      slugCounts[baseSlug]++;
      finalSlug = `${baseSlug}-${slugCounts[baseSlug]}`;
    } else {
      slugCounts[baseSlug] = 1;
    }
    
    await db.query('UPDATE building SET slug = ? WHERE id = ?', [finalSlug, building.id]);
    console.log(`Building ID ${building.id} (${building.name}) -> slug: ${finalSlug}`);
  }
  
  console.log(`Generated slugs for ${buildings.length} buildings`);
  console.log('Slug generation complete, moving to next step...');
}

async function findDuplicateBuildings() {
  console.log('Finding duplicate buildings...');
  
  // Find buildings with same base name (before -2, -3 suffix)
  const [buildings] = await db.query('SELECT id, name, slug FROM building WHERE slug IS NOT NULL');
  const nameGroups = {};
  
  buildings.forEach(building => {
    const baseName = building.name.trim().toLowerCase();
    if (!nameGroups[baseName]) {
      nameGroups[baseName] = [];
    }
    nameGroups[baseName].push(building);
  });
  
  const duplicateGroups = [];
  Object.entries(nameGroups).forEach(([baseName, buildings]) => {
    if (buildings.length > 1) {
      duplicateGroups.push({
        baseName: baseName,
        count: buildings.length,
        ids: buildings.map(b => b.id),
        names: buildings.map(b => b.name),
        slugs: buildings.map(b => b.slug)
      });
    }
  });
  
  return duplicateGroups;
}

async function mergeDuplicateBuildings(duplicateGroups) {
  console.log('Starting merge process...');
  
  for (const group of duplicateGroups) {
    console.log(`\nMerging ${group.count} buildings with name "${group.baseName}":`, group.names);
    
    // Choose primary building (lowest ID)
    const primaryId = Math.min(...group.ids);
    const duplicateIds = group.ids.filter(id => id !== primaryId);
    
    console.log(`Primary building ID: ${primaryId}, merging duplicates: ${duplicateIds.join(', ')}`);
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Reassign floors to primary building
      for (const duplicateId of duplicateIds) {
        await connection.query('UPDATE floor SET building_id = ? WHERE building_id = ?', [primaryId, duplicateId]);
        const [floorCount] = await connection.query('SELECT COUNT(*) as count FROM floor WHERE building_id = ?', [primaryId]);
        console.log(`Reassigned floors from building ${duplicateId} to ${primaryId} (total floors: ${floorCount[0].count})`);
      }
      
      // Reassign maps to primary building
      for (const duplicateId of duplicateIds) {
        await connection.query('UPDATE map SET building_id = ? WHERE building_id = ?', [primaryId, duplicateId]);
      }
      
      // Delete duplicate buildings
      for (const duplicateId of duplicateIds) {
        await connection.query('DELETE FROM building WHERE id = ?', [duplicateId]);
        console.log(`Deleted duplicate building ${duplicateId}`);
      }
      
      // Update primary building slug to clean version (remove -2, -3 suffix)
      const cleanSlug = group.baseName.replace(/\s+/g, '-');
      await connection.query('UPDATE building SET slug = ? WHERE id = ?', [cleanSlug, primaryId]);
      console.log(`Updated primary building ${primaryId} slug to: ${cleanSlug}`);
      
      await connection.commit();
      console.log(`Successfully merged ${group.count} buildings into building ${primaryId}`);
      
    } catch (error) {
      await connection.rollback();
      console.error(`Error merging buildings for name "${group.baseName}":`, error.message);
      throw error;
    } finally {
      connection.release();
    }
  }
}

async function main() {
  try {
    console.log('=== Building Merge Script ===');
    
    // Step 0: Initialize database
    await initDatabase();
    
    // Step 0.5: Ensure tables with slug column exist
    await ensureTables();
    console.log('Database schema updated');
    
    // Step 1: Create backup
    const backupPath = await createBackup();
    
    // Step 2: Generate slugs for existing buildings
    await generateSlugsForExistingBuildings();
    
    // Step 3: Find duplicates
    const duplicateGroups = await findDuplicateBuildings();
    
    if (duplicateGroups.length === 0) {
      console.log('No duplicate buildings found.');
      return;
    }
    
    console.log(`Found ${duplicateGroups.length} groups of duplicate buildings:`);
    duplicateGroups.forEach(group => {
      console.log(`- "${group.baseName}": ${group.count} duplicates (${group.names.join(', ')})`);
    });
    
    // Step 4: Merge duplicates
    await mergeDuplicateBuildings(duplicateGroups);
    
    // Step 5: Verify results
    const [finalBuildings] = await db.query('SELECT COUNT(*) as count FROM building');
    const [remainingDuplicates] = await db.query(`
      SELECT COUNT(*) as count FROM (
        SELECT slug FROM building 
        WHERE slug IS NOT NULL 
        GROUP BY slug 
        HAVING COUNT(*) > 1
      ) as dups
    `);
    
    console.log('\n=== Merge Complete ===');
    console.log(`Total buildings: ${finalBuildings[0].count}`);
    console.log(`Remaining duplicates: ${remainingDuplicates[0].count}`);
    console.log(`Backup saved to: ${backupPath}`);
    
    if (remainingDuplicates[0].count > 0) {
      console.warn('WARNING: Some duplicates may still exist. Check manually.');
    }
    
  } catch (error) {
    console.error('Script failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    console.log('Script execution finished');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };