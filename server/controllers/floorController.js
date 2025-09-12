const floorService = require('../services/floorService');

async function getAllFloors(req, res) {
  try {
    const floors = await floorService.getAllFloors();
    res.json(floors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getFloorById(req, res) {
  try {
    const floor = await floorService.getFloorById(req.params.id);
    res.json(floor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createFloor(req, res) {
  try {
    const newFloor = await floorService.createFloor(req.body);
    res.status(201).json(newFloor);
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function updateFloor(req, res) {
  try {
    const updatedFloor = await floorService.updateFloor(req.params.id, req.body);
    res.json(updatedFloor);
  } catch (error) {
    if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

async function deleteFloor(req, res) {
  try {
    const result = await floorService.deleteFloor(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
};
