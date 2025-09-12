import React, { useState, useEffect } from "react";
import { entities } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History as HistoryIcon, 
  Droplets, 
  Activity,
  Search,
  Calendar,
  User,
  Clock,
  Flower2
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function History() {
  const [wateringSchedules, setWateringSchedules] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [plants, setPlants] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      const [wateringData, measurementsData, plantsData, sensorsData] = await Promise.all([
        entities.WateringSchedule.list("-created_date", 100),
        entities.Measurement.list("-timestamp", 200),
        entities.Plant.list(),
        entities.Sensor.list()
      ]);
      
      setWateringSchedules(wateringData);
      setMeasurements(measurementsData);
      setPlants(plantsData);
      setSensors(sensorsData);
    } catch (error) {
      console.error("Error loading history data:", error);
    }
    setLoading(false);
  };

  const getPlantById = (plantId) => {
    return plants.find(p => p.id === plantId);
  };

  const getSensorById = (sensorId) => {
    return sensors.find(s => s.id === sensorId);
  };

  const filteredWateringSchedules = wateringSchedules.filter(schedule => {
    const plant = getPlantById(schedule.plant_id);
    return plant?.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
           schedule.triggered_by?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredMeasurements = measurements.filter(measurement => {
    const sensor = getSensorById(measurement.sensor_id);
    return sensor?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTriggerTypeBadge = (triggerType) => {
    return triggerType === 'automatic' ? 
      <Badge variant="default" className="bg-green-100 text-green-800">אוטומטי</Badge> :
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">ידני</Badge>;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">היסטוריה</h1>
          <p className="text-gray-600 mt-1">מעקב אחר פעילויות השקיה ומדידות קודמות</p>
        </div>
        <Button variant="outline" onClick={loadHistoryData} disabled={loading}>
          <HistoryIcon className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="חפש בהיסטוריה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <Tabs defaultValue="watering" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="watering" className="flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            השקיות
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            מדידות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watering" className="space-y-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-left">
                      <Skeleton className="h-6 w-20 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredWateringSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Droplets className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">אין רשומות השקיה</h3>
              <p className="text-gray-500">עדיין לא בוצעו פעולות השקיה במערכת</p>
            </div>
          ) : (
            filteredWateringSchedules.map((schedule) => {
              const plant = getPlantById(schedule.plant_id);
              return (
                <Card key={schedule.id} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          schedule.trigger_type === 'automatic' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {schedule.trigger_type === 'automatic' ? 
                            <Droplets className="w-5 h-5 text-green-600" /> :
                            <User className="w-5 h-5 text-blue-600" />
                          }
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {plant ? plant.species : 'צמח לא מוכר'}
                            </h4>
                            {getTriggerTypeBadge(schedule.trigger_type)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(schedule.created_date), "dd/MM/yyyy HH:mm", { locale: he })}
                            </div>
                            {schedule.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {schedule.duration_minutes} דקות
                              </div>
                            )}
                          </div>
                          {schedule.triggered_by && (
                            <p className="text-xs text-gray-500 mt-1">
                              על ידי: {schedule.triggered_by}
                            </p>
                          )}
                          {plant && (
                            <p className="text-xs text-gray-500">
                              מיקום: {plant.location_description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="space-y-1">
                          {schedule.moisture_before && (
                            <div className="text-xs text-gray-600">
                              לפני: {schedule.moisture_before}%
                            </div>
                          )}
                          {schedule.moisture_after && (
                            <div className="text-xs text-gray-600">
                              אחרי: {schedule.moisture_after}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {schedule.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <strong>הערות:</strong> {schedule.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="text-left">
                      <Skeleton className="h-6 w-16 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredMeasurements.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">אין מדידות</h3>
              <p className="text-gray-500">עדיין לא נמדדו נתונים מהחיישנים</p>
            </div>
          ) : (
            filteredMeasurements.map((measurement) => {
              const sensor = getSensorById(measurement.sensor_id);
              return (
                <Card key={measurement.id} className="shadow-sm border-0 bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {sensor?.type === 'moisture' ? 
                            <Droplets className="w-4 h-4 text-blue-600" /> :
                            <Activity className="w-4 h-4 text-orange-600" />
                          }
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {sensor ? sensor.name : 'חיישן לא מוכר'}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {sensor?.type === 'moisture' ? 'לחות קרקע' : 'טמפרטורה'} • {format(new Date(measurement.timestamp), "dd/MM/yyyy HH:mm", { locale: he })}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-gray-900">
                          {measurement.value}{measurement.unit}
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(measurement.timestamp), "HH:mm", { locale: he })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}