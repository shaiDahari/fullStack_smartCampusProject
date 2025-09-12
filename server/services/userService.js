const userModel = require('../models/userModel');

async function getAllUsers() {
  return await userModel.getAllUsers();
}

async function getUserById(id) {
  return await userModel.getUserById(id);
}

async function createUser(user) {
  return await userModel.createUser(user);
}

async function updateUser(id, user) {
  return await userModel.updateUser(id, user);
}

async function deleteUser(id) {
  return await userModel.deleteUser(id);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
