const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS and JSON with increased size limit for image uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health
app.get('/', (req, res) => {
  res.json({ status: 'ok', name: 'Smart Campus API' });
});

// Routes
const buildingRoutes = require('./routes/buildingRoutes');
const userRoutes = require('./routes/userRoutes');
const floorRoutes = require('./routes/floorRoutes');
// rooms removed per request; keep file but do not mount
const sensorRoutes = require('./routes/sensorRoutes');
const miscRoutes = require('./routes/miscRoutes');

app.use('/api/buildings', buildingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api', miscRoutes); // plants, measurements, maps, watering-schedules, sensors/filter

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
