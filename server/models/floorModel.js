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
  await db.query('DELETE FROM floor WHERE id = ?', [id]);
  return { message: 'Floor deleted' };
}

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
};
