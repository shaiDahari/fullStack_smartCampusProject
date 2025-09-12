const sensorModel = require('../models/sensorModel');

async function getAll(req, res) {
  const sensors = await sensorModel.getAllSensors();
  res.json(sensors);
}

async function getById(req, res) {
  const sensor = await sensorModel.getSensorById(req.params.id);
  if (!sensor) return res.status(404).json({ message: 'Sensor not found' });
  res.json(sensor);
}

async function create(req, res) {
  const newId = await sensorModel.createSensor(req.body);
  res.status(201).json({ id: newId });
}

async function update(req, res) {
  const affected = await sensorModel.updateSensor(req.params.id, req.body);
  if (!affected) return res.status(404).json({ message: 'Sensor not found' });
  res.json({ message: 'Sensor updated' });
}

async function remove(req, res) {
  const deleted = await sensorModel.deleteSensor(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Sensor not found' });
  res.json({ message: 'Sensor deleted' });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
