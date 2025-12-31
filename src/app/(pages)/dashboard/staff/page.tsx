import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StaffTable } from "@/components/staff/staff-table"
import { AddStaffDialog } from "@/components/staff/add-staff-dialog"
import { getStaff } from "@/app/actions/staff"

export default async function StaffPage() {
  const staff = await getStaff()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground mt-1">Manage instructors and administrative staff</p>
        </div>
        <AddStaffDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </AddStaffDialog>
      </div>

      <StaffTable initialStaff={staff} />
    </div>
  )
}
