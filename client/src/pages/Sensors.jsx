
import React, { useState, useEffect, useRef } from "react";
import { entities } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RadioTower as SensorsIcon, 
  Droplets, 
  Thermometer, 
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  Info,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  Calendar,
  Activity,
  Move
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function Sensors() {
  const [sensors, setSensors] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [plants, setPlants] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "",
    status: "active",
    room_id: "",
    building_id: "",
    floor_id: "",
    map_id: ""
  });
  const [pendingMove, setPendingMove] = useState(null); // {mapId, buildingId, floorId}
  const [editDraftPosition, setEditDraftPosition] = useState(null); // {x, y}
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [movingSensor, setMovingSensor] = useState(null);
  const [moveTargetBuilding, setMoveTargetBuilding] = useState("");
  const [moveTargetFloor, setMoveTargetFloor] = useState("");
  const [moveTargetMap, setMoveTargetMap] = useState(null);
  const [draftPosition, setDraftPosition] = useState(null);
  const [mapViewSensors, setMapViewSensors] = useState([]);
  
  // Drag state for move dialog
  const [draggingSensor, setDraggingSensor] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cachedRect, setCachedRect] = useState(null);
  const dragRafId = useRef(null);
  const moveMapContainerRef = useRef(null);
  const moveSensorRefs = useRef({});
  const { toast } = useToast();


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

  // Helper functions for location data
  const getBuildingName = (buildingId) => {
    const building = buildings.find(b => b.id === buildingId);
    return building?.name || '';
  };

  const getFloorName = (floorId) => {
    const floor = floors.find(f => f.id === floorId);
    return floor?.name || (floor?.level ? `קומה ${floor.level}` : '');
  };

  const getLocationBreadcrumb = (sensor) => {
    const parts = [];
    
    // Try direct building_id/floor_id first (new sensors)
    if (sensor.building_id) {
      parts.push(getBuildingName(sensor.building_id));
      if (sensor.floor_id) parts.push(getFloorName(sensor.floor_id));
      if (sensor.room_id) parts.push(sensor.room_id);
      return parts.join(' › ');
    }
    
    // Fallback: derive from map_id (legacy sensors)
    if (sensor.map_id) {
      // Convert to number for comparison (handles string vs number type mismatches)
      const mapId = Number(sensor.map_id);
      const sensorMap = maps.find(m => Number(m.id) === mapId);
      
      if (sensorMap && sensorMap.floor_id) {
        const floorId = Number(sensorMap.floor_id);
        const floor = floors.find(f => Number(f.id) === floorId);
        
        if (floor) {
          const buildingId = Number(floor.building_id);
          const building = buildings.find(b => Number(b.id) === buildingId);
          
          if (building) parts.push(building.name);
          parts.push(floor.name || (floor.level ? `קומה ${floor.level}` : ''));
          if (sensor.room_id) parts.push(sensor.room_id);
          
          return parts.length ? parts.join(' › ') : 'לא מוקצה למפה';
        }
      }
      return 'לא מוקצה למפה';
    }
    
    return 'לא מוקצה למפה';
  };

  const handleShowDetails = (sensor) => {
    setSelectedSensor(sensor);
    setShowDetails(true);
  };

  const loadMapViewSensors = async (mapId) => {
    try {
      const sensorsData = await entities.Sensor.filter({ map_id: Number(mapId) });
      setMapViewSensors(sensorsData);
    } catch (error) {
      console.error("Error loading sensors for map:", error);
    }
  };

  const handleMoveSensor = (sensor) => {
    setMovingSensor(sensor);
    
    // Find current map and preselect building/floor
    if (sensor.map_id) {
      const currentMap = maps.find(m => Number(m.id) === Number(sensor.map_id));
      if (currentMap && currentMap.floor_id) {
        const floor = floors.find(f => Number(f.id) === Number(currentMap.floor_id));
        if (floor) {
          setMoveTargetBuilding(floor.building_id.toString());
          setMoveTargetFloor(floor.id.toString());
          setMoveTargetMap(currentMap);
          loadMapViewSensors(currentMap.id);
        }
      }
    }
    
    setDraftPosition({ 
      x: sensor.x_percent || 50, 
      y: sensor.y_percent || 50,
      mapId: sensor.map_id
    });
    setShowMoveDialog(true);
  };

  const handleMapClick = (e) => {
    if (!moveTargetMap || draggingSensor) return;
    e.stopPropagation(); // Prevent Dialog close
    
    const mapContainer = e.currentTarget;
    const rect = mapContainer.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPosition = { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)),
      mapId: moveTargetMap.id
    };
    
    console.log('🎯 Map clicked:', newPosition);
    setDraftPosition(newPosition);
  };

  // Move dialog drag handlers
  const handleMoveSensorDragStart = (sensor, e) => {
    if (!moveMapContainerRef.current) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent Dialog close
    const rect = moveMapContainerRef.current.getBoundingClientRect();
    setCachedRect(rect);
    
    const sensorElement = moveSensorRefs.current[sensor.id];
    if (sensorElement) {
      const sensorRect = sensorElement.getBoundingClientRect();
      const sensorCenterX = sensorRect.left + sensorRect.width / 2;
      const sensorCenterY = sensorRect.top + sensorRect.height / 2;
      setDragOffset({ x: e.clientX - sensorCenterX, y: e.clientY - sensorCenterY });
      
      const initialX = ((e.clientX - rect.left) / rect.width) * 100;
      const initialY = ((e.clientY - rect.top) / rect.height) * 100;
      sensorElement.style.left = `${initialX}%`;
      sensorElement.style.top = `${initialY}%`;
    }
    
    setDraggingSensor(sensor.id);
  };

  const handleMoveMapMouseMove = (e) => {
    if (!draggingSensor || !cachedRect) return;
    e.preventDefault();
    e.stopPropagation(); // Prevent Dialog close
    
    const sensorElement = moveSensorRefs.current[draggingSensor];
    if (sensorElement) {
      const x = ((e.clientX - dragOffset.x - cachedRect.left) / cachedRect.width) * 100;
      const y = ((e.clientY - dragOffset.y - cachedRect.top) / cachedRect.height) * 100;
      
      if (dragRafId.current) {
        cancelAnimationFrame(dragRafId.current);
      }
      
      dragRafId.current = requestAnimationFrame(() => {
        if (sensorElement && draggingSensor) {
          sensorElement.style.left = `${x}%`;
          sensorElement.style.top = `${y}%`;
          dragRafId.current = null;
        }
      });
    }
  };

  const handleMoveStopDrag = () => {
    if (!draggingSensor || !moveTargetMap) return;
    
    const sensorElement = moveSensorRefs.current[draggingSensor];
    let finalX, finalY;
    
    if (sensorElement) {
      finalX = parseFloat(sensorElement.style.left || '0');
      finalY = parseFloat(sensorElement.style.top || '0');
    }
    
    if (finalX !== undefined && finalY !== undefined) {
      setDraftPosition({
        x: finalX,
        y: finalY,
        mapId: moveTargetMap.id
      });
    }
    
    setDraggingSensor(null);
    setCachedRect(null);
    setDragOffset({ x: 0, y: 0 });
    
    if (dragRafId.current) {
      cancelAnimationFrame(dragRafId.current);
      dragRafId.current = null;
    }
  };

  const handleSaveMove = async () => {
    if (!movingSensor || !moveTargetMap || !draftPosition) {
      return;
    }
    
    // Check if this is called from Edit dialog
    if (showEditForm && pendingMove) {
      // Return position to Edit dialog
      handleEditPositionSet(draftPosition);
      return;
    }
    
    if (movingSensor?.name === 'blaa blaa') {
      console.log('📍 Sensors Page - Saving blaa blaa coordinates:', {
        name: movingSensor.name,
        draftPosition,
        targetMap: moveTargetMap?.id
      });
    }
    
    try {
      await entities.Sensor.update(movingSensor.id, {
        map_id: draftPosition.mapId,
        x_percent: draftPosition.x,
        y_percent: draftPosition.y
      });

      setSensors(sensors.map(s => 
        s.id === movingSensor.id 
          ? { ...s, map_id: draftPosition.mapId, x_percent: draftPosition.x, y_percent: draftPosition.y }
          : s
      ));

      toast({
        title: "חיישן הועבר בהצלחה",
        description: "מיקום החיישן עודכן במפה"
      });

      handleCancelMove();
    } catch (error) {
      console.error('Error moving sensor:', error);
      toast({
        title: "שגיאה בהעברת החיישן",
        description: "לא ניתן לעדכן את מיקום החיישן",
        variant: "destructive"
      });
    }
  };

  const handleCancelMove = () => {
    setShowMoveDialog(false);
    setMovingSensor(null);
    setMoveTargetMap(null);
    setDraftPosition(null);
    setDraggingSensor(null);
    setCachedRect(null);
    setDragOffset({ x: 0, y: 0 });
  };


  useEffect(() => {
    loadSensorsData();
  }, []);

  const loadSensorsData = async () => {
    setLoading(true);
    try {
      const [sensorsData, measurementsData, plantsData, buildingsData, floorsData, mapsData] = await Promise.all([
        entities.Sensor.list(),
        entities.Measurement.list("-timestamp", 200),
        entities.Plant.list(),
        entities.Building.list(),
        entities.Floor.list(),
        entities.Map.list()
      ]);
      
      setSensors(sensorsData);
      
      const blaaBlaa = sensorsData.find(s => s.name === 'blaa blaa');
      if (blaaBlaa) {
        console.log('📊 Sensors Page - Loaded blaa blaa sensor:', {
          name: blaaBlaa.name,
          x_percent: blaaBlaa.x_percent,
          y_percent: blaaBlaa.y_percent,
          location_x: blaaBlaa.location_x,
          location_y: blaaBlaa.location_y,
          map_id: blaaBlaa.map_id
        });
      }
      setMeasurements(measurementsData);
      setPlants(plantsData);
      setBuildings(buildingsData);
      setFloors(floorsData);
      setMaps(mapsData);
    } catch (error) {
      console.error("Error loading sensors data:", error);
    }
    setLoading(false);
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

  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || sensor.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getSensorIcon = (type) => {
    return type === 'moisture' ? 
      <Droplets className="w-5 h-5 text-blue-600" /> :
      <Thermometer className="w-5 h-5 text-orange-600" />;
  };

  const getStatusBadge = (sensor) => {
    const status = getSensorStatus(sensor);
    switch(status) {
      case 'critical':
        return <Badge variant="destructive">זקוק השקיה</Badge>;
      case 'good':
        return <Badge variant="default" className="bg-green-100 text-green-800">תקין</Badge>;
      default:
        return <Badge variant="secondary">לא מחובר</Badge>;
    }
  };

  const handleEditSensor = (sensor) => {
    setEditingSensor(sensor);
    
    // Get current location info
    let currentBuildingId = sensor.building_id || "";
    let currentFloorId = sensor.floor_id || "";
    let currentMapId = sensor.map_id || "";
    
    // Derive location from map_id if building_id not set (legacy sensors)
    if (!currentBuildingId && sensor.map_id) {
      const sensorMap = maps.find(m => Number(m.id) === Number(sensor.map_id));
      if (sensorMap && sensorMap.floor_id) {
        const floor = floors.find(f => Number(f.id) === Number(sensorMap.floor_id));
        if (floor) {
          currentFloorId = floor.id.toString();
          currentBuildingId = floor.building_id.toString();
        }
      }
    }
    
    setEditForm({
      name: sensor.name || "",
      type: sensor.type || "moisture",
      status: sensor.status || "active",
      room_id: sensor.room_id || "",
      building_id: currentBuildingId,
      floor_id: currentFloorId,
      map_id: currentMapId
    });
    setPendingMove(null);
    setEditDraftPosition(null);
    setShowEditForm(true);
  };

  const handleEditFormSubmit = async () => {
    if (!editForm.name.trim() || !editForm.type) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם וסוג חיישן",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData = {
        name: editForm.name,
        type: editForm.type,
        unit: getSensorUnit(editForm.type),
        status: editForm.status,
        room_id: editForm.room_id || null,
      };

      // Handle location changes
      if (pendingMove) {
        updateData.map_id = Number(pendingMove.mapId);
        updateData.building_id = Number(pendingMove.buildingId);
        updateData.floor_id = Number(pendingMove.floorId);
        
        // Use draft position or center default
        if (editDraftPosition) {
          updateData.x_percent = editDraftPosition.x;
          updateData.y_percent = editDraftPosition.y;
        } else {
          // Auto-center if no position set
          updateData.x_percent = 50;
          updateData.y_percent = 50;
        }
      }

      await entities.Sensor.update(editingSensor.id, updateData);
      
      // Refresh sensor data to update all maps/locations
      await loadSensorsData();

      toast({
        title: "חיישן עודכן בהצלחה",
        description: "השינויים נשמרו במערכת"
      });

      setShowEditForm(false);
      setEditingSensor(null);
      setPendingMove(null);
      setEditDraftPosition(null);
    } catch (error) {
      console.error('Error updating sensor:', error);
      toast({
        title: "שגיאה בעדכון החיישן",
        description: "לא ניתן לעדכן את החיישן. נסה שוב מאוחר יותר.",
        variant: "destructive"
      });
    }
  };

  const handleEditLocationChange = (field, value) => {
    const newForm = { ...editForm, [field]: value };
    
    // Reset dependent fields when parent changes
    if (field === 'building_id') {
      newForm.floor_id = "";
      newForm.map_id = "";
    } else if (field === 'floor_id') {
      newForm.map_id = "";
    }
    
    setEditForm(newForm);
    
    // Check if map changed to trigger pending move
    if (field === 'map_id' && value && value !== editingSensor.map_id?.toString()) {
      const selectedMap = maps.find(m => m.id.toString() === value);
      if (selectedMap) {
        setPendingMove({
          mapId: value,
          buildingId: newForm.building_id,
          floorId: newForm.floor_id
        });
        setEditDraftPosition(null); // Reset position when map changes
      }
    } else if (field === 'map_id' && value === editingSensor.map_id?.toString()) {
      // Reverted to original map
      setPendingMove(null);
      setEditDraftPosition(null);
    }
  };

  const handleSetEditPosition = () => {
    if (!pendingMove) return;
    
    const targetMap = maps.find(m => m.id.toString() === pendingMove.mapId);
    if (!targetMap) return;
    
    // Set up move dialog with target map
    setMoveTargetMap(targetMap);
    setMoveTargetBuilding(pendingMove.buildingId);
    setMoveTargetFloor(pendingMove.floorId);
    setMovingSensor(editingSensor);
    
    // Set draft position to current or center
    setDraftPosition({
      x: editDraftPosition?.x || 50,
      y: editDraftPosition?.y || 50,
      mapId: targetMap.id
    });
    
    setShowMoveDialog(true);
  };

  const handleEditPositionSet = (position) => {
    // Called when Move dialog confirms position
    setEditDraftPosition({ x: position.x, y: position.y });
    setShowMoveDialog(false);
  };

  const handleDeleteSensor = async (sensorId) => {
    try {
      setDeletingId(sensorId);
      await entities.Sensor.delete(sensorId);
      
      // Remove sensor from local state
      setSensors(sensors.filter(s => s.id !== sensorId));
      
      toast({
        title: "חיישן נמחק בהצלחה",
        description: "החיישן הוסר מהמערכת",
      });
    } catch (error) {
      console.error('Error deleting sensor:', error);
      toast({
        title: "שגיאה במחיקת החיישן",
        description: "לא ניתן למחוק את החיישן. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">חיישנים</h1>
          <p className="text-gray-600 mt-1">ניהול ומעקב אחר חיישני הקמפוס</p>
        </div>
        <Button variant="outline" onClick={loadSensorsData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חפש חיישנים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filterType === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterType("all")}
          >
            הכל
          </Button>
          <Button 
            variant={filterType === "moisture" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterType("moisture")}
          >
            לחות
          </Button>
          <Button 
            variant={filterType === "temperature" ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterType("temperature")}
          >
            טמפרטורה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredSensors.map((sensor) => {
          const measurement = getLatestMeasurementForSensor(sensor.id);
          const plant = getPlantForSensor(sensor.id);
          const status = getSensorStatus(sensor);

          return (
            <Card key={sensor.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getSensorIcon(sensor.type)}
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">{sensor.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {measurement ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Wifi className="h-3 w-3 text-green-600" />
                            <span>מחובר</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <WifiOff className="h-3 w-3 text-red-600" />
                            <span>לא מחובר</span>
                          </div>
                        )}
                        {measurement && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(measurement.timestamp), "HH:mm", { locale: he })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShowDetails(sensor);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="פרטים"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSensor(sensor)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="עריכה"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMoveSensor(sensor);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                      title="העבר חיישן"
                    >
                      <Move className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === sensor.id}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת חיישן</AlertDialogTitle>
                          <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את החיישן הזה?
                            <br />
                            <strong className="text-gray-900">{sensor.name}</strong>
                            <br />
                            פעולה זו אינה ניתנת לביטול.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSensor(sensor.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletingId === sensor.id}
                          >
                            {deletingId === sensor.id ? "מוחק..." : "מחק"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-3">
                  {/* Sensor Type and Latest Value */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {sensor.type === 'moisture' ? 'לחות קרקע' : 
                         sensor.type === 'temperature' ? 'טמפרטורה' :
                         sensor.type === 'humidity' ? 'לחות אוויר' :
                         sensor.type === 'light' ? 'אור' : sensor.type}
                      </span>
                      {getStatusBadge(sensor)}
                    </div>
                  </div>

                  {/* Latest Measurement Value */}
                  {measurement ? (
                    <div className="text-center py-2">
                      <div className={`text-2xl font-bold ${
                        status === 'critical' ? 'text-red-600' : 
                        status === 'good' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {measurement.value}{measurement.unit}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-lg text-gray-400 font-medium">אין נתונים</span>
                    </div>
                  )}

                  {/* Location Breadcrumb */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 border-t pt-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{getLocationBreadcrumb(sensor)}</span>
                  </div>

                  {/* Alert indicator for plant-based sensors */}
                  {plant && sensor.type === 'moisture' && measurement && (
                    <div className="border-t pt-2">
                      {measurement.value < plant.watering_threshold ? (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span>זקוק השקיה - {plant.species}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span>מצב תקין - {plant.species}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSensors.length === 0 && !loading && (
        <div className="text-center py-12">
          <SensorsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">לא נמצאו חיישנים</h3>
          <p className="text-gray-500">נסה לשנות את הפילטרים או להוסיף חיישנים חדשים</p>
        </div>
      )}

      <Dialog open={showEditForm} onOpenChange={(open) => {
        if (!open) {
          setShowEditForm(false);
          setPendingMove(null);
          setEditDraftPosition(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>עריכת חיישן</DialogTitle>
            <DialogDescription>
              עריכת פרטי החיישן הבסיסיים
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="sensorName" className="block text-sm font-medium text-gray-700 mb-1">
                שם החיישן
              </label>
              <Input
                id="sensorName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="הזן שם לחיישן"
              />
            </div>

            <div>
              <label htmlFor="sensorType" className="block text-sm font-medium text-gray-700 mb-1">
                סוג חיישן
              </label>
              <Select 
                value={editForm.type} 
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג חיישן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moisture">לחות קרקע</SelectItem>
                  <SelectItem value="temperature">טמפרטורה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="sensorStatus" className="block text-sm font-medium text-gray-700 mb-1">
                סטטוס
              </label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                  <SelectItem value="maintenance">תחזוקה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="sensorRoom" className="block text-sm font-medium text-gray-700 mb-1">
                חדר (אופציונלי)
              </label>
              <Input
                id="sensorRoom"
                value={editForm.room_id}
                onChange={(e) => setEditForm({ ...editForm, room_id: e.target.value })}
                placeholder="מספר חדר או שם חדר"
              />
            </div>

            {/* Location Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">בניין</label>
              <Select 
                value={editForm.building_id} 
                onValueChange={(value) => handleEditLocationChange('building_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר בניין" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id.toString()}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קומה</label>
              <Select 
                value={editForm.floor_id} 
                onValueChange={(value) => handleEditLocationChange('floor_id', value)}
                disabled={!editForm.building_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קומה" />
                </SelectTrigger>
                <SelectContent>
                  {floors
                    .filter(floor => floor.building_id === Number(editForm.building_id))
                    .map((floor) => (
                      <SelectItem key={floor.id} value={floor.id.toString()}>
                        {floor.name || `קומה ${floor.level}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מפה</label>
              <Select 
                value={editForm.map_id} 
                onValueChange={(value) => handleEditLocationChange('map_id', value)}
                disabled={!editForm.floor_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מפה" />
                </SelectTrigger>
                <SelectContent>
                  {maps
                    .filter(map => map.floor_id === Number(editForm.floor_id))
                    .map((map) => (
                      <SelectItem key={map.id} value={map.id.toString()}>
                        {map.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pending Move Banner */}
            {pendingMove && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800 text-sm mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">מפה חדשה נבחרה</span>
                </div>
                <p className="text-blue-700 text-sm mb-3">
                  יש לקבוע מיקום החיישן על המפה החדשה לפני שמירה
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleSetEditPosition}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    קבע מיקום
                  </Button>
                  {editDraftPosition && (
                    <span className="text-xs text-blue-600 flex items-center">
                      מיקום הוגדר: {editDraftPosition.x.toFixed(1)}%, {editDraftPosition.y.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleEditFormSubmit} 
                disabled={!editForm.name || !editForm.type}
              >
                שמור שינויים
              </Button>
              <Button variant="outline" onClick={() => {
                setShowEditForm(false);
                setPendingMove(null);
                setEditDraftPosition(null);
              }}>
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sensor Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl">{selectedSensor?.name || 'פרטי חיישן'}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedSensor && `${selectedSensor.type === 'moisture' ? 'לחות קרקע' : 
               selectedSensor.type === 'temperature' ? 'טמפרטורה' :
               selectedSensor.type === 'humidity' ? 'לחות אוויר' :
               selectedSensor.type === 'light' ? 'אור' : selectedSensor.type} • ${getLocationBreadcrumb(selectedSensor)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto" dir="rtl">
            {selectedSensor && (
              <>
                {/* Current Status Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    מצב נוכחי
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">סטטוס:</span>
                      <div className="flex items-center gap-2">
                        {getLatestMeasurementForSensor(selectedSensor.id) ? (
                          <><Wifi className="h-4 w-4 text-green-600" /><span className="text-green-600">מחובר</span></>
                        ) : (
                          <><WifiOff className="h-4 w-4 text-red-600" /><span className="text-red-600">לא מחובר</span></>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">מצב תפעולי:</span>
                      <span className={selectedSensor.status === 'active' ? 'text-green-600' : 'text-gray-500'}>
                        {selectedSensor.status === 'active' ? 'פעיל' : 
                         selectedSensor.status === 'maintenance' ? 'תחזוקה' : 'לא פעיל'}
                      </span>
                    </div>
                    {getLatestMeasurementForSensor(selectedSensor.id) && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">ערך נוכחי:</span>
                          <span className="font-bold text-lg">
                            {getLatestMeasurementForSensor(selectedSensor.id).value}
                            {getLatestMeasurementForSensor(selectedSensor.id).unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">עדכון אחרון:</span>
                          <span className="text-sm">
                            {format(new Date(getLatestMeasurementForSensor(selectedSensor.id).timestamp), 
                                   "dd/MM/yyyy HH:mm", { locale: he })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Technical Details Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <SensorsIcon className="h-5 w-5" />
                    פרטים טכניים
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">סוג חיישן:</span>
                      <span>{selectedSensor.type === 'moisture' ? 'לחות קרקע' : 
                             selectedSensor.type === 'temperature' ? 'טמפרטורה' :
                             selectedSensor.type === 'humidity' ? 'לחות אוויר' :
                             selectedSensor.type === 'light' ? 'אור' : selectedSensor.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">יחידת מדידה:</span>
                      <span>{getSensorUnit(selectedSensor.type)}</span>
                    </div>
                    {selectedSensor.serial_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">מספר סידורי:</span>
                        <span className="font-mono text-sm">{selectedSensor.serial_number}</span>
                      </div>
                    )}
                    {selectedSensor.model && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">דגם:</span>
                        <span>{selectedSensor.model}</span>
                      </div>
                    )}
                    {selectedSensor.manufacturer && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">יצרן:</span>
                        <span>{selectedSensor.manufacturer}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Details Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    מיקום
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {(() => {
                      // Get derived location data for both new and legacy sensors
                      let buildingName = 'לא הוגדר';
                      let floorName = 'לא הוגדר';
                      
                      if (selectedSensor.building_id) {
                        // New sensor with direct building_id/floor_id
                        buildingName = getBuildingName(selectedSensor.building_id) || 'לא הוגדר';
                        floorName = getFloorName(selectedSensor.floor_id) || 'לא הוגדר';
                      } else if (selectedSensor.map_id) {
                        // Legacy sensor - derive from map_id
                        const mapId = Number(selectedSensor.map_id);
                        const sensorMap = maps.find(m => Number(m.id) === mapId);
                        if (sensorMap && sensorMap.floor_id) {
                          const floorId = Number(sensorMap.floor_id);
                          const floor = floors.find(f => Number(f.id) === floorId);
                          if (floor) {
                            const buildingId = Number(floor.building_id);
                            const building = buildings.find(b => Number(b.id) === buildingId);
                            if (building) buildingName = building.name;
                            floorName = floor.name || (floor.level ? `קומה ${floor.level}` : 'לא הוגדר');
                          }
                        }
                      }
                      
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">בניין:</span>
                            <span>{buildingName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">קומה:</span>
                            <span>{floorName}</span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">חדר/אזור:</span>
                      <span>{selectedSensor.room_id || 'לא הוגדר'}</span>
                    </div>
                    {(selectedSensor.x_percent || selectedSensor.y_percent) && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">מיקום על מפה:</span>
                        <span className="text-sm font-mono">
                          X: {selectedSensor.x_percent}%, Y: {selectedSensor.y_percent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Installation & Maintenance Section */}
                {(selectedSensor.installed_at || selectedSensor.last_maintenance) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      התקנה ותחזוקה
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {selectedSensor.installed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">הותקן בתאריך:</span>
                          <span>{format(new Date(selectedSensor.installed_at), "dd/MM/yyyy", { locale: he })}</span>
                        </div>
                      )}
                      {selectedSensor.last_maintenance && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">תחזוקה אחרונה:</span>
                          <span>{format(new Date(selectedSensor.last_maintenance), "dd/MM/yyyy", { locale: he })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Associated Plant Section */}
                {getPlantForSensor(selectedSensor.id) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Droplets className="h-5 w-5" />
                      צמח קשור
                    </h3>
                    <div className="bg-green-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">מין:</span>
                        <span className="font-medium">{getPlantForSensor(selectedSensor.id).species}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">סף השקיה:</span>
                        <span>{getPlantForSensor(selectedSensor.id).watering_threshold}%</span>
                      </div>
                      {getPlantForSensor(selectedSensor.id).last_watered && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">השקיה אחרונה:</span>
                          <span>{format(new Date(getPlantForSensor(selectedSensor.id).last_watered), 
                                        "dd/MM/yyyy HH:mm", { locale: he })}</span>
                        </div>
                      )}
                      {getPlantForSensor(selectedSensor.id).notes && (
                        <div className="space-y-1">
                          <span className="text-gray-600 text-sm">הערות:</span>
                          <p className="text-sm bg-white p-2 rounded border">
                            {getPlantForSensor(selectedSensor.id).notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Sensor Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={(open) => {
        // Only allow closing via explicit buttons, not map interactions
        if (!open) {
          handleCancelMove();
        }
      }}>
        <DialogContent className="w-[95vw] sm:max-w-[95vw] max-h-[95vh] bg-white z-[1000] overflow-auto p-4">
          <DialogHeader>
            <DialogTitle>העברת חיישן - {movingSensor?.name}</DialogTitle>
            <DialogDescription>
              בחר מפה יעד לצפייה במיקום החיישן הנוכחי
            </DialogDescription>
          </DialogHeader>
          
          {/* Building/Floor/Map Selectors Toolbar */}
          <div className="flex flex-wrap items-end gap-2 justify-end mt-4" dir="rtl">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleCancelMove}
                className="h-10"
              >
                ביטול
              </Button>
              <Button 
                variant="default"
                disabled={!moveTargetMap || !draftPosition}
                onClick={handleSaveMove}
                className="h-10 bg-green-600 hover:bg-green-700 text-white"
              >
                {showEditForm && pendingMove ? "אישור מיקום" : "שמור מיקום"}
              </Button>
            </div>
            <div className="min-w-0 flex-shrink-0">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">בניין</Label>
              <Select value={moveTargetBuilding} onValueChange={(value) => {
                setMoveTargetBuilding(value);
                setMoveTargetFloor("");
                setMoveTargetMap(null);
                if (movingSensor) {
                  setDraftPosition({
                    x: movingSensor.x_percent || 50,
                    y: movingSensor.y_percent || 50,
                    mapId: movingSensor.map_id
                  });
                }
              }}>
                <SelectTrigger className="h-10 w-40">
                  <SelectValue placeholder="בחר בניין" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id.toString()}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-shrink-0">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">קומה</Label>
              <Select 
                value={moveTargetFloor} 
                onValueChange={(value) => {
                  setMoveTargetFloor(value);
                  setMoveTargetMap(null);
                  if (movingSensor) {
                    setDraftPosition({
                      x: movingSensor.x_percent || 50,
                      y: movingSensor.y_percent || 50,
                      mapId: movingSensor.map_id
                    });
                  }
                }}
                disabled={!moveTargetBuilding}
              >
                <SelectTrigger className="h-10 w-40">
                  <SelectValue placeholder="בחר קומה" />
                </SelectTrigger>
                <SelectContent>
                  {floors
                    .filter(floor => floor.building_id === Number(moveTargetBuilding))
                    .map((floor) => (
                      <SelectItem key={floor.id} value={floor.id.toString()}>
                        {floor.name || `קומה ${floor.level}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-shrink-0">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">מפה</Label>
              <Select 
                value={moveTargetMap?.id?.toString() || ""} 
                onValueChange={(value) => {
                  const map = maps.find(m => m.id.toString() === value);
                  setMoveTargetMap(map);
                  if (map && movingSensor) {
                    // Set initial draft position for the moving sensor on new map
                    setDraftPosition({
                      x: movingSensor.x_percent || 50,
                      y: movingSensor.y_percent || 50,
                      mapId: map.id
                    });
                  }
                }}
                disabled={!moveTargetFloor}
              >
                <SelectTrigger className="h-10 w-44">
                  <SelectValue placeholder="בחר מפה" />
                </SelectTrigger>
                <SelectContent>
                  {maps
                    .filter(map => map.floor_id === Number(moveTargetFloor))
                    .map((map) => (
                      <SelectItem key={map.id} value={map.id.toString()}>
                        {map.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exact MapView Grid Structure */}
          {moveTargetMap && (
            <div className="grid lg:grid-cols-4 gap-6 mt-6">
              <div className="lg:col-span-3 w-full max-w-none justify-self-stretch">
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm h-[38rem] lg:h-[1100px] w-full overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold">{moveTargetMap.name}</div>
                        <div className="text-sm opacity-90 font-normal">מיקום החיישן על המפה</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-full relative">
                    <div
                      ref={moveMapContainerRef}
                      onMouseMove={handleMoveMapMouseMove}
                      onMouseUp={handleMoveStopDrag}
                      onClick={handleMapClick}
                    >
                      <MapDisplay
                        selectedMap={moveTargetMap}
                        sensors={(() => {
                          // Get all sensors for the current map
                          const mapSensors = sensors.filter(s => s.map_id === moveTargetMap?.id) || [];
                          
                          // Add the moving sensor if it's not already on this map
                          const movingSensorExists = mapSensors.find(s => s.id === movingSensor?.id);
                          if (movingSensor && !movingSensorExists) {
                            mapSensors.push({
                              ...movingSensor,
                              map_id: moveTargetMap?.id,
                              x_percent: draftPosition?.x || movingSensor.x_percent || 50,
                              y_percent: draftPosition?.y || movingSensor.y_percent || 50
                            });
                          }
                          
                          // Apply draft position to moving sensor
                          return mapSensors.map(sensor => {
                            if (sensor.id === movingSensor?.id && draftPosition) {
                              return {
                                ...sensor,
                                x_percent: draftPosition.x,
                                y_percent: draftPosition.y,
                                location_x: draftPosition.x,
                                location_y: draftPosition.y
                              };
                            }
                            return sensor;
                          });
                        })()}
                        buildings={buildings}
                        floors={floors}
                        maps={maps}
                        measurements={measurements}
                        plants={plants}
                        highlightedSensorId={movingSensor?.id}
                        onSensorDrag={handleMoveSensorDragStart}
                        sensorRefs={moveSensorRefs}
                        draggingSensor={draggingSensor}
                        className="w-full h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Empty sidebar to maintain 3:1 ratio like MapView */}
              <div className="hidden lg:block">
                {/* Intentionally empty - maintains MapView proportions */}
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}
