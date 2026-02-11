import { X, Clock, Flag, UserCircle, FileText, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { useState, useEffect } from "react";
import type { Customer, CustomerStatus } from "./customer-queue-list";

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (customerId: string, updates: Partial<Customer>) => void;
}

const statusColors = {
  "Checked-in": "bg-blue-100 text-blue-800",
  "Consultation": "bg-purple-100 text-purple-800",
  "Prep": "bg-amber-100 text-amber-800",
  "Procedure": "bg-orange-100 text-orange-800",
  "Aftercare": "bg-teal-100 text-teal-800",
  "Completed": "bg-green-100 text-green-800",
  "No-show": "bg-gray-100 text-gray-800",
  "Late": "bg-red-100 text-red-800",
  "VIP": "bg-yellow-100 text-yellow-900"
};

const priorityColors = {
  "VIP": "bg-yellow-100 text-yellow-900",
  "High": "bg-red-100 text-red-800",
  "Medium": "bg-orange-100 text-orange-800",
  "Low": "bg-gray-100 text-gray-800"
};

const getStatusColor = (status: CustomerStatus): string => {
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

const getTimeSinceCheckIn = (checkInTime: Date) => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);
  if (diff < 60) return `${diff} minutes`;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours} hours ${minutes} minutes`;
};

// Get appropriate staff based on current status
const getStaffOptions = (status: CustomerStatus) => {
  switch (status) {
    case "Checked-in":
      return [
        { value: "none", label: "Unassigned" },
        { value: "Sarah Chen", label: "Sarah Chen (Sales Assistant)" },
        { value: "Mike Torres", label: "Mike Torres (Sales Assistant)" },
      ];
    case "Consultation":
      return [
        { value: "none", label: "Unassigned" },
        { value: "Sarah Chen", label: "Sarah Chen (Sales Consultant)" },
        { value: "Mike Torres", label: "Mike Torres (Sales Consultant)" },
        { value: "Dr. Smith", label: "Dr. Smith (Doctor)" },
        { value: "Dr. Johnson", label: "Dr. Johnson (Doctor)" },
      ];
    case "Prep":
    case "Aftercare":
      return [
        { value: "none", label: "Unassigned" },
        { value: "Nurse Lee", label: "Nurse Lee (Treatment Staff)" },
        { value: "Tech Rivera", label: "Tech Rivera (Treatment Staff)" },
      ];
    case "Procedure":
      return [
        { value: "none", label: "Unassigned" },
        { value: "Dr. Smith", label: "Dr. Smith (Doctor)" },
        { value: "Dr. Johnson", label: "Dr. Johnson (Doctor)" },
      ];
    default:
      return [
        { value: "none", label: "Unassigned" },
        { value: "Sarah Chen", label: "Sarah Chen (Sales)" },
        { value: "Mike Torres", label: "Mike Torres (Sales)" },
        { value: "Nurse Lee", label: "Nurse Lee (Treatment)" },
        { value: "Tech Rivera", label: "Tech Rivera (Treatment)" },
        { value: "Dr. Smith", label: "Dr. Smith (Doctor)" },
        { value: "Dr. Johnson", label: "Dr. Johnson (Doctor)" },
      ];
  }
};

export function CustomerDetailsModal({ customer, isOpen, onClose, onUpdate }: CustomerDetailsModalProps) {
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("Checked-in");
  const [priority, setPriority] = useState<Customer["priority"]>("Medium");
  const [assignedStaff, setAssignedStaff] = useState<string>("none");

  useEffect(() => {
    if (customer) {
      setNotes(customer.notes);
      setStatus(customer.status);
      setPriority(customer.priority);
      setAssignedStaff(customer.assignedStaff || "none");
    }
  }, [customer]);

  // Clear invalid staff assignment when status changes
  useEffect(() => {
    const validStaff = getStaffOptions(status).map(s => s.value);
    if (assignedStaff !== "none" && !validStaff.includes(assignedStaff)) {
      setAssignedStaff("none");
    }
  }, [status]);

  if (!customer) return null;

  const handleSave = () => {
    onUpdate(customer.id, {
      notes,
      status,
      priority,
      assignedStaff: assignedStaff === "none" ? null : assignedStaff,
      isVIP: priority === "VIP"
    });
    onClose();
  };

  const statusColor = getStatusColor(customer.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-gray-600" />
              <div>
                <DialogTitle className="text-xl">{customer.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[customer.status]}>
                    {customer.status}
                  </Badge>
                  <Badge className={priorityColors[customer.priority]}>
                    {customer.priority} Priority
                  </Badge>
                  {customer.isVIP && (
                    <Badge className="bg-yellow-100 text-yellow-900 border-yellow-300">
                      VIP Customer
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Check-in Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Checked in at:</span>
                <span className="font-medium text-gray-900">
                  {customer.checkInTime.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total wait time:</span>
                <span className="font-medium text-gray-900">
                  {getTimeSinceCheckIn(customer.checkInTime)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-gray-600">Current status:</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CustomerStatus)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Checked-in">Checked-in</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Prep">Prep</SelectItem>
                    <SelectItem value="Procedure">Procedure</SelectItem>
                    <SelectItem value="Aftercare">Aftercare</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="No-show">No-show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-900 flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Assignment
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col gap-2">
                <Label className="text-gray-600">Assigned to:</Label>
                <Select value={assignedStaff} onValueChange={setAssignedStaff}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStaffOptions(status).map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-gray-600">Priority level:</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Customer["priority"])}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customer.isLate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    Late Arrival
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes Section */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Notes
          </h3>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this customer..."
            className="min-h-[80px] resize-none"
          />
        </div>

        <Separator />

        {/* Service History (Mock) */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Journey Stages
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Checked-in</span>
              <span className="text-xs text-gray-500 ml-auto">
                {customer.checkInTime.toLocaleTimeString()}
              </span>
            </div>
            {customer.status !== "Checked-in" && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">{status}</span>
                <span className="text-xs text-gray-500 ml-auto">Current</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm opacity-50">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-600">Pending next stages...</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}