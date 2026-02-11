import { UserCircle, Clock, Pause, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { Customer } from "./customer-queue-list";

interface StaffMember {
  id: string;
  name: string;
  role: "Sales" | "Treatment" | "Doctor";
  currentCustomer: Customer | null;
  queuedCustomers: Customer[]; // All customers in queue (excluding current)
  isPaused: boolean;
  workload: number; // number of customers in queue
}

interface StaffWorkQueuesProps {
  staff: StaffMember[];
  onReassign: (staffId: string, customerId: string) => void;
  onPause: (staffId: string) => void;
  onResume: (staffId: string) => void;
  onViewCustomer: (customer: Customer) => void;
}

const roleColors = {
  Sales: "bg-blue-50 border-blue-200",
  Treatment: "bg-teal-50 border-teal-200",
  Doctor: "bg-purple-50 border-purple-200"
};

const roleIconColors = {
  Sales: "text-blue-600",
  Treatment: "text-teal-600",
  Doctor: "text-purple-600"
};

export function StaffWorkQueues({ staff, onReassign, onPause, onResume, onViewCustomer }: StaffWorkQueuesProps) {
  const groupedStaff = {
    Sales: staff.filter(s => s.role === "Sales"),
    Treatment: staff.filter(s => s.role === "Treatment"),
    Doctor: staff.filter(s => s.role === "Doctor")
  };

  const renderStaffCard = (member: StaffMember) => {
    const isOverloaded = member.workload > 3;
    
    return (
      <Card 
        key={member.id} 
        className={`${roleColors[member.role]} ${member.isPaused ? "opacity-60" : ""} ${
          isOverloaded ? "ring-2 ring-orange-400" : ""
        }`}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className={`w-5 h-5 ${roleIconColors[member.role]}`} />
              <CardTitle className="text-sm">{member.name}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {isOverloaded && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Overloaded: {member.workload} customers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Queue: {member.workload}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Current Customer */}
          <div className="bg-white rounded-md p-2 border border-gray-200">
            <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">
              Current Customer
            </div>
            {member.currentCustomer ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {member.currentCustomer.name}
                  </span>
                  {member.currentCustomer.isVIP && (
                    <Badge className="h-4 px-1 text-[10px] bg-yellow-100 text-yellow-900 border-yellow-200">
                      VIP
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Status: {member.currentCustomer.status}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-6 text-xs mt-1"
                  onClick={() => onReassign(member.id, member.currentCustomer!.id)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reassign
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No active customer</div>
            )}
          </div>

          {/* Next Customer */}
          <div className="bg-white rounded-md p-2 border border-gray-200">
            <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">
              Next in Queue ({member.queuedCustomers.length})
            </div>
            {member.queuedCustomers.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {member.queuedCustomers.map((customer, index) => (
                  <div 
                    key={customer.id}
                    className={`p-1.5 rounded border ${
                      index === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">
                        {index + 1}. {customer.name}
                      </span>
                      {customer.isVIP && (
                        <Badge className="h-3.5 px-1 text-[9px] bg-yellow-100 text-yellow-900 border-yellow-200">
                          VIP
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-600">{customer.status}</span>
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{customer.waitTime}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="text-sm text-gray-400 italic">Queue empty</div>
                <div className="text-[10px] text-gray-400 mt-0.5">No customers waiting</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-1">
            {member.isPaused ? (
              <Button
                variant="default"
                size="sm"
                className="w-full h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onResume(member.id)}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => onPause(member.id)}
              >
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200 overflow-auto">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-gray-900">Staff Work Queues</h2>
      </div>

      <div className="p-4 space-y-4 overflow-auto">
        {/* Sales Team */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-sm text-gray-700">Sales Team</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
              {groupedStaff.Sales.length} Active
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groupedStaff.Sales.map(renderStaffCard)}
          </div>
        </div>

        {/* Treatment Staff */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-sm text-gray-700">Treatment Staff</h3>
            <Badge variant="outline" className="bg-teal-100 text-teal-800 text-xs">
              {groupedStaff.Treatment.length} Active
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groupedStaff.Treatment.map(renderStaffCard)}
          </div>
        </div>

        {/* Doctors */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-sm text-gray-700">Doctors</h3>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
              {groupedStaff.Doctor.length} Active
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groupedStaff.Doctor.map(renderStaffCard)}
          </div>
        </div>
      </div>
    </div>
  );
}