const miscModel = require('../models/miscModel');
const buildingController = require('./buildingController');
const floorController = require('./floorController');
const db = require('../config/db');

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

async function deleteMap(req, res) {
  try {
    await miscModel.ensureTables();
    const { id } = req.params;
    
    // Cascade delete: get sensors for this map, then delete their measurements, plants, watering schedules
    const [sensors] = await db.query('SELECT id FROM sensor WHERE map_id = ?', [id]);
    const sensorIds = sensors.map(s => s.id);
    
    if (sensorIds.length > 0) {
      const sensorPlaceholders = sensorIds.map(() => '?').join(',');
      
      // Delete measurements for these sensors
      await db.query(`DELETE FROM measurement WHERE sensor_id IN (${sensorPlaceholders})`, sensorIds);
      
      // Get plants for these sensors and delete their watering schedules
      const [plants] = await db.query(`SELECT id FROM plant WHERE sensor_id IN (${sensorPlaceholders})`, sensorIds);
      const plantIds = plants.map(p => p.id);
      
      if (plantIds.length > 0) {
        const plantPlaceholders = plantIds.map(() => '?').join(',');
        await db.query(`DELETE FROM watering_schedule WHERE plant_id IN (${plantPlaceholders})`, plantIds);
        await db.query(`DELETE FROM plant WHERE id IN (${plantPlaceholders})`, plantIds);
      }
      
      // Delete sensors
      await db.query(`DELETE FROM sensor WHERE map_id = ?`, [id]);
    }
    
    // Finally delete the map
    await db.query('DELETE FROM map WHERE id = ?', [id]);
    
    res.json({ 
      message: `Map deleted along with ${sensorIds.length} sensors and related data.`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deleteMeasurement(req, res) {
  try {
    await miscModel.ensureTables();
    const { id } = req.params;
    await db.query('DELETE FROM measurement WHERE id = ?', [id]);
    res.json({ message: 'Measurement deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function cleanupOrphanedData(req, res) {
  try {
    await miscModel.ensureTables();
    let cleanupResults = {};
    
    // Delete orphaned measurements (measurements with non-existent sensor_id)
    const [measurementResult] = await db.query(`
      DELETE m FROM measurement m 
      LEFT JOIN sensor s ON m.sensor_id = s.id 
      WHERE s.id IS NULL
    `);
    cleanupResults.orphanedMeasurements = measurementResult.affectedRows;
    
    // Delete orphaned maps (maps with non-existent floor_id)
    const [mapResult] = await db.query(`
      DELETE m FROM map m 
      LEFT JOIN floor f ON m.floor_id = f.id 
      WHERE m.floor_id IS NOT NULL AND f.id IS NULL
    `);
    cleanupResults.orphanedMaps = mapResult.affectedRows;
    
    // Delete orphaned sensors (sensors with non-existent map_id)
    const [sensorResult] = await db.query(`
      DELETE s FROM sensor s 
      LEFT JOIN map m ON s.map_id = m.id 
      WHERE s.map_id IS NOT NULL AND m.id IS NULL
    `);
    cleanupResults.orphanedSensors = sensorResult.affectedRows;
    
    res.json({ 
      message: 'Orphaned data cleanup completed',
      results: cleanupResults
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = {
  filterSensors,
  getPlants,
  updatePlant,
  getMeasurements,
  deleteMeasurement,
  getMaps,
  createMap,
  deleteMap,
  getWateringSchedules,
  createWateringSchedule,
  getBuildings,
  createBuilding,
  getFloors,
  createFloor,
  cleanupOrphanedData,
};