import { AttendanceTracker } from "@/components/attendance/attendance-tracker"
import { getClasses } from "@/app/actions/classes"

export default async function AttendancePage() {
  const classes = await getClasses()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Track and manage student attendance</p>
      </div>

      <AttendanceTracker classes={classes ?? []} />
    </div>
  )
}
