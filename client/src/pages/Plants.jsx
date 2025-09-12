import React, { useState, useEffect } from "react";
import { entities } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Flower2, 
  Droplets, 
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function Plants() {
  const [plants, setPlants] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPlantsData();
  }, []);

  const loadPlantsData = async () => {
    setLoading(true);
    try {
      const [plantsData, measurementsData, sensorsData] = await Promise.all([
        entities.Plant.list(),
        entities.Measurement.list("-timestamp", 200),
        entities.Sensor.list()
      ]);
      
      setPlants(plantsData);
      setMeasurements(measurementsData);
      setSensors(sensorsData);
    } catch (error) {
      console.error("Error loading plants data:", error);
    }
    setLoading(false);
  };

  const getLatestMeasurementForPlant = (plant) => {
    return measurements.find(m => m.sensor_id === plant.sensor_id);
  };

  const getSensorForPlant = (plant) => {
    return sensors.find(s => s.id === plant.sensor_id);
  };

  const getPlantStatus = (plant) => {
    const measurement = getLatestMeasurementForPlant(plant);
    if (!measurement) return 'offline';
    return measurement.value < plant.watering_threshold ? 'needs_water' : 'healthy';
  };

  const filteredPlants = plants.filter(plant =>
    plant.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.location_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (plant) => {
    const status = getPlantStatus(plant);
    switch(status) {
      case 'needs_water':
        return <Badge variant="destructive">זקוק השקיה</Badge>;
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">בריא</Badge>;
      default:
        return <Badge variant="secondary">לא מחובר</Badge>;
    }
  };

  const handleManualWatering = async (plant) => {
    try {
      await entities.WateringSchedule.create({
        plant_id: plant.id,
        trigger_type: 'manual',
        triggered_by: 'local_user',
        duration_minutes: 5,
        notes: 'השקיה ידנית מלוח הבקרה'
      });
      
      // Update plant's last watered timestamp
      await entities.Plant.update(plant.id, {
        last_watered: new Date().toISOString()
      });
      
      loadPlantsData(); // Refresh data
    } catch (error) {
      console.error("Error triggering manual watering:", error);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">צמחים</h1>
          <p className="text-gray-600 mt-1">ניהול ומעקב אחר צמחי הקמפוס</p>
        </div>
        <Button variant="outline" onClick={loadPlantsData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="חפש צמחים..."
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
        ) : filteredPlants.map((plant) => {
          const measurement = getLatestMeasurementForPlant(plant);
          const sensor = getSensorForPlant(plant);
          const status = getPlantStatus(plant);

          return (
            <Card key={plant.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flower2 className={`w-5 h-5 ${
                      status === 'needs_water' ? 'text-red-600' : 'text-green-600'
                    }`} />
                    <CardTitle className="text-lg">{plant.species}</CardTitle>
                  </div>
                  {getStatusBadge(plant)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plant.location_description && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{plant.location_description}</span>
                    </div>
                  )}

                  {measurement ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${
                          status === 'needs_water' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {measurement.value}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          לחות קרקע נוכחית
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">סף השקיה:</span>
                          <span>{plant.watering_threshold}%</span>
                        </div>
                        
                        {sensor && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">חיישן:</span>
                            <span className="font-medium">{sensor.name}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">עדכון אחרון:</span>
                          <span className="text-xs">
                            {format(new Date(measurement.timestamp), "HH:mm dd/MM", { locale: he })}
                          </span>
                        </div>
                      </div>

                      {plant.last_watered && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            השקיה אחרונה: {format(new Date(plant.last_watered), "dd/MM HH:mm", { locale: he })}
                          </span>
                        </div>
                      )}

                      {status === 'needs_water' && (
                        <Button 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleManualWatering(plant)}
                        >
                          <Droplets className="w-4 h-4 ml-2" />
                          השקיה ידנית
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">אין נתוני לחות</p>
                      {sensor ? (
                        <p className="text-xs text-gray-400 mt-1">חיישן: {sensor.name}</p>
                      ) : (
                        <p className="text-xs text-red-500 mt-1">חיישן לא מחובר</p>
                      )}
                    </div>
                  )}

                  {plant.notes && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        <strong>הערות:</strong> {plant.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPlants.length === 0 && !loading && (
        <div className="text-center py-12">
          <Flower2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">לא נמצאו צמחים</h3>
          <p className="text-gray-500">נסה לשנות את החיפוש או להוסיף צמחים חדשים</p>
        </div>
      )}
    </div>
  );
}