const db = require('../config/db');

async function ensureSensorTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS sensor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(255), model VARCHAR(255), manufacturer VARCHAR(255),
    type VARCHAR(64), name VARCHAR(255), unit VARCHAR(32), status VARCHAR(32),
    installed_at DATETIME NULL, last_maintenance DATETIME NULL,
    building_id INT NULL, floor_id INT NULL, room_id VARCHAR(255) NULL,
    x_coord DECIMAL(10,2) NULL, y_coord DECIMAL(10,2) NULL,
    x_percent DECIMAL(5,2) NULL, y_percent DECIMAL(5,2) NULL,
    map_id INT NULL
  )`);
  
  // Add missing columns if they don't exist (for existing databases)
  try {
    await db.query("ALTER TABLE sensor ADD COLUMN building_id INT NULL");
  } catch (e) { /* Column already exists */ }
  
  try {
    await db.query("ALTER TABLE sensor ADD COLUMN floor_id INT NULL");
  } catch (e) { /* Column already exists */ }
  
  // Convert room_id to VARCHAR if it's still INT
  try {
    await db.query("ALTER TABLE sensor MODIFY COLUMN room_id VARCHAR(255) NULL");
  } catch (e) { /* Column already correct type */ }
}

// כל החיישנים
async function getAllSensors() {
  await ensureSensorTable();
  const [rows] = await db.query('SELECT * FROM sensor');
  return rows;
}

// לפי מזהה
async function getSensorById(id) {
  await ensureSensorTable();
  const [rows] = await db.query('SELECT * FROM sensor WHERE id = ?', [id]);
  return rows[0];
}

// יצירה
async function createSensor(sensor) {
  const {
    serial_number, model, manufacturer, type, name, unit,
    status, installed_at, last_maintenance,
    building_id = null, floor_id = null, room_id = null,
    x_coord = null, y_coord = null, x_percent = null, y_percent = null,
    map_id = null
  } = sensor;

  await ensureSensorTable();

  // Check for duplicate names (globally unique)
  if (name) {
    const [existing] = await db.query('SELECT id FROM sensor WHERE name = ?', [name]);
    if (existing.length > 0) {
      throw new Error(`Sensor with name "${name}" already exists`);
    }
  }

  const [result] = await db.query(
    `INSERT INTO sensor (
      serial_number, model, manufacturer, type, name, unit,
      status, installed_at, last_maintenance,
      building_id, floor_id, room_id, x_coord, y_coord, x_percent, y_percent, map_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [serial_number, model, manufacturer, type, name, unit,
      status, installed_at, last_maintenance,
      building_id, floor_id, room_id, x_coord, y_coord, x_percent, y_percent, map_id]
  );
  return result.insertId;
}

// עדכון
async function updateSensor(id, sensor) {
  await ensureSensorTable();
  
  // Check for duplicate names if name is being updated (globally unique, excluding current sensor)
  if (sensor.name) {
    const [existing] = await db.query('SELECT id FROM sensor WHERE name = ? AND id != ?', [sensor.name, id]);
    if (existing.length > 0) {
      throw new Error(`Sensor with name "${sensor.name}" already exists`);
    }
  }
  
  const allowed = ['serial_number','model','manufacturer','type','name','unit','status','installed_at','last_maintenance','building_id','floor_id','room_id','x_coord','y_coord','x_percent','y_percent','map_id'];
  const payload = {};
  for (const k of allowed) if (sensor[k] !== undefined) payload[k] = sensor[k];
  if (Object.keys(payload).length === 0) return 0;
  const [result] = await db.query(`UPDATE sensor SET ? WHERE id = ?`, [payload, id]);
  return result.affectedRows;
}

// מחיקה
async function deleteSensor(id) {
  await ensureSensorTable();
  
  // Complete cascade deletion for sensor:
  // Sensor -> Plants -> Watering Schedules + Measurements
  
  // 1. Delete measurements for this sensor
  await db.query('DELETE FROM measurement WHERE sensor_id = ?', [id]);
  
  // 2. Get plants using this sensor and delete their watering schedules
  const [plants] = await db.query('SELECT id FROM plant WHERE sensor_id = ?', [id]);
  const plantIds = plants.map(p => p.id);
  
  if (plantIds.length > 0) {
    const plantPlaceholders = plantIds.map(() => '?').join(',');
    await db.query(`DELETE FROM watering_schedule WHERE plant_id IN (${plantPlaceholders})`, plantIds);
    await db.query(`DELETE FROM plant WHERE id IN (${plantPlaceholders})`, plantIds);
  }
  
  // 3. Finally delete the sensor
  const [result] = await db.query('DELETE FROM sensor WHERE id = ?', [id]);
  
  console.log(`Sensor ${id} deleted with cascade: ${plantIds.length} plants and their schedules + measurements`);
  return result.affectedRows;
}

module.exports = {
  getAllSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor
};
