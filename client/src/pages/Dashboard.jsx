import React, { useState, useEffect } from "react";
import { entities } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle, 
  Flower2,
  Activity,
  MapPin,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import StatsOverview from "../components/dashboard/StatsOverview";
import AlertsList from "../components/dashboard/AlertsList";
import RecentActivity from "../components/dashboard/RecentActivity";

export default function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [plants, setPlants] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [wateringSchedules, setWateringSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sensorsData, plantsData, measurementsData, wateringData] = await Promise.all([
        entities.Sensor.list(),
        entities.Plant.list(),
        entities.Measurement.list("-timestamp", 50),
        entities.WateringSchedule.list("-created_date", 20)
      ]);
      
      setSensors(sensorsData);
      setPlants(plantsData);
      setMeasurements(measurementsData);
      setWateringSchedules(wateringData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setLoading(false);
  };

  const getLatestMeasurementForSensor = (sensorId) => {
    return measurements.find(m => m.sensor_id === sensorId);
  };

  const getCriticalAlerts = () => {
    const alerts = [];
    plants.forEach(plant => {
      const latestMeasurement = getLatestMeasurementForSensor(plant.sensor_id);
      if (latestMeasurement && latestMeasurement.value < plant.watering_threshold) {
        alerts.push({
          type: 'moisture_low',
          plant,
          measurement: latestMeasurement,
          severity: latestMeasurement.value < plant.watering_threshold * 0.5 ? 'critical' : 'warning'
        });
      }
    });
    return alerts;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6" dir="rtl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-gray-600 mt-1">מערכת השקיה אוטומטית - קמפוס HIT</p>
        </div>
        <div className="text-sm text-gray-500">
          עדכון אחרון: {format(new Date(), "HH:mm - dd/MM/yyyy", { locale: he })}
        </div>
      </div>

      <StatsOverview 
        sensors={sensors}
        plants={plants} 
        measurements={measurements}
        wateringSchedules={wateringSchedules}
        loading={loading}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertsList 
            alerts={getCriticalAlerts()}
            loading={loading}
          />
        </div>
        
        <div>
          <RecentActivity 
            wateringSchedules={wateringSchedules}
            loading={loading}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-emerald-600" />
              חיישנים פעילים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sensors.slice(0, 5).map((sensor) => {
                const measurement = getLatestMeasurementForSensor(sensor.id);
                return (
                  <div key={sensor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {sensor.type === 'moisture' ? 
                        <Droplets className="w-4 h-4 text-blue-500" /> :
                        <Thermometer className="w-4 h-4 text-orange-500" />
                      }
                      <div>
                        <p className="font-medium text-gray-900">{sensor.name}</p>
                        <p className="text-sm text-gray-500">{sensor.type === 'moisture' ? 'לחות קרקע' : 'טמפרטורה'}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      {measurement ? (
                        <div>
                          <p className="font-bold text-lg">{measurement.value}{measurement.unit}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(measurement.timestamp), "HH:mm", { locale: he })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400">אין נתונים</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to={createPageUrl("Sensors")}>
              <Button variant="outline" className="w-full mt-4">
                צפה בכל החיישנים
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flower2 className="w-5 h-5 text-green-600" />
              צמחים במעקב
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plants.slice(0, 5).map((plant) => {
                const measurement = getLatestMeasurementForSensor(plant.sensor_id);
                const needsWater = measurement && measurement.value < plant.watering_threshold;
                return (
                  <div key={plant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Flower2 className={`w-4 h-4 ${needsWater ? 'text-red-500' : 'text-green-500'}`} />
                      <div>
                        <p className="font-medium text-gray-900">{plant.species}</p>
                        <p className="text-sm text-gray-500">{plant.location_description}</p>
                      </div>
                    </div>
                    <Badge variant={needsWater ? "destructive" : "default"}>
                      {needsWater ? 'זקוק השקיה' : 'תקין'}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <Link to={createPageUrl("Plants")}>
              <Button variant="outline" className="w-full mt-4">
                נהל צמחים
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}