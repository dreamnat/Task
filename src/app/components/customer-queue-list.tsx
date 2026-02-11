import { useState } from "react";
import { Clock, ChevronDown, Flag, UserCircle, Edit3, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export type CustomerStatus = 
  | "Checked-in" 
  | "Consultation" 
  | "Prep" 
  | "Procedure" 
  | "Aftercare" 
  | "Completed" 
  | "No-show" 
  | "Late" 
  | "VIP";

export interface Customer {
  id: string;
  name: string;
  priority: "VIP" | "High" | "Medium" | "Low";
  status: CustomerStatus;
  checkInTime: Date;
  waitTime: number; // Fixed wait time in minutes
  assignedStaff: string | null;
  notes: string;
  isVIP: boolean;
  isLate: boolean;
}

interface CustomerQueueListProps {
  customers: Customer[];
  onStatusChange: (customerId: string, newStatus: CustomerStatus) => void;
  onAssignStaff: (customerId: string, staffName: string) => void;
  onAddNote: (customerId: string, note: string) => void;
  onFlagPriority: (customerId: string, priority: Customer["priority"]) => void;
  onViewDetails: (customer: Customer) => void;
  filters: {
    showVIP: boolean;
    showLate: boolean;
    roleFilter: string | null;
  };
}

const statusColors = {
  "Checked-in": "bg-blue-100 text-blue-800 border-blue-200",
  "Consultation": "bg-purple-100 text-purple-800 border-purple-200",
  "Prep": "bg-amber-100 text-amber-800 border-amber-200",
  "Procedure": "bg-orange-100 text-orange-800 border-orange-200",
  "Aftercare": "bg-teal-100 text-teal-800 border-teal-200",
  "Completed": "bg-green-100 text-green-800 border-green-200",
  "No-show": "bg-gray-100 text-gray-800 border-gray-200",
  "Late": "bg-red-100 text-red-800 border-red-200",
  "VIP": "bg-yellow-100 text-yellow-900 border-yellow-200"
};

const priorityColors = {
  "VIP": "text-yellow-600",
  "High": "text-red-600",
  "Medium": "text-orange-600",
  "Low": "text-gray-600"
};

export function CustomerQueueList({
  customers,
  onStatusChange,
  onAssignStaff,
  onAddNote,
  onFlagPriority,
  onViewDetails,
  filters
}: CustomerQueueListProps) {
  const [sortBy, setSortBy] = useState<"time" | "priority" | "status">("time");

  const getTimeSinceCheckIn = (waitTime: number) => {
    if (waitTime < 60) return `${waitTime}m`;
    const hours = Math.floor(waitTime / 60);
    const minutes = waitTime % 60;
    return `${hours}h ${minutes}m`;
  };

  const isOverdue = (waitTime: number) => {
    return waitTime > 45;
  };

  // Get appropriate staff options based on customer status
  const getStaffOptions = (status: CustomerStatus) => {
    switch (status) {
      case "Checked-in":
        return [
          { value: "none", label: "Unassigned" },
          { value: "Sarah Chen", label: "Sarah Chen" },
          { value: "Mike Torres", label: "Mike Torres" },
        ];
      case "Consultation":
        return [
          { value: "none", label: "Unassigned" },
          { value: "Sarah Chen", label: "Sarah Chen" },
          { value: "Mike Torres", label: "Mike Torres" },
          { value: "Dr. Smith", label: "Dr. Smith" },
          { value: "Dr. Johnson", label: "Dr. Johnson" },
        ];
      case "Prep":
      case "Aftercare":
        return [
          { value: "none", label: "Unassigned" },
          { value: "Nurse Lee", label: "Nurse Lee" },
          { value: "Tech Rivera", label: "Tech Rivera" },
        ];
      case "Procedure":
        return [
          { value: "none", label: "Unassigned" },
          { value: "Dr. Smith", label: "Dr. Smith" },
          { value: "Dr. Johnson", label: "Dr. Johnson" },
        ];
      default:
        return [
          { value: "none", label: "Unassigned" },
        ];
    }
  };

  let filteredCustomers = [...customers];
  if (filters.showVIP) {
    filteredCustomers = filteredCustomers.filter(c => c.isVIP);
  }
  if (filters.showLate) {
    filteredCustomers = filteredCustomers.filter(c => c.isLate);
  }

  const sortedCustomers = filteredCustomers.sort((a, b) => {
    if (sortBy === "time") {
      return a.checkInTime.getTime() - b.checkInTime.getTime();
    } else if (sortBy === "priority") {
      const priorityOrder = { VIP: 0, High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Customer Queue</h2>
          <Badge variant="outline" className="bg-white">
            {sortedCustomers.length} Active
          </Badge>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-full h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time">Sort by Check-in Time</SelectItem>
            <SelectItem value="priority">Sort by Priority</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 grid grid-cols-12 gap-2">
        <div className="col-span-3">Customer</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Wait Time</div>
        <div className="col-span-2">Assigned</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-auto">
        {sortedCustomers.map((customer) => {
          const timeSince = getTimeSinceCheckIn(customer.waitTime);
          const overdue = isOverdue(customer.waitTime);

          return (
            <div
              key={customer.id}
              className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 grid grid-cols-12 gap-2 items-center transition-colors ${
                overdue ? "bg-red-50" : ""
              }`}
            >
              {/* Customer Name */}
              <div className="col-span-3 flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-gray-400" />
                <div>
                  <button
                    onClick={() => onViewDetails(customer)}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline text-left"
                  >
                    {customer.name}
                  </button>
                  {customer.isVIP && (
                    <Badge className="ml-1 h-4 px-1 text-[10px] bg-yellow-100 text-yellow-900 border-yellow-200">
                      VIP
                    </Badge>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="col-span-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                      <Flag className={`w-3 h-3 ${priorityColors[customer.priority]}`} />
                      <span className={priorityColors[customer.priority]}>{customer.priority}</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onFlagPriority(customer.id, "VIP")}>
                      VIP Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFlagPriority(customer.id, "High")}>
                      High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFlagPriority(customer.id, "Medium")}>
                      Medium Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFlagPriority(customer.id, "Low")}>
                      Low Priority
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                      <Badge className={`${statusColors[customer.status]} border text-[10px] px-1.5`}>
                        {customer.status}
                      </Badge>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "Checked-in")}>
                      Checked-in
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "Consultation")}>
                      Consultation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "Prep")}>
                      Prep
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "Procedure")}>
                      Procedure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "Aftercare")}>
                      Aftercare
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "Completed")}>
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(customer.id, "No-show")}>
                      No-show
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Wait Time */}
              <div className="col-span-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-700"}`}>
                        <Clock className="w-3 h-3" />
                        {timeSince}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Checked in at {customer.checkInTime.toLocaleTimeString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Assigned Staff */}
              <div className="col-span-2">
                <Select
                  value={customer.assignedStaff || "none"}
                  onValueChange={(value) => onAssignStaff(customer.id, value)}
                >
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStaffOptions(customer.status).map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onViewDetails(customer)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Edit details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onViewDetails(customer)}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">View details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}