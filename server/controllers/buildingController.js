const buildingService = require('../services/buildingService');

async function getAllBuildings(req, res) {
  try {
    const buildings = await buildingService.getAllBuildings();
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getBuildingById(req, res) {
  try {
    const building = await buildingService.getBuildingById(req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createBuilding(req, res) {
  try {
    const { name, address, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const newBuilding = await buildingService.createBuilding({ name, address, description });
    res.status(201).json(newBuilding);
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function updateBuilding(req, res) {
  try {
    const { name, address, description } = req.body;
    const updatedBuilding = await buildingService.updateBuilding(req.params.id, { name, address, description });
    res.json(updatedBuilding);
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function deleteBuilding(req, res) {
  try {
    const result = await buildingService.deleteBuilding(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding
};
