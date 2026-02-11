import { useState, useEffect } from "react";
import { Activity, Filter, Users, Clock } from "lucide-react";
import { CustomerQueueList, type Customer, type CustomerStatus } from "./components/customer-queue-list";
import { StaffWorkQueues } from "./components/staff-work-queues";
import { StationOverview } from "./components/station-overview";
import { CustomerDetailsModal } from "./components/customer-details-modal";
import { ReassignDialog } from "./components/reassign-dialog";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Switch } from "./components/ui/switch";
import { Label } from "./components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

// Types
type CustomerStatus = "Checked-in" | "Consultation" | "Prep" | "Procedure" | "Aftercare";
type CustomerPriority = "VIP" | "High" | "Medium" | "Low";

interface Customer {
  id: string;
  name: string;
  priority: CustomerPriority;
  status: CustomerStatus;
  checkInTime: Date;
  waitTime: number; // Fixed wait time in minutes
  assignedStaff: string;
  notes: string;
  isVIP: boolean;
  isLate: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  role: "Sales" | "Treatment" | "Doctor";
  currentCustomer: Customer | null;
  queuedCustomers: Customer[]; // All other customers in queue
  isPaused: boolean;
  workload: number;
}

const initialStaffMembers = (): StaffMember[] => [
  {
    id: "s1",
    name: "Sarah Chen",
    role: "Sales",
    currentCustomer: null,
    queuedCustomers: [],
    isPaused: false,
    workload: 2
  },
  {
    id: "s2",
    name: "Mike Torres",
    role: "Sales",
    currentCustomer: null,
    queuedCustomers: [],
    isPaused: false,
    workload: 2
  },
  {
    id: "t1",
    name: "Nurse Lee",
    role: "Treatment",
    currentCustomer: null,
    queuedCustomers: [],
    isPaused: false,
    workload: 4
  },
  {
    id: "t2",
    name: "Tech Rivera",
    role: "Treatment",
    currentCustomer: null,
    queuedCustomers: [],
    isPaused: false,
    workload: 1
  },
  {
    id: "d1",
    name: "Dr. Smith",
    role: "Doctor",
    currentCustomer: null,
    queuedCustomers: [],
    isPaused: false,
    workload: 3
  },
  {
    id: "d2",
    name: "Dr. Johnson",
    role: "Doctor",
    currentCustomer: null,
    queuedCustomers: [],
    isPaused: false,
    workload: 2
  }
];

