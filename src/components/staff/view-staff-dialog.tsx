"use client"

import { formatDate } from "@/lib/date"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type Staff = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  specializations: string[] | null
  hireDate: string
  status: string
}

const roleColors = {
  Owner: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Instructor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Admin: "bg-green-500/10 text-green-700 dark:text-green-400",
  Assistant: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  "on-leave": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
}

interface ViewStaffDialogProps {
  staff: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewStaffDialog({ staff, open, onOpenChange }: ViewStaffDialogProps) {
  if (!staff) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{staff.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant="secondary"
              className={statusColors[staff.status as keyof typeof statusColors]}
            >
              {staff.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge
              variant="secondary"
              className={roleColors[staff.role as keyof typeof roleColors]}
            >
              {staff.role}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{staff.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span>{staff.phone || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hire Date</span>
            <span>{formatDate(staff.hireDate, "SHORT")}</span>
          </div>
          {staff.specializations && staff.specializations.length > 0 && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-muted-foreground shrink-0">Specializations</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {staff.specializations.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
