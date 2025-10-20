const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function fixSensorLocation() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_campus',
    port: process.env.DB_PORT || 3306
  });

  try {
    // First check what tables exist
    console.log('=== Checking Database Tables ===');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:', tables);
    
    // Check sensor 23 current data
    console.log('\n=== Checking Sensor 23 Current Data ===');
    const [sensors] = await connection.execute('SELECT id, name, map_id, building_id, floor_id FROM sensor WHERE id = 23');
    const sensor = sensors[0];
    console.log('Sensor 23:', sensor);

    if (sensor?.map_id) {
      // Get the correct location from map_id
      const [maps] = await connection.execute('SELECT id, name, floor_id FROM map WHERE id = ?', [sensor.map_id]);
      const map = maps[0];
      console.log('Current map:', map);

      if (map?.floor_id) {
        const [floors] = await connection.execute('SELECT id, name, level, building_id FROM floor WHERE id = ?', [map.floor_id]);
        const floor = floors[0];
        console.log('Correct floor:', floor);

        if (floor?.building_id) {
          // Check if sensor location needs updating
          if (sensor.floor_id !== floor.id || sensor.building_id !== floor.building_id) {
            console.log('\n=== Location Mismatch Detected ===');
            console.log('Sensor has:', { building_id: sensor.building_id, floor_id: sensor.floor_id });
            console.log('Should have:', { building_id: floor.building_id, floor_id: floor.id });
            
            // Update sensor with correct location
            await connection.execute(
              'UPDATE sensor SET building_id = ?, floor_id = ? WHERE id = 23',
              [floor.building_id, floor.id]
            );
            
            console.log('✅ Updated sensor 23 location to match map location');
            
            // Verify update
            const [updatedSensors] = await connection.execute('SELECT id, name, map_id, building_id, floor_id FROM sensor WHERE id = 23');
            console.log('Updated sensor 23:', updatedSensors[0]);
          } else {
            console.log('✅ Sensor location is already correct');
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixSensorLocation();