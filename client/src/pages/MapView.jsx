
import { useState, useEffect, useRef } from "react";
import { entities } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import MapDisplay from "@/components/MapDisplay";
import { 
  Map, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  MapPin,
  RefreshCw,
  RadioTower,
  Activity,
  TrendingUp,
  Building2,
  Layers3,
  Plus,
  Eye,
  Trash2,
  Edit3
} from "lucide-react";

export default function MapView() {
  const [maps, setMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [sensors, setSensors] = useState([]);
  const [plants, setPlants] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [addingSensor, setAddingSensor] = useState(false);
  const [showSensorForm, setShowSensorForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [awaitingPlacement, setAwaitingPlacement] = useState(false);
  const [pendingSensorData, setPendingSensorData] = useState(null);
  const [newSensorForm, setNewSensorForm] = useState({ 
    name: '', 
    type: '',
    room_id: '',
    status: 'active'
  });
  // Map drag state
  const mapContainerRef = useRef(null);
  const sensorRefs = useRef({});
  const [draggingSensor, setDraggingSensor] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cachedRect, setCachedRect] = useState(null);
  const dragRafId = useRef(null);

  // Helper function to get unit based on sensor type
  const getSensorUnit = (type) => {
    switch (type) {
      case 'moisture':
        return '%';
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'light':
        return 'lux';
      default:
        return '';
    }
  };

  // New map form state (kept for backward compatibility)
  const [newMap, setNewMap] = useState({ name: "", building_id: "", floor_id: "", image_base64: "" });
  const [savingMap, setSavingMap] = useState(false);
  
  // Infrastructure creation wizard
  const [showInfraWizard, setShowInfraWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1=Building, 2=Floor, 3=Map
  const [wizardData, setWizardData] = useState({
    building: { name: "" },
    floor: { name: "", level: "" },
    map: { name: "", image_base64: "" }
  });
  const [createdBuilding, setCreatedBuilding] = useState(null);
  const [createdFloor, setCreatedFloor] = useState(null);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [deletingSensorId, setDeletingSensorId] = useState(null);
  const { toast } = useToast();

  // Handle building selection
  const handleBuildingChange = (buildingId) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId(""); // Clear floor selection
    setSelectedMapId(""); // Clear map
    
    // Auto-select first floor if available
    const buildingFloors = floors.filter(floor => floor.building_id && floor.building_id.toString() === buildingId);
    if (buildingFloors.length > 0) {
      const firstFloor = buildingFloors[0];
      setSelectedFloorId(firstFloor.id.toString());
      
      // Auto-select map for first floor if available
      const floorMap = maps.find(map => map.floor_id && map.floor_id.toString() === firstFloor.id.toString());
      if (floorMap) {
        setSelectedMapId(floorMap.id.toString());
      }
    }
  };

  // Handle floor selection
  const handleFloorChange = (floorId) => {
    setSelectedFloorId(floorId);
    // Find map for this floor
    const floorMap = maps.find(map => map.floor_id && map.floor_id.toString() === floorId);
    if (floorMap) {
      setSelectedMapId(floorMap.id.toString());
    } else {
      setSelectedMapId(""); // No map for this floor
    }
  };

  // Get floors for selected building
  const getFloorsForBuilding = () => {
    if (!selectedBuildingId) return [];
    return floors.filter(floor => floor.building_id && floor.building_id.toString() === selectedBuildingId);
  };

  useEffect(() => {
    loadMapsAndData();
  }, []);

  useEffect(() => {
    if (selectedMapId) {
      loadSensorsForMap(selectedMapId);
      // Save selection to localStorage
      localStorage.setItem('mapview-selected-map', selectedMapId);
      localStorage.setItem('mapview-selected-building', selectedBuildingId);
      localStorage.setItem('mapview-selected-floor', selectedFloorId);
    }
  }, [selectedMapId, selectedBuildingId, selectedFloorId]);

  // Restore saved selection after data loads
  useEffect(() => {
    if (maps.length > 0 && buildings.length > 0 && floors.length > 0) {
      const savedMapId = localStorage.getItem('mapview-selected-map');
      const savedBuildingId = localStorage.getItem('mapview-selected-building');
      const savedFloorId = localStorage.getItem('mapview-selected-floor');
      
      if (savedMapId && savedBuildingId && savedFloorId) {
        // Verify the saved IDs still exist
        const mapExists = maps.find(m => m.id.toString() === savedMapId);
        const buildingExists = buildings.find(b => b.id.toString() === savedBuildingId);
        const floorExists = floors.find(f => f.id.toString() === savedFloorId);
        
        if (mapExists && buildingExists && floorExists) {
          setSelectedMapId(savedMapId);
          setSelectedBuildingId(savedBuildingId);
          setSelectedFloorId(savedFloorId);
        }
      }
    }
  }, [maps, buildings, floors]);

  const loadMapsAndData = async () => {
    setLoading(true);
    try {
      const [mapsData, plantsData, measurementsData, buildingsData, floorsData] = await Promise.all([
        entities.Map.list(),
        entities.Plant.list(),
        entities.Measurement.list("-timestamp", 100),
        entities.Building.list(),
        entities.Floor.list()
      ]);
      
      
      setMaps(mapsData);
      setPlants(plantsData);
      setMeasurements(measurementsData);
      setBuildings(buildingsData);
      setFloors(floorsData);
    } catch (error) {
      console.error("Error loading maps data:", error);
    }
    setLoading(false);
  };

  const loadSensorsForMap = async (mapId) => {
    try {
      const sensorsData = await entities.Sensor.filter({ map_id: Number(mapId) });
      setSensors(sensorsData);
    } catch (error) {
      console.error("Error loading sensors for map:", error);
    }
  };

  const handleNewMapFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setNewMap((m) => ({ ...m, image_base64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateMap = async () => {
    if (!newMap.name) return;
    setSavingMap(true);
    try {
      await entities.Map.create({
        name: newMap.name,
        image_base64: newMap.image_base64 || null,
        building_id: newMap.building_id ? Number(newMap.building_id) : null,
        floor_id: newMap.floor_id ? Number(newMap.floor_id) : null,
      });
      setNewMap({ name: "", building_id: "", floor_id: "", image_base64: "" });
      await loadMapsAndData();
    } catch (e) {
      console.error("Failed creating map", e);
    }
    setSavingMap(false);
  };


  // Infrastructure wizard handlers
  const handleWizardStep1 = async () => {
    if (!wizardData.building.name.trim()) return;
    setWizardSaving(true);
    try {
      const building = await entities.Building.create({ name: wizardData.building.name.trim() });
      setCreatedBuilding(building);
      setWizardStep(2);
      toast({
        title: "בניין נוצר בהצלחה",
        description: `בניין "${wizardData.building.name}" נוצר. כעת צור קומה עבורו.`,
      });
    } catch (e) {
      console.error("Failed creating building", e);
      toast({
        title: "שגיאה ביצירת בניין",
        description: "לא ניתן ליצור את הבניין. נסה שוב.",
        variant: "destructive",
      });
    }
    setWizardSaving(false);
  };

  const handleWizardStep2 = async () => {
    if (!wizardData.floor.name.trim() || !createdBuilding) return;
    setWizardSaving(true);
    try {
      const floor = await entities.Floor.create({
        name: wizardData.floor.name.trim(),
        building_id: createdBuilding.id,
        level: wizardData.floor.level ? Number(wizardData.floor.level) : null,
      });
      setCreatedFloor(floor);
      setWizardStep(3);
      toast({
        title: "קומה נוצרה בהצלחה",
        description: `קומה "${wizardData.floor.name}" נוצרה. כעת צור מפה עבור הקומה.`,
      });
    } catch (e) {
      console.error("Failed creating floor", e);
      toast({
        title: "שגיאה ביצירת קומה",
        description: "לא ניתן ליצור את הקומה. נסה שוב.",
        variant: "destructive",
      });
    }
    setWizardSaving(false);
  };

  const handleWizardStep3 = async () => {
    if (!wizardData.map.name.trim() || !createdBuilding || !createdFloor) return;
    setWizardSaving(true);
    try {
      console.log('createdBuilding:', createdBuilding);
      console.log('createdFloor:', createdFloor);
      
      await entities.Map.create({
        name: wizardData.map.name.trim(),
        image_base64: wizardData.map.image_base64 || null,
        building_id: createdBuilding.id,
        floor_id: createdFloor.id,
      });
      
      toast({
        title: "תשתית נוצרה בהצלחה!",
        description: `בניין "${createdBuilding.name}" עם קומה "${createdFloor.name}" ומפה "${wizardData.map.name}" נוצרו.`,
      });
      
      // Reset wizard and reload data
      setShowInfraWizard(false);
      setWizardStep(1);
      setWizardData({
        building: { name: "" },
        floor: { name: "", level: "" },
        map: { name: "", image_base64: "" }
      });
      setCreatedBuilding(null);
      setCreatedFloor(null);
      await loadMapsAndData();
    } catch (e) {
      console.error("Failed creating map", e);
      toast({
        title: "שגיאה ביצירת מפה",
        description: `שגיאה: ${e.message || 'לא ניתן ליצור את המפה'}`,
        variant: "destructive",
      });
    }
    setWizardSaving(false);
  };

  const handleWizardMapFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setWizardData(prev => ({
        ...prev,
        map: { ...prev.map, image_base64: base64 }
      }));
    };
    reader.readAsDataURL(file);
  };

  const onMapClick = async (e) => {
    if (!awaitingPlacement || !mapContainerRef.current || !pendingSensorData) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    try {
      const finalSensorData = {
        ...pendingSensorData,
        x_percent: x,
        y_percent: y,
      };

      const created = await entities.Sensor.create(finalSensorData);
      const newId = created?.id || created?.insertId || created;
      
      // Add the sensor to local state
      setSensors((prev) => [
        ...prev,
        { 
          id: newId, 
          ...finalSensorData,
        },
      ]);
      
      toast({
        title: "חיישן נוצר בהצלחה",
        description: `החיישן "${pendingSensorData.name}" נוסף למפה`,
      });

      // Reset states
      setPendingSensorData(null);
      setAwaitingPlacement(false);
      setNewSensorForm({ name: '', type: '', room_id: '', status: 'active' });
    } catch (err) {
      console.error('Failed to create sensor', err);
      toast({
        title: "שגיאה ביצירת החיישן",
        description: "לא ניתן ליצור את החיישן. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const handleSensorFormSubmit = async () => {
    if (!newSensorForm.name || !newSensorForm.type) return;
    
    if (editingSensor) {
      // Handle editing existing sensor
      try {
        const updateData = {
          name: newSensorForm.name,
          type: newSensorForm.type,
          unit: getSensorUnit(newSensorForm.type),
          status: newSensorForm.status,
          room_id: newSensorForm.room_id || null,
        };

        await entities.Sensor.update(editingSensor.id, updateData);
        
        // Update local state
        setSensors(prev => prev.map(s => 
          s.id === editingSensor.id ? { ...s, ...updateData } : s
        ));

        // Update selected sensor if it's the one being edited
        if (selectedSensor?.id === editingSensor.id) {
          setSelectedSensor({ ...selectedSensor, ...updateData });
        }
        
        toast({
          title: "חיישן עודכן בהצלחה",
          description: "פרטי החיישן נשמרו במערכת",
        });

        // Reset form
        setNewSensorForm({ name: '', type: '', room_id: '', status: 'active' });
        setShowSensorForm(false);
        setEditingSensor(null);
      } catch (err) {
        console.error('Failed to update sensor', err);
        toast({
          title: "שגיאה בעדכון החיישן",
          description: "לא ניתן לעדכן את החיישן. נסה שוב מאוחר יותר.",
          variant: "destructive",
        });
      }
    } else {
      // Handle creating new sensor - auto-inherit building/floor from selected map
      const currentMap = maps.find(m => m.id.toString() === selectedMapId);
      
      const sensorData = {
        name: newSensorForm.name,
        type: newSensorForm.type,
        unit: getSensorUnit(newSensorForm.type),
        status: newSensorForm.status,
        map_id: Number(selectedMapId),
        building_id: currentMap?.building_id || null,
        floor_id: currentMap?.floor_id || null,
        room_id: newSensorForm.room_id || null,
      };

      setPendingSensorData(sensorData);
      setShowSensorForm(false);
      setAwaitingPlacement(true);
    }
  };

  const handleDeleteSensor = async (sensorId) => {
    try {
      setDeletingSensorId(sensorId);
      await entities.Sensor.delete(sensorId);
      
      // Remove sensor from local state
      setSensors(sensors.filter(s => s.id !== sensorId));
      
      // Clear selected sensor if it was deleted
      if (selectedSensor?.id === sensorId) {
        setSelectedSensor(null);
      }
      
      toast({
        title: "חיישן נמחק בהצלחה",
        description: "החיישן הוסר מהמערכת והמפה",
      });
    } catch (error) {
      console.error('Error deleting sensor:', error);
      toast({
        title: "שגיאה במחיקת החיישן",
        description: "לא ניתן למחוק את החיישן. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setDeletingSensorId(null);
    }
  };

  // Original drag handlers
  const onStartDrag = (sensor, e) => {
    if (!mapContainerRef.current) return;
    e.preventDefault();
    const rect = mapContainerRef.current.getBoundingClientRect();
    setCachedRect(rect);
    
    // Get the actual sensor element position (center point due to transform translate)
    const sensorElement = sensorRefs.current[sensor.id];
    if (sensorElement) {
      const sensorRect = sensorElement.getBoundingClientRect();
      const sensorCenterX = sensorRect.left + sensorRect.width / 2;
      const sensorCenterY = sensorRect.top + sensorRect.height / 2;
      setDragOffset({ x: e.clientX - sensorCenterX, y: e.clientY - sensorCenterY });
      
      // Set initial position to prevent jump on first move
      const initialX = ((e.clientX - rect.left) / rect.width) * 100;
      const initialY = ((e.clientY - rect.top) / rect.height) * 100;
      sensorElement.style.left = `${initialX}%`;
      sensorElement.style.top = `${initialY}%`;
    } else {
      // Fallback if ref not available
      const currentX = ((sensor.location_x ?? Math.random() * 80 + 10) / 100) * rect.width + rect.left;
      const currentY = ((sensor.location_y ?? Math.random() * 80 + 10) / 100) * rect.height + rect.top;
      setDragOffset({ x: e.clientX - currentX, y: e.clientY - currentY });
    }
    
    setDraggingSensor(sensor.id);
  };

  const onMapMouseMove = (e) => {
    if (!draggingSensor || !cachedRect) return;
    e.preventDefault();
    
    // Direct DOM manipulation for instant visual feedback
    const sensorElement = sensorRefs.current[draggingSensor];
    if (sensorElement) {
      const x = ((e.clientX - dragOffset.x - cachedRect.left) / cachedRect.width) * 100;
      const y = ((e.clientY - dragOffset.y - cachedRect.top) / cachedRect.height) * 100;
      
      // Cancel previous animation frame to prevent stacking
      if (dragRafId.current) {
        cancelAnimationFrame(dragRafId.current);
      }
      
      // Use requestAnimationFrame for smoother updates during fast movement
      dragRafId.current = requestAnimationFrame(() => {
        if (sensorElement && draggingSensor) {
          sensorElement.style.left = `${x}%`;
          sensorElement.style.top = `${y}%`;
          dragRafId.current = null;
        }
      });
    }
  };

  const onStopDrag = async () => {
    if (!draggingSensor) return;
    
    const sensorElement = sensorRefs.current[draggingSensor];
    if (sensorElement) {
      // Get final position from DOM
      const finalX = parseFloat(sensorElement.style.left) || 0;
      const finalY = parseFloat(sensorElement.style.top) || 0;
      
      // Call the provided drag end handler
      await handleDragEnd(draggingSensor, finalX, finalY);
    }
    
    setDraggingSensor(null);
    setDragOffset({ x: 0, y: 0 });
    cachedRect.current = null;
  };

  // Drag end handler for MapView - saves to API and updates local state
  const handleDragEnd = async (sensorId, finalX, finalY) => {
    // Update React state with final position
    setSensors((prev) => {
      const newSensors = [...prev];
      const sensorIndex = newSensors.findIndex(s => s.id === sensorId);
      if (sensorIndex !== -1) {
        newSensors[sensorIndex] = { ...newSensors[sensorIndex], location_x: finalX, location_y: finalY };
      }
      return newSensors;
    });

    // Clear selection after drag to allow tooltip to reappear
    setSelectedSensor(null);

    // Save to database
    try {
      await entities.Sensor.update(sensorId, { 
        x_percent: finalX, 
        y_percent: finalY, 
        map_id: selectedMapId 
      });
    } catch (err) {
      console.error('Failed to update sensor position', err);
    }
  };


  const getLatestMeasurementForSensor = (sensorId) => {
    return measurements.find(m => m.sensor_id === sensorId);
  };

  const getPlantForSensor = (sensorId) => {
    return plants.find(p => p.sensor_id === sensorId);
  };

  const getSensorStatus = (sensor) => {
    const measurement = getLatestMeasurementForSensor(sensor.id);
    const plant = getPlantForSensor(sensor.id);
    
    if (!measurement) return 'offline';
    if (sensor.type === 'moisture' && plant) {
      return measurement.value < plant.watering_threshold ? 'critical' : 'good';
    }
    return 'good';
  };

  const getSensorIcon = (sensor) => {
    const status = getSensorStatus(sensor);
    const baseClasses = "w-6 h-6 p-1.5 rounded-full border-2";
    
    switch(status) {
      case 'critical':
        return sensor.type === 'moisture' ? 
          <div className={`${baseClasses} bg-red-500 border-red-600 text-white`}>
            <Droplets className="w-full h-full" />
          </div> :
          <div className={`${baseClasses} bg-orange-500 border-orange-600 text-white`}>
            <Thermometer className="w-full h-full" />
          </div>;
      case 'good':
        return sensor.type === 'moisture' ?
          <div className={`${baseClasses} bg-blue-500 border-blue-600 text-white`}>
            <Droplets className="w-full h-full" />
          </div> :
          <div className={`${baseClasses} bg-green-500 border-green-600 text-white`}>
            <Thermometer className="w-full h-full" />
          </div>;
      default:
        return <div className={`${baseClasses} bg-gray-400 border-gray-500 text-white`}>
          <AlertTriangle className="w-full h-full" />
        </div>;
    }
  };

  const selectedMap = maps.find(m => m.id.toString() === selectedMapId);
  
  // Dashboard Statistics
  const totalSensors = sensors.length;
  const activeSensors = sensors.filter(s => getSensorStatus(s) !== 'offline').length;
  const criticalSensors = sensors.filter(s => getSensorStatus(s) === 'critical').length;
  const goodSensors = sensors.filter(s => getSensorStatus(s) === 'good').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-blue-700 bg-clip-text text-transparent">
                מפת קמפוס חכם
              </h1>
              <p className="text-gray-600 text-lg">לוח בקרה מתקדם לניהול ומעקב אחר חיישני הקמפוס</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Building Selector */}
              <div className="relative">
                <select 
                  value={selectedBuildingId || ""} 
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-48 h-12 bg-white/70 backdrop-blur-sm border-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-colors rounded-md px-3 pr-10 text-right shadow-sm appearance-none cursor-pointer"
                  dir="rtl"
                >
                  <option value="" disabled>בחר בניין</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id.toString()}>
                      {building.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              
              {/* Floor Selector */}
              <div className="relative">
                <select 
                  value={selectedFloorId || ""} 
                  onChange={(e) => handleFloorChange(e.target.value)}
                  disabled={!selectedBuildingId}
                  className="w-48 h-12 bg-white/70 backdrop-blur-sm border-2 border-emerald-200 hover:border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-colors rounded-md px-3 pr-10 text-right shadow-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="" disabled>בחר קומה</option>
                  {getFloorsForBuilding().map((floor) => (
                    <option key={floor.id} value={floor.id.toString()}>
                      {floor.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center">
                  <Layers3 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => loadMapsAndData()}
                className="h-12 px-6 bg-white/70 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                רענן נתונים
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">סה&ldquo;כ חיישנים</p>
                  <p className="text-3xl font-bold">{totalSensors}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <RadioTower className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">חיישנים פעילים</p>
                  <p className="text-3xl font-bold">{activeSensors}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">דורש תשומת לב</p>
                  <p className="text-3xl font-bold">{criticalSensors}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">במצב תקין</p>
                  <p className="text-3xl font-bold">{goodSensors}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Map Section - Takes 3 out of 4 columns */}
          <div className="lg:col-span-3">
            <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-[36rem] lg:h-[1000px] overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Map className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">
                      {selectedFloorId ? 
                        `${buildings.find(b => b.id.toString() === selectedBuildingId)?.name || ''} - ${getFloorsForBuilding().find(f => f.id.toString() === selectedFloorId)?.name || ''}` : 
                        "מפת קמפוס"}
                    </div>
                    <div className="text-sm opacity-90 font-normal">תצוגה אינטראקטיבית עם חיישנים בזמן אמת</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full relative">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="space-y-6 w-full max-w-md text-center">
                      <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                      <Skeleton className="h-8 w-48 mx-auto" />
                      <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                  </div>
                ) : selectedFloorId && !selectedMap ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center p-8">
                      <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                        <MapPin className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">No map assigned to this floor</h3>
                      <p className="text-gray-600 text-lg">Upload a map for this floor to view sensors</p>
                    </div>
                  </div>
                ) : selectedMap ? (
                  <div
                    ref={mapContainerRef}
                    onMouseMove={onMapMouseMove}
                    onMouseUp={() => onStopDrag(handleDragEnd)}
                  >
                    <MapDisplay
                      selectedMap={selectedMap}
                      sensors={sensors}
                      buildings={buildings}
                      floors={floors}
                      maps={maps}
                      measurements={measurements}
                      plants={plants}
                      onMapClick={onMapClick}
                      onSensorDrag={onStartDrag}
                      onSensorClick={setSelectedSensor}
                      sensorRefs={sensorRefs}
                      draggingSensor={draggingSensor}
                      className="w-full h-full"
                    />

                    {/* Awaiting Placement Notification */}
                    {awaitingPlacement && pendingSensorData && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl shadow-lg p-4 max-w-xs">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                              <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-blue-800 mb-1">בחר מיקום</h4>
                              <p className="text-blue-700 text-sm mb-1">החיישן &quot;{pendingSensorData.name}&quot;</p>
                              <p className="text-blue-600 text-xs mb-3">לחץ על המפה למיקום החיישן</p>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAwaitingPlacement(false);
                                  setPendingSensorData(null);
                                }}
                                className="border-blue-300 hover:border-blue-400 text-blue-700 hover:text-blue-800 h-8 px-3 text-sm"
                              >
                                ביטול
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center p-8">
                      <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                        <Map className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-600 mb-2">בחר בניין וקומה</h3>
                      <p className="text-gray-500">השתמש בתפריטים למעלה לבחירת מפה</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Legend and Quick Actions Combined */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">מקרא וכלים</div>
                    <div className="text-xs opacity-90 font-normal">סטטוס חיישנים ופעולות מהירות</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Legend */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium text-red-800">דחוף</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-800">לחות תקינה</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-800">טמפרטורה תקינה</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-800">לא פעיל</span>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <Button 
                    onClick={() => setShowSensorForm(true)} 
                    disabled={!selectedMapId}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 h-9 text-sm font-medium shadow-lg"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף חיישן
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => loadMapsAndData()}
                    className="w-full border border-blue-200 hover:border-blue-300 hover:bg-blue-50 h-9 text-sm font-medium"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    רענן נתונים
                  </Button>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    מעודכן: {new Date().toLocaleTimeString('he-IL')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Infrastructure Management - Guided Creation */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">ניהול תשתיות</div>
                    <div className="text-xs opacity-90 font-normal">בניין → קומה → מפה</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <Building2 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <h4 className="font-bold text-indigo-800 mb-1">יצירת תשתית חדשה</h4>
                    <p className="text-xs text-indigo-600 mb-3">
                      תהליך מונחה ליצירת בניין, קומה ומפה
                    </p>
                    <Button 
                      onClick={() => setShowInfraWizard(true)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white h-9 px-4 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      צור תשתית חדשה
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    תהליך זה יצור בניין חדש עם קומה ומפה בצורה מסודרת
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Sensor Details */}
            {selectedSensor && (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <RadioTower className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">פרטי חיישן</div>
                        <div className="text-sm opacity-90 font-normal">מידע מפורט בזמן אמת</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewSensorForm({
                            name: selectedSensor.name || '',
                            type: selectedSensor.type || 'moisture',
                            room_id: selectedSensor.room_id || '',
                            status: selectedSensor.status || 'active'
                          });
                          setEditingSensor(selectedSensor);
                          setShowSensorForm(true);
                        }}
                        className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingSensorId === selectedSensor.id}
                            className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת חיישן</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את החיישן הזה מהמפה?
                            <br />
                            <strong className="text-gray-900">{selectedSensor.name}</strong>
                            <br />
                            פעולה זו אינה ניתנת לביטול והחיישן יוסר לצמיתות.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSensor(selectedSensor.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletingSensorId === selectedSensor.id}
                          >
                            {deletingSensorId === selectedSensor.id ? "מוחק..." : "מחק"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedSensor.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {selectedSensor.type === 'moisture' ? 'חיישן לחות קרקע' : 'חיישן טמפרטורה'}
                      </p>
                      {(() => {
                      const measurement = getLatestMeasurementForSensor(selectedSensor.id);
                      const plant = getPlantForSensor(selectedSensor.id);
                      const status = getSensorStatus(selectedSensor);
                      
                      return (
                        <div className="space-y-4">
                          {/* Sensor Basic Info */}
                          <div className="bg-white rounded-lg p-4 shadow-inner">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">מזהה חיישן:</span>
                                <div className="font-bold text-gray-900">#{selectedSensor.id}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">סוג חיישן:</span>
                                <div className="font-bold text-gray-900">
                                  {selectedSensor.type === 'moisture' ? 'לחות קרקע' : 'טמפרטורה'}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">סטטוס:</span>
                                <div className="font-bold text-gray-900">{selectedSensor.status || 'פעיל'}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">יחידת מדידה:</span>
                                <div className="font-bold text-gray-900">{selectedSensor.unit || 'לא מוגדר'}</div>
                              </div>
                              {selectedSensor.serial_number && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">מספר סידורי:</span>
                                  <div className="font-bold text-gray-900">{selectedSensor.serial_number}</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Measurement Data */}
                          <div className="bg-white rounded-lg p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">מדידה אחרונה:</span>
                              <Badge 
                                variant={measurement ? (status === 'critical' ? 'destructive' : status === 'good' ? 'default' : 'secondary') : 'secondary'}
                                className="px-3 py-1"
                              >
                                {measurement ? (status === 'critical' ? 'דחוף' : status === 'good' ? 'תקין' : 'לא פעיל') : 'אין נתונים'}
                              </Badge>
                            </div>
                            {measurement ? (
                              <div>
                                <div className="text-3xl font-bold text-center text-gray-900 mb-1">
                                  {measurement.value}
                                  <span className="text-lg text-gray-600 ml-1">{measurement.unit}</span>
                                </div>
                                <div className="text-xs text-gray-500 text-center">
                                  {new Date(measurement.timestamp).toLocaleString('he-IL')}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <div className="text-2xl font-bold text-gray-400 mb-1">--</div>
                                <div className="text-xs text-gray-500">אין נתוני מדידה זמינים</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Plant Information (if exists) */}
                          {plant && selectedSensor.type === 'moisture' && (
                            <div className="bg-white rounded-lg p-4 shadow-inner">
                              <h4 className="font-bold text-gray-900 mb-3">מידע על הצמח</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">זן:</span>
                                  <span className="font-bold text-gray-900">{plant.species}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">סף השקיה:</span>
                                  <span className="font-bold text-gray-900">{plant.watering_threshold}%</span>
                                </div>
                              </div>
                              
                              {measurement && measurement.value < plant.watering_threshold && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span className="font-bold text-red-800">דרושה השקיה מיידית</span>
                                  </div>
                                  <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 h-10 shadow-lg">
                                    <Droplets className="w-4 h-4 ml-2" />
                                    השקיה ידנית
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Location Information */}
                          <div className="bg-white rounded-lg p-4 shadow-inner">
                            <h4 className="font-bold text-gray-900 mb-3">מיקום במפה</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">X (אחוז):</span>
                                <div className="font-bold text-gray-900">
                                  {(typeof selectedSensor.location_x === 'number' ? selectedSensor.location_x.toFixed(1) : null) || (typeof selectedSensor.x_percent === 'number' ? selectedSensor.x_percent.toFixed(1) : null) || '--'}%
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Y (אחוז):</span>
                                <div className="font-bold text-gray-900">
                                  {(typeof selectedSensor.location_y === 'number' ? selectedSensor.location_y.toFixed(1) : null) || (typeof selectedSensor.y_percent === 'number' ? selectedSensor.y_percent.toFixed(1) : null) || '--'}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Sensor Creation Form Dialog */}
      <Dialog open={showSensorForm} onOpenChange={setShowSensorForm}>
        <DialogContent className="sm:max-w-[425px] bg-white border-2 border-gray-200 shadow-2xl overflow-visible" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingSensor ? 'עריכת חיישן' : 'הוסף חיישן חדש'}</DialogTitle>
            <DialogDescription>
              {editingSensor 
                ? 'ערוך את פרטי החיישן הקיים.' 
                : 'הזן פרטי החיישן החדש. לאחר השמירה תוכל לבחור את מיקום החיישן במפה.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sensor-name">שם החיישן *</Label>
              <Input
                id="sensor-name"
                value={newSensorForm.name}
                onChange={(e) => setNewSensorForm({ ...newSensorForm, name: e.target.value })}
                placeholder="לדוגמה: גינת ירקות A"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sensor-type">סוג חיישן *</Label>
              <Select 
                value={newSensorForm.type} 
                onValueChange={(value) => setNewSensorForm({ ...newSensorForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג חיישן" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[1000]">
                  <SelectItem value="moisture">לחות קרקע</SelectItem>
                  <SelectItem value="temperature">טמפרטורה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedMap && (
              <div className="grid gap-2">
                <Label>מיקום</Label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-sm text-emerald-800">
                    <div className="font-semibold">מפה: {selectedMap.name}</div>
                    {selectedMap.building_id && (
                      <div>בניין: {buildings.find(b => b.id === selectedMap.building_id)?.name || 'לא ידוע'}</div>
                    )}
                    {selectedMap.floor_id && (
                      <div>קומה: {floors.find(f => f.id === selectedMap.floor_id)?.name || 'לא ידועה'}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="sensor-room">מספר חדר</Label>
              <Input
                id="sensor-room"
                value={newSensorForm.room_id}
                onChange={(e) => setNewSensorForm({ ...newSensorForm, room_id: e.target.value })}
                placeholder="לדוגמה: 101, A-12, מעבדה (אופציונלי)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sensor-status">סטטוס</Label>
              <Select value={newSensorForm.status} onValueChange={(value) => setNewSensorForm({ ...newSensorForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[1000]">
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSensorForm(false);
              setEditingSensor(null);
              setNewSensorForm({ name: '', type: '', room_id: '', status: 'active' });
            }}>
              ביטול
            </Button>
            <Button onClick={handleSensorFormSubmit} disabled={!newSensorForm.name || !newSensorForm.type}>
              {editingSensor ? 'שמור שינויים' : 'המשך למיקום'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Infrastructure Creation Wizard */}
      <Dialog open={showInfraWizard} onOpenChange={setShowInfraWizard}>
        <DialogContent className="sm:max-w-[500px] bg-white border-2 border-gray-200 shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              יצירת תשתית חדשה - שלב {wizardStep} מתוך 3
            </DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && "צור בניין חדש ומתן שם לו"}
              {wizardStep === 2 && `צור קומה בבניין "${createdBuilding?.name}"`}
              {wizardStep === 3 && `צור מפה עבור קומה "${createdFloor?.name}"`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step < wizardStep ? 'bg-green-500 text-white' :
                      step === wizardStep ? 'bg-blue-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {step < wizardStep ? '✓' : step}
                    </div>
                    {step < 3 && <div className="w-12 h-0.5 bg-gray-300 mx-2" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Building Creation */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-800">יצירת בניין</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="building-name">שם הבניין *</Label>
                      <Input
                        id="building-name"
                        value={wizardData.building.name}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          building: { ...prev.building, name: e.target.value }
                        }))}
                        placeholder="לדוגמה: בניין הנדסה, מעבדות מחקר"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Floor Creation */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                  <div className="text-sm text-emerald-800">
                    <div className="font-semibold">בניין נוצר: {createdBuilding?.name}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers3 className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-green-800">יצירת קומה</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="floor-name">שם הקומה *</Label>
                      <Input
                        id="floor-name"
                        value={wizardData.floor.name}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          floor: { ...prev.floor, name: e.target.value }
                        }))}
                        placeholder="לדוגמה: קומת קרקע, קומה ראשונה"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="floor-level">מספר קומה (אופציונלי)</Label>
                      <Input
                        id="floor-level"
                        type="number"
                        value={wizardData.floor.level}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          floor: { ...prev.floor, level: e.target.value }
                        }))}
                        placeholder="0, 1, 2..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Map Creation */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                  <div className="text-sm text-emerald-800">
                    <div className="font-semibold">בניין: {createdBuilding?.name}</div>
                    <div>קומה: {createdFloor?.name}</div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Map className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-800">יצירת מפה</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="map-name">שם המפה *</Label>
                      <Input
                        id="map-name"
                        value={wizardData.map.name}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          map: { ...prev.map, name: e.target.value }
                        }))}
                        placeholder="לדוגמה: תוכנית קומת קרקע"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="map-image">תמונת מפה (אופציונלי)</Label>
                      <Input
                        id="map-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleWizardMapFile(e.target.files?.[0])}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowInfraWizard(false);
                setWizardStep(1);
                setWizardData({
                  building: { name: "" },
                  floor: { name: "", level: "" },
                  map: { name: "", image_base64: "" }
                });
                setCreatedBuilding(null);
                setCreatedFloor(null);
              }}
            >
              ביטול
            </Button>
            
            <Button 
              onClick={() => {
                if (wizardStep === 1) handleWizardStep1();
                else if (wizardStep === 2) handleWizardStep2();
                else if (wizardStep === 3) handleWizardStep3();
              }}
              disabled={wizardSaving || 
                (wizardStep === 1 && !wizardData.building.name.trim()) ||
                (wizardStep === 2 && !wizardData.floor.name.trim()) ||
                (wizardStep === 3 && !wizardData.map.name.trim())
              }
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              {wizardSaving ? 'שומר...' : 
               wizardStep === 3 ? 'סיים' : 'הבא'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
