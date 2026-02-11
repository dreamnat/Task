import { DoorOpen, AlertTriangle, Clock, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Station {
  id: string;
  name: string;
  type: "Consultation" | "Treatment" | "Procedure" | "Recovery";
  status: "Available" | "Occupied" | "Cleaning" | "Blocked";
  currentCustomer: string | null;
  occupiedSince: Date | null;
  estimatedFreeAt: Date | null;
}

interface Bottleneck {
  id: string;
  type: "overdue" | "overloaded" | "blocked";
  severity: "high" | "medium" | "low";
  message: string;
  details: string;
}

interface StationOverviewProps {
  stations: Station[];
  bottlenecks: Bottleneck[];
}

const stationTypeColors = {
  Consultation: "bg-blue-50 border-blue-200",
  Treatment: "bg-teal-50 border-teal-200",
  Procedure: "bg-purple-50 border-purple-200",
  Recovery: "bg-green-50 border-green-200"
};

const statusColors = {
  Available: "bg-green-500",
  Occupied: "bg-blue-500",
  Cleaning: "bg-yellow-500",
  Blocked: "bg-red-500"
};

const bottleneckColors = {
  high: "bg-red-50 border-red-300 text-red-800",
  medium: "bg-orange-50 border-orange-300 text-orange-800",
  low: "bg-yellow-50 border-yellow-300 text-yellow-800"
};

export function StationOverview({ stations, bottlenecks }: StationOverviewProps) {
  const getOccupancyRate = () => {
    const occupied = stations.filter(s => s.status === "Occupied").length;
    return Math.round((occupied / stations.length) * 100);
  };

  const getTimeSince = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const groupedStations = {
    Consultation: stations.filter(s => s.type === "Consultation"),
    Treatment: stations.filter(s => s.type === "Treatment"),
    Procedure: stations.filter(s => s.type === "Procedure"),
    Recovery: stations.filter(s => s.type === "Recovery")
  };

  const occupancyRate = getOccupancyRate();

  return (
    <div className="h-full flex flex-col bg-white overflow-auto">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-900 mb-3">Station Overview</h2>
        
        {/* Overall Occupancy */}
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Overall Occupancy</span>
            <span className="text-sm font-semibold text-gray-900">{occupancyRate}%</span>
          </div>
          <Progress value={occupancyRate} className="h-2" />
        </div>
      </div>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-medium text-sm text-red-900">Active Bottlenecks</h3>
            <Badge variant="destructive" className="h-5 text-xs">
              {bottlenecks.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {bottlenecks.map(bottleneck => (
              <TooltipProvider key={bottleneck.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`text-xs p-2 rounded border ${bottleneckColors[bottleneck.severity]} cursor-help`}>
                      <div className="font-medium">{bottleneck.message}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">{bottleneck.details}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}

      {/* Stations by Type */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {Object.entries(groupedStations).map(([type, typeStations]) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-sm text-gray-700">{type} Rooms</h3>
              <Badge variant="outline" className="text-xs">
                {typeStations.filter(s => s.status === "Available").length}/{typeStations.length} Available
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {typeStations.map(station => {
                const occupiedTime = getTimeSince(station.occupiedSince);
                
                return (
                  <Card 
                    key={station.id}
                    className={`${stationTypeColors[station.type as keyof typeof stationTypeColors]} ${
                      station.status === "Blocked" ? "ring-2 ring-red-400" : ""
                    }`}
                  >
                    <CardHeader className="p-2 pb-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="w-4 h-4 text-gray-600" />
                          <CardTitle className="text-xs">{station.name}</CardTitle>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${statusColors[station.status]}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">
                        {station.status}
                      </div>
                      
                      {station.currentCustomer ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-900">
                            {station.currentCustomer}
                          </div>
                          {occupiedTime && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-600">
                              <Clock className="w-3 h-3" />
                              {occupiedTime}
                            </div>
                          )}
                          {station.estimatedFreeAt && (
                            <div className="text-[10px] text-gray-500">
                              Est. free: {station.estimatedFreeAt.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">
                          {station.status === "Available" ? "Ready for patient" : "Unavailable"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded p-2 border border-gray-200">
            <div className="text-gray-500 mb-1">Total Stations</div>
            <div className="text-lg font-semibold text-gray-900 flex items-center gap-1">
              <DoorOpen className="w-4 h-4" />
              {stations.length}
            </div>
          </div>
          <div className="bg-white rounded p-2 border border-gray-200">
            <div className="text-gray-500 mb-1">In Use</div>
            <div className="text-lg font-semibold text-blue-600 flex items-center gap-1">
              <Users className="w-4 h-4" />
              {stations.filter(s => s.status === "Occupied").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
