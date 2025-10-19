const db = require('../config/db');
const { ensureTables } = require('./miscModel');

async function getAllFloors() {
  await ensureTables();
  const [rows] = await db.query('SELECT * FROM floor');
  return rows;
}

async function getFloorById(id) {
  await ensureTables();
  const [rows] = await db.query('SELECT * FROM floor WHERE id = ?', [id]);
  return rows[0];
}

async function createFloor(floor) {
  await ensureTables();
  const { name, building_id, level } = floor;
  
  try {
    const [result] = await db.query(
      'INSERT INTO floor (name, building_id, level) VALUES (?, ?, ?)',
      [name, building_id, level]
    );
    return { id: result.insertId, name, building_id, level };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`Floor with level ${level} already exists in this building`);
    }
    throw error;
  }
}

async function updateFloor(id, floor) {
  await ensureTables();
  const { name, building_id, level } = floor;
  
  try {
    await db.query(
      'UPDATE floor SET name = ?, building_id = ?, level = ? WHERE id = ?',
      [name, building_id, level, id]
    );
    return { id, name, building_id, level };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error(`Floor with level ${level} already exists in this building`);
    }
    throw error;
  }
}

async function deleteFloor(id) {
  await ensureTables();
  
  // Complete cascade deletion for floor:
  // Floor -> Maps -> Sensors (by map_id) + Sensors (by floor_id) + Plants + Measurements + Watering Schedules
  
  // 1. Get all maps for this floor
  const [maps] = await db.query('SELECT id FROM map WHERE floor_id = ?', [id]);
  const mapIds = maps.map(m => m.id);
  
  // 2. Get all sensors related to this floor (both by floor_id and by map_id)
  let sensorIds = [];
  
  // Sensors directly assigned to floor
  const [floorSensors] = await db.query('SELECT id FROM sensor WHERE floor_id = ?', [id]);
  sensorIds.push(...floorSensors.map(s => s.id));
  
  // Sensors assigned to maps of this floor
  if (mapIds.length > 0) {
    const mapPlaceholders = mapIds.map(() => '?').join(',');
    const [mapSensors] = await db.query(`SELECT id FROM sensor WHERE map_id IN (${mapPlaceholders})`, mapIds);
    sensorIds.push(...mapSensors.map(s => s.id));
  }
  
  // Remove duplicates
  sensorIds = [...new Set(sensorIds)];
  
  // 3. Delete cascade: measurements -> watering_schedules -> plants -> sensors -> maps -> floor
  
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
  
  // 4. Delete maps
  if (mapIds.length > 0) {
    const mapPlaceholders = mapIds.map(() => '?').join(',');
    await db.query(`DELETE FROM map WHERE id IN (${mapPlaceholders})`, mapIds);
  }
  
  // 5. Finally delete the floor
  await db.query('DELETE FROM floor WHERE id = ?', [id]);
  
  return { 
    message: `Floor with ID ${id} deleted along with ${mapIds.length} maps, ${sensorIds.length} sensors and related data.` 
  };
}

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
};
