const db = require('../config/db');
const { ensureTables } = require('./miscModel');

function createSlug(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

async function getAllBuildings() {
  await ensureTables();
  const [rows] = await db.query('SELECT * FROM building');
  return rows;
}

async function getBuildingById(id) {
  await ensureTables();
  const [rows] = await db.query('SELECT * FROM building WHERE id = ?', [id]);
  return rows[0];
}

async function createBuilding({ name, address, description }) {
  await ensureTables();
  const slug = createSlug(name);
  
  // Check for duplicate slug
  const [existing] = await db.query('SELECT id FROM building WHERE slug = ?', [slug]);
  if (existing.length > 0) {
    throw new Error(`Building with name "${name}" already exists`);
  }
  
  const [result] = await db.query(
    'INSERT INTO building (name, address, description, slug) VALUES (?, ?, ?, ?)', 
    [name, address || null, description || null, slug]
  );
  return { id: result.insertId, name, address, description, slug };
}

async function updateBuilding(id, { name, address, description }) {
  await ensureTables();
  const slug = createSlug(name);
  
  // Check for duplicate slug (excluding current building)
  const [existing] = await db.query('SELECT id FROM building WHERE slug = ? AND id != ?', [slug, id]);
  if (existing.length > 0) {
    throw new Error(`Building with name "${name}" already exists`);
  }
  
  await db.query(
    'UPDATE building SET name = ?, address = ?, description = ?, slug = ? WHERE id = ?', 
    [name, address || null, description || null, slug, id]
  );
  return { id, name, address, description, slug };
}

async function deleteBuilding(id) {
  await ensureTables();
  
  // Complete cascade deletion following the hierarchy:
  // Building -> Floors -> Maps -> Sensors (by map_id) + Sensors (by building_id) + Plants + Measurements + Watering Schedules
  
  // 1. Get all floors for this building
  const [floors] = await db.query('SELECT id FROM floor WHERE building_id = ?', [id]);
  const floorIds = floors.map(f => f.id);
  
  // 2. Get all maps for these floors
  let mapIds = [];
  if (floorIds.length > 0) {
    const placeholders = floorIds.map(() => '?').join(',');
    const [maps] = await db.query(`SELECT id FROM map WHERE floor_id IN (${placeholders})`, floorIds);
    mapIds = maps.map(m => m.id);
  }
  
  // 3. Get all sensors related to this building (both by building_id and by map_id)
  let sensorIds = [];
  
  // Sensors directly assigned to building
  const [buildingSensors] = await db.query('SELECT id FROM sensor WHERE building_id = ?', [id]);
  sensorIds.push(...buildingSensors.map(s => s.id));
  
  // Sensors assigned to maps of this building
  if (mapIds.length > 0) {
    const mapPlaceholders = mapIds.map(() => '?').join(',');
    const [mapSensors] = await db.query(`SELECT id FROM sensor WHERE map_id IN (${mapPlaceholders})`, mapIds);
    sensorIds.push(...mapSensors.map(s => s.id));
  }
  
  // Remove duplicates
  sensorIds = [...new Set(sensorIds)];
  
  // 4. Delete cascade: measurements -> watering_schedules -> plants -> sensors -> maps -> floors -> building
  
  if (sensorIds.length > 0) {
    const sensorPlaceholders = sensorIds.map(() => '?').join(',');
    
    // Delete measurements for these sensors
    await db.query(`DELETE FROM measurement WHERE sensor_id IN (${sensorPlaceholders})`, sensorIds);
    
    // Get plants for these sensors and delete their watering schedules
    const [plants] = await db.query(`SELECT id FROM plant WHERE sensor_id IN (${sensorPlaceholders})`, sensorIds);
    const plantIds = plants.map(p => p.id);
    
    if (plantIds.length > 0) {
      const plantPlaceholders = plantIds.map(() => '?').join(',');
      await db.query(`DELETE FROM watering_schedule WHERE plant_id IN (${plantPlaceholders})`, plantIds);
      await db.query(`DELETE FROM plant WHERE id IN (${plantPlaceholders})`, plantIds);
    }
    
    // Delete sensors
    await db.query(`DELETE FROM sensor WHERE id IN (${sensorPlaceholders})`, sensorIds);
  }
  
  // 5. Delete maps
  if (mapIds.length > 0) {
    const mapPlaceholders = mapIds.map(() => '?').join(',');
    await db.query(`DELETE FROM map WHERE id IN (${mapPlaceholders})`, mapIds);
  }
  
  // 6. Delete floors
  if (floorIds.length > 0) {
    const floorPlaceholders = floorIds.map(() => '?').join(',');
    await db.query(`DELETE FROM floor WHERE id IN (${floorPlaceholders})`, floorIds);
  }
  
  // 7. Finally delete the building
  await db.query('DELETE FROM building WHERE id = ?', [id]);
  
  return { 
    message: `Building with ID ${id} deleted along with ${floorIds.length} floors, ${mapIds.length} maps, ${sensorIds.length} sensors and related data.` 
  };
}

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding
};
