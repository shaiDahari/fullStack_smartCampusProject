const db = require('../config/db');

async function getAllUsers() {
  const [rows] = await db.query('SELECT * FROM `user`');
  return rows;
}

async function getUserById(id) {
  const [rows] = await db.query('SELECT * FROM `user` WHERE id = ?', [id]);
  return rows[0];
}

async function createUser(user) {
  const { username, password, email, phone, role } = user;
  const [result] = await db.query(
    'INSERT INTO `user` (username, password, email, phone, role) VALUES (?, ?, ?, ?, ?)',
    [username, password, email, phone, role]
  );
  return { id: result.insertId, ...user };
}

async function updateUser(id, user) {
  const { username, password, email, phone, role } = user;
  await db.query(
    'UPDATE `user` SET username = ?, password = ?, email = ?, phone = ?, role = ? WHERE id = ?',
    [username, password, email, phone, role, id]
  );
  return { id, ...user };
}

async function deleteUser(id) {
  await db.query('DELETE FROM `user` WHERE id = ?', [id]);
  return { message: 'User deleted' };
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
