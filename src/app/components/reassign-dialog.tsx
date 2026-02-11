import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface ReassignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  currentStaff: string;
  onReassign: (newStaffId: string, newStaffName: string) => void;
  availableStaff: Array<{ id: string; name: string; role: string; workload: number }>;
}

export function ReassignDialog({
  isOpen,
  onClose,
  customerName,
  currentStaff,
  onReassign,
  availableStaff
}: ReassignDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const handleReassign = () => {
    if (selectedStaffId) {
      const staff = availableStaff.find(s => s.id === selectedStaffId);
      if (staff) {
        onReassign(selectedStaffId, staff.name);
        onClose();
        setSelectedStaffId("");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customer</Label>
            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
              {customerName}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Staff</Label>
            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
              {currentStaff}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-staff" className="text-sm font-medium">
              Reassign to
            </Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger id="new-staff">
                <SelectValue placeholder="Select staff member..." />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role}) - Queue: {staff.workload}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={!selectedStaffId}>
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
