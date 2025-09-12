const miscModel = require('../models/miscModel');
const buildingController = require('./buildingController');
const floorController = require('./floorController');

async function filterSensors(req, res) {
  try {
    const { map_id } = req.query;
    const sensors = await miscModel.filterSensors({ map_id });
    res.json(sensors);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getPlants(req, res) {
  try {
    const plants = await miscModel.getPlants();
    res.json(plants);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function updatePlant(req, res) {
  try {
    const id = req.params.id;
    const updated = await miscModel.updatePlant(id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getMeasurements(req, res) {
  try {
    const { sort = '-timestamp', limit = 100, sensor_id } = req.query;
    const items = await miscModel.getMeasurements({ sort, limit: Number(limit), sensor_id });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getMaps(req, res) {
  try {
    const maps = await miscModel.getMaps();
    res.json(maps);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createMap(req, res) {
  try {
    const { name, image_base64, building_id, floor_id } = req.body;
    const id = await miscModel.createMap({ name, image_base64, building_id, floor_id });
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getWateringSchedules(req, res) {
  try {
    const { sort = '-created_date', limit = 100 } = req.query;
    const items = await miscModel.getWateringSchedules({ sort, limit: Number(limit) });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createWateringSchedule(req, res) {
  try {
    const id = await miscModel.createWateringSchedule(req.body);
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Building/Floor management proxy to main controllers
async function getBuildings(req, res) {
  try {
    // Ensure tables exist before calling building controller
    await miscModel.ensureTables();
    return buildingController.getAllBuildings(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createBuilding(req, res) {
  try {
    // Ensure tables exist before calling building controller
    await miscModel.ensureTables();
    return buildingController.createBuilding(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getFloors(req, res) {
  try {
    // Ensure tables exist before calling floor controller
    await miscModel.ensureTables();
    return floorController.getAllFloors(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createFloor(req, res) {
  try {
    // Ensure tables exist before calling floor controller
    await miscModel.ensureTables();
    return floorController.createFloor(req, res);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  filterSensors,
  getPlants,
  updatePlant,
  getMeasurements,
  getMaps,
  createMap,
  getWateringSchedules,
  createWateringSchedule,
  getBuildings,
  createBuilding,
  getFloors,
  createFloor,
};