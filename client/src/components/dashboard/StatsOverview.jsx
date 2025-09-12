
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RadioTower, 
  Flower2, 
  Droplets, 
  AlertTriangle,
  Activity,
  Clock
} from "lucide-react";

export default function StatsOverview({ 
  sensors, 
  plants, 
  measurements, 
  wateringSchedules, 
  loading 
}) {
  const activeSensors = sensors.filter(s => s.status === 'active').length;
  const plantsNeedingWater = plants.filter(plant => {
    const latestMeasurement = measurements.find(m => m.sensor_id === plant.sensor_id);
    return latestMeasurement && latestMeasurement.value < plant.watering_threshold;
  }).length;
  
  const todayWaterings = wateringSchedules.filter(w => {
    const today = new Date();
    const wateringDate = new Date(w.created_date);
    return wateringDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    {
      title: "חיישנים פעילים",
      value: activeSensors,
      total: sensors.length,
      icon: RadioTower,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      title: "צמחים במעקב", 
      value: plants.length,
      icon: Flower2,
      color: "text-green-600", 
      bgColor: "bg-green-500",
    },
    {
      title: "זקוקים השקיה",
      value: plantsNeedingWater,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-500",
    },
    {
      title: "השקיות היום",
      value: todayWaterings,
      icon: Droplets,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
          <div className={`absolute top-0 left-0 w-1 h-full ${stat.bgColor}`} />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bgColor} bg-opacity-10`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-left">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                      {stat.total && <span className="text-gray-400">/{stat.total}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
