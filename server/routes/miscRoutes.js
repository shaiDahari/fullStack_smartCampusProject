const express = require('express');
const router = express.Router();
const miscController = require('../controllers/miscController');

// Quick endpoints used by the frontend (initial simple versions)
router.get('/filter-sensors', miscController.filterSensors);
router.get('/plants', miscController.getPlants);
router.put('/plants/:id', miscController.updatePlant);
router.get('/measurements', miscController.getMeasurements);
router.delete('/measurements/:id', miscController.deleteMeasurement);
router.get('/maps', miscController.getMaps);
router.post('/maps', miscController.createMap);
router.delete('/maps/:id', miscController.deleteMap);
router.get('/watering-schedules', miscController.getWateringSchedules);
router.post('/watering-schedules', miscController.createWateringSchedule);

// Building and floor management (proxy to main controllers)
router.get('/buildings', miscController.getBuildings);
router.post('/buildings', miscController.createBuilding);
router.get('/floors', miscController.getFloors);
router.post('/floors', miscController.createFloor);

// Cleanup endpoint for orphaned data
router.post('/cleanup-orphaned-data', miscController.cleanupOrphanedData);

module.exports = router;
