import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { ClassTable } from "@/components/classes/class-table"
import { ClassCalendar } from "@/components/classes/class-calendar"
import { AddClassDialog } from "@/components/classes/add-class-dialog"
import { getClasses } from "@/app/actions/classes"
import { getStaff } from "@/app/actions/staff"

export default async function ClassesPage() {
  const [classes, staff] = await Promise.all([getClasses(), getStaff()])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-1">Manage class schedules and enrollments</p>
        </div>
        <AddClassDialog staff={staff}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </AddClassDialog>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <ClassTable classes={classes} />
        </TabsContent>
        <TabsContent value="calendar">
          <ClassCalendar classes={classes} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
