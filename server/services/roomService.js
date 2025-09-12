const roomModel = require('../models/roomModel');

async function getAllRooms() {
  const rooms = await roomModel.getAllRooms();
  return rooms;
}

async function getRoomById(id) {
  return await roomModel.getRoomById(id);
}

async function createRoom(room) {
  return await roomModel.createRoom(room);
}

async function updateRoom(id, room) {
  return await roomModel.updateRoom(id, room);
}

async function deleteRoom(id) {
  const result = await roomModel.deleteRoom(id);
  return result;
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
