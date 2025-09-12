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
  const [result] = await db.query('DELETE FROM sensor WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = {
  getAllSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor
};
