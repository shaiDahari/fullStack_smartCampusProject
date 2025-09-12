const db = require('../config/db');

async function getAllRooms() {
  const [rows] = await db.query('SELECT * FROM room');
  return rows;
}

async function getRoomById(id) {
  const [rows] = await db.query('SELECT * FROM room WHERE id = ?', [id]);
  return rows[0];
}

async function createRoom({ name, room_type, floor_id }) {
  const [result] = await db.query(
    'INSERT INTO room (name, room_type, floor_id) VALUES (?, ?, ?)',
    [name, room_type, floor_id]
  );
  return { id: result.insertId, name, room_type, floor_id };
}

async function updateRoom(id, { name, room_type, floor_id }) {
  await db.query(
    'UPDATE room SET name = ?, room_type = ?, floor_id = ? WHERE id = ?',
    [name, room_type, floor_id, id]
  );
  return { id, name, room_type, floor_id };
}

async function deleteRoom(id) {
  const [result] = await db.query('DELETE FROM room WHERE id = ?', [id]);
  return result;
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
