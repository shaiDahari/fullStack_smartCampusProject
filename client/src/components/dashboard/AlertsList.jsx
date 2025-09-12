import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Droplets, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function AlertsList({ alerts, loading }) {
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          התראות קריטיות
          {alerts.length > 0 && (
            <Badge variant="destructive" className="mr-auto">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">הכל תקין!</h3>
            <p className="text-gray-500">כל הצמחים ברמת לחות תקינה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Droplets className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{alert.plant.species}</h4>
                      <p className="text-sm text-gray-600 mb-2">{alert.plant.location_description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        מדידה אחרונה: {format(new Date(alert.measurement.timestamp), "HH:mm - dd/MM", { locale: he })}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity === 'critical' ? 'קריטי' : 'אזהרה'}
                    </Badge>
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-red-700">
                        לחות: {alert.measurement.value}%
                      </p>
                      <p className="text-xs text-gray-600">
                        סף: {alert.plant.watering_threshold}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Droplets className="w-4 h-4 ml-2" />
                    השקיה ידנית
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}