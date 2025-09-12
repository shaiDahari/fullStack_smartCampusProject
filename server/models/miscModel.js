const db = require('../config/db');

// Ensure tables exist (simple bootstrap). Images saved as base64 text.
async function ensureTables() {
  // Building table
  await db.query(`CREATE TABLE IF NOT EXISTS building (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NULL,
    description TEXT NULL,
    slug VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add slug column if it doesn't exist
  await ensureColumn('building', 'slug', 'VARCHAR(255) NULL');
  
  // Create unique index on slug
  try {
    await db.query(`CREATE UNIQUE INDEX idx_building_slug ON building (slug)`);
  } catch (error) {
    // Index might already exist, ignore error
    if (!error.message.includes('Duplicate key name')) {
      console.warn('Warning creating building slug index:', error.message);
    }
  }

  // Floor table
  await db.query(`CREATE TABLE IF NOT EXISTS floor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    building_id INT NOT NULL,
    level INT NULL,
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create unique index on building_id and level
  try {
    await db.query(`CREATE UNIQUE INDEX idx_floor_building_level ON floor (building_id, level)`);
  } catch (error) {
    // Index might already exist, ignore error
    if (!error.message.includes('Duplicate key name')) {
      console.warn('Warning creating floor uniqueness index:', error.message);
    }
  }

  await db.query(`CREATE TABLE IF NOT EXISTS map (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_base64 LONGTEXT NULL,
    building_id INT NULL,
    floor_id INT NULL
  )`);

  // Ensure columns exist in case table was created earlier without them
  async function ensureColumn(table, column, definition) {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (cols.length === 0) {
      await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
  await ensureColumn('map', 'building_id', 'INT NULL');
  await ensureColumn('map', 'floor_id', 'INT NULL');

  await db.query(`CREATE TABLE IF NOT EXISTS plant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    species VARCHAR(255) NOT NULL,
    sensor_id INT NULL,
    watering_threshold INT DEFAULT 30,
    last_watered DATETIME NULL,
    location_description VARCHAR(255) NULL,
    notes TEXT NULL
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS measurement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(16) DEFAULT '%',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS watering_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id INT NOT NULL,
    trigger_type VARCHAR(32) NOT NULL,
    triggered_by VARCHAR(64) NULL,
    duration_minutes INT DEFAULT 5,
    notes TEXT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed minimal demo data if empty
  // Ensure sensor table exists as well for joins
  await db.query(`CREATE TABLE IF NOT EXISTS sensor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_number VARCHAR(255), model VARCHAR(255), manufacturer VARCHAR(255),
    type VARCHAR(64), name VARCHAR(255), unit VARCHAR(32), status VARCHAR(32),
    installed_at DATETIME NULL, last_maintenance DATETIME NULL,
    room_id INT NULL, x_coord DECIMAL(10,2) NULL, y_coord DECIMAL(10,2) NULL,
    x_percent DECIMAL(5,2) NULL, y_percent DECIMAL(5,2) NULL,
    map_id INT NULL
  )`);
  await ensureColumn('sensor', 'map_id', 'INT NULL');
  await ensureColumn('sensor', 'x_percent', 'DECIMAL(5,2) NULL');
  await ensureColumn('sensor', 'y_percent', 'DECIMAL(5,2) NULL');

  const [[{ cntMaps }]] = await db.query('SELECT COUNT(*) as cntMaps FROM map');
  if (cntMaps === 0) {
    // Remove demo data - let users create their own maps
  }

  const [[{ cntSensors }]] = await db.query('SELECT COUNT(*) as cntSensors FROM sensor');
  if (cntSensors === 0) {
    // Remove demo data - let users create their own sensors
  }

  const [[{ cntPlants }]] = await db.query('SELECT COUNT(*) as cntPlants FROM plant');
  if (cntPlants === 0) {
    // Remove demo data - let users create their own plants
  }

  const [[{ cntMeas }]] = await db.query('SELECT COUNT(*) as cntMeas FROM measurement');
  if (cntMeas === 0) {
    // Remove demo data - measurements will come from real sensors
  }
}

async function filterSensors({ map_id }) {
  // If sensors table has x_percent/y_percent and optional map_id column
  await ensureTables();
  if (!map_id) {
    const [rows] = await db.query('SELECT * FROM sensor');
    return rows.map(s => ({
      ...s,
      location_x: s.x_percent ?? s.x_coord,
      location_y: s.y_percent ?? s.y_coord,
    }));
  }
  // allow missing map_id column by ignoring filter if column not found
  try {
    const [rows] = await db.query('SELECT * FROM sensor WHERE map_id = ?', [map_id]);
    return rows.map(s => ({
      ...s,
      location_x: s.x_percent ?? s.x_coord,
      location_y: s.y_percent ?? s.y_coord,
    }));
  } catch (e) {
    const [rows] = await db.query('SELECT * FROM sensor');
    return rows.map(s => ({
      ...s,
      location_x: s.x_percent ?? s.x_coord,
      location_y: s.y_percent ?? s.y_coord,
    }));
  }
}

async function getPlants() {
  await ensureTables();
  const [rows] = await db.query('SELECT * FROM plant');
  return rows;
}

async function updatePlant(id, data) {
  await ensureTables();
  // Only allow subset
  const allowed = ['species', 'sensor_id', 'watering_threshold', 'last_watered', 'location_description', 'notes'];
  const payload = {};
  for (const k of allowed) if (data[k] !== undefined) payload[k] = data[k];
  if (Object.keys(payload).length === 0) return { id: Number(id) };
  await db.query('UPDATE plant SET ? WHERE id = ?', [payload, id]);
  const [rows] = await db.query('SELECT * FROM plant WHERE id = ?', [id]);
  return rows[0] || { id: Number(id), ...payload };
}

async function getMeasurements({ sort = '-timestamp', limit = 100, sensor_id }) {
  await ensureTables();
  const order = sort.startsWith('-') ? 'DESC' : 'ASC';
  const col = sort.replace(/^[-+]/, '') || 'timestamp';
  let rows;
  if (sensor_id) {
    [rows] = await db.query(
      `SELECT * FROM measurement WHERE sensor_id = ? ORDER BY ${col} ${order} LIMIT ?`,
      [sensor_id, limit]
    );
  } else {
    [rows] = await db.query(`SELECT * FROM measurement ORDER BY ${col} ${order} LIMIT ?`, [limit]);
  }
  return rows;
}

async function getMaps() {
  await ensureTables();
  const [rows] = await db.query('SELECT id, name, image_base64, building_id, floor_id FROM map');
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    image_url: r.image_base64 ? `data:image/png;base64,${r.image_base64}` : null,
    building_id: r.building_id,
    floor_id: r.floor_id,
  }));
}

async function createMap({ name, image_base64, building_id = null, floor_id = null }) {
  await ensureTables();
  const [result] = await db.query('INSERT INTO map (name, image_base64, building_id, floor_id) VALUES (?, ?, ?, ?)', [name, image_base64 || null, building_id, floor_id]);
  return result.insertId;
}

async function getWateringSchedules({ sort = '-created_date', limit = 100 }) {
  await ensureTables();
  const order = sort.startsWith('-') ? 'DESC' : 'ASC';
  const col = sort.replace(/^[-+]/, '') || 'created_date';
  const [rows] = await db.query(`SELECT * FROM watering_schedule ORDER BY ${col} ${order} LIMIT ?`, [limit]);
  return rows;
}

async function createWateringSchedule(data) {
  await ensureTables();
  const { plant_id, trigger_type, triggered_by, duration_minutes = 5, notes } = data;
  const [result] = await db.query(
    'INSERT INTO watering_schedule (plant_id, trigger_type, triggered_by, duration_minutes, notes) VALUES (?, ?, ?, ?, ?)',
    [plant_id, trigger_type || 'manual', triggered_by || 'user', duration_minutes, notes || null]
  );
  return result.insertId;
}

module.exports = {
  ensureTables,
  filterSensors,
  getPlants,
  updatePlant,
  getMeasurements,
  getMaps,
  createMap,
  getWateringSchedules,
  createWateringSchedule,
};
