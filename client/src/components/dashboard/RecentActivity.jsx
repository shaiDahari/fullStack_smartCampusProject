import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Droplets, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function RecentActivity({ wateringSchedules, loading }) {
  const getActivityIcon = (triggerType) => {
    return triggerType === 'automatic' ? 
      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
        <Droplets className="w-4 h-4 text-green-600" />
      </div> :
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-blue-600" />
      </div>;
  };

  const getActivityBadge = (triggerType) => {
    return triggerType === 'automatic' ? 
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        אוטומטי
      </Badge> :
      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
        ידני
      </Badge>;
  };

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-emerald-600" />
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : wateringSchedules.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">אין פעילות אחרונה</p>
          </div>
        ) : (
          <div className="space-y-4">
            {wateringSchedules.slice(0, 10).map((schedule) => (
              <div key={schedule.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                {getActivityIcon(schedule.trigger_type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      השקיה {schedule.trigger_type === 'automatic' ? 'אוטומטית' : 'ידנית'}
                    </p>
                    {getActivityBadge(schedule.trigger_type)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(schedule.created_date), "HH:mm - dd/MM", { locale: he })}
                  </div>
                  {schedule.duration_minutes && (
                    <p className="text-xs text-gray-600 mt-1">
                      משך: {schedule.duration_minutes} דקות
                    </p>
                  )}
                  {schedule.triggered_by && (
                    <p className="text-xs text-gray-600">
                      על ידי: {schedule.triggered_by}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}