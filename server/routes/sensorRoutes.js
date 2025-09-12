const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/', sensorController.getAll);
router.get('/:id', sensorController.getById);
router.post('/', sensorController.create);
router.put('/:id', sensorController.update);
router.delete('/:id', sensorController.remove);

module.exports = router;
