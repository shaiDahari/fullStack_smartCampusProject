const buildingModel = require('../models/buildingModel');

async function getAllBuildings() {
  return await buildingModel.getAllBuildings();
}

async function getBuildingById(id) {
  return await buildingModel.getBuildingById(id);
}

async function createBuilding(building) {
  return await buildingModel.createBuilding(building);
}

async function updateBuilding(id, building) {
  return await buildingModel.updateBuilding(id, building);
}

async function deleteBuilding(id) {
  return await buildingModel.deleteBuilding(id);
}

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding
};
