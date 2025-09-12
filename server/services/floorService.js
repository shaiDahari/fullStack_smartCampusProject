const floorModel = require('../models/floorModel');

async function getAllFloors() {
  return await floorModel.getAllFloors();
}

async function getFloorById(id) {
  return await floorModel.getFloorById(id);
}

async function createFloor(floor) {
  return await floorModel.createFloor(floor);
}

async function updateFloor(id, floor) {
  return await floorModel.updateFloor(id, floor);
}

async function deleteFloor(id) {
  return await floorModel.deleteFloor(id);
}

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
};