const generateMockStations = () => {
  const now = new Date();
  return [
    {
      id: "c1",
      name: "Consult 1",
      type: "Consultation" as const,
      status: "Occupied" as const,
      currentCustomer: "Sarah Johnson",
      occupiedSince: new Date(now.getTime() - 25 * 60000),
      estimatedFreeAt: new Date(now.getTime() + 10 * 60000)
    },
    {
      id: "c2",
      name: "Consult 2",
      type: "Consultation" as const,
      status: "Occupied" as const,
      currentCustomer: "Lisa Thompson",
      occupiedSince: new Date(now.getTime() - 20 * 60000),
      estimatedFreeAt: new Date(now.getTime() + 15 * 60000)
    },
    {
      id: "c3",
      name: "Consult 3",
      type: "Consultation" as const,
      status: "Available" as const,
      currentCustomer: null,
      occupiedSince: null,
      estimatedFreeAt: null
    },
    {
      id: "t1",
      name: "Treatment 1",
      type: "Treatment" as const,
      status: "Occupied" as const,
      currentCustomer: "James Wilson",
      occupiedSince: new Date(now.getTime() - 50 * 60000),
      estimatedFreeAt: new Date(now.getTime() + 5 * 60000)
    },
    {
      id: "t2",
      name: "Treatment 2",
      type: "Treatment" as const,
      status: "Occupied" as const,
      currentCustomer: "Jessica Lee",
      occupiedSince: new Date(now.getTime() - 30 * 60000),
      estimatedFreeAt: new Date(now.getTime() + 10 * 60000)
    },
    {
      id: "t3",
      name: "Treatment 3",
      type: "Treatment" as const,
      status: "Cleaning" as const,
      currentCustomer: null,
      occupiedSince: null,
      estimatedFreeAt: new Date(now.getTime() + 5 * 60000)
    },
    {
      id: "p1",
      name: "Procedure 1",
      type: "Procedure" as const,
      status: "Occupied" as const,
      currentCustomer: "Michael Chen",
      occupiedSince: new Date(now.getTime() - 35 * 60000),
      estimatedFreeAt: new Date(now.getTime() + 25 * 60000)
    },
    {
      id: "p2",
      name: "Procedure 2",
      type: "Procedure" as const,
      status: "Blocked" as const,
      currentCustomer: null,
      occupiedSince: null,
      estimatedFreeAt: null
    },
    {
      id: "r1",
      name: "Recovery 1",
      type: "Recovery" as const,
      status: "Occupied" as const,
      currentCustomer: "Amanda Foster",
      occupiedSince: new Date(now.getTime() - 75 * 60000),
      estimatedFreeAt: new Date(now.getTime() + 5 * 60000)
    },
    {
      id: "r2",
      name: "Recovery 2",
      type: "Recovery" as const,
      status: "Available" as const,
      currentCustomer: null,
      occupiedSince: null,
      estimatedFreeAt: null
    }
  ];
};

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>(generateMockCustomers());
  const [staff, setStaff] = useState<StaffMember[]>(initialStaffMembers());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [reassignDialog, setReassignDialog] = useState<{
    isOpen: boolean;
    staffId: string;
    customerId: string;
  }>({ isOpen: false, staffId: "", customerId: "" });
  const [filters, setFilters] = useState({
    showVIP: false,
    showLate: false,
    roleFilter: null as string | null
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const stations = generateMockStations();

  // Dynamically calculate staff work queues based on customer assignments
  const calculateStaffQueues = (): StaffMember[] => {
    const staffList = [
      { id: "s1", name: "Sarah Chen", role: "Sales" as const },
      { id: "s2", name: "Mike Torres", role: "Sales" as const },
      { id: "t1", name: "Nurse Lee", role: "Treatment" as const },
      { id: "t2", name: "Tech Rivera", role: "Treatment" as const },
      { id: "d1", name: "Dr. Smith", role: "Doctor" as const },
      { id: "d2", name: "Dr. Johnson", role: "Doctor" as const },
    ];

    return staffList.map(staffMember => {
      // Find existing staff data to preserve pause state
      const existingStaff = staff.find(s => s.id === staffMember.id);
      
      // Get all customers assigned to this staff member, excluding completed/no-show
      const assignedCustomers = customers.filter(
        c => c.assignedStaff === staffMember.name && 
             c.status !== "Completed" && 
             c.status !== "No-show"
      );

      // Sort by check-in time (earliest first)
      assignedCustomers.sort((a, b) => a.checkInTime.getTime() - b.checkInTime.getTime());

      // Determine current and next customer based on status
      let currentCustomer: Customer | null = null;
      let nextCustomer: Customer | null = null;

      // Active statuses mean the customer is currently being served
      const activeStatuses = ["Consultation", "Prep", "Procedure", "Aftercare"];
      
      // Find customers actively being served by this staff
      const activeCustomers = assignedCustomers.filter(c => activeStatuses.includes(c.status));
      
      // Find customers waiting (Checked-in)
      const waitingCustomers = assignedCustomers.filter(c => c.status === "Checked-in");
      
      // Current customer is the first one being actively served
      currentCustomer = activeCustomers[0] || null;
      
      // Next in queue is the first waiting customer
      nextCustomer = waitingCustomers[0] || null;

      return {
        id: staffMember.id,
        name: staffMember.name,
        role: staffMember.role,
        currentCustomer,
        queuedCustomers: assignedCustomers.filter(c => c !== currentCustomer),
        isPaused: existingStaff?.isPaused || false,
        workload: assignedCustomers.length
      };
    });
  };

  // Update staff queues whenever customers change
  const staffQueues = calculateStaffQueues();

  // Dynamically calculate bottlenecks based on real-time data
  const calculateBottlenecks = () => {
    const bottlenecks: Array<{
      id: string;
      type: "overdue" | "overloaded" | "blocked" | "unassigned";
      severity: "high" | "medium" | "low";
      message: string;
      details: string;
    }> = [];

    // Check for overdue customers (waiting > 45 minutes)
    customers.forEach(customer => {
      if (customer.status !== "Completed" && customer.status !== "No-show") {
        const waitTime = customer.waitTime; // Use fixed wait time
        if (waitTime > 45) {
          bottlenecks.push({
            id: `overdue-${customer.id}`,
            type: "overdue",
            severity: waitTime > 60 ? "high" : "medium",
            message: `${customer.name}: ${waitTime}min wait time`,
            details: `Customer has been waiting for ${waitTime} minutes in ${customer.status} stage. Average wait time should be under 45 minutes.`
          });
        }
      }
    });

    // Check for overloaded staff (more than 3 customers)
    staffQueues.forEach(staffMember => {
      if (staffMember.workload > 3) {
        bottlenecks.push({
          id: `overloaded-${staffMember.id}`,
          type: "overloaded",
          severity: staffMember.workload > 5 ? "high" : "medium",
          message: `${staffMember.name}: ${staffMember.workload} customers assigned`,
          details: `${staffMember.role} staff member has ${staffMember.workload} customers in queue. Consider reassigning to balance workload.`
        });
      }
    });

    // Check for unassigned VIP or high priority customers
    customers.forEach(customer => {
      if (!customer.assignedStaff && 
          (customer.priority === "VIP" || customer.priority === "High") &&
          customer.status !== "Completed" && 
          customer.status !== "No-show") {
        bottlenecks.push({
          id: `unassigned-${customer.id}`,
          type: "unassigned",
          severity: customer.priority === "VIP" ? "high" : "medium",
          message: `${customer.name}: ${customer.priority} priority unassigned`,
          details: `${customer.priority} priority customer is not assigned to any staff member. Immediate attention required.`
        });
      }
    });

    // Check for blocked stations (from static data)
    stations.forEach(station => {
      if (station.status === "Blocked") {
        bottlenecks.push({
          id: `blocked-${station.id}`,
          type: "blocked",
          severity: "high",
          message: `${station.name}: Blocked`,
          details: `Station is unavailable. This may cause delays in the ${station.type} workflow.`
        });
      }
    });

    return bottlenecks;
  };

  const bottlenecks = calculateBottlenecks();

  // Handler functions
  const handleStatusChange = (customerId: string, newStatus: CustomerStatus) => {
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, status: newStatus } : c))
    );
    const customer = customers.find(c => c.id === customerId);
    toast.success(`${customer?.name} moved to ${newStatus}`);
  };

  const handleAssignStaff = (customerId: string, staffName: string) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? { ...c, assignedStaff: staffName === "none" ? null : staffName }
          : c
      )
    );
    const customer = customers.find(c => c.id === customerId);
    if (staffName === "none") {
      toast.info(`${customer?.name} unassigned from staff`);
    } else {
      toast.success(`${customer?.name} assigned to ${staffName}`);
    }
  };

  const handleAddNote = (customerId: string, note: string) => {
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, notes: note } : c))
    );
    toast.success("Note added successfully");
  };

  const handleFlagPriority = (customerId: string, priority: Customer["priority"]) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? { ...c, priority, isVIP: priority === "VIP" }
          : c
      )
    );
    const customer = customers.find(c => c.id === customerId);
    toast.success(`${customer?.name} priority updated to ${priority}`);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleUpdateCustomer = (customerId: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(c => (c.id === customerId ? { ...c, ...updates } : c))
    );
    toast.success("Customer details updated");
  };

  const handleReassignClick = (staffId: string, customerId: string) => {
    setReassignDialog({ isOpen: true, staffId, customerId });
  };

  const handleReassignConfirm = (newStaffId: string, newStaffName: string) => {
    const { customerId } = reassignDialog;
    handleAssignStaff(customerId, newStaffName);
    setReassignDialog({ isOpen: false, staffId: "", customerId: "" });
  };

  const handlePause = (staffId: string) => {
    setStaff(prev =>
      prev.map(s => (s.id === staffId ? { ...s, isPaused: true } : s))
    );
    const staffMember = staff.find(s => s.id === staffId);
    toast.info(`${staffMember?.name} paused`);
  };

  const handleResume = (staffId: string) => {
    setStaff(prev =>
      prev.map(s => (s.id === staffId ? { ...s, isPaused: false } : s))
    );
    const staffMember = staff.find(s => s.id === staffId);
    toast.success(`${staffMember?.name} resumed`);
  };

  const reassignCustomer = customers.find(c => c.id === reassignDialog.customerId);
  const currentStaff = staff.find(s => s.id === reassignDialog.staffId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className="w-6 h-6 text-blue-600" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900">Branch Operations Dashboard</h1>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-100 rounded-md border border-gray-200">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })} • {currentTime.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">Real-time queue management & bottleneck detection</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                  {(filters.showVIP || filters.showLate) && (
                    <Badge variant="default" className="h-4 px-1.5 text-xs">
                      {[filters.showVIP && "VIP", filters.showLate && "Late"]
                        .filter(Boolean)
                        .length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm mb-3">Quick Filters</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="vip-filter" className="text-sm">
                          VIP Customers Only
                        </Label>
                        <Switch
                          id="vip-filter"
                          checked={filters.showVIP}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({ ...prev, showVIP: checked }));
                            toast.info(checked ? "Showing VIP customers only" : "Showing all customers");
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="late-filter" className="text-sm">
                          Late Arrivals Only
                        </Label>
                        <Switch
                          id="late-filter"
                          checked={filters.showLate}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({ ...prev, showLate: checked }));
                            toast.info(checked ? "Showing late arrivals only" : "Showing all customers");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Stats */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-200">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {customers.filter(c => c.status !== "Completed" && c.status !== "No-show").length} Active
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-md border border-orange-200">
              <Activity className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">
                {bottlenecks.length} Bottlenecks
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Customer Queue */}
        <div className="w-[35%] flex flex-col">
          <CustomerQueueList
            customers={customers}
            onStatusChange={handleStatusChange}
            onAssignStaff={handleAssignStaff}
            onAddNote={handleAddNote}
            onFlagPriority={handleFlagPriority}
            onViewDetails={handleViewDetails}
            filters={filters}
          />
        </div>

        {/* Center: Staff Work Queues */}
        <div className="flex-1 flex flex-col">
          <StaffWorkQueues
            staff={staffQueues}
            onReassign={handleReassignClick}
            onPause={handlePause}
            onResume={handleResume}
            onViewCustomer={handleViewDetails}
          />
        </div>

        {/* Right: Station Overview */}
        <div className="w-[25%] flex flex-col">
          <StationOverview stations={stations} bottlenecks={bottlenecks} />
        </div>
      </div>

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdate={handleUpdateCustomer}
      />

      {/* Reassign Dialog */}
      <ReassignDialog
        isOpen={reassignDialog.isOpen}
        onClose={() => setReassignDialog({ isOpen: false, staffId: "", customerId: "" })}
        customerName={reassignCustomer?.name || ""}
        currentStaff={currentStaff?.name || ""}
        onReassign={handleReassignConfirm}
        availableStaff={staff.map(s => ({ id: s.id, name: s.name, role: s.role, workload: s.workload }))}
      />
    </div>
  );
}

