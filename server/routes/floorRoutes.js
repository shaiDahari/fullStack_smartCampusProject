const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');

router.get('/', floorController.getAllFloors);
router.get('/:id', floorController.getFloorById);
router.post('/', floorController.createFloor);
router.put('/:id', floorController.updateFloor);
router.delete('/:id', floorController.deleteFloor);

module.exports = router;
