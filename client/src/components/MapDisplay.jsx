import { useState, useRef } from "react";
import { 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  MapPin
} from "lucide-react";

export default function MapDisplay({ 
  selectedMap, 
  sensors, 
  buildings, 
  floors, 
  maps,
  measurements, 
  plants,
  highlightedSensorId = null,
  readOnly = false,
  onMapClick = null,
  onSensorDrag = null,
  onSensorClick = null,
  sensorRefs = null,
  draggingSensor = null,
  smallSensors = false,
  className = ""
}) {
  const mapContainerRef = useRef(null);

  // Helper functions from MapView
  const getLatestMeasurementForSensor = (sensorId) => {
    return measurements.find(m => m.sensor_id === sensorId);
  };

  const getPlantForSensor = (sensorId) => {
    return plants.find(p => p.sensor_id === sensorId);
  };

  const getSensorStatus = (sensor) => {
    // Simple active/inactive logic based on sensor status field
    return sensor.status === 'active' ? 'active' : 'inactive';
  };

  const getSensorIcon = (sensor, isSmall = false) => {
    const status = getSensorStatus(sensor);
    const baseClasses = isSmall ? "w-4 h-4 p-1 rounded-full border-2" : "w-6 h-6 p-1.5 rounded-full border-2";
    
    // Get appropriate icon based on sensor type
    const SensorIcon = sensor.type === 'moisture' ? Droplets : Thermometer;
    
    switch(status) {
      case 'active':
        return <div className={`${baseClasses} bg-green-500 border-green-600 text-white`}>
          <SensorIcon className="w-full h-full" />
        </div>;
      case 'inactive':
        return <div className={`${baseClasses} bg-red-500 border-red-600 text-white`}>
          <SensorIcon className="w-full h-full" />
        </div>;
      default:
        return <div className={`${baseClasses} bg-gray-400 border-gray-500 text-white`}>
          <AlertTriangle className="w-full h-full" />
        </div>;
    }
  };

  const handleMapClick = (e) => {
    if (readOnly || !onMapClick) return;
    onMapClick(e);
  };

  const handleSensorMouseDown = (sensor, e) => {
    if (readOnly || !onSensorDrag) return;
    onSensorDrag(sensor, e);
  };

  const handleSensorClick = (sensor, e) => {
    if (readOnly) return;
    e.stopPropagation();
    if (onSensorClick) onSensorClick(sensor);
  };

  return (
    <div
      className={`relative w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 ${readOnly ? '' : 'cursor-crosshair'} ${className}`}
      style={{ height: '800px' }}
      ref={mapContainerRef}
      onClick={handleMapClick}
    >
      {selectedMap?.image_url ? (
        <img 
          src={selectedMap.image_url} 
          alt={selectedMap.name}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center p-8">
            <div className="p-6 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedMap?.name}</h3>
            <p className="text-gray-600 text-lg">תמונת מפה לא זמינה</p>
            <p className="text-gray-500 text-sm mt-2">העלה תמונת מפה כדי להציג את החיישנים</p>
          </div>
        </div>
      )}
      
      {/* Sensors Overlay */}
      {sensors.map((sensor) => {
        const measurement = getLatestMeasurementForSensor(sensor.id);
        const status = getSensorStatus(sensor);
        const isHighlighted = highlightedSensorId === sensor.id;
        
        return (
          <div
            key={sensor.id}
            ref={sensorRefs ? el => sensorRefs.current[sensor.id] = el : undefined}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${
              readOnly 
                ? (isHighlighted ? (smallSensors ? 'scale-125 z-50 animate-pulse' : 'scale-150 z-50 animate-pulse') : '') 
                : `cursor-move ${
                    draggingSensor === sensor.id 
                      ? 'scale-110 z-50' 
                      : 'hover:scale-125 transition-all duration-300'
                  }`
            } ${isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-75 rounded-full' : ''}`}
            style={{
              left: `${sensor.x_percent ?? sensor.location_x ?? Math.random() * 80 + 10}%`,
              top: `${sensor.y_percent ?? sensor.location_y ?? Math.random() * 80 + 10}%`
            }}
            onMouseDown={(e) => handleSensorMouseDown(sensor, e)}
            onClick={(e) => handleSensorClick(sensor, e)}
          >
            <div className="relative">
              {getSensorIcon(sensor, smallSensors)}
              
              {/* Sensor Info Tooltip - only show if not read-only */}
              {!readOnly && (
                <div className={`absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-3 rounded-lg text-sm whitespace-nowrap transition-all duration-300 pointer-events-none shadow-2xl backdrop-blur-sm ${
                  draggingSensor === sensor.id 
                    ? 'opacity-0' 
                    : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className="font-bold">{sensor.name || `חיישן #${sensor.id}`}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-300">מיקום:</span>
                    <span className="font-bold text-blue-300">
                      {(() => {
                        let buildingName = '';
                        let floorName = '';
                        let roomName = sensor.room_id || '';
                        
                        if (sensor.building_id && sensor.floor_id) {
                          const building = buildings.find(b => b.id === sensor.building_id);
                          const floor = floors.find(f => f.id === sensor.floor_id);
                          buildingName = building?.name || '';
                          floorName = floor?.name || (floor?.level ? `קומה ${floor.level}` : '');
                        } else if (sensor.map_id || selectedMap) {
                          const mapId = sensor.map_id || selectedMap.id;
                          const sensorMap = maps.find(m => Number(m.id) === Number(mapId));
                          if (sensorMap && sensorMap.floor_id) {
                            const floor = floors.find(f => Number(f.id) === Number(sensorMap.floor_id));
                            if (floor) {
                              const building = buildings.find(b => Number(b.id) === Number(floor.building_id));
                              buildingName = building?.name || '';
                              floorName = floor.name || (floor.level ? `קומה ${floor.level}` : '');
                            }
                          }
                        }
                        
                        const parts = [buildingName, floorName, roomName].filter(Boolean);
                        return parts.length ? parts.join(' › ') : 'לא מוקצה למפה';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-300">סטטוס:</span>
                    <span className="text-xs text-gray-300">
                      {sensor.status || 'פעיל'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Pulse Effect for Inactive Sensors */}
              {status === 'inactive' && (
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
              )}
              
              {/* Highlighted sensor special effects */}
              {isHighlighted && (
                <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-50"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}