// Mock Data
const generateMockCustomers = (): Customer[] => {
  const now = new Date();
  return [
    {
      id: "1",
      name: "Sarah Johnson",
      priority: "VIP",
      status: "Consultation",
      checkInTime: new Date(now.getTime() - 75 * 60000),
      waitTime: 75, // 1hr 15min
      assignedStaff: "Dr. Smith",
      notes: "Regular client - prefers Dr. Smith for consultation",
      isVIP: true,
      isLate: false
    },
    {
      id: "2",
      name: "Michael Chen",
      priority: "High",
      status: "Procedure",
      checkInTime: new Date(now.getTime() - 37 * 60000),
      waitTime: 37,
      assignedStaff: "Dr. Johnson",
      notes: "First-time laser treatment - proceeding now",
      isVIP: false,
      isLate: false
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      priority: "Medium",
      status: "Checked-in",
      checkInTime: new Date(now.getTime() - 15 * 60000),
      waitTime: 15,
      assignedStaff: "Sarah Chen",
      notes: "Waiting for consultation",
      isVIP: false,
      isLate: false
    },
    {
      id: "4",
      name: "James Wilson",
      priority: "High",
      status: "Prep",
      checkInTime: new Date(now.getTime() - 52 * 60000),
      waitTime: 52,
      assignedStaff: "Nurse Lee",
      notes: "Numbing cream applied - 15min remaining",
      isVIP: false,
      isLate: false
    },
    {
      id: "5",
      name: "Amanda Foster",
      priority: "VIP",
      status: "Aftercare",
      checkInTime: new Date(now.getTime() - 68 * 60000),
      waitTime: 68,
      assignedStaff: "Tech Rivera",
      notes: "VIP package - complimentary aftercare session",
      isVIP: true,
      isLate: false
    },
    {
      id: "6",
      name: "David Park",
      priority: "Medium",
      status: "Checked-in",
      checkInTime: new Date(now.getTime() - 9 * 60000),
      waitTime: 9,
      assignedStaff: "Mike Torres",
      notes: "Walk-in customer - initial registration",
      isVIP: false,
      isLate: false
    },
    {
      id: "7",
      name: "Lisa Thompson",
      priority: "Low",
      status: "Consultation",
      checkInTime: new Date(now.getTime() - 24 * 60000),
      waitTime: 24,
      assignedStaff: "Sarah Chen",
      notes: "Consultation for package options with sales",
      isVIP: false,
      isLate: false
    },
    {
      id: "8",
      name: "Robert Martinez",
      priority: "High",
      status: "Checked-in",
      checkInTime: new Date(now.getTime() - 55 * 60000),
      waitTime: 55,
      assignedStaff: "Sarah Chen",
      notes: "Arrived 30min late - needs re-registration",
      isVIP: false,
      isLate: true
    },
    {
      id: "9",
      name: "Jessica Lee",
      priority: "Medium",
      status: "Prep",
      checkInTime: new Date(now.getTime() - 31 * 60000),
      waitTime: 31,
      assignedStaff: "Nurse Lee",
      notes: "Skin cleansing and numbing in progress",
      isVIP: false,
      isLate: false
    },
    {
      id: "10",
      name: "Christopher Brown",
      priority: "VIP",
      status: "Checked-in",
      checkInTime: new Date(now.getTime() - 5 * 60000),
      waitTime: 5,
      assignedStaff: "Dr. Smith",
      notes: "VIP platinum - awaiting assignment",
      isVIP: true,
      isLate: false
    },
    {
      id: "11",
      name: "Jennifer Wang",
      priority: "Medium",
      status: "Procedure",
      checkInTime: new Date(now.getTime() - 48 * 60000),
      waitTime: 48,
      assignedStaff: "Dr. Smith",
      notes: "Botox procedure - 30% complete",
      isVIP: false,
      isLate: false
    },
    {
      id: "12",
      name: "Kevin O'Brien",
      priority: "Low",
      status: "Aftercare",
      checkInTime: new Date(now.getTime() - 63 * 60000),
      waitTime: 63,
      assignedStaff: "Tech Rivera",
      notes: "Post-treatment cooling and instructions",
      isVIP: false,
      isLate: false
    }
  ];
};