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
  await db.query('DELETE FROM building WHERE id = ?', [id]);
  return { message: `Building with ID ${id} deleted.` };
}

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding
};
