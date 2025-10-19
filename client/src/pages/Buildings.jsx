import React, { useState, useEffect } from "react";
import { entities } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Plus, 
  Search,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Layers3,
  RadioTower,
  Trash2,
  Edit,
  ChevronDown,
  ChevronRight,
  Image
} from "lucide-react";

export default function Buildings() {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [maps, setMaps] = useState([]);
  const [expandedBuildings, setExpandedBuildings] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddFloorDialogOpen, setIsAddFloorDialogOpen] = useState(false);
  const [isEditFloorDialogOpen, setIsEditFloorDialogOpen] = useState(false);
  const [isEditBuildingDialogOpen, setIsEditBuildingDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isMapPreviewOpen, setIsMapPreviewOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [previewMap, setPreviewMap] = useState(null);
  const [newBuilding, setNewBuilding] = useState({ name: "", address: "", description: "" });
  const [editBuilding, setEditBuilding] = useState({ name: "" });
  const [newFloor, setNewFloor] = useState({ floor_number: "", name: "", map_data: "", map_name: "" });
  const [editFloor, setEditFloor] = useState({ name: "", level: "" });
  const [mapAction, setMapAction] = useState(""); // "assign", "replace", "remove"

  useEffect(() => {
    loadBuildingsData();
  }, []);

  const loadBuildingsData = async () => {
    setLoading(true);
    try {
      const [buildingsData, floorsData, sensorsData, mapsData] = await Promise.all([
        entities.Building.list(),
        entities.Floor.list(),
        entities.Sensor.list(),
        entities.Map.list()
      ]);
      
      setBuildings(buildingsData);
      setFloors(floorsData);
      setSensors(sensorsData);
      setMaps(mapsData);
    } catch (error) {
      console.error("Error loading buildings data:", error);
    }
    setLoading(false);
  };

  const getFloorsForBuilding = (buildingId) => {
    return floors.filter(floor => floor.building_id === buildingId);
  };

  const getSensorsForBuilding = (buildingId) => {
    const buildingFloors = getFloorsForBuilding(buildingId);
    return sensors.filter(sensor => 
      buildingFloors.some(floor => floor.id === sensor.floor_id)
    );
  };

  const getBuildingStatus = (building) => {
    const buildingSensors = getSensorsForBuilding(building.id);
    const activeSensors = buildingSensors.filter(s => s.status === 'active');
    
    if (buildingSensors.length === 0) return 'no_sensors';
    if (activeSensors.length === 0) return 'offline';
    if (activeSensors.length === buildingSensors.length) return 'online';
    return 'partial';
  };

  // Deduplicate buildings by ID and filter
  const uniqueBuildings = buildings.reduce((acc, building) => {
    if (!acc.find(b => b.id === building.id)) {
      acc.push(building);
    }
    return acc;
  }, []);

  const filteredBuildings = uniqueBuildings.filter(building =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (building) => {
    const status = getBuildingStatus(building);
    switch(status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">מקוון</Badge>;
      case 'partial':
        return <Badge variant="secondary">חלקי</Badge>;
      case 'offline':
        return <Badge variant="destructive">לא מקוון</Badge>;
      default:
        return <Badge variant="outline">אין חיישנים</Badge>;
    }
  };

  const handleCreateBuilding = async () => {
    try {
      if (!newBuilding.name.trim()) {
        alert("שם הבניין הוא שדה חובה");
        return;
      }

      await entities.Building.create(newBuilding);
      setIsCreateDialogOpen(false);
      setNewBuilding({ name: "", address: "", description: "" });
      await loadBuildingsData();
      console.log("Building created successfully");
    } catch (error) {
      console.error("Error creating building:", error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error.includes('already exists') ? 
          'בניין עם השם הזה כבר קיים' : 
          error.response.data.error);
      } else {
        alert("נכשל ביצירת הבניין");
      }
    }
  };

  const handleAddFloor = async () => {
    try {
      if (!newFloor.floor_number.trim()) {
        alert("מספר קומה הוא שדה חובה");
        return;
      }
      
      // Use floor number as name if name is not provided
      const floorName = newFloor.name.trim() || `קומה ${newFloor.floor_number}`;

      const floorData = await entities.Floor.create({
        name: floorName,
        building_id: selectedBuilding.id,
        level: parseInt(newFloor.floor_number)
      });
      
      
      setIsAddFloorDialogOpen(false);
      setNewFloor({ floor_number: "", name: "", map_data: "", map_name: "" });
      setSelectedBuilding(null);
      await loadBuildingsData();
      console.log("Floor added successfully");
    } catch (error) {
      console.error("Error adding floor:", error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(error.response.data.error.includes('already exists') ? 
          'קומה עם רמה זו כבר קיימת בבניין זה' : 
          error.response.data.error);
      } else {
        alert("נכשל בהוספת הקומה");
      }
    }
  };

  const handleDeleteBuilding = async (building) => {
    try {
      console.log("Attempting to delete building:", building.id, building.name);
      await entities.Building.delete(building.id);
      await loadBuildingsData();
      console.log("Building deleted successfully with cascade");
    } catch (error) {
      console.error("Error deleting building:", error);
      console.error("Error details:", {
        status: error.status,
        response: error.response,
        message: error.message,
        data: error.response?.data
      });
      const errorMessage = error.response?.data?.error || error.message || "נכשל במחיקת הבניין";
      alert(`שגיאה: ${errorMessage}`);
    }
  };

  const toggleBuildingExpansion = (buildingId) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const getMapForFloor = (floorId) => {
    return maps.find(map => map.floor_id && map.floor_id.toString() === floorId.toString());
  };

  const getBuildingDeletionInfo = (buildingId) => {
    const buildingFloors = floors.filter(f => f.building_id === buildingId);
    const floorIds = buildingFloors.map(f => f.id);
    const buildingMaps = maps.filter(m => floorIds.includes(m.floor_id));
    const buildingSensors = sensors.filter(s => s.building_id === buildingId);
    
    return {
      floors: buildingFloors.length,
      maps: buildingMaps.length,
      sensors: buildingSensors.length
    };
  };

  const getFloorDeletionInfo = (floorId) => {
    const floorMaps = maps.filter(m => m.floor_id === floorId);
    const floorSensors = sensors.filter(s => s.floor_id === floorId);
    
    return {
      maps: floorMaps.length,
      sensors: floorSensors.length
    };
  };

  const handleEditBuilding = (building) => {
    setSelectedBuilding(building);
    setEditBuilding({ name: building.name });
    setIsEditBuildingDialogOpen(true);
  };

  const handleUpdateBuilding = async () => {
    try {
      if (!editBuilding.name.trim()) {
        alert("שם הבניין הוא שדה חובה");
        return;
      }

      await entities.Building.update(selectedBuilding.id, {
        name: editBuilding.name
      });

      setIsEditBuildingDialogOpen(false);
      setSelectedBuilding(null);
      setEditBuilding({ name: "" });
      await loadBuildingsData();
      console.log("Building updated successfully");
    } catch (error) {
      console.error("Error updating building:", error);
      alert("נכשל בעדכון הבניין");
    }
  };

  const handleEditFloor = (floor, building) => {
    setSelectedFloor(floor);
    setSelectedBuilding(building);
    setEditFloor({ name: floor.name, level: floor.level || floor.floor_number });
    setIsEditFloorDialogOpen(true);
  };

  const handleMapUpload = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.includes('base64,') 
          ? event.target.result.split('base64,')[1] 
          : event.target.result;
        
        const buildingName = selectedBuilding?.name || '';
        const floorName = selectedFloor?.name || '';
        const defaultMapName = `${buildingName}_${floorName}`;
        const finalMapName = newFloor.map_name || defaultMapName;
        
        await entities.Map.create({
          name: finalMapName,
          image_base64: base64Data,
          building_id: selectedBuilding.id,
          floor_id: selectedFloor.id
        });
        
        setIsMapDialogOpen(false);
        setNewFloor({ floor_number: "", name: "", map_data: "", map_name: "" });
        await loadBuildingsData();
        console.log("Map uploaded successfully");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading map:", error);
      alert("נכשל בהעלאת המפה");
    }
  };

  const handleUpdateFloor = async () => {
    try {
      if (!editFloor.name.trim()) {
        alert("שם הקומה הוא שדה חובה");
        return;
      }

      await entities.Floor.update(selectedFloor.id, {
        name: editFloor.name,
        level: parseInt(editFloor.level) || selectedFloor.level,
        building_id: selectedFloor.building_id
      });

      setIsEditFloorDialogOpen(false);
      setSelectedFloor(null);
      setEditFloor({ name: "", level: "" });
      await loadBuildingsData();
      console.log("Floor updated successfully");
    } catch (error) {
      console.error("Error updating floor:", error);
      alert("נכשל בעדכון הקומה");
    }
  };

  const handleDeleteFloor = async (floor) => {
    try {
      await entities.Floor.delete(floor.id);
      await loadBuildingsData();
      console.log("Floor deleted successfully");
    } catch (error) {
      console.error("Error deleting floor:", error);
      alert("נכשל במחיקת הקומה");
    }
  };

  const handleMapAction = (action, floor, building) => {
    setMapAction(action);
    setSelectedFloor(floor);
    setSelectedBuilding(building);
    setIsMapDialogOpen(true);
  };


  const handleRemoveMap = async () => {
    try {
      const floorMap = getMapForFloor(selectedFloor.id);
      if (floorMap) {
        await entities.Map.delete(floorMap.id);
        await loadBuildingsData();
        console.log("Map removed successfully");
      }
      setIsMapDialogOpen(false);
      setMapAction("");
      setSelectedFloor(null);
    } catch (error) {
      console.error("Error removing map:", error);
      alert("נכשל בהסרת המפה");
    }
  };

  const handleMapPreview = (floor, building) => {
    const floorMap = getMapForFloor(floor.id);
    setPreviewMap({
      map: floorMap,
      floorName: floor.name,
      floorNumber: floor.level || floor.floor_number,
      buildingName: building.name
    });
    setIsMapPreviewOpen(true);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">בניינים</h1>
          <p className="text-gray-600 mt-1">ניהול בניינים, קומות ומפות הקמפוס</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                בניין חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>יצירת בניין חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="building-name">שם הבניין *</Label>
                  <Input
                    id="building-name"
                    value={newBuilding.name}
                    onChange={(e) => setNewBuilding(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="הזן שם בניין..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building-address">כתובת</Label>
                  <Input
                    id="building-address"
                    value={newBuilding.address}
                    onChange={(e) => setNewBuilding(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="הזן כתובת..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building-description">תיאור</Label>
                  <Input
                    id="building-description"
                    value={newBuilding.description}
                    onChange={(e) => setNewBuilding(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="הזן תיאור..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleCreateBuilding}>
                  צור בניין
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={loadBuildingsData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="חפש בניינים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredBuildings.map((building) => {
          const buildingFloors = getFloorsForBuilding(building.id);
          const buildingSensors = getSensorsForBuilding(building.id);

          return (
            <Card key={building.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{building.name}</CardTitle>
                  </div>
                  {getStatusBadge(building)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {building.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{building.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Layers3 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">קומות:</span>
                      <span className="font-medium">{buildingFloors.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioTower className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">חיישנים:</span>
                      <span className="font-medium">{buildingSensors.length}</span>
                    </div>
                  </div>

                  {building.description && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {building.description}
                    </p>
                  )}

                  {/* Floors Section */}
                  {buildingFloors.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <Button
                        variant="ghost"
                        onClick={() => toggleBuildingExpansion(building.id)}
                        className="w-full justify-between p-2 h-auto text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <span>קומות ({buildingFloors.length})</span>
                        {expandedBuildings.has(building.id) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </Button>
                      
                      {expandedBuildings.has(building.id) && (
                        <div className="mt-2 space-y-2">
                          {buildingFloors.map((floor) => {
                            const floorMap = getMapForFloor(floor.id);
                            return (
                              <div key={floor.id} className="bg-gray-50 p-3 rounded-md">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div>
                                        <h4 className="font-medium text-gray-900">{floor.name}</h4>
                                        <p className="text-xs text-gray-500">קומה {floor.level || floor.floor_number}</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
                                          onClick={() => handleMapPreview(floor, building)}
                                          title="צפה במפה"
                                        >
                                          <MapPin className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-gray-200"
                                          onClick={() => handleEditFloor(floor, building)}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent className="bg-white">
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>מחיקת קומה</AlertDialogTitle>
                                              <AlertDialogDescription asChild>
                                                {(() => {
                                                  const deletionInfo = getFloorDeletionInfo(floor.id);
                                                  return (
                                                    <div className="space-y-2">
                                                      <p>האם אתה בטוח שברצונך למחוק את הקומה "{floor.name}"?</p>
                                                      <div className="bg-red-50 p-3 rounded-md border border-red-200">
                                                        <p className="font-medium text-red-800 mb-1">פעולה זו תמחק לצמיתות:</p>
                                                        <ul className="text-sm text-red-700 space-y-1">
                                                          {deletionInfo.maps > 0 && <li>• {deletionInfo.maps} מפות</li>}
                                                          {deletionInfo.sensors > 0 && <li>• {deletionInfo.sensors} חיישנים</li>}
                                                          {deletionInfo.maps === 0 && deletionInfo.sensors === 0 && (
                                                            <li>• קומה ריקה (ללא מפות או חיישנים)</li>
                                                          )}
                                                        </ul>
                                                      </div>
                                                    </div>
                                                  );
                                                })()}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                                              <AlertDialogAction 
                                                onClick={() => handleDeleteFloor(floor)}
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                מחק קומה
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                    
                                    {/* Map Actions */}
                                    <div className="flex gap-1 mt-2">
                                      {floorMap ? (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs px-2"
                                            onClick={() => handleMapAction("replace", floor, building)}
                                          >
                                            החלף מפה
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleMapAction("remove", floor, building)}
                                          >
                                            הסר מפה
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 text-xs px-2"
                                          onClick={() => handleMapAction("assign", floor, building)}
                                        >
                                          הוסף מפה
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mr-3">
                                    {floorMap ? (
                                      <div className="text-center">
                                        <div className="w-16 h-12 border border-gray-200 rounded overflow-hidden bg-white mb-1">
                                          {floorMap.image_url ? (
                                            <img 
                                              src={floorMap.image_url} 
                                              alt={floorMap.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Image className="w-4 h-4 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-600 truncate max-w-16">{floorMap.name}</p>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <div className="w-16 h-12 border border-gray-200 rounded bg-gray-100 flex items-center justify-center mb-1">
                                          <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-500">אין מפה</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Dialog open={isAddFloorDialogOpen && selectedBuilding?.id === building.id} 
                           onOpenChange={(open) => {
                             setIsAddFloorDialogOpen(open);
                             if (open) setSelectedBuilding(building);
                             else setSelectedBuilding(null);
                           }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Plus className="w-4 h-4 ml-1" />
                          הוסף קומה
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-white">
                        <DialogHeader>
                          <DialogTitle>הוספת קומה ל{building.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="floor-number">מספר קומה *</Label>
                            <Input
                              id="floor-number"
                              type="number"
                              value={newFloor.floor_number}
                              onChange={(e) => setNewFloor(prev => ({ ...prev, floor_number: e.target.value }))}
                              placeholder="הזן מספר קומה..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="floor-name">שם הקומה *</Label>
                            <Input
                              id="floor-name"
                              value={newFloor.name}
                              onChange={(e) => setNewFloor(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="הזן שם קומה..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => {
                            setIsAddFloorDialogOpen(false);
                            setSelectedBuilding(null);
                          }}>
                            ביטול
                          </Button>
                          <Button onClick={handleAddFloor}>
                            הוסף קומה
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleEditBuilding(building)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחיקת בניין</AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            {(() => {
                              const deletionInfo = getBuildingDeletionInfo(building.id);
                              return (
                                <div className="space-y-2">
                                  <p>האם אתה בטוח שברצונך למחוק את הבניין "{building.name}"?</p>
                                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                                    <p className="font-medium text-red-800 mb-1">פעולה זו תמחק לצמיתות:</p>
                                    <ul className="text-sm text-red-700 space-y-1">
                                      {deletionInfo.floors > 0 && <li>• {deletionInfo.floors} קומות</li>}
                                      {deletionInfo.maps > 0 && <li>• {deletionInfo.maps} מפות</li>}
                                      {deletionInfo.sensors > 0 && <li>• {deletionInfo.sensors} חיישנים</li>}
                                      {deletionInfo.floors === 0 && deletionInfo.maps === 0 && deletionInfo.sensors === 0 && (
                                        <li>• בניין ריק (ללא קומות או חיישנים)</li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              );
                            })()}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteBuilding(building)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            מחק בניין
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBuildings.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">לא נמצאו בניינים</h3>
          <p className="text-gray-500">נסה לשנות את החיפוש או להוסיף בניין חדש</p>
        </div>
      )}

      {/* Edit Floor Dialog */}
      <Dialog open={isEditFloorDialogOpen} onOpenChange={setIsEditFloorDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>עריכת קומה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-floor-name">שם הקומה *</Label>
              <Input
                id="edit-floor-name"
                value={editFloor.name}
                onChange={(e) => setEditFloor(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הזן שם קומה..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-floor-level">מספר קומה</Label>
              <Input
                id="edit-floor-level"
                type="number"
                value={editFloor.level}
                onChange={(e) => setEditFloor(prev => ({ ...prev, level: e.target.value }))}
                placeholder="הזן מספר קומה..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditFloorDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateFloor}>
              עדכן קומה
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Management Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {mapAction === "assign" && "הוספת מפה"}
              {mapAction === "replace" && "החלפת מפה"}
              {mapAction === "remove" && "הסרת מפה"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {mapAction === "remove" ? (
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  האם אתה בטוח שברצונך להסיר את המפה מהקומה "{selectedFloor?.name}"?
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setIsMapDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleRemoveMap} className="bg-red-600 hover:bg-red-700">
                    הסר מפה
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {mapAction === "assign" ? "העלה מפה חדשה לקומה" : "העלה מפה חדשה להחלפה"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map-name">שם המפה</Label>
                  <Input
                    id="map-name"
                    value={newFloor.map_name || ''}
                    onChange={(e) => setNewFloor(prev => ({ ...prev, map_name: e.target.value }))}
                    placeholder="הזן שם המפה..."
                  />
                </div>
                <Input
                  type="file"
                  accept="image/*,.svg,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleMapUpload(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500 text-center">העלה קובץ תמונה (PNG, JPG, SVG)</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Large Map Preview Overlay */}
      <Dialog open={isMapPreviewOpen} onOpenChange={setIsMapPreviewOpen}>
        <DialogContent className="w-[90vw] sm:max-w-[90vw] max-h-[85vh] bg-white z-[1000] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Building {previewMap?.buildingName} — Floor {previewMap?.floorNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {previewMap?.map?.image_url ? (
              <div className="w-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                <img 
                  src={previewMap.map.image_url} 
                  alt={previewMap.map.name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No map assigned to this floor</h3>
                  <p className="text-gray-500">Upload a map to view it here</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Building Dialog */}
      <Dialog open={isEditBuildingDialogOpen} onOpenChange={setIsEditBuildingDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>עריכת בניין</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-building-name">שם הבניין *</Label>
              <Input
                id="edit-building-name"
                value={editBuilding.name}
                onChange={(e) => setEditBuilding(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הזן שם בניין..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditBuildingDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleUpdateBuilding}>
              עדכן בניין
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}