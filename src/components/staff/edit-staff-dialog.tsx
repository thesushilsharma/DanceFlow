"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateStaff } from "@/app/actions/staff"
import { toast } from "sonner"

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

interface EditStaffDialogProps {
  staff: Staff | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStaffDialog({ staff, open, onOpenChange }: EditStaffDialogProps) {
  const [isPending, startTransition] = useTransition()

  if (!staff) return null

  // Derive firstName/lastName from the combined name field
  const [firstName, ...rest] = staff.name.split(" ")
  const lastName = rest.join(" ")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateStaff(staff.id, formData)
      if (result.success) {
        toast.success("Staff member updated successfully")
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff — {staff.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-staff-firstName">First Name</Label>
                <Input
                  id="edit-staff-firstName"
                  name="firstName"
                  defaultValue={firstName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-staff-lastName">Last Name</Label>
                <Input
                  id="edit-staff-lastName"
                  name="lastName"
                  defaultValue={lastName}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-staff-email">Email</Label>
                <Input
                  id="edit-staff-email"
                  name="email"
                  type="email"
                  defaultValue={staff.email}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-staff-phone">Phone</Label>
                <Input
                  id="edit-staff-phone"
                  name="phone"
                  defaultValue={staff.phone ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-staff-role">Role</Label>
                <Select name="role" defaultValue={staff.role}>
                  <SelectTrigger id="edit-staff-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Instructor">Instructor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-staff-status">Status</Label>
                <Select name="status" defaultValue={staff.status}>
                  <SelectTrigger id="edit-staff-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-staff-specialization">
                Specializations{" "}
                <span className="text-muted-foreground text-xs">(comma-separated)</span>
              </Label>
              <Input
                id="edit-staff-specialization"
                name="specialization"
                defaultValue={staff.specializations?.join(", ") ?? ""}
                placeholder="Ballet, Jazz, Hip-Hop"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